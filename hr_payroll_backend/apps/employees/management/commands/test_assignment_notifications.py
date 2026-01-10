from django.core.management.base import BaseCommand
from apps.employees.models import Employee
from apps.notifications.models import Notification

class Command(BaseCommand):
    help = 'Verifies manager assignment notifications'

    def handle(self, *args, **kwargs):
        self.stdout.write('Testing Manager Assignment Notifications...')
        
        # Cleanup
        Employee.objects.filter(first_name__in=['TestEmp', 'TestMgr']).delete()
        
        # 1. Create Manager
        mgr = Employee.objects.create(
            first_name='TestMgr',
            last_name='User',
            job_title='Department Manager',
            status='Active'
        )
        
        # 2. Create Employee
        emp = Employee.objects.create(
            first_name='TestEmp',
            last_name='User',
            job_title='Employee',
            status='Active'
        )
        
        # Clear specific notifications from creation logic if any
        Notification.objects.filter(recipient__id__in=[emp.id, mgr.id]).delete()
        
        self.stdout.write(f'Assigning manager {mgr.fullname} to {emp.fullname}...')
        
        # 3. Assign Manager (Should trigger signals)
        emp.line_manager = mgr
        emp.save()
        
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
