import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.employees.models import Employee
from apps.departments.models import Department

User = get_user_model()

def create_admin_employee():
    try:
        user = User.objects.get(username='admin')
        print(f"Found user: {user.username}")
        
        if user.employee:
            print(f"User already has employee profile: {user.employee}")
            return

        # Create a Department
        dept, _ = Department.objects.get_or_create(
            name='Management',
            defaults={
                'code': 'MGT',
                'description': 'Executive Management',
                'is_active': True
            }
        )
        print(f"Department: {dept.name}")

        # Create Employee Profile
        employee = Employee.objects.create(
            first_name='System',
            last_name='Admin',
            gender='Other',
            date_of_birth=date(1990, 1, 1),
            marital_status='Single',
            nationality='System',
            personal_tax_id='000000',
            phone='0000000000',
            email=user.email,
            
            # Job
            employee_id='ADMIN001',
            job_title='System Administrator',
            position='Manager',
            department=dept,
            employment_type='Permanent',
            join_date=date.today(),
            service_years=0,
            
            # Payroll
            salary=100000.00,
            status='Active',
            
            # Address
            primary_address='Server Room',
            country='Internet',
            state='Cloud',
            city='Localhost',
            postcode='127001'
        )
        
        # Link to User
        user.employee = employee
        user.save()
        
        print(f"Successfully created Employee profile for admin: ID {employee.id}")
        
    except User.DoesNotExist:
        print("Admin user not found!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_admin_employee()
