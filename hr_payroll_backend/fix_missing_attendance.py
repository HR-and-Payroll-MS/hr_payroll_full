import os
import django
from datetime import date, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.employees.models import Employee
from apps.attendance.models import Attendance

def fix_missing():
    print("Starting Attendance Backfill Fix...")
    employees = Employee.objects.all()
    today = date.today()
    
    total_created = 0
    
    for emp in employees:
        if not emp.join_date:
            continue
            
        start_date = emp.join_date
        # Clamp to a reasonable date if join_date is extremely old for this dev/test context
        # But user said "starting from the day their job is started", so we should try to honor it.
        # However, for performance massive loops, let's just do it.
        
        # Optimization: Find existing dates first
        existing_dates = set(Attendance.objects.filter(
            employee=emp, 
            date__gte=start_date, 
            date__lte=today
        ).values_list('date', flat=True))
        
        current = start_date
        to_create = []
        
        while current <= today:
            if current not in existing_dates:
                # Prepare 'Absent' record
                to_create.append(Attendance(
                    employee=emp,
                    date=current,
                    status='absent'
                ))
            current += timedelta(days=1)
        
        if to_create:
            print(f"Backfilling {len(to_create)} days for {emp.fullname}...")
            Attendance.objects.bulk_create(to_create)
            total_created += len(to_create)
        else:
            print(f"No gaps for {emp.fullname}.")

    print(f"\nFix Complete. Created {total_created} missing 'Absent' records.")

if __name__ == "__main__":
    fix_missing()
