from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import transaction
from apps.employees.models import Employee


class Command(BaseCommand):
    help = 'Reset legacy role groups and seed canonical groups (Manager, Line Manager, Payroll, Employee).'

    def add_arguments(self, parser):
        parser.add_argument('--yes', action='store_true', help='Run without confirmation')
        parser.add_argument('--include-staff', action='store_true', help='Also overwrite groups for staff/superusers')

    def handle(self, *args, **options):
        yes = options.get('yes')
        include_staff = options.get('include_staff')

        self.stdout.write('Seeding canonical role groups: Manager, Line Manager, Payroll, Employee')

        if not yes:
            confirm = input('This will remove legacy role groups and re-seed canonical groups. Continue? [y/N]: ')
            if confirm.strip().lower() != 'y':
                self.stdout.write('Aborted by user.')
                return

        legacy_names = {
            'HR MANAGER', 'HR-MANAGER', 'HR', 'HUMAN RESOURCES',
            'DEPARTMENT MANAGER', 'DEPT MANAGER', 'DEPARTMENT-MANAGER',
            'HR MANAGERS', 'HR MANAGER(S)', 'HRMANAGER'
        }
        # Also include some known variants
        legacy_names_upper = {n.upper() for n in legacy_names}

        canonical = ['Manager', 'Line Manager', 'Payroll', 'Employee']

        User = get_user_model()

        with transaction.atomic():
            # Remove legacy and existing canonical groups (we'll recreate clean)
            deleted = 0
            for g in Group.objects.all():
                name_up = (g.name or '').upper()
                if name_up in legacy_names_upper or name_up in {c.upper() for c in canonical}:
                    g.delete()
                    deleted += 1

            self.stdout.write(f'Deleted {deleted} legacy/canonical groups')

            # Create canonical groups
            groups = {}
            for name in canonical:
                grp, _ = Group.objects.get_or_create(name=name)
                groups[name] = grp

            self.stdout.write('Created canonical groups: ' + ', '.join(groups.keys()))

            # Assign users to groups based on Employee.job_title
            updated_users = 0
            total_employees = 0
            for emp in Employee.objects.select_related('user_account').all():
                total_employees += 1
                user = getattr(emp, 'user_account', None)
                if not user:
                    continue

                title = (emp.job_title or '').upper()
                if 'HR' in title or 'HUMAN RESOURCES' in title or 'HR MANAGER' in title or title == 'MANAGER':
                    target = 'Manager'
                elif 'DEPARTMENT' in title and 'MANAGER' in title or 'DEPT MANAGER' in title or 'LINE MANAGER' in title:
                    target = 'Line Manager'
                elif 'PAYROLL' in title:
                    target = 'Payroll'
                else:
                    target = 'Employee'

                try:
                    target_group = groups[target]
                except KeyError:
                    # fallback
                    target_group, _ = Group.objects.get_or_create(name=target)

                if user.is_superuser or user.is_staff:
                    if include_staff:
                        user.groups.set([target_group])
                    else:
                        user.groups.add(target_group)
                else:
                    user.groups.set([target_group])

                updated_users += 1

            self.stdout.write(f'Processed {total_employees} employees, updated {updated_users} user group assignments')

        self.stdout.write('Seeding complete.')
