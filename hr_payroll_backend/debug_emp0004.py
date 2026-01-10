import os
import django
from datetime import date, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.employees.models import Employee
from apps.attendance.models import Attendance

try:
    emp = Employee.objects.filter(employee_id='EMP0002').first()
    
    if emp:
        print(f"Checking Employee: {emp.fullname} ({emp.employee_id})")
        print(f"Join Date: {emp.join_date}")
        today = date.today()
        yesterday = today - timedelta(days=1)
        day_before = today - timedelta(days=2)
        
        target_dates = [yesterday, day_before]
        
        for d in target_dates:
            att = Attendance.objects.filter(employee=emp, date=d).first()
            if att:
                print(f"  Date {d}: Found ID={att.id}, Status='{att.status}'")
            else:
                 print(f"  Date {d}: No record found")
             
    else:
        print("Employee EMP0002 not found.")

except Exception as e:
    print(f"Error: {e}")
