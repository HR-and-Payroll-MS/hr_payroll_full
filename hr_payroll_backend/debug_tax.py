import os
import sys
import django
from decimal import Decimal

# Setup Django
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.payroll.models import Payslip

p = Payslip.objects.filter(base_salary__gte=Decimal('20000')).first()
if p:
    print(f"Employee: {p.employee.fullname}")
    print(f"Base: {p.base_salary}")
    print(f"Gross: {p.gross_pay}")
    print(f"Tax: {p.tax_amount}")
    print(f"Net: {p.net_pay}")
    print(f"Breakdown Earnings: {p.details.get('earnings')}")
    print(f"Breakdown Deductions: {p.details.get('deductions')}")
else:
    print("No matches found.")
