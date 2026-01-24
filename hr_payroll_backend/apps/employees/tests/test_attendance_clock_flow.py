from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from apps.employees.models import Employee


User = get_user_model()


class AttendanceClockFlowTest(APITestCase):
    def setUp(self):
        # create an employee and a linked user
        self.emp = Employee.objects.create(first_name='Clock', last_name='Tester')
        self.user = User.objects.create_user(username='clockuser', password='pass')
        self.user.employee = self.emp
        self.user.save()
        self.client = APIClient()

    def test_clock_in_and_clock_out(self):
        self.client.force_authenticate(user=self.user)
        # Clock in
        res_in = self.client.post(f'/api/v1/employees/{self.emp.id}/attendances/clock-in/')
        self.assertEqual(res_in.status_code, 200)
        self.assertIn('clock_in', res_in.data)
        self.assertIn('attendance_id', res_in.data)

        # Clock out
        res_out = self.client.post(f'/api/v1/employees/{self.emp.id}/attendances/clock-out/')
        self.assertEqual(res_out.status_code, 200)
        self.assertIn('clock_out', res_out.data)
