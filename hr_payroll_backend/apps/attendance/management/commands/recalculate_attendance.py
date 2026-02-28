from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime

from apps.attendance.models import Attendance


class Command(BaseCommand):
    help = 'Re-evaluate attendance.status for records in a date range. Default is dry-run; pass --apply to save changes.'

    def add_arguments(self, parser):
        parser.add_argument('--start', required=True, help='Start date YYYY-MM-DD')
        parser.add_argument('--end', required=False, help='End date YYYY-MM-DD (defaults to start)')
        parser.add_argument('--employee-id', type=int, required=False, help='Limit to a specific employee id')
        parser.add_argument('--apply', action='store_true', help='Actually save recalculated statuses')

    def handle(self, *args, **options):
        start = options.get('start')
        end = options.get('end') or start
        apply_changes = options.get('apply', False)
        emp_id = options.get('employee_id')

        try:
            start_dt = datetime.fromisoformat(start).date()
            end_dt = datetime.fromisoformat(end).date()
        except Exception as e:
            self.stderr.write(f'Invalid date format: {e}')
            return

        qs = Attendance.objects.filter(date__gte=start_dt, date__lte=end_dt)
        if emp_id:
            qs = qs.filter(employee__id=emp_id)

        total = qs.count()
        self.stdout.write(f'Found {total} attendance records between {start_dt} and {end_dt} (employee={emp_id})')

        changed = 0
        for att in qs.select_related('employee'):
            old_status = att.status
            # Recalculate by calling save(); if dry-run, revert the change immediately
            try:
                att.save()
                new_status = att.status
            except Exception as e:
                self.stderr.write(f'Error recalculating Attendance id={att.id}: {e}')
                continue

            if new_status != old_status:
                changed += 1
                self.stdout.write(f'Would change Attendance id={att.id} employee={att.employee_id} date={att.date} {old_status} -> {new_status}')
                # revert if not applying
                if not apply_changes:
                    try:
                        att.status = old_status
                        att.save(update_fields=['status'])
                    except Exception as e:
                        self.stderr.write(f'Failed to revert Attendance id={att.id}: {e}')
                else:
                    self.stdout.write(f'Applied change for Attendance id={att.id}')

        self.stdout.write(f'Total changed (or would change): {changed}')
