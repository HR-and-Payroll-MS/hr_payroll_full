import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from apps.payroll.models import Payslip
from apps.employees.models import Employee
import json, sys

emp = Employee.objects.filter(id=110).first()
if not emp:
    print("EMPLOYEE NOT FOUND")
    sys.exit(0)

p = Payslip.objects.filter(employee=emp, period__month='January', period__year=2026).first()
if not p:
    print("PAYSLIP NOT FOUND")
    sys.exit(0)

print('PAYSILP_ID:', p.id)
print('TAX_AMOUNT:', float(p.tax_amount))
print('TAX_CODE:', getattr(p.tax_code,'code', None))
print('TAX_VERSION:', getattr(p.tax_code_version,'version', None))

ts = p.details.get('taxSummary') if p.details else {}
print('TAX_SUMMARY:', json.dumps(ts, default=str))

dbg = p.details.get('debug') if p.details else None
if dbg:
    print('\nDEBUG TRACE (last entries):')
    for d in dbg[-20:]:
        print('-', json.dumps(d, default=str))
else:
    print('NO DEBUG TRACE')
