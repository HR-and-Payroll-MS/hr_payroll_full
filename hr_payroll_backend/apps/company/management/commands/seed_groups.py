"""
Seed core Django groups used for permissions/roles.
Run with: python manage.py seed_groups
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group

GROUPS = [
    "Admin",
    "Manager",
    "HR Manager",
    "Line Manager",
    "Payroll",
    "Employee",
]


class Command(BaseCommand):
    help = "Seed core Django groups for role-based permissions"

    def handle(self, *args, **options):
        created = 0
        for name in GROUPS:
            _, was_created = Group.objects.get_or_create(name=name)
            created += 1 if was_created else 0
        self.stdout.write(self.style.SUCCESS(f"Groups ensured: {len(GROUPS)} (created {created})"))
