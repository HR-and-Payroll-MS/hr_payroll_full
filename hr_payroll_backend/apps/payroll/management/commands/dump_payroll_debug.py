from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from apps.payroll.models import PayrollPeriod, Payslip

class Command(BaseCommand):
    help = "Dump payroll debug info for a period to console."

    def add_arguments(self, parser):
        parser.add_argument('--month', type=str, help='Month name, e.g., January')
        parser.add_argument('--year', type=int, help='Year, e.g., 2026')
        parser.add_argument('--period-id', type=int, help='Specific PayrollPeriod ID')
        parser.add_argument('--max', type=int, default=20, help='Max payslips to display')

    def handle(self, *args, **options):
        period = None
        if options.get('period_id'):
            try:
                period = PayrollPeriod.objects.get(id=options['period_id'])
            except PayrollPeriod.DoesNotExist:
                raise CommandError(f"PayrollPeriod id={options['period_id']} not found")
        elif options.get('month') and options.get('year'):
            period = PayrollPeriod.objects.filter(month=options['month'], year=options['year']).order_by('-id').first()
        else:
            # Latest by created (id) as a fallback
            period = PayrollPeriod.objects.order_by('-id').first()

        if not period:
            raise CommandError('No payroll period found for the given filters')

        self.stdout.write(self.style.SUCCESS(f"Period: {period.month} {period.year} (id={period.id}, status={period.status})"))

        payslips = Payslip.objects.filter(period=period).select_related('employee', 'tax_code', 'tax_code_version')[:options['max']]
        if not payslips:
            self.stdout.write('No payslips found for this period.')
            return

        for p in payslips:
            details = p.details or {}
            debug = details.get('debug', [])
            warnings = details.get('warnings', [])

            self.stdout.write('-' * 80)
            self.stdout.write(f"Employee: {getattr(p.employee, 'fullname', p.employee_id)} | Payslip id={p.id}")
            self.stdout.write(f"TaxCode: {getattr(p.tax_code, 'code', None)} ({getattr(p.tax_code, 'name', None)}) | Version: {getattr(p.tax_code_version, 'version', None)} (id={getattr(p.tax_code_version, 'id', None)})")
            self.stdout.write(f"Gross={p.gross_pay} Deductions={p.total_deductions} Tax={p.tax_amount} Net={p.net_pay}")

            if warnings:
                self.stdout.write(self.style.WARNING(f"Warnings: {warnings}"))

            if debug:
                # Show last 5 breadcrumbs for brevity
                tail = debug[-5:] if len(debug) > 5 else debug
                self.stdout.write('Debug tail:')
                for entry in tail:
                    label = entry.get('label')
                    self.stdout.write(f"  - {label}: {entry}")
            else:
                self.stdout.write('Debug: [empty]')

        self.stdout.write('-' * 80)
        self.stdout.write(self.style.SUCCESS('Done.'))
