import logging
import threading
import sys

from django.db import close_old_connections, OperationalError
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Policy

logger = logging.getLogger('policies')


def _sync_policy_shifts_to_workschedules(instance):
    if instance.section != 'attendancePolicy':
        return
    try:
        from datetime import time as _time
        from apps.attendance.models import WorkSchedule

        shifts = (instance.content or {}).get('shiftTimes') or []
        prefix = f"PolicyShift:org{instance.organization_id}:policy{instance.pk}:"
        desired_titles = []
        for idx, s in enumerate(shifts):
            name = s.get('name') or f'shift{idx+1}'
            title = f"{prefix}{idx}:{name}"
            desired_titles.append(title)
            try:
                start_str = s.get('start')
                end_str = s.get('end')
                if not start_str or not end_str:
                    continue
                sh, sm = map(int, start_str.split(':'))
                eh, em = map(int, end_str.split(':'))
                start_t = _time(sh, sm)
                end_t = _time(eh, em)
            except Exception:
                logger.exception('Invalid shift time format in policy %s', instance.pk)
                continue

            ws_qs = WorkSchedule.objects.filter(title=title)
            if ws_qs.exists():
                ws = ws_qs.first()
                changed = False
                if ws.start_time != start_t:
                    ws.start_time = start_t
                    changed = True
                if ws.end_time != end_t:
                    ws.end_time = end_t
                    changed = True
                if changed:
                    ws.save()
            else:
                WorkSchedule.objects.create(
                    title=title,
                    start_time=start_t,
                    end_time=end_t,
                    days_of_week=[0, 1, 2, 3, 4],
                )

        existing = WorkSchedule.objects.filter(title__startswith=prefix)
        for ex in existing:
            if ex.title not in desired_titles:
                ex.delete()
    except Exception:
        logger.exception('Failed to sync policy shifts to WorkSchedule for policy %s', instance.pk)


def _do_notify_and_recalc(instance, created=False):
    try:
        close_old_connections()

        from apps.employees.models import Employee
        from apps.notifications.models import Notification

        employees = Employee.objects.filter(status='Active')

        action = "Created" if created else "Updated"
        title = f"Policy Update: {instance.section}"
        message = f"The {instance.section} has been {action.lower()}. Please review the changes in the Policy section."

        if employees.exists():
            from django.db import transaction
            try:
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

        if instance.section == 'attendancePolicy':
            try:
                from apps.attendance.models import Attendance
                from django.utils import timezone
                today = timezone.localdate()
                today_attendances = Attendance.objects.filter(date=today)
                for att in today_attendances:
                    try:
                        att.save()
                    except Exception:
                        logger.exception('Failed to recalc attendance id=%s', getattr(att, 'id', None))
            except Exception:
                logger.exception('Attendance recalculation failed after policy change')

    except Exception:
        logger.exception('Policy change notification failed')


@receiver(post_save, sender=Policy)
def notify_policy_change_impl(sender, instance, created, **kwargs):
    try:
        _sync_policy_shifts_to_workschedules(instance)

        if 'test' in sys.argv:
            _do_notify_and_recalc(instance, created=created)
            return

        try:
            from .tasks import notify_and_recalc
            notify_and_recalc.delay(instance.pk, created)
            return
        except Exception:
            logger.exception('Failed to dispatch notify_and_recalc to Celery; falling back to thread')

        thr = threading.Thread(target=_do_notify_and_recalc, args=(instance, True), daemon=True)
        thr.start()
    except Exception:
        logger.exception('Failed to start background handler for policy change')
