from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APIClient
from apps.employees.models import Employee
from apps.departments.models import Department

User = get_user_model()

class EmployeeViewSetPermissionTests(TestCase):
    def setUp(self):
        # Disable employee<->user signals to avoid auto-creating users for test employees
        from apps.employees import signals as emp_signals
        from django.db.models.signals import post_save, pre_save
        from django.contrib.auth import get_user_model
        User = get_user_model()
        # Disconnect all signal handlers defined in apps.employees.signals to avoid side effects
        try:
            post_save.disconnect(emp_signals.create_user_for_employee, sender=Employee)
        except Exception:
            pass
        try:
            post_save.disconnect(emp_signals.create_employee_for_user, sender=User)
        except Exception:
            pass
        try:
            post_save.disconnect(emp_signals.sync_user_groups, sender=Employee)
        except Exception:
            pass
        try:
            post_save.disconnect(emp_signals.backfill_attendance_on_create, sender=Employee)
        except Exception:
            pass
        try:
            post_save.disconnect(emp_signals.notify_employee_changes, sender=Employee)
        except Exception:
            pass
        try:
            post_save.disconnect(emp_signals.sync_employee_email_to_user, sender=Employee)
        except Exception:
            pass
        try:
            pre_save.disconnect(emp_signals.track_employee_changes, sender=Employee)
        except Exception:
            pass

        # Create groups
        self.hr_group, _ = Group.objects.get_or_create(name='HR MANAGER')
        self.payroll_group, _ = Group.objects.get_or_create(name='Payroll')
        self.line_group, _ = Group.objects.get_or_create(name='Line Manager')

        # Create departments
        self.dept_a = Department.objects.create(name='Dept A')
        self.dept_b = Department.objects.create(name='Dept B')

        # Create many employees (simulate >70)
        self.employees = []
        for i in range(1, 84):
            emp = Employee.objects.create(first_name=f'Emp{i}', last_name='Test', employee_id=f'EMP{i:04d}', department=self.dept_a if i % 2 == 0 else self.dept_b)
            self.employees.append(emp)

        # Create users
        self.hr_user = User.objects.create_user(username='hr', password='pass')
        self.hr_user.groups.add(self.hr_group)

        self.payroll_user = User.objects.create_user(username='pay', password='pass')
        self.payroll_user.groups.add(self.payroll_group)

        self.line_user = User.objects.create_user(username='line', password='pass')
        self.line_user.groups.add(self.line_group)

        self.reg_user = User.objects.create_user(username='reg', password='pass')

        # Assign some employee relations
        # Give line manager an employee record and make them manager of dept_a
        self.line_employee = Employee.objects.create(first_name='Line', last_name='Manager', employee_id='EMPL001', department=self.dept_a)
        self.line_user.employee = self.line_employee
        self.line_user.save()
        self.dept_a.manager = self.line_employee
        self.dept_a.save()

        # Regular user -> attach to a single employee
        self.reg_employee = Employee.objects.create(first_name='Reg', last_name='User', employee_id='EMPREG', department=self.dept_b)
        self.reg_user.employee = self.reg_employee
        self.reg_user.save()

        # Set up API client
        self.client = APIClient()

    def tearDown(self):
        # Reconnect signals to avoid interfering with other tests / runtime
        from apps.employees import signals as emp_signals
        from django.db.models.signals import post_save
        try:
            post_save.connect(emp_signals.create_user_for_employee, sender=Employee)
        except Exception:
            pass
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            post_save.connect(emp_signals.create_employee_for_user, sender=User)
        except Exception:
            pass
        try:
            post_save.connect(emp_signals.sync_user_groups, sender=Employee)
        except Exception:
            pass
        try:
            post_save.connect(emp_signals.backfill_attendance_on_create, sender=Employee)
        except Exception:
            pass
        try:
            post_save.connect(emp_signals.notify_employee_changes, sender=Employee)
        except Exception:
            pass
        try:
            post_save.connect(emp_signals.sync_employee_email_to_user, sender=Employee)
        except Exception:
            pass
        from django.db.models.signals import pre_save
        try:
            pre_save.connect(emp_signals.track_employee_changes, sender=Employee)
        except Exception:
            pass

    def test_hr_user_sees_all_employees(self):
        self.client.force_authenticate(user=self.hr_user)
        resp = self.client.get('/api/v1/employees/')
        self.assertEqual(resp.status_code, 200)
        # viewset configured to return list (pagination disabled) -> should be list-like
        data = resp.data
        self.assertTrue(isinstance(data, list) or 'results' in resp.data)
        # Count must be at least the number we created
        if isinstance(data, list):
            self.assertGreaterEqual(len(data), 83)
        else:
            self.assertGreaterEqual(len(data.get('results', [])), 83)

    def test_payroll_user_sees_all_employees(self):
        self.client.force_authenticate(user=self.payroll_user)
        resp = self.client.get('/api/v1/employees/')
        self.assertEqual(resp.status_code, 200)
        data = resp.data
        if isinstance(data, list):
            self.assertGreaterEqual(len(data), 83)
        else:
            self.assertGreaterEqual(len(data.get('results', [])), 83)

    def test_line_manager_sees_managed_department_only(self):
        self.client.force_authenticate(user=self.line_user)
        resp = self.client.get('/api/v1/employees/')
        self.assertEqual(resp.status_code, 200)
        data = resp.data
        if isinstance(data, list):
            ids = {e['id'] for e in data}
        else:
            ids = {e['id'] for e in data.get('results', [])}
        # All returned employees should belong to dept_a (which line manager manages)
        dept_a_ids = set(Employee.objects.filter(department=self.dept_a).values_list('id', flat=True))
        self.assertTrue(ids.issubset(dept_a_ids))

    def test_regular_user_sees_only_self(self):
        self.client.force_authenticate(user=self.reg_user)
        resp = self.client.get('/api/v1/employees/')
        self.assertEqual(resp.status_code, 200)
        data = resp.data
        if isinstance(data, list):
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]['id'], self.reg_employee.id)
        else:
            results = data.get('results', [])
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0]['id'], self.reg_employee.id)
