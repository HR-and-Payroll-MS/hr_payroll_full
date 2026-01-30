from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import connection

User = get_user_model()


class Command(BaseCommand):
    help = 'Backfill User.email from legacy Employee.email column where missing (raw SQL)'

    def handle(self, *args, **options):
        updated = 0
        # Use raw SQL to read the legacy employees.email column even after the
        # Employee model no longer defines that field. This allows running the
        # backfill after code changes but before schema migrations are applied.
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, email FROM employees WHERE email IS NOT NULL AND email != ''")
            rows = cursor.fetchall()

        for emp_id, email in rows:
            user = User.objects.filter(employee__id=emp_id).first()
            if user and not user.email:
                user.email = email
                user.save(update_fields=['email'])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f'Backfilled {updated} user email(s) from employees.'))
