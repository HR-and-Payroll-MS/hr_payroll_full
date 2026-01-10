import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.employees.models import Employee
from apps.employees.signals import sync_user_groups

def promote_user(username):
    print(f"--- Promoting {username} to HR Manager ---")
    try:
        emp = Employee.objects.get(user_account__username=username)
        emp.job_title = 'HR Manager'
        emp.save()
        # The signal should handle group sync now
        print(f"Role updated for {emp.fullname}")
        
        # Verify groups
        user = emp.user_account
        groups = list(user.groups.values_list('name', flat=True))
        print(f"Current Groups: {groups}")
    except Employee.DoesNotExist:
        print(f"User {username} not found as an employee.")

if __name__ == "__main__":
    # Promote the most likely user accounts
    promote_user('seud.abdulsemed')
    promote_user('EyobTaye')
    # Also promote a new designated HR account just in case
    promote_user('hr.manager')
