from django.core.management.base import BaseCommand
from django.db import transaction
from apps.departments.models import Department
from apps.employees.models import Employee


class Command(BaseCommand):
    help = 'Backfill Department.manager FK from Employee.job_title or most-referenced line_manager in the department.'

    def add_arguments(self, parser):
        parser.add_argument('--yes', action='store_true', help='Run without confirmation')

    def handle(self, *args, **options):
        yes = options.get('yes')
        depts = Department.objects.filter(manager__isnull=True)
        if not depts.exists():
            self.stdout.write('No departments need backfilling.')
            return

        self.stdout.write(f'Found {depts.count()} departments without manager. Preparing to backfill...')
        if not yes:
            confirm = input('Proceed to backfill managers? [y/N]: ')
            if confirm.strip().lower() != 'y':
                self.stdout.write('Aborted.')
                return

        updated = 0
        with transaction.atomic():
            for dept in depts:
                # 1) Find an employee in this department with job_title indicating department manager
                candidates = Employee.objects.filter(department=dept)
                mgr = candidates.filter(job_title__icontains='department manager').first()
                if not mgr:
                    mgr = candidates.filter(job_title__icontains='department-manager').first()
                if not mgr:
                    mgr = candidates.filter(job_title__icontains='manager').first()

                # 2) If still not found, find most referenced line_manager id among employees
                if not mgr:
                    lm_counts = {}
                    for e in candidates:
                        lm_id = getattr(e, 'line_manager_id', None)
                        if lm_id:
                            lm_counts[lm_id] = lm_counts.get(lm_id, 0) + 1
                    if lm_counts:
                        top_id = max(lm_counts, key=lm_counts.get)
                        mgr = Employee.objects.filter(id=top_id).first()

                if mgr:
                    dept.manager = mgr
                    dept.save(update_fields=['manager', 'updated_at'])
                    updated += 1
                    self.stdout.write(f'Set manager for {dept.name} -> {mgr.fullname} (id={mgr.id})')
                else:
                    self.stdout.write(f'No suitable manager found for {dept.name}; skipped')

        self.stdout.write(f'Done. Managers updated: {updated}')
