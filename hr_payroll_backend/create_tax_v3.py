import os
import sys
import django
from decimal import Decimal

# Setup Django
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.payroll.models import TaxCode, TaxCodeVersion, TaxBracket

def create_v3():
    tc = TaxCode.objects.filter(name='Federal Tax Code').first()
    if not tc:
        print("Federal Tax Code not found")
        return

    # Deactivate other versions
    tc.versions.all().update(is_active=False)

    # Create v3.0
    v3 = TaxCodeVersion.objects.create(
        tax_code=tc,
        version='3.0',
        valid_from='2026-02-01',
        is_active=True,
        income_tax_config={'type': 'progressive'},
        pension_config={'employeePercent': 7, 'employerPercent': 11},
        rounding_rules={'method': 'nearest', 'precision': 2},
        statutory_deductions_config=[
            {'name': 'National Social Security', 'percent': 1.5},
            {'name': 'Community Development Levy', 'percent': 0.5}
        ],
        exemptions_config=[
            {'name': 'Personal Relief (Fixed)', 'limit': 2500, 'overtimeTaxable': False},
            {'name': 'Housing Exemption', 'limit': 3000, 'overtimeTaxable': False},
            {'name': 'Transport Exemption', 'limit': 1500, 'overtimeTaxable': False},
            {'name': 'Utility Allowance Exemption', 'limit': 1000, 'overtimeTaxable': False}
        ],
        compliance_notes=[
            {'label': 'Authority', 'value': 'Federal Revenue Office'},
            {'label': 'Regulation', 'value': 'FIRS 2026-B'},
            {'label': 'Currency', 'value': 'USD'},
            {'label': 'Periodicity', 'value': 'Monthly'}
        ]
    )

    # Add Brackets
    brackets = [
        (0, 5000, 0),
        (5000, 15000, 7),
        (15000, 30000, 15),
        (30000, 100000, 25),
        (100000, 250000, 30),
        (250000, None, 35)
    ]

    for b_min, b_max, rate in brackets:
        TaxBracket.objects.create(
            tax_code_version=v3,
            min_income=Decimal(str(b_min)),
            max_income=Decimal(str(b_max)) if b_max is not None else None,
            rate=Decimal(str(rate))
        )

    print(f"Created TaxCodeVersion v3.0 (ID: {v3.id}) and set as active.")

if __name__ == "__main__":
    create_v3()
