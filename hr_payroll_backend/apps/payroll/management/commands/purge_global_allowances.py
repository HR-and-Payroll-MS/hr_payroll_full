from django.core.management.base import BaseCommand
from apps.payroll.models import Allowance

class Command(BaseCommand):
    help = "Delete all global/static allowances not bound to a TaxCodeVersion (and any dependent EmployeeAllowance via cascade)."

    def handle(self, *args, **options):
        qs = Allowance.objects.filter(tax_code_version__isnull=True)
        count = qs.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS("No global allowances to purge."))
            return
        qs.delete()
        self.stdout.write(self.style.SUCCESS(f"Purged {count} global allowances (unversioned)."))
