import os
import django
from datetime import date, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.employees.models import Employee
from apps.attendance.models import Attendance

def check_missing():
    print("Starting Attendance Audit...")
    employees = Employee.objects.all()
    today = date.today()
    
    issues_found = 0
    
    for emp in employees:
        if not emp.join_date:
            print(f"SKIP: {emp.fullname} (No Join Date)")
            continue
            
        # Determine check range
        start_date = emp.join_date
        # Limit start date to reasonable past (e.g. 2020) to avoid infinite loops if bad data
        if start_date.year < 2020: 
             start_date = date(2025, 1, 1) # Safety clamp for dev environment
        
        current = start_date
        
        print(f"Checking {emp.fullname} ({emp.employee_id}) from {start_date} to {today}...")
        
        while current <= today:
            # Check for record
            att = Attendance.objects.filter(employee=emp, date=current).first()
            
            if not att:
                print(f"  [MISSING] {current}: No record found")
                issues_found += 1
            elif not att.status:
                 print(f"  [NO STATUS] {current}: Record exists but status is None/Empty")
                 issues_found += 1
            
            current += timedelta(days=1)

    print(f"\nAudit Complete. Found {issues_found} issues.")

if __name__ == "__main__":
    check_missing()
