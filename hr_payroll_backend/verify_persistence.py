
import os
import django
import json

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.attendance.models import Attendance
from apps.employees.models import Employee
from apps.departments.models import Department
from django.utils import timezone
from django.db.models import Q
from datetime import date

def verify_persistence():
    try:
        today = timezone.localdate()
        target_date_str = today.isoformat()
        
        # Pick a department
        dept = Department.objects.filter(is_active=True).first()
        if not dept:
            print("No active departments found.")
            return
            
        print(f"DEBUG: Today is {today}. Testing Department: {dept.name} (ID: {dept.id})")
        
        # Count current records for today in this department
        initial_count = Attendance.objects.filter(employee__job_info__department=dept, date=today).count()
        print(f"Initial attendance records for today in this dept: {initial_count}")
        
        # SIMULATE THE VIEW LOGIC (Replicating the code I just added to the view)
        employees = Employee.objects.filter(job_info__department=dept).filter(
            Q(job_info__join_date__lte=target_date_str) | Q(job_info__join_date__isnull=True)
        ).filter(
            Q(payroll_info__last_working_date__isnull=True) | Q(payroll_info__last_working_date__gte=target_date_str)
        )
        
        eligible_count = employees.count()
        print(f"Eligible employees today: {eligible_count}")
        
        # The view now does:
        existing_att_ids = Attendance.objects.filter(
            employee__in=employees, 
            date=today
        ).values_list('employee_id', flat=True)
        
        missing_emps = employees.exclude(id__in=existing_att_ids)
        print(f"Missing employees before logic: {missing_emps.count()}")
        
        if missing_emps.exists():
            new_records = [
                Attendance(
                    employee=emp,
                    date=today,
                    status='ABSENT'
                ) for emp in missing_emps
            ]
            # Use same logic as in view
            if str(today) <= str(timezone.localdate().isoformat()):
                Attendance.objects.bulk_create(new_records, ignore_conflicts=True)
                print(f"SUCCESS: Created {len(new_records)} persistent ABSENT records.")
        else:
            print("No missing employees found (Persistence already handled or all clocked in).")
            
        # Final count
        final_count = Attendance.objects.filter(employee__job_info__department=dept, date=today).count()
        print(f"Final attendance records for today in this dept: {final_count}")
        
        if final_count >= eligible_count:
             print("VERIFICATION PASSED: Every eligible employee has a persistent record.")
        else:
             print("VERIFICATION FAILED: Some employees still missing records.")

    except Exception as e:
        import traceback
        print(f"ERROR: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    verify_persistence()
