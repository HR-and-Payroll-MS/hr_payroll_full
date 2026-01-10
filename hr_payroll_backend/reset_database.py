"""
Database Reset Script for HR/Payroll System
This script will:
1. Delete all Employee records
2. Delete all Department records
3. Delete all User records
4. Create a new superuser
5. Create necessary Groups

Run with: python reset_database.py
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from apps.employees.models import Employee, EmployeeDocument
from apps.departments.models import Department

User = get_user_model()

def reset_database():
    print("=" * 50)
    print("HR/PAYROLL DATABASE RESET SCRIPT")
    print("=" * 50)
    
    # Confirm action
    confirm = input("\n⚠️  WARNING: This will DELETE ALL employees, departments, and users!\nType 'YES' to confirm: ")
    if confirm != 'YES':
        print("Aborted.")
        return
    
    print("\n🧨 NUCLEAR OPTION: Deleting database file...")
    db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db.sqlite3')
    
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print(f"   - Deleted {db_file}")
        except Exception as e:
            print(f"   - Error deleting file: {e}")
            return
    else:
        print("   - No database file found (starting fresh)")

    print("\n🔄 Running Migrations...")
    from django.core.management import call_command
    call_command('migrate', interactive=False)
    
    # Re-connect signals just in case
    try:
        from django.db.models.signals import post_save
        from apps.employees.signals import create_user_for_employee, create_employee_for_user
        from apps.employees.models import Employee
        
        post_save.connect(create_user_for_employee, sender=Employee)
        post_save.connect(create_employee_for_user, sender=User)
        print("   - Signals ensured for creation")
    except Exception as e:
        print(f"   - Warning: Could not connect signals: {e}")
    
    # Create Groups - matching the roles in useSidebarContent.js
    print("\n📁 Creating user groups...")
    # These match the keys in sidebarList: Payroll, Manager, Employee, Line Manager, Admin
    groups = ['Employee', 'Manager', 'Payroll', 'Line Manager', 'Admin']
    for group_name in groups:
        group, created = Group.objects.get_or_create(name=group_name)
        if created:
            print(f"   - Created group: {group_name}")
        else:
            print(f"   - Group exists: {group_name}")
    
    # Create superuser
    print("\n👤 Creating superuser...")
    username = 'admin'
    email = 'admin@company.local'
    password = 'Admin@123'
    
    # This will trigger the signal to auto-create an Employee profile for the admin!
    superuser = User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        first_name='System',
        last_name='Administrator'
    )
    
    # Add to Admin group (and Manager for frontend access)
    admin_group = Group.objects.get(name='Admin')
    manager_group = Group.objects.get(name='Manager')
    superuser.groups.add(admin_group)
    superuser.groups.add(manager_group)
    
    print("\n" + "=" * 50)
    print("🎉 DATABASE RESET COMPLETE!")
    print("=" * 50)
    print(f"\n📋 SUPERUSER CREDENTIALS:")
    print(f"   Username: {username}")
    print(f"   Password: {password}")
    print(f"   Email: {email}")
    print("\n⚠️  Please change the password after first login!")
    print("=" * 50)

if __name__ == '__main__':
    reset_database()
