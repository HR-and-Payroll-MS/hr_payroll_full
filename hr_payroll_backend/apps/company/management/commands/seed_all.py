"""
Seed all core demo data (company info, policies, tax codes, FAQs, employees).
Run with: python manage.py seed_all
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command

SEED_COMMANDS = [
    "seed_groups",
    "seed_company_info",
    "seed_policies",
    "seed_tax_codes",
    "seed_faqs",
    "seed_employees",
]


class Command(BaseCommand):
    help = "Run all seed commands in one go"

    def handle(self, *args, **options):
        for cmd in SEED_COMMANDS:
            try:
                self.stdout.write(self.style.WARNING(f"Running {cmd}..."))
                call_command(cmd)
            except Exception as exc:
                self.stdout.write(self.style.ERROR(f"{cmd} failed: {exc}"))
                raise
        self.stdout.write(self.style.SUCCESS("All seed commands completed."))
