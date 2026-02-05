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

def check_attendance_api_logic():
    try:
        from django.utils import timezone
        today = timezone.localdate()
        print(f"DEBUG: Today is {today} (Type: {type(today)})")
        
        # Check specific department
        dept = Department.objects.filter(is_active=True).first()
        if not dept:
            print("No active departments found.")
            return
            
        print(f"Checking Department: {dept.name} (ID: {dept.id})")
        
        # Replicating logic from DepartmentAttendanceDetailView (apps/attendance/views.py line 242+)
        target_date_str = today.isoformat()
        
        employees = Employee.objects.filter(
            department=dept
        ).filter(
            Q(join_date__lte=target_date_str) | Q(join_date__isnull=True)
        ).filter(
            Q(last_working_date__isnull=True) | Q(last_working_date__gte=target_date_str)
        )
        
        print(f"Total employees eligible today for this department: {employees.count()}")
        
        for emp in employees:
            print(f"\n--- Checking Employee: {emp.fullname} (ID: {emp.id}) ---")
            try:
                att = Attendance.objects.get(employee=emp, date=today)
                print(f"  DB RECORD FOUND: status='{att.status}', clock_in={att.clock_in}")
                print(f"  VIEW LOGIC WOULD RETURN: status='{att.status.upper()}'")
            except Attendance.DoesNotExist:
                print("  DB RECORD NOT FOUND")
                # Replicating VIEW logic for Absence (apps/attendance/views.py line 300+)
                l_today = timezone.localdate().isoformat()
                is_future = str(target_date_str) > str(l_today)
                status_text = 'ABSENT' if not is_future else '--'
                
                # Check join date logic
                if emp.join_date and str(target_date_str) < str(emp.join_date):
                    status_text = 'N/A'
                    
                print(f"  VIEW LOGIC WOULD RETURN: status='{status_text}' (is_future={is_future}, target_date={target_date_str}, l_today={l_today})")
                
    except Exception as e:
        import traceback
        print(f"ERROR: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    check_attendance_api_logic()
