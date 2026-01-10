
import os
import django
import sys
from datetime import date, time, datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.employees.models import Employee
from apps.attendance.models import Attendance
from apps.attendance.serializers import AttendanceSerializer

def test_correction():
    print("Setting up test...")
    # Get or create dummy employee
    emp = Employee.objects.first()
    if not emp:
        print("No employee found")
        return

    today = date.today()
    
    # 1. Test Clock In deletion
    print("\nTest 1: Deleting Clock In")
    att1, created = Attendance.objects.get_or_create(
        employee=emp,
        date=today,
        defaults={
            'clock_in': datetime.now(),
            'clock_out': datetime.now(),
            'clock_in_location': 'Office',
            'clock_out_location': 'Office',
            'status': 'PRESENT',
            'worked_hours': 8
        }
    )
    # Ensure it has data initially (force update if it existed)
    att1.clock_in = datetime.now()
    att1.clock_out = datetime.now()
    att1.clock_in_location = 'Office'
    att1.clock_out_location = 'Office'
    att1.status = 'PRESENT'
    att1.save()
    
    # Simulate API update payload
    data = {'clock_in': None}
    serializer = AttendanceSerializer(att1, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        att1.refresh_from_db()
        print(f"Clock In: {att1.clock_in}")
        print(f"Clock Out: {att1.clock_out}")
        print(f"In Loc: {att1.clock_in_location}")
        print(f"Out Loc: {att1.clock_out_location}")
        print(f"Status: {att1.status}")
        
        if att1.clock_out is None and att1.clock_in_location == "" and att1.clock_out_location == "":
            print("PASS: Dependent fields cleared")
        else:
            print("FAIL: Dependent fields NOT cleared")
    else:
        print("Serializer errors:", serializer.errors)

    # 2. Test Clock Out deletion
    print("\nTest 2: Deleting Clock Out only")
    att1.clock_in = datetime.now()
    att1.clock_out = datetime.now()
    att1.clock_in_location = 'Office'
    att1.clock_out_location = 'Office'
    att1.save()
    
    data = {'clock_out': None}
    serializer = AttendanceSerializer(att1, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        att1.refresh_from_db()
        print(f"Clock In: {att1.clock_in}")
        print(f"Clock Out: {att1.clock_out}")
        print(f"In Loc: {att1.clock_in_location}")
        print(f"Out Loc: {att1.clock_out_location}")
        
        if att1.clock_in is not None and att1.clock_out is None and att1.clock_out_location == "":
            print("PASS: Clock out fields cleared, Clock in preserved")
        else:
            print("FAIL: Logic incorrect")

if __name__ == '__main__':
    test_correction()
