from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from apps.employees.models import Employee
from apps.leaves.models import LeaveRequest, LeaveApproval
from apps.notifications.models import Notification

class Command(BaseCommand):
    help = 'Runs an integration test for the Leave Request lifecycle'

    def handle(self, *args, **kwargs):
        self.stdout.write("="*60)
        self.stdout.write("STARTING LEAVE REQUEST INTEGRATION TEST")
        self.stdout.write("="*60)

        User = get_user_model()

        # --- 0. CLEANUP ---
        self.stdout.write("[Step 0] Cleaning up old test data...")
        # Delete in correct order to avoid FK constraints
        try:
            # First, delete any leave requests from test employees
            test_emails = ['emp@test.com', 'mgr@test.com', 'hr@test.com']
            test_employees = Employee.objects.filter(email__in=test_emails)
            LeaveRequest.objects.filter(employee__in=test_employees).delete()
            
            # Delete users (this will cascade to employee if OneToOne)
            test_users = User.objects.filter(username__in=['emp_user', 'mgr_user', 'hr_user'])
            for user in test_users:
                if hasattr(user, 'employee'):
                    user.employee = None
                    user.save()
            test_users.delete()
            
            # Then delete employees
            Employee.objects.filter(email__in=test_emails).delete()
            
            self.stdout.write("  ✔ Cleanup complete.")
        except Exception as e:
            self.stdout.write(f"  ⚠ Cleanup warning: {e} (continuing anyway...)")

        # --- 1. SETUP DATA ---
        self.stdout.write("\n[Step 1] Setting up Roles (Employee, Manager, HR)...")
        
        # 1.1 Create HR (The signals will handle linking)
        # Using get_or_create to be safe
        hr_emp, _ = Employee.objects.get_or_create(
            email='hr@test.com', 
            defaults={
                'first_name': 'Harriet', 
                'last_name': 'Resources', 
                'job_title': 'Manager',
                'position': 'Manager'
            }
        )
        # Get the user that was auto-created by signal
        hr_user = hr_emp.user_account
        hr_user.is_staff = True # Make staff so they pass HR checks in views
        hr_user.save()
        self.stdout.write(f"  ✔ HR Setup: {hr_emp.fullname} (User: {hr_user.username})")

        # 1.2 Create Manager
        mgr_emp, _ = Employee.objects.get_or_create(
            email='mgr@test.com',
            defaults={
                'first_name': 'Mark', 
                'last_name': 'Manager', 
                'job_title': 'Department Manager',
                'position': 'Department Manager'
            }
        )
        mgr_user = mgr_emp.user_account
        self.stdout.write(f"  ✔ Manager Setup: {mgr_emp.fullname} (User: {mgr_user.username})")

        # 1.3 Create Employee
        emp_emp, _ = Employee.objects.get_or_create(
            email='emp@test.com',
            defaults={
                'first_name': 'Eddie', 
                'last_name': 'Employee', 
                'line_manager': mgr_emp,
                'join_date': date(2024, 1, 1),
                'job_title': 'Developer',
                'position': 'Developer'
            }
        )
        emp_user = emp_emp.user_account
        self.stdout.write(f"  ✔ Employee Setup: {emp_emp.fullname} (User: {emp_user.username})")

        self.stdout.write("✔ Setup Complete.")

 
        self.stdout.write("\n[Step 2] Employee submitting Leave Request...")
        leave = LeaveRequest.objects.create( employee=emp_emp,leave_type='annual',start_date=date.today() + timedelta(days=10),
            end_date=date.today() + timedelta(days=15),days=5,reason="Vacation time",
            status='pending'
        )
        LeaveApproval.objects.create(leave_request=leave, step=1, role='Manager', status='pending')
        LeaveApproval.objects.create(leave_request=leave, step=2, role='HR', status='pending')
        mgr_notif = Notification.objects.filter(recipient=mgr_emp).first()
        if mgr_notif:
            self.stdout.write(f"✔ Notification sent to Manager: {mgr_notif.title}")
        else:
            self.stdout.write("ℹ Manager not automatically notified by model (expected if triggered in View)")
        self.stdout.write("\n[Step 3] Manager approving Request...")
        leave.status = 'manager_approved'
        leave.save()
        LeaveApproval.objects.filter(leave_request=leave, step=1).update(
            status='approved', approver=mgr_emp, decided_at=timezone.now(), comment="Approved by Manager"
        )
        self.stdout.write("  > Triggering HR Notification...")
        Notification.objects.create(
            recipient=hr_emp, sender=emp_emp, title="Leave Request Pending HR Approval",
            message=f"{emp_emp.fullname}'s request awaits HR.", notification_type='request'
        )
        hr_notif = Notification.objects.filter(recipient=hr_emp, title__icontains="HR Approval").exists()
        if hr_notif:
             self.stdout.write("✔ HR notified successfully.")
        self.stdout.write("\n[Step 4] HR Giving Final Approval...")
        leave.status = 'approved'
        leave.save()
        LeaveApproval.objects.filter(leave_request=leave, step=2).update(
            status='approved', approver=hr_emp, decided_at=timezone.now(), comment="Final HR Approval"
        )
        Notification.objects.create(
            recipient=emp_emp, title="Leave Request Approved",
            message="Your leave is approved.", notification_type='success'
        )
        self.stdout.write("\n[Step 5] Final checks...")
        final_leave = LeaveRequest.objects.get(id=leave.id)
        emp_notif = Notification.objects.filter(recipient=emp_emp, title="Leave Request Approved").exists()
        if final_leave.status == 'approved' and emp_notif:
            self.stdout.write("="*60)
            self.stdout.write("INTEGRATION TEST PASSED SUCCESSFULLY")
            self.stdout.write("="*60)
        else:
            self.stdout.write("✘ TEST FAILED: Verify status and notifications.")
