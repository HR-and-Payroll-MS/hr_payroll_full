"""
Verification script for policy and tax code integration.
Run with: python verify_integration.py
"""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from apps.payroll.models import TaxCode, TaxCodeVersion, TaxBracket, Deduction, Allowance
from apps.policies.models import Policy
from apps.company.models import CompanyInfo


def verify():
    print("=" * 60)
    print(" VERIFICATION: Policy & Tax Code Integration")
    print("=" * 60)

    # 1. Tax Code Verification
    print("\n📊 TAX CODES:")
    for tc in TaxCode.objects.filter(is_active=True):
        print(f"  ✅ {tc.code} - {tc.name}")
        for v in tc.versions.filter(is_active=True):
            print(f"     Version: {v.version} (valid from {v.valid_from})")
            brackets = v.tax_brackets.all().order_by('min_income')
            print(f"     Brackets: {brackets.count()}")
            for b in brackets:
                max_str = f"{b.max_income}" if b.max_income else "∞"
                print(f"       {b.min_income} - {max_str}: {b.rate}%")

    # 2. Policy Verification
    print("\n📋 POLICIES:")
    for p in Policy.objects.filter(is_active=True):
        print(f"  ✅ {p.section}")
        if p.section == 'overtimePolicy':
            print(f"     overtimeRate: {p.content.get('overtimeRate')}")
            print(f"     weekendRate: {p.content.get('weekendRate')}")
            print(f"     holidayRate: {p.content.get('holidayRate')}")
        elif p.section == 'attendancePolicy':
            grace = p.content.get('gracePeriod', {})
            print(f"     gracePeriod: {grace.get('minutesAllowed')} minutes")
        elif p.section == 'shiftPolicy':
            print(f"     workingHoursPerDay: {p.content.get('workingHoursPerDay')}")

    # 3. Company Info Verification
    print("\n🏢 COMPANY INFO:")
    c = CompanyInfo.objects.first()
    if c:
        print(f"  ✅ Name: {c.name}")
        print(f"     Email: {c.email}")
        print(f"     Phone: {c.country_code}{c.phone}")
        print(f"     Tax ID: {c.tax_id}")
    else:
        print("  ❌ No company info found")

    # 4. Deductions & Allowances
    print("\n💰 DEDUCTIONS:")
    for d in Deduction.objects.filter(is_active=True):
        print(f"  ✅ {d.code} - {d.name} ({d.percentage_value or d.default_value})")

    print("\n🎁 ALLOWANCES:")
    for a in Allowance.objects.filter(is_active=True):
        print(f"  ✅ {a.code} - {a.name} ({a.default_value})")

    print("\n" + "=" * 60)
    print(" VERIFICATION COMPLETE ✅")
    print("=" * 60)


if __name__ == '__main__':
    verify()
