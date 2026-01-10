import os
import django
from django.conf import settings

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.employees.models import Employee
from django.test import RequestFactory

def debug_urls():
    emp = Employee.objects.filter(photo__isnull=False).first()
    if not emp:
        print("No employee with photo found.")
        # Let's check any employee
        emp = Employee.objects.first()
        if not emp:
            print("No employees found at all.")
            return
        print(f"Checking employee without photo: {emp.fullname}")
    else:
        print(f"Checking employee with photo: {emp.fullname}")
        print(f"Photo field: {emp.photo}")
        print(f"Photo URL property: {emp.photo.url}")
        
    factory = RequestFactory()
    request = factory.get('/api/v1/attendances/manager/department/')
    
    if emp.photo:
        abs_url = request.build_absolute_uri(emp.photo.url)
        print(f"Absolute URI: {abs_url}")
    else:
        print("Employee has no photo, but let me check dummy path:")
        dummy_path = "/media/employees/photos/test.jpg"
        abs_url = request.build_absolute_uri(dummy_path)
        print(f"Absolute URI for {dummy_path}: {abs_url}")
        
        dummy_rel_path = "media/employees/photos/test.jpg"
        abs_url_rel = request.build_absolute_uri(dummy_rel_path)
        print(f"Absolute URI for {dummy_rel_path}: {abs_url_rel}")

if __name__ == "__main__":
    debug_urls()
