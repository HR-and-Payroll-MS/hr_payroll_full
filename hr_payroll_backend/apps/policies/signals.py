from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Policy
from apps.notifications.models import Notification

@receiver(post_save, sender=Policy)
def notify_policy_change(sender, instance, created, **kwargs):
    """Notify all employees when a policy is updated."""
    try:
        from apps.employees.models import Employee
        # Get all active employees via payroll partition
        employees = Employee.objects.filter(payroll_info__status='Active')
        
        action = "Created" if created else "Updated"
        title = f"Policy Update: {instance.section}"
        message = f"The {instance.section} has been {action.lower()}. Please review the changes in the Policy section."
        
        if employees.exists():
            from django.db import transaction
            with transaction.atomic():
                for emp in employees:
                    Notification.objects.create(
                        recipient=emp,
                        title=title,
                        message=message,
                        notification_type='policy', 
                        link='/policies'
                    )
            
        # Retroactive recalculation if attendance policy changed
        if instance.section == 'attendancePolicy':
            from apps.attendance.models import Attendance
            from django.utils import timezone
            today = timezone.localdate()
            # Recalculate all records for today to reflect the new policy immediately
            today_attendances = Attendance.objects.filter(date=today)
            for att in today_attendances:
                try:
                    att.save()
                except Exception:
                    pass # Don't block because of one bad record
            
    except Exception:
        import traceback
        from django.utils import timezone
        try:
            with open('policy_signal_error.log', 'a', encoding='utf-8') as f:
                f.write(f"\n--- SIGNAL ERROR {timezone.now()} ---\n")
                f.write(traceback.format_exc())
        except Exception:
            # Last-resort: swallow logging failures to avoid breaking saves
            pass
