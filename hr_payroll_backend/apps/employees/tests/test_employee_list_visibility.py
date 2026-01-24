from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APITestCase, APIClient
from apps.employees.models import Employee


User = get_user_model()


class EmployeeListVisibilityTest(APITestCase):
    def setUp(self):
        # create employees
        self.emp1 = Employee.objects.create(first_name='One', last_name='User')
        self.emp2 = Employee.objects.create(first_name='Two', last_name='User')

        # HR user
        hr_group, _ = Group.objects.get_or_create(name='HR Manager')
        self.hr_user = User.objects.create_user(username='hr', password='pass')
        self.hr_user.groups.add(hr_group)

        # regular user linked to emp1
        self.reg_user = User.objects.create_user(username='empuser', password='pass')
        # link regular user to employee record
        self.reg_user.employee = self.emp1
        self.reg_user.save()

        self.client = APIClient()

    def test_hr_sees_all_employees(self):
        self.client.force_authenticate(user=self.hr_user)
        res = self.client.get('/api/v1/employees/')
        self.assertEqual(res.status_code, 200)
        data = res.data
        results = data.get('results', data) if isinstance(data, dict) else data
        self.assertGreaterEqual(len(results), 2)

    def test_regular_user_sees_only_self(self):
        self.client.force_authenticate(user=self.reg_user)
        res = self.client.get('/api/v1/employees/')
        self.assertEqual(res.status_code, 200)
        data = res.data
        results = data.get('results', data) if isinstance(data, dict) else data
        # should return only one employee (emp1)
        self.assertEqual(len(results), 1)
        # ensure returned id matches emp1
        returned = results[0]
        # returned may be nested serializer; check id
        self.assertTrue(int(returned.get('id', returned.get('pk', self.emp1.id))) == self.emp1.id)
