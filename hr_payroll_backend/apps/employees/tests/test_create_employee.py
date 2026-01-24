from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()
from apps.employees.models import Employee


class CreateEmployeeAPITest(APITestCase):
    def setUp(self):
        # create HR Manager group and a user in it
        self.hr_group, _ = Group.objects.get_or_create(name='HR Manager')
        self.user = User.objects.create_user(username='hruser', password='pass')
        self.user.groups.add(self.hr_group)
        self.client = APIClient()
        # authenticate as HR user
        self.client.force_authenticate(user=self.user)

    def test_add_employee_minimal(self):
        url = '/api/v1/employees/'
        payload = {
            'first_name': 'Test',
            'last_name': 'Employee',
            'email': 'test.employee@example.com'
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertTrue(Employee.objects.filter(first_name='Test', last_name='Employee').exists())

    def test_add_employee_with_nested_general(self):
        url = '/api/v1/employees/'
        payload = {
            'general': {
                'firstname': 'Nested',
                'lastname': 'User',
                'emailaddress': 'nested.user@example.com'
            }
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertTrue(Employee.objects.filter(first_name='Nested', last_name='User').exists())
