
import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.attendance.views import DepartmentAttendanceDetailView
from apps.users.models import User
from rest_framework.test import APIRequestFactory, force_authenticate

def debug_emp0001():
    factory = APIRequestFactory()
    view = DepartmentAttendanceDetailView.as_view()
    today_iso = timezone.localdate().isoformat()
    
    # Get a user for authentication
    user = User.objects.filter(is_superuser=True).first()
    if not user:
        user = User.objects.first()
        
    # Dept ID 1 for Computer Science
    request = factory.get('/dummy/', {'date': today_iso})
    force_authenticate(request, user=user)
    response = view(request, pk=1)
    
    print(f"API Response Status: {response.status_code}")
    if response.status_code == 200:
        found = False
        for r in response.data:
            if r.get('employee_id') == 1 or r.get('employee_name') == 'System Administrator':
                print(f"FOUND EMP0001 DATA: {r}")
                found = True
                break
        if not found:
            print("EMP0001 NOT FOUND in API response for Dept 1")
    else:
        print(f"API Error Response Data: {response.data}")

if __name__ == "__main__":
    debug_emp0001()
