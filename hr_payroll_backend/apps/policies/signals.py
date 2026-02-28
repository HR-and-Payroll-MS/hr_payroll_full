"""Signals shim for policies.

This file intentionally keeps only a single import to the actual
implementation in `signals_impl.py` to avoid duplication during
iterative edits.
"""

from .signals_impl import *
import logging
import threading
import sys

from django.db import close_old_connections, OperationalError
from django.db.utils import InterfaceError
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Policy

logger = logging.getLogger('policies')


def _do_notify_and_recalc(instance, created=False):
    """Create notifications and recalc today's attendance when appropriate.

    Accepts a model instance and a boolean `created` flag.
    """
    try:
        close_old_connections()

        from apps.employees.models import Employee
        from apps.notifications.models import Notification

        try:
            employees = Employee.objects.filter(status='Active')
        except (OperationalError, InterfaceError):
            logger.exception('DB error while querying employees')
            return

        action = "Created" if created else "Updated"
        title = f"Policy Update: {instance.section}"
        message = f"The {instance.section} has been {action.lower()}. Please review the changes in the Policy section."

        try:
            has_employees = employees.exists()
        except (OperationalError, InterfaceError):
            logger.exception('DB error while checking employees.exists()')
            return

        if has_employees:
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
            except (OperationalError, InterfaceError):
                logger.exception('DB error while creating notifications; skipping')

        if instance.section == 'attendancePolicy':
            try:
                from apps.attendance.models import Attendance
                from django.utils import timezone
                today = timezone.localdate()
                try:
                    today_attendances = Attendance.objects.filter(date=today)
                except (OperationalError, InterfaceError):
                    logger.exception('DB error querying Attendance; skipping recalc')
                    return
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
def notify_policy_change(sender, instance, created, **kwargs):
    """Handle Policy post-save: prefer Celery task, run sync in tests, else thread."""
    try:
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

def _do_notify_and_recalc(instance, created):
    try:
        # Ensure thread has a fresh DB connection (avoid using connections from main thread)
        from django.db import close_old_connections, OperationalError
        close_old_connections()

        from apps.employees.models import Employee
        from apps.notifications.models import Notification
        # Get all active employees
        try:
            employees = Employee.objects.filter(status='Active')
        except OperationalError:
            logger.exception('DB OperationalError while querying employees')
            return

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

        # Retroactive recalculation if attendance policy changed
        if instance.section == 'attendancePolicy':
            try:
                from apps.attendance.models import Attendance
                from django.utils import timezone
                today = timezone.localdate()
                # Recalculate all records for today to reflect the new policy immediately
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
        logger.exception('Policy change notification failed')


@receiver(post_save, sender=Policy)
def notify_policy_change(sender, instance, created, **kwargs):
    """Notify all employees when a policy is updated.

    This handler dispatches the heavier work to a background thread to avoid
    blocking the request/transaction that saved the policy.
    """
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
import logging
import threading
import sys

from django.db import close_old_connections, OperationalError
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Policy

logger = logging.getLogger('policies')


def _do_notify_and_recalc(instance, created=False):
    """Create notifications and recalc today's attendance when appropriate.

    Accepts a model instance and a boolean `created` flag.
    """
    try:
        close_old_connections()

        from apps.employees.models import Employee
        from apps.notifications.models import Notification

        try:
            employees = Employee.objects.filter(status='Active')
        except OperationalError:
            logger.exception('DB OperationalError while querying employees')
            return

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
        logger.exception('Policy change notification failed')


@receiver(post_save, sender=Policy)
def notify_policy_change(sender, instance, created, **kwargs):
    """Handle Policy post-save: prefer Celery task, run sync in tests, else thread."""
    try:
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
