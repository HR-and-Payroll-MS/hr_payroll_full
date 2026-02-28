from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.policies.utils import get_policy

class Command(BaseCommand):
    help = 'Create WorkSchedule(s) from policy shiftTimes and assign to all employees (day shift by default)'

    def add_arguments(self, parser):
        parser.add_argument('--assign-all', action='store_true', help='Assign the policy work schedule to all employees (overwrites existing assignments)')

    def handle(self, *args, **options):
        from apps.attendance.models import WorkSchedule
        from apps.employees.models import Employee

        policy = get_policy('attendancePolicy') or {}
        shifts = policy.get('shiftTimes') or []
        if not shifts:
            self.stdout.write(self.style.WARNING('No shiftTimes found in attendancePolicy. Nothing to apply.'))
            return

        # Use first shift as day-shift
        first = shifts[0]
        start = first.get('start', '09:00')
        end = first.get('end', '17:00')
        title = first.get('title') or f"Policy Shift {start}-{end}"

        # Parse times
        try:
            sh, sm = map(int, start.split(':'))
            eh, em = map(int, end.split(':'))
        except Exception:
            self.stdout.write(self.style.ERROR('Invalid time format in policy shiftTimes. Expected HH:MM'))
            return

        ws, created = WorkSchedule.objects.get_or_create(
            title=title,
            defaults={
                'start_time': timezone.datetime(2000,1,1,sh,sm).time(),
                'end_time': timezone.datetime(2000,1,1,eh,em).time(),
                'days_of_week': [0,1,2,3,4],
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created WorkSchedule: {ws}'))
        else:
            # Ensure times match
            ws.start_time = timezone.datetime(2000,1,1,sh,sm).time()
            ws.end_time = timezone.datetime(2000,1,1,eh,em).time()
            ws.save()
            self.stdout.write(self.style.SUCCESS(f'Updated WorkSchedule: {ws}'))

        # Assign to employees
        qs = Employee.objects.all()
        if not options.get('assign_all'):
            qs = qs.filter(work_schedule__isnull=True)

        updated = qs.update(work_schedule=ws)
        self.stdout.write(self.style.SUCCESS(f'Assigned work schedule to {updated} employees.'))

        self.stdout.write(self.style.SUCCESS('Policy shift application complete.'))
