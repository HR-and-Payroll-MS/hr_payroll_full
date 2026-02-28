from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, date, time

from apps.attendance.models import Attendance


class AttendancePolicyEnforcementTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username='att_test', password='pass')
        # Ensure no leftover policies interfere
        from apps.policies.models import Policy
        Policy.objects.filter(section='attendancePolicy', organization_id=1).delete()

    def _create_policy(self, shift_start='09:00', shift_end='17:00', grace=0):
        from apps.policies.models import Policy
        content = {
            'shiftTimes': [ { 'start': shift_start, 'end': shift_end } ],
            'gracePeriod': { 'minutesAllowed': grace }
        }
        Policy.objects.create(organization_id=1, section='attendancePolicy', content=content)

    def test_present_within_grace(self):
        # policy: shift 09:00, grace 10 -> clock in 09:05 should be PRESENT
        self._create_policy(shift_start='09:00', shift_end='17:00', grace=10)
        employee = getattr(self.user, 'employee')

        today = date.today()
        clock_in_dt = datetime.combine(today, time(9, 5))
        clock_in_dt = timezone.make_aware(clock_in_dt)

        att = Attendance(employee=employee, date=today, clock_in=clock_in_dt, status='absent')
        att.save()
        self.assertIn(att.status.lower(), ['present'])

    def test_late_after_grace(self):
        # policy: shift 09:00, grace 10 -> clock in 09:15 should be LATE
        self._create_policy(shift_start='09:00', shift_end='17:00', grace=10)
        employee = getattr(self.user, 'employee')

        today = date.today()
        clock_in_dt = datetime.combine(today, time(9, 15))
        clock_in_dt = timezone.make_aware(clock_in_dt)

        att = Attendance(employee=employee, date=today, clock_in=clock_in_dt, status='absent')
        att.save()
        self.assertIn(att.status.lower(), ['late'])

    def test_present_at_grace_boundary(self):
        # clocking in exactly at shift_start + grace should be PRESENT
        self._create_policy(shift_start='09:00', shift_end='17:00', grace=10)
        employee = getattr(self.user, 'employee')

        today = date.today()
        clock_in_dt = datetime.combine(today, time(9, 10))
        clock_in_dt = timezone.make_aware(clock_in_dt)

        att = Attendance(employee=employee, date=today, clock_in=clock_in_dt, status='absent')
        att.save()
        self.assertIn(att.status.lower(), ['present'])

    def test_early_before_shift(self):
        # clocking in before shift start should be PRESENT
        self._create_policy(shift_start='09:00', shift_end='17:00', grace=0)
        employee = getattr(self.user, 'employee')

        today = date.today()
        clock_in_dt = datetime.combine(today, time(8, 50))
        clock_in_dt = timezone.make_aware(clock_in_dt)

        att = Attendance(employee=employee, date=today, clock_in=clock_in_dt, status='absent')
        att.save()
        self.assertIn(att.status.lower(), ['present'])
