import os
import django
import json
from datetime import date
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.employees.models import Employee
from apps.attendance.models import OvertimeRequest
from apps.attendance.serializers import OvertimeRequestSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

def verify_ot_initiation():
    print("--- Verifying Overtime Initiation Fix ---")
    
    # 1. Get a Manager
    manager_user = User.objects.filter(username__icontains='manager').first()
    if not manager_user or not hasattr(manager_user, 'employee'):
        print("No manager user found.")
        return

    manager = manager_user.employee
    print(f"Testing with manager: {manager_user.username} ({manager.fullname})")
    print(f"Manager Department: {manager.department}")

    # 2. Get Employees in same department
    team = Employee.objects.filter(department=manager.department).exclude(id=manager.id)
    if not team.exists():
        print("No team members found for this manager.")
        return
    
    employee_ids = [e.id for e in team[:2]]
    print(f"Targeting employees: {employee_ids}")

    # 3. Simulate POST payload (NO manager field, just like frontend)
    payload = {
        "date": date.today().isoformat(),
        "hours": 2,
        "justification": "Testing OT Fix",
        "employees": employee_ids
    }

    # 4. Check Serializer Validation
    # We need to check if OvertimeRequestSerializer allows payload WITHOUT manager
    serializer = OvertimeRequestSerializer(data=payload)
    is_valid = serializer.is_valid()
    
    if is_valid:
        print("SUCCESS: Serializer is valid without 'manager' field.")
    else:
        print("FAILURE: Serializer validation failed.")
        print(f"Errors: {serializer.errors}")
        return

    # 5. Check perform_create logic
    from apps.attendance.views import OvertimeRequestViewSet
    viewset = OvertimeRequestViewSet()
    
    # Mocking self.request in viewset
    factory = APIRequestFactory()
    request = factory.post('/api/v1/attendances/overtime/', payload, format='json')
    request.user = manager_user
    viewset.request = request
    viewset.format_kwarg = None
    
    print("Attempting to save via perform_create...")
    try:
        viewset.perform_create(serializer)
        print("SUCCESS: perform_create executed without error.")
        
        # Verify the saved request
        ot_req = OvertimeRequest.objects.filter(manager=manager, justification="Testing OT Fix").first()
        if ot_req:
            print(f"Confirmed: OvertimeRequest created. ID: {ot_req.id}, Manager: {ot_req.manager.fullname}")
            print(f"Employees assigned: {[e.fullname for e in ot_req.employees.all()]}")
            # Cleanup
            ot_req.delete()
        else:
            print("FAILURE: OvertimeRequest was not found in DB.")
            
    except Exception as e:
        print(f"FAILURE: perform_create raised error: {e}")

if __name__ == "__main__":
    verify_ot_initiation()
