"""
Setup test data for payroll testing.
Creates sample salaries and tax configuration.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from decimal import Decimal
from datetime import date
import random

from apps.employees.models import Employee
from apps.payroll.models import TaxCode, TaxCodeVersion, TaxBracket, Allowance, Deduction, PayrollPeriod, Payslip


def setup_test_data():
    print("=" * 60)
    print(" SETTING UP TEST DATA")
    print("=" * 60)
    
    # 1. Set salaries for employees without salary
    print("\n1. Setting employee salaries...")
    
    employees = Employee.objects.filter(status='Active')
    salary_ranges = [3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]
    
    updated = 0
    for emp in employees:
        if not emp.salary or emp.salary == 0:
            emp.salary = Decimal(str(random.choice(salary_ranges)))
            emp.save()
            updated += 1
    
    print(f"   Updated {updated} employees with random salaries")
    
    # Show sample
    for emp in Employee.objects.filter(status='Active')[:5]:
        print(f"      {emp.fullname}: ${emp.salary}")
    
    # 2. Create Tax Code
    print("\n2. Creating Tax Code...")
    
    tax_code, created = TaxCode.objects.get_or_create(
        code='STANDARD',
        defaults={
            'name': 'Standard Tax',
            'description': 'Standard income tax for all employees',
            'is_active': True
        }
    )
    
    if created:
        print(f"   Created tax code: {tax_code.name}")
    else:
        print(f"   Using existing tax code: {tax_code.name}")
    
    # 3. Create Tax Code Version with brackets
    print("\n3. Creating Tax Version and Brackets...")
    
    version, created = TaxCodeVersion.objects.get_or_create(
        tax_code=tax_code,
        version='2026-v1',
        defaults={
            'valid_from': date(2026, 1, 1),
            'valid_to': None,
            'is_active': True,
            'income_tax_config': {
                'description': 'Progressive tax brackets'
            },
            'pension_config': {},
            'rounding_rules': {'precision': 2}
        }
    )
    
    if created:
        print(f"   Created version: {version.version}")
        
        # Create tax brackets
        brackets = [
            (0, 5000, 0),       # 0-5000: 0%
            (5000, 10000, 10),  # 5000-10000: 10%
            (10000, 20000, 15), # 10000-20000: 15%
            (20000, None, 20),  # 20000+: 20%
        ]
        
        for min_inc, max_inc, rate in brackets:
            TaxBracket.objects.create(
                tax_code_version=version,
                min_income=Decimal(str(min_inc)),
                max_income=Decimal(str(max_inc)) if max_inc else None,
                rate=Decimal(str(rate)),
                applies_to='all'
            )
            print(f"      Bracket: ${min_inc} - ${max_inc or '∞'} @ {rate}%")
    else:
        print(f"   Using existing version: {version.version}")
    
    # 4. Create sample allowances
    print("\n4. Creating Allowances...")
    
    allowance_data = [
        ('TRANSPORT', 'Transport Allowance', 200),
        ('HOUSING', 'Housing Allowance', 500),
    ]
    
    for code, name, value in allowance_data:
        allowance, created = Allowance.objects.get_or_create(
            code=code,
            defaults={
                'name': name,
                'default_value': Decimal(str(value)),
                'calculation_type': 'fixed',
                'is_taxable': True,
                'is_active': True,
                'applies_to': ['all'],
                'tax_code': tax_code
            }
        )
        print(f"   {'Created' if created else 'Exists'}: {name} = ${value}")
    
    # 5. Create sample deductions
    print("\n5. Creating Deductions...")
    
    deduction_data = [
        ('PENSION', 'Pension Contribution', 7, True),  # 7% of gross
    ]
    
    for code, name, value, is_pct in deduction_data:
        deduction, created = Deduction.objects.get_or_create(
            code=code,
            defaults={
                'name': name,
                'default_value': Decimal('0') if is_pct else Decimal(str(value)),
                'percentage_value': Decimal(str(value)) if is_pct else None,
                'calculation_type': 'percentage' if is_pct else 'fixed',
                'is_mandatory': True,
                'is_pre_tax': True,
                'is_active': True,
                'applies_to': ['all'],
                'tax_code': tax_code
            }
        )
        print(f"   {'Created' if created else 'Exists'}: {name} = {value}%")
    
    # 6. Reset January 2026 period for fresh test
    print("\n6. Resetting January 2026 Period...")
    
    try:
        period = PayrollPeriod.objects.get(month='January', year=2026)
        Payslip.objects.filter(period=period).delete()
        period.status = 'draft'
        period.submitted_at = None
        period.submitted_by = None
        period.approved_at = None
        period.approved_by = None
        period.finalized_at = None
        period.save()
        print(f"   Reset period to draft status")
    except PayrollPeriod.DoesNotExist:
        print(f"   No existing period to reset")
    
    print("\n" + "=" * 60)
    print(" TEST DATA SETUP COMPLETE")
    print("=" * 60)
    print("\nNext: Run test_payroll.py to test with this data")


if __name__ == '__main__':
    setup_test_data()
