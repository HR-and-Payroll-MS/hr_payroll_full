import os
import django
from datetime import date

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.employees.models import Employee
from apps.attendance.models import OvertimeRequest
from apps.notifications.models import Notification
from apps.attendance.serializers import OvertimeRequestSerializer
from rest_framework.test import APIRequestFactory

def verify_ot_notifications():
    print("--- Verifying Overtime Notifications & Visibility ---")
    
    # 1. Setup Manager and Employee
    manager_user = User.objects.filter(username__icontains='manager').first()
    if not manager_user or not hasattr(manager_user, 'employee'):
        print("No manager user found.")
        return
    manager = manager_user.employee

    target_employee = Employee.objects.filter(department=manager.department).exclude(id=manager.id).first()
    if not target_employee:
        print("No target employee found in manager department.")
        return
    
    print(f"Manager: {manager.fullname}")
    print(f"Target Employee: {target_employee.fullname}")

    # 2. Simulate Overtime Initiation (Manager)
    payload = {
        "date": date.today().isoformat(),
        "hours": 3.5,
        "justification": "System Verification Overtime",
        "employees": [target_employee.id]
    }

    from apps.attendance.views import OvertimeRequestViewSet
    viewset = OvertimeRequestViewSet()
    factory = APIRequestFactory()
    request = factory.post('/api/v1/attendances/overtime/', payload, format='json')
    request.user = manager_user
    viewset.request = request
    
    serializer = OvertimeRequestSerializer(data=payload)
    if serializer.is_valid():
        print("Serializer validated successfully.")
        instance = viewset.perform_create(serializer)
        print("Overtime record created.")
    else:
        print(f"Serializer failed: {serializer.errors}")
        return

    # 3. Verify Notification Creation
    notif = Notification.objects.filter(recipient=target_employee, title="New Overtime Assigned").first()
    if notif:
        print(f"SUCCESS: Notification found for {target_employee.fullname}")
        print(f"Message: {notif.message}")
    else:
        print("FAILURE: Notification not created.")

    # 4. Verify Employee Visibility (RBAC)
    employee_user = target_employee.user
    if employee_user:
        request_get = factory.get('/api/v1/attendances/overtime/')
        request_get.user = employee_user
        viewset.request = request_get
        
        queryset = viewset.get_queryset()
        if queryset.filter(id__in=[notif.id if notif else 0]).exists() or queryset.filter(justification="System Verification Overtime").exists():
            print(f"SUCCESS: Employee {target_employee.fullname} can see their assigned overtime.")
        else:
            print(f"FAILURE: Employee {target_employee.fullname} cannot see their assigned overtime.")
            print(f"Queryset count: {queryset.count()}")
    else:
        print("Could not verify employee visibility: Employee has no linked user account.")

    # Cleanup (Optional)
    # n_deleted = Notification.objects.filter(justification__icontains="System Verification").delete()
    # ot_deleted = OvertimeRequest.objects.filter(justification="System Verification Overtime").delete()
    # print("Cleanup done.")

if __name__ == "__main__":
    verify_ot_notifications()
