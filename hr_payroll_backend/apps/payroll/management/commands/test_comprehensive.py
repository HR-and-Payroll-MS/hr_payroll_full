from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from datetime import date
from decimal import Decimal
from apps.employees import signals as employee_signals
from apps.employees.models import Employee
from apps.users.models import EmployeeGeneralInfo
from apps.company.models import EmployeeJobInfo
from apps.payroll.models import EmployeePayrollInfo
from apps.payroll.models import PayrollPeriod, TaxCode, TaxCodeVersion, TaxBracket, Payslip
from apps.policies.models import Policy
from apps.notifications.models import Notification
from apps.payroll.services import PayrollCalculationService

class Command(BaseCommand):
    help = 'Runs comprehensive payroll tests'

    def handle(self, *args, **kwargs):
        self.stdout.write("="*60)
        self.stdout.write("STARTING COMPREHENSIVE PAYROLL SYSTEM TEST")
        self.stdout.write("="*60)

        User = get_user_model()

        # --- 0. CLEANUP ---
        self.stdout.write("[Step 0] Cleaning up old test data...")
        emails = ['admin@test.com', 'full@test.com', 'mid@test.com']
        User.objects.filter(email__in=emails).delete()
        emp_ids = list(EmployeeGeneralInfo.objects.filter(email__in=emails).values_list('employee_id', flat=True))
        Employee.objects.filter(id__in=emp_ids).delete()
        TaxCode.objects.filter(code__in=['TAX_A', 'TAX_B', 'TAX_C']).delete()
        Policy.objects.filter(section='attendancePolicy').delete()

        # --- 1. SETUP DATA ---
        self.stdout.write("\n[Step 1] Setting up Test Data...")
        
        # Create Admin/HR User
        admin_user, _ = User.objects.get_or_create(username='admin_test', defaults={'email': 'admin@test.com'})

        # Disconnect signals to avoid legacy field usage during creation
        post_save.disconnect(employee_signals.create_user_for_employee, sender=Employee)
        post_save.disconnect(employee_signals.sync_user_groups, sender=Employee)
        post_save.disconnect(employee_signals.create_employee_for_user, sender=User)

        # Create Admin Employee (partitioned)
        admin_employee = Employee.objects.create(first_name='Admin', last_name='Test')
        EmployeeGeneralInfo.objects.create(employee=admin_employee, email='admin@test.com')
        EmployeeJobInfo.objects.create(employee=admin_employee, employee_code='ADMIN001', job_title='HR Manager', employment_type='Full-Time', join_date=date(2025, 1, 1))
        EmployeePayrollInfo.objects.create(employee=admin_employee, status='Active', salary=Decimal('10000.00'))
        admin_employee.salary = Decimal('10000.00')
        admin_employee.join_date = date(2025, 1, 1)
        admin_employee.job_title = 'HR Manager'

        try:
            admin_user.employee = admin_employee
            admin_user.save()
            self.stdout.write("  Linked Admin User to Employee")
        except Exception as e:
            self.stdout.write(f"  Warning linking user: {e}")

        # Create Test Employees
        # Emp 1: Full Month
        emp_full = Employee.objects.create(first_name='Full', last_name='Month')
        EmployeeGeneralInfo.objects.create(employee=emp_full, email='full@test.com')
        EmployeeJobInfo.objects.create(employee=emp_full, employee_code='FULL001', job_title='Manager', employment_type='Full-Time', join_date=date(2025, 1, 1))
        EmployeePayrollInfo.objects.create(employee=emp_full, status='Active', salary=Decimal('50000.00'))
        emp_full.salary = Decimal('50000.00')
        emp_full.join_date = date(2025, 1, 1)
        emp_full.job_title = 'Manager'
        
        # Emp 2: Mid Month Joiner (16th Jan)
        emp_mid = Employee.objects.create(first_name='Mid', last_name='Month')
        EmployeeGeneralInfo.objects.create(employee=emp_mid, email='mid@test.com')
        EmployeeJobInfo.objects.create(employee=emp_mid, employee_code='MID001', job_title='Staff', employment_type='Full-Time', join_date=date(2025, 1, 16))
        EmployeePayrollInfo.objects.create(employee=emp_mid, status='Active', salary=Decimal('50000.00'))
        emp_mid.salary = Decimal('50000.00')
        emp_mid.join_date = date(2025, 1, 16)
        emp_mid.job_title = 'Staff'
        
        # Setup users for them so they get notifications (optional but good for testing)
        user_full, _ = User.objects.get_or_create(username='user_full', defaults={'email': 'full@test.com'})
        try:
            user_full.employee = emp_full
            user_full.save()
        except Exception:
            pass

        # Create Tax Codes
        # Tax A: Flat 10%
        tax_a, _ = TaxCode.objects.get_or_create(name='Tax A', defaults={'code': 'TAX_A', 'is_active': True})
        ver_a, _ = TaxCodeVersion.objects.get_or_create(tax_code=tax_a, version='v1', defaults={'is_active': True, 'valid_from': date(2020,1,1)})
        TaxBracket.objects.get_or_create(tax_code_version=ver_a, min_income=0, rate=10)
        
        # Tax B: Flat 20%
        tax_b, _ = TaxCode.objects.get_or_create(name='Tax B', defaults={'code': 'TAX_B', 'is_active': True})
        ver_b, _ = TaxCodeVersion.objects.get_or_create(tax_code=tax_b, version='v1', defaults={'is_active': True, 'valid_from': date(2020,1,1)})
        TaxBracket.objects.get_or_create(tax_code_version=ver_b, min_income=0, rate=20)
        
        # Tax C: Inactive
        tax_c, _ = TaxCode.objects.get_or_create(name='Tax C', defaults={'code': 'TAX_C', 'is_active': False})

        self.stdout.write("✔ Data Setup Complete")

        # Reconnect signals after setup
        post_save.connect(employee_signals.create_user_for_employee, sender=Employee)
        post_save.connect(employee_signals.sync_user_groups, sender=Employee)
        post_save.connect(employee_signals.create_employee_for_user, sender=User)

        # --- 2. TEST NOTIFICATIONS ---
        self.stdout.write("\n[Step 2] Testing Notifications on Change...")
        initial_count = Notification.objects.count()
        
        # Trigger Policy Change
        # Ensure we're creating a new one or updating existing triggers signal
        policy, created = Policy.objects.get_or_create(section='attendancePolicy', defaults={'content': {}})
        policy.content = {'updated': True, 'timestamp': str(date.today())} 
        policy.save() 
        
        new_count = Notification.objects.count()
        self.stdout.write(f"  Notifications: {initial_count} -> {new_count}")
        
        if new_count > initial_count:
            self.stdout.write("✔ Notification Signal Works (Policy)")
        else:
            self.stdout.write("✘ Notification Signal FAILED (Might be because no Users linked to Employees)")

        # --- 3. TEST STRICT PAYROLL GENERATION ---
        self.stdout.write("\n[Step 3] Testing Strict Payroll Generation...")
        
        # Create Period
        period, _ = PayrollPeriod.objects.get_or_create(month='January', year=2025)
        period.status = 'draft' # Reset
        period.save()
        
        # Clear old payslips
        Payslip.objects.filter(period=period).delete()

        # 3.1 Try Inactive Tax Code
        self.stdout.write("  > Testing Inactive Tax Code (Tax C)...")
        try:
            service = PayrollCalculationService(period, performed_by=admin_employee, tax_code_id=tax_c.id)
            service.generate_payroll()
            self.stdout.write("✘ FAILED: Should have raised error for inactive tax code")
        except ValueError as e:
            self.stdout.write(f"✔ CAUGHT EXPECTED ERROR: {e}")

        # 3.2 Try Valid Tax Code (Tax A - 10%)
        self.stdout.write("  > Generating with Tax A (10%)...")
        service = PayrollCalculationService(period, performed_by=admin_employee, tax_code_id=tax_a.id)
        payslips = service.generate_payroll()
        
        self.stdout.write(f"✔ Generated {len(payslips)} payslips")
        
        # Check Net Pay & Proration
        ps_full = Payslip.objects.get(period=period, employee=emp_full)
        ps_mid = Payslip.objects.get(period=period, employee=emp_mid)
        
        self.stdout.write(f"  > Full Emp Base Salary: {ps_full.base_salary} (Expected: 50000.00)")
        self.stdout.write(f"  > Full Emp Tax (10%):   {ps_full.tax_amount} (Expected: ~5000.00)")
        
        self.stdout.write(f"  > Mid Emp Base Salary:  {ps_mid.base_salary}")
        
        # Verify Proration
        if ps_mid.base_salary < 50000:
            self.stdout.write(f"✔ Proration Active: {ps_mid.base_salary} < 50000")
        else:
            self.stdout.write(f"✘ Proration FAILED: {ps_mid.base_salary} == 50000")

        # --- 4. TEST TOGGLING TAX CODE ---
        self.stdout.write("\n[Step 4] Testing Tax Code Switch (Recalculation)...")
        
        # Rollback/Regenerate with Tax B (20%)
        Payslip.objects.filter(period=period).delete()
        
        self.stdout.write("  > Regenerating with Tax B (20%)...")
        service = PayrollCalculationService(period, performed_by=admin_employee, tax_code_id=tax_b.id)
        payslips_b = service.generate_payroll()
        
        ps_full_b = Payslip.objects.get(period=period, employee=emp_full)
        self.stdout.write(f"  > Full Emp Tax (20%): {ps_full_b.tax_amount} (Expected: ~10000.00)")
        
        if ps_full_b.tax_amount > ps_full.tax_amount:
             self.stdout.write("✔ Tax Calculation Updated Correctly (Higher Tax)")
        else:
             self.stdout.write(f"✘ Tax Recalculation FAILED: {ps_full_b.tax_amount} is not > {ps_full.tax_amount}")
             
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TEST COMPLETED")
        self.stdout.write("="*60)
