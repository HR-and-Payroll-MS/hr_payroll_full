from django.test import TestCase
from apps.employees.serializers import EmployeeCreateSerializer, EmployeeDetailSerializer
from apps.employees.models import Employee
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailSyncTests(TestCase):
    def test_create_employee_with_user_email_creates_user_and_links_email(self):
        data = {
            'first_name': 'Test',
            'last_name': 'User',
            'user_email': 'test.user@example.com'
        }
        serializer = EmployeeCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)
        employee = serializer.save()

        # User should be created and linked
        self.assertIsNotNone(employee.user_account)
        self.assertEqual(employee.user_account.email, 'test.user@example.com')

        # Employee detail serializer should surface the same email
        detail = EmployeeDetailSerializer(employee, context={'request': None}).data
        self.assertEqual(detail['general']['emailaddress'], 'test.user@example.com')
