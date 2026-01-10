"""
Management command to seed Ethiopian tax codes with progressive brackets.
Run with: python manage.py seed_tax_codes

Creates:
- TaxCode: ETH_FED_2025 (Ethiopian Federal Income Tax)
- TaxCodeVersion: v1 (current)
- TaxBracket: Progressive brackets (0-35%)
- Deduction: Pension Contribution (7% employee, 11% employer)
"""
from django.core.management.base import BaseCommand
from decimal import Decimal
from datetime import date
from apps.payroll.models import TaxCode, TaxCodeVersion, TaxBracket, Deduction, Allowance


# Ethiopian Income Tax Brackets (Proclamation 979/2016)
# These are the standard Ethiopian federal income tax brackets
ETHIOPIAN_TAX_BRACKETS = [
    {'min': Decimal('0'), 'max': Decimal('600'), 'rate': Decimal('0')},
    {'min': Decimal('601'), 'max': Decimal('1650'), 'rate': Decimal('10')},
    {'min': Decimal('1651'), 'max': Decimal('3200'), 'rate': Decimal('15')},
    {'min': Decimal('3201'), 'max': Decimal('5250'), 'rate': Decimal('20')},
    {'min': Decimal('5251'), 'max': Decimal('7800'), 'rate': Decimal('25')},
    {'min': Decimal('7801'), 'max': Decimal('10900'), 'rate': Decimal('30')},
    {'min': Decimal('10901'), 'max': None, 'rate': Decimal('35')},  # No upper limit
]

# Standard Deductions
DEDUCTIONS = [
    {
        'code': 'PENSION_EMP',
        'name': 'Pension Contribution (Employee)',
        'description': 'Employee contribution to pension fund (7% of basic salary)',
        'calculation_type': 'percentage',
        'percentage_value': Decimal('7'),
        'is_mandatory': True,
        'is_pre_tax': True,
        'applies_to': ['all'],
    },
    {
        'code': 'COST_SHARING',
        'name': 'Cost Sharing',
        'description': 'Cost sharing contribution',
        'calculation_type': 'percentage',
        'percentage_value': Decimal('0'),  # Varies by organization
        'is_mandatory': False,
        'is_pre_tax': False,
        'applies_to': ['all'],
    },
]

# Standard Allowances
ALLOWANCES = [
    {
        'code': 'TRANSPORT',
        'name': 'Transport Allowance',
        'description': 'Monthly transport allowance (tax-exempt up to 600 ETB)',
        'calculation_type': 'fixed',
        'default_value': Decimal('600'),
        'is_taxable': False,
        'applies_to': ['all'],
    },
    {
        'code': 'PHONE',
        'name': 'Phone Allowance',
        'description': 'Monthly mobile phone allowance',
        'calculation_type': 'fixed',
        'default_value': Decimal('300'),
        'is_taxable': True,
        'applies_to': [],  # Must be explicitly assigned
    },
    {
        'code': 'NIGHT_SHIFT',
        'name': 'Night Shift Allowance',
        'description': 'Allowance for working night shifts',
        'calculation_type': 'fixed',
        'default_value': Decimal('300'),
        'is_taxable': True,
        'applies_to': [],  # Must be explicitly assigned
    },
]


class Command(BaseCommand):
    help = 'Seed Ethiopian tax codes with progressive brackets and standard deductions'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('\n' + '='*60))
        self.stdout.write(self.style.NOTICE(' SEEDING TAX CODE DATA'))
        self.stdout.write(self.style.NOTICE('='*60 + '\n'))

        # 1. Create Tax Code
        tax_code, created = TaxCode.objects.get_or_create(
            code='ETH_FED_2025',
            defaults={
                'name': 'Ethiopian Federal Income Tax',
                'description': 'Ethiopian federal income tax per Proclamation 979/2016',
                'is_active': True,
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ Created TaxCode: {tax_code.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'ℹ️  TaxCode already exists: {tax_code.name}'))

        # 2. Create Tax Code Version
        version, v_created = TaxCodeVersion.objects.get_or_create(
            tax_code=tax_code,
            version='v1',
            defaults={
                'valid_from': date(2025, 1, 1),
                'valid_to': None,  # Currently active
                'is_active': True,
                'is_locked': False,
                'income_tax_config': {
                    'type': 'progressive',
                    'description': 'Ethiopian progressive income tax brackets'
                },
                'pension_config': {
                    'employeePercent': 7,
                    'employerPercent': 11,
                },
                'rounding_rules': {
                    'method': 'nearest',
                    'precision': 2,
                },
                'compliance_notes': [
                    {'label': 'Authority', 'value': 'Federal Ministry of Revenue'},
                    {'label': 'Proclamation', 'value': '979/2016'},
                    {'label': 'Country Code', 'value': 'ET'},
                ]
            }
        )

        if v_created:
            self.stdout.write(self.style.SUCCESS(f'✅ Created TaxCodeVersion: {version}'))
        else:
            self.stdout.write(self.style.WARNING(f'ℹ️  TaxCodeVersion already exists: {version}'))

        # 3. Create Tax Brackets
        brackets_created = 0
        for bracket_data in ETHIOPIAN_TAX_BRACKETS:
            bracket, b_created = TaxBracket.objects.get_or_create(
                tax_code_version=version,
                min_income=bracket_data['min'],
                defaults={
                    'max_income': bracket_data['max'],
                    'rate': bracket_data['rate'],
                    'applies_to': ['all'],
                }
            )
            if b_created:
                brackets_created += 1

        if brackets_created > 0:
            self.stdout.write(self.style.SUCCESS(f'✅ Created {brackets_created} TaxBrackets'))
        else:
            self.stdout.write(self.style.WARNING(f'ℹ️  TaxBrackets already exist'))

        # 4. Create Standard Deductions
        deductions_created = 0
        for ded_data in DEDUCTIONS:
            deduction, d_created = Deduction.objects.get_or_create(
                code=ded_data['code'],
                defaults={
                    'name': ded_data['name'],
                    'description': ded_data['description'],
                    'calculation_type': ded_data['calculation_type'],
                    'percentage_value': ded_data['percentage_value'],
                    'is_mandatory': ded_data['is_mandatory'],
                    'is_pre_tax': ded_data['is_pre_tax'],
                    'is_active': True,
                    'applies_to': ded_data['applies_to'],
                    'tax_code': tax_code,
                }
            )
            if d_created:
                deductions_created += 1

        if deductions_created > 0:
            self.stdout.write(self.style.SUCCESS(f'✅ Created {deductions_created} Deductions'))
        else:
            self.stdout.write(self.style.WARNING(f'ℹ️  Deductions already exist'))

        # 5. Create Standard Allowances
        allowances_created = 0
        for allow_data in ALLOWANCES:
            allowance, a_created = Allowance.objects.get_or_create(
                code=allow_data['code'],
                defaults={
                    'name': allow_data['name'],
                    'description': allow_data['description'],
                    'calculation_type': allow_data['calculation_type'],
                    'default_value': allow_data['default_value'],
                    'is_taxable': allow_data['is_taxable'],
                    'is_active': True,
                    'applies_to': allow_data['applies_to'],
                    'tax_code': tax_code,
                }
            )
            if a_created:
                allowances_created += 1

        if allowances_created > 0:
            self.stdout.write(self.style.SUCCESS(f'✅ Created {allowances_created} Allowances'))
        else:
            self.stdout.write(self.style.WARNING(f'ℹ️  Allowances already exist'))

        # Summary
        self.stdout.write(self.style.NOTICE('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS(' TAX CODE SEEDING COMPLETE'))
        self.stdout.write(self.style.NOTICE('='*60))
        
        self.stdout.write(f'\n  Tax Codes:    {TaxCode.objects.count()}')
        self.stdout.write(f'  Versions:     {TaxCodeVersion.objects.count()}')
        self.stdout.write(f'  Brackets:     {TaxBracket.objects.count()}')
        self.stdout.write(f'  Deductions:   {Deduction.objects.count()}')
        self.stdout.write(f'  Allowances:   {Allowance.objects.count()}\n')
