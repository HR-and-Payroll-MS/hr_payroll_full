from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from apps.employees import signals as employee_signals
from apps.employees.models import Employee
from apps.users.models import EmployeeGeneralInfo
from apps.company.models import EmployeeJobInfo
from apps.payroll.models import EmployeePayrollInfo
from apps.payroll.models import PayrollPeriod, TaxCode
from apps.payroll.services import PayrollCalculationService
from datetime import date
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Tests payroll calculation using the seeded Strict Tax Codes.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Testing seeded tax codes...'))
        
        # 1. Get Seeded Codes
        try:
            eth_tax = TaxCode.objects.get(code='ETH_FED_2025')
            flat_tax = TaxCode.objects.get(code='FLAT_TEST')
            self.stdout.write(self.style.SUCCESS('Found seeded tax codes.'))
        except TaxCode.DoesNotExist:
            self.stdout.write(self.style.ERROR('Seeded codes not found! Run seed_strict_tax first.'))
            return

        # 2. Setup Test Employee (partitioned schema)
        # Clean existing test user/employee if any
        post_save.disconnect(employee_signals.create_user_for_employee, sender=Employee)
        post_save.disconnect(employee_signals.sync_user_groups, sender=Employee)
        post_save.disconnect(employee_signals.create_employee_for_user, sender=User)

        try:
            User.objects.filter(email='seed_test@example.com').delete()
            User.objects.filter(username='seed_tester').delete()
            emp_ids = list(EmployeeGeneralInfo.objects.filter(email='seed_test@example.com').values_list('employee_id', flat=True))
            Employee.objects.filter(id__in=emp_ids).delete()

            emp = Employee.objects.create(first_name='Seed', last_name='Tester')
            EmployeeGeneralInfo.objects.create(
                employee=emp,
                email='seed_test@example.com',
                phone='+251900000000',
                gender='Other',
                date_of_birth=date(1995, 1, 1),
                marital_status='Single',
            )
            EmployeeJobInfo.objects.create(
                employee=emp,
                employee_code='SEEDTEST',
                job_title='QA Engineer',
                employment_type='Full-Time',
                join_date=date(2020, 1, 1),
            )
            EmployeePayrollInfo.objects.create(
                employee=emp,
                status='Active',
                salary=Decimal('10000.00'),
                last_working_date=None,
                bank_name='Test Bank',
                bank_account='000111222',
                offset=Decimal('0'),
                one_off=Decimal('0'),
            )

            user, created = User.objects.get_or_create(username='seed_tester', defaults={'email': 'seed_test@example.com'})
            if created:
                user.set_password('password123')
            user.employee = emp
            user.save()
        finally:
            post_save.connect(employee_signals.create_user_for_employee, sender=Employee)
            post_save.connect(employee_signals.sync_user_groups, sender=Employee)
            post_save.connect(employee_signals.create_employee_for_user, sender=User)
        
        # 3. Test ETH Tax (Progressive)
        # 10,000 ETB
        # 0-600 @0% = 0
        # 601-1650 @10% = 105
        # 1651-3200 @15% = 232.5
        # 3201-5250 @20% = 410
        # 5251-7800 @25% = 637.5
        # 7801-10000 @30% = 660  (2200 * 0.3)
        # Total Tax expected: ~2045
        
        # NOTE: PayrollCalculationService still expects legacy fields; attach attributes for compatibility
        emp.salary = Decimal('10000.00')
        emp.join_date = date(2020, 1, 1)
        emp.status = 'Active'
        service_eth = PayrollCalculationService(month='June', year=2025, tax_code_id=eth_tax.id)
        payslip_eth = service_eth._calculate_for_employee(emp, PayrollPeriod(month='June', year=2025))
        
        self.stdout.write(f"ETH Tax (10k Salary): {payslip_eth.tax_amount}")
        if 2000 < payslip_eth.tax_amount < 2100:
             self.stdout.write(self.style.SUCCESS(f"✔ ETH Progressive Calculation Valid: {payslip_eth.tax_amount}"))
        else:
             self.stdout.write(self.style.ERROR(f"✘ ETH Calc Invalid: {payslip_eth.tax_amount}"))

        # 4. Test Flat Tax (10%)
        # 10,000 * 10% = 1000
        service_flat = PayrollCalculationService(month='July', year=2025, tax_code_id=flat_tax.id)
        payslip_flat = service_flat._calculate_for_employee(emp, PayrollPeriod(month='July', year=2025))
        
        self.stdout.write(f"Flat Tax (10k Salary): {payslip_flat.tax_amount}")
        if payslip_flat.tax_amount == Decimal('1000.00'):
             self.stdout.write(self.style.SUCCESS(f"✔ Flat Calculation Valid: {payslip_flat.tax_amount}"))
        else:
             self.stdout.write(self.style.ERROR(f"✘ Flat Calc Invalid: {payslip_flat.tax_amount}"))

        # Cleanup
        emp.delete()
        user.delete()
