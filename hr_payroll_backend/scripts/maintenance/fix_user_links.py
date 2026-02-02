"""
Script to fix existing unlinked User-Employee records
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from apps.employees.models import Employee

User = get_user_model()

print("Checking for unlinked users...")

fixed = 0
for user in User.objects.filter(employee__isnull=True).exclude(username='admin'):
    # Try to find matching employee by name
    emp = Employee.objects.filter(
        first_name=user.first_name, 
        last_name=user.last_name
    ).first()
    
    if emp:
        user.employee = emp
        user.save()
        print(f"  Linked {user.username} -> {emp.fullname}")
        fixed += 1
    else:
        print(f"  No employee found for user: {user.username}")

print(f"\nFixed {fixed} user-employee links")

# Show current state
print("\n=== CURRENT STATE ===")
for user in User.objects.all():
    groups = list(user.groups.values_list('name', flat=True))
    print(f"{user.username} | employee: {user.employee} | groups: {groups}")
