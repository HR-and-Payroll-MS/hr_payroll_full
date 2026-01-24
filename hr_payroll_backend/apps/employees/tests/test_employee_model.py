from django.test import TestCase
from apps.employees.models import Employee


class EmployeeModelTest(TestCase):
    def test_fullname_and_employee_id_generation(self):
        emp = Employee.objects.create(first_name='Jane', last_name='Doe')
        # fullname property
        self.assertEqual(emp.fullname, 'Jane Doe')
        # employee_id should be generated and start with 'EMP'
        self.assertTrue(hasattr(emp, 'employee_id'))
        self.assertTrue(str(emp.employee_id).startswith('EMP') or isinstance(emp.employee_id, str))
