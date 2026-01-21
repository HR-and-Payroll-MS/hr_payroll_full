from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import LeaveRequest
from apps.notifications.models import Notification

from datetime import timedelta
from apps.attendance.models import Attendance

@receiver(post_save, sender=LeaveRequest)
def leave_request_notification(sender, instance, created, **kwargs):
    if created:
        # Notify Line Manager & Department Manager
        notified_users = {instance.employee.id}
        
        ji = getattr(instance.employee, 'job_info', None)
        line_manager = getattr(ji, 'line_manager', None)
        dept = getattr(ji, 'department', None)

        # 1. Immediate Line Manager
        if line_manager and line_manager.id not in notified_users:
            Notification.objects.create(
                recipient=line_manager,
                sender=instance.employee,
                title="New Leave Request",
                message=f"{instance.employee.fullname} has submitted a {instance.leave_type} leave request.",
                notification_type='leave',
                link=f"/leaves/{instance.id}"
            )
            notified_users.add(line_manager.id)
            
        # 2. Department Manager
        if dept and dept.manager:
            dept_manager = dept.manager
            if dept_manager.id not in notified_users:
                Notification.objects.create(
                    recipient=dept_manager,
                    sender=instance.employee,
                    title="New Leave Request (Dept)",
                    message=f"{instance.employee.fullname} has submitted a {instance.leave_type} leave request.",
                    notification_type='leave',
                    link=f"/leaves/{instance.id}"
                )
                notified_users.add(dept_manager.id)
    else:
        # Status change notification
        if instance.status == 'manager_approved':
            # Notify employee about manager approval
            Notification.objects.create(
                recipient=instance.employee,
                sender=None,
                title="Leave Request: Manager Approved",
                message=f"Your {instance.leave_type} leave request has been approved by your manager and is now pending HR approval.",
                notification_type='info',
                link=f"/leaves/{instance.id}"
            )
        elif instance.status == 'approved':
            # 1. Notify employee about final approval
            Notification.objects.create(
                recipient=instance.employee,
                sender=None,
                title="Leave Request: Fully Approved",
                message=f"Your {instance.leave_type} leave request has been fully approved.",
                notification_type='info',
                link=f"/leaves/{instance.id}"
            )

            # 2. Sync to Attendance: Set status to 'permission' for the leave duration
            curr_date = instance.start_date
            while curr_date <= instance.end_date:
                Attendance.objects.update_or_create(
                    employee=instance.employee,
                    date=curr_date,
                    defaults={
                        'status': 'permission',
                        'notes': f"Approved Leave: {instance.get_leave_type_display()}"
                    }
                )
                curr_date += timedelta(days=1)
            print(f"SIGNAL: Synced attendance for {instance.employee.fullname} from {instance.start_date} to {instance.end_date}")
        elif instance.status in ['cancelled', 'denied']:
            # Reversal: If it was approved, reset attendance to 'absent' if still 'permission'
            Attendance.objects.filter(
                employee=instance.employee,
                date__range=[instance.start_date, instance.end_date],
                status='permission',
                clock_in__isnull=True
            ).update(status='absent', notes='Leave cancelled/denied')
            print(f"SIGNAL: Reversed attendance for {instance.employee.fullname} due to {instance.status}")
    
    # Emit socket event for real-time list updates
    try:
        from config.socket_app import sio
        sio.emit('leave_updated', {'id': instance.id, 'status': instance.status})
        print(f"Socket emit: leave_updated {instance.id} status={instance.status}")
    except Exception as e:
        print(f"Socket emit error: {e}")
