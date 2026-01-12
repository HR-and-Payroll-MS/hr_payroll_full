from django.core.management.base import BaseCommand, CommandError
from apps.payroll.models import PayrollPeriod
from apps.payroll.services import PayrollCalculationService

class Command(BaseCommand):
    help = "Generate payslips for a payroll period (with optional tax code/version overrides)."

    def add_arguments(self, parser):
        parser.add_argument('--month', type=str, required=True, help='Month name, e.g., January')
        parser.add_argument('--year', type=int, required=True, help='Year, e.g., 2026')
        parser.add_argument('--tax-code-id', type=int, help='Force TaxCode ID selection')
        parser.add_argument('--tax-version-id', type=int, help='Force TaxCodeVersion ID selection')

    def handle(self, *args, **options):
        month = options['month']
        year = options['year']
        tax_code_id = options.get('tax_code_id')
        tax_version_id = options.get('tax_version_id')

        # Find or create period
        period, created = PayrollPeriod.objects.get_or_create(month=month, year=year, defaults={'status': 'draft'})
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created period {month} {year} (id={period.id})"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Using existing period {month} {year} (id={period.id}, status={period.status})"))

        # Run generation
        svc = PayrollCalculationService(period, tax_code_id=tax_code_id, tax_code_version_id=tax_version_id)
        payslips = svc.generate_payroll()
        self.stdout.write(self.style.SUCCESS(f"Generated {len(payslips)} payslips for {month} {year}."))

        self.stdout.write(self.style.NOTICE("Tip: run 'python manage.py dump_payroll_debug --month {month} --year {year}' to inspect reasons."))
