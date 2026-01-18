from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from apps.employees import signals as employee_signals
from apps.employees.models import Employee
from apps.company.models import EmployeeJobInfo
from apps.payroll.models import EmployeePayrollInfo
from apps.users.models import EmployeeGeneralInfo
from apps.notifications.models import Notification

class Command(BaseCommand):
    help = 'Verifies manager assignment notifications'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        self.stdout.write('Testing Manager Assignment Notifications...')
        
        # Cleanup
        post_save.disconnect(employee_signals.create_user_for_employee, sender=Employee)
        post_save.disconnect(employee_signals.sync_user_groups, sender=Employee)
        post_save.disconnect(employee_signals.create_employee_for_user, sender=User)
        Employee.objects.filter(first_name__in=['TestEmp', 'TestMgr']).delete()

        # 1. Create Manager
        mgr = Employee.objects.create(
            first_name='TestMgr',
            last_name='User',
        )
        EmployeeGeneralInfo.objects.create(employee=mgr, email='testmgr@example.com')
        EmployeePayrollInfo.objects.create(employee=mgr, status='Active', salary=0)
        mgr_job = EmployeeJobInfo.objects.create(
            employee=mgr,
            employee_code='TESTMGR',
            job_title='Department Manager',
        )
        mgr.job_title = 'Department Manager'

        # 2. Create Employee
        emp = Employee.objects.create(
            first_name='TestEmp',
            last_name='User',
        )
        EmployeeGeneralInfo.objects.create(employee=emp, email='testemp@example.com')
        EmployeePayrollInfo.objects.create(employee=emp, status='Active', salary=0)
        emp_job = EmployeeJobInfo.objects.create(
            employee=emp,
            employee_code='TESTEMP',
            job_title='Employee',
            line_manager=mgr,
        )
        emp.job_title = 'Employee'
        
        # Clear specific notifications from creation logic if any
        Notification.objects.filter(recipient__id__in=[emp.id, mgr.id]).delete()
        
        self.stdout.write(f'Assigning manager {mgr.fullname} to {emp.fullname}...')
        
        # 3. Assign Manager (Should trigger signals)
        emp_job.line_manager = mgr
        emp_job.save()
        
        # 4. Verify Notifications
        emp_notifs = Notification.objects.filter(recipient=emp, title="New Manager Assigned")
        mgr_notifs = Notification.objects.filter(recipient=mgr, title="New Direct Report")
        
        success = True
        if emp_notifs.exists():
            self.stdout.write(self.style.SUCCESS(f'OK: Employee notified - {emp_notifs.first().message}'))
        else:
            self.stdout.write(self.style.ERROR('FAIL: Employee notification missing'))
            success = False
            
        if mgr_notifs.exists():
            self.stdout.write(self.style.SUCCESS(f'OK: Manager notified - {mgr_notifs.first().message}'))
        else:
            self.stdout.write(self.style.ERROR('FAIL: Manager notification missing'))
            success = False
            
        if success:
            self.stdout.write(self.style.SUCCESS('\nVerification PASSED'))
        else:
            self.stdout.write(self.style.ERROR('\nVerification FAILED'))

        post_save.connect(employee_signals.create_user_for_employee, sender=Employee)
        post_save.connect(employee_signals.sync_user_groups, sender=Employee)
        post_save.connect(employee_signals.create_employee_for_user, sender=User)
