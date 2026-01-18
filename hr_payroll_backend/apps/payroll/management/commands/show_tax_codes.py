from django.core.management.base import BaseCommand
from apps.payroll.models import TaxCode, TaxCodeVersion, TaxBracket

class Command(BaseCommand):
    help = "List TaxCode IDs and their TaxCodeVersion IDs with validity and bracket counts."

    def handle(self, *args, **options):
        codes = TaxCode.objects.all().order_by('id')
        if not codes:
            self.stdout.write('No tax codes found.')
            return
        for tc in codes:
            self.stdout.write('-' * 80)
            self.stdout.write(f"TaxCode id={tc.id} code={tc.code} name={tc.name} active={tc.is_active}")
            versions = TaxCodeVersion.objects.filter(tax_code=tc).order_by('-valid_from', 'id')
            if not versions:
                self.stdout.write('  (no versions)')
                continue
            for v in versions:
                bracket_count = TaxBracket.objects.filter(tax_code_version=v).count()
                self.stdout.write(
                    f"  Version id={v.id} version={v.version} active={v.is_active} locked={v.is_locked} "
                    f"valid_from={v.valid_from} valid_to={v.valid_to} brackets={bracket_count}"
                )
        self.stdout.write('-' * 80)
        self.stdout.write('Done.')
