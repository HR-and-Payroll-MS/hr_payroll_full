from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, date

from apps.attendance.models import Attendance


class HolidayDetectionTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username='hol_test', password='pass')

    def test_fixed_holiday_marks_holiday(self):
        # Create a holiday policy for today
        from apps.policies.models import Policy
        today = date.today()
        dstr = today.strftime('%Y-%m-%d')
        Policy.objects.create(organization_id=1, section='holidayPolicy', content={
            'fixedHolidays': [ { 'date': dstr, 'name': 'TodayFest' } ]
        })

        employee = getattr(self.user, 'employee')
        att = Attendance(employee=employee, date=today, status='absent')
        att.save()
        self.assertEqual(att.status.lower(), 'holiday')
