from django.core.management.base import BaseCommand
from apps.payroll.models import TaxCode, TaxCodeVersion, TaxBracket, Allowance, Deduction
from datetime import date

class Command(BaseCommand):
    help = 'Wipes all tax data and seeds simplified strict data for testing.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Wiping all existing Tax Codes, Versions, Brackets, Allowances...'))
        
        # Delete reverse order to handle foreign keys
        TaxBracket.objects.all().delete()
        TaxCodeVersion.objects.all().delete()
        Allowance.objects.all().delete()
        Deduction.objects.all().delete()
        TaxCode.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS('Cleanup complete. Seeding strict data...'))

        # 1. Ethiopian Federal Income Tax
        eth_tax = TaxCode.objects.create(
            code='ETH_FED_2025',
            name='Ethiopian Federal Income Tax',
            description='Standard progressive tax for Ethiopia (2025)',
            is_active=True
        )
        
        eth_v1 = TaxCodeVersion.objects.create(
            tax_code=eth_tax,
            version='v1',
            valid_from=date(2025, 1, 1),
            is_active=True,
            income_tax_config={'type': 'progressive', 'brackets': []}, # Minimal config for JSON
            pension_config={'employeePercent': 7, 'employerPercent': 11},
            rounding_rules={'method': 'nearest', 'precision': 2}
        )
        
        # Brackets
        brackets = [
            (0, 600, 0),
            (601, 1650, 10),
            (1651, 3200, 15),
            (3201, 5250, 20),
            (5251, 7800, 25),
            (7801, 10900, 30),
            (10901, None, 35),
        ]
        
        for min_inc, max_inc, rate in brackets:
            TaxBracket.objects.create(
                tax_code_version=eth_v1,
                min_income=min_inc,
                max_income=max_inc,
                rate=rate
            )
            
        self.stdout.write(self.style.SUCCESS(f'Created {eth_tax.name} with 7 brackets.'))

        # 2. Simple Flat Test Tax
        flat_tax = TaxCode.objects.create(
            code='FLAT_TEST',
            name='Simple Flat Tax (10%)',
            description='Flat 10% tax for testing verification.',
            is_active=True
        )
        
        flat_v1 = TaxCodeVersion.objects.create(
            tax_code=flat_tax,
            version='v1',
            valid_from=date(2025, 1, 1),
            is_active=True,
            income_tax_config={'type': 'flat', 'flatRate': 10},
            pension_config={'employeePercent': 5, 'employerPercent': 5},
            rounding_rules={'method': 'nearest', 'precision': 2}
        )
        # Flat tax has no brackets usually, but backend might expect relation?
        # Serializer: tax_brackets=TaxBracketSerializer(many=True). 
        # If flat, brackets list is empty. Frontend handles this.
        
        self.stdout.write(self.style.SUCCESS(f'Created {flat_tax.name} (Flat 10%).'))
        
        self.stdout.write(self.style.SUCCESS('STRICT SEED COMPLETED SUCCESSFULLY.'))
