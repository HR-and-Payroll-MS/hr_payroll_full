from celery import shared_task
import logging

logger = logging.getLogger('policies')


@shared_task(bind=True)
def notify_and_recalc(self, policy_id, created):
    """Background task to notify employees and recalc attendance after policy change.
    `policy_id` should be the PK of the Policy instance.
    """
    try:
        from django.apps import apps
        from django.db import close_old_connections, OperationalError
        close_old_connections()

        Policy = apps.get_model('policies', 'Policy')
        Employee = apps.get_model('employees', 'Employee')
        Notification = apps.get_model('notifications', 'Notification')

        try:
            policy = Policy.objects.get(pk=policy_id)
        except Policy.DoesNotExist:
            logger.error('Policy id %s not found for notify_and_recalc', policy_id)
            return

        employees = Employee.objects.filter(status='Active')
        action = 'Created' if created else 'Updated'
        title = f"Policy Update: {policy.section}"
        message = f"The {policy.section} has been {action.lower()}. Please review the changes in the Policy section."

        try:
            from django.db import transaction
            with transaction.atomic():
                for emp in employees:
                    try:
                        Notification.objects.create(
                            recipient=emp,
                            title=title,
                            message=message,
                            notification_type='policy',
                            link='/policies'
                        )
                    except Exception:
                        logger.exception('Failed to create notification for emp %s', getattr(emp, 'id', None))
        except OperationalError:
            logger.exception('OperationalError while creating notifications; skipping')

        # Recalculate today's attendance
        if policy.section == 'attendancePolicy':
            try:
                Attendance = apps.get_model('attendance', 'Attendance')
                from django.utils import timezone
                today = timezone.localdate()
                try:
                    today_attendances = Attendance.objects.filter(date=today)
                except OperationalError:
                    logger.exception('OperationalError querying Attendance; skipping recalc')
                    return
                for att in today_attendances:
                    try:
                        att.save()
                    except Exception:
                        logger.exception('Failed to recalc attendance id=%s', getattr(att, 'id', None))
            except Exception:
                logger.exception('Attendance recalculation failed after policy change')

    except Exception:
        logger.exception('notify_and_recalc task failed')