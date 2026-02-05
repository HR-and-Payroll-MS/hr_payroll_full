import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.attendance.views import DepartmentAttendanceView
from apps.users.models import User
from rest_framework.test import APIRequestFactory, force_authenticate

def debug_summary():
    factory = APIRequestFactory()
    view = DepartmentAttendanceView.as_view()
    today_iso = timezone.localdate().isoformat()
    
    user = User.objects.filter(is_superuser=True).first()
    
    request = factory.get('/dummy/', {'date': today_iso})
    force_authenticate(request, user=user)
    response = view(request)
    
    print(f"Summary API Response Status: {response.status_code}")
    for d in response.data:
        if d.get('department_id') == 1:
            print(f"Computer Science Summary: {d}")

if __name__ == "__main__":
    debug_summary()
