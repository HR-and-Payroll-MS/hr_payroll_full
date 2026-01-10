import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.employees.models import Employee
from apps.employees.signals import sync_user_groups

def sync_all():
    print("--- Global Group Sync ---")
    employees = Employee.objects.all()
    count = 0
    for emp in employees:
        if hasattr(emp, 'user_account') and emp.user_account:
            sync_user_groups(Employee, emp, created=False)
            count += 1
    print(f"Synced groups for {count} employees.")

if __name__ == "__main__":
    sync_all()
