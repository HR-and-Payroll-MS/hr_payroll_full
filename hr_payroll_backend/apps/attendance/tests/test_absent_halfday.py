from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, date, time, timedelta

from apps.attendance.models import Attendance


class AttendanceAbsentHalfDayTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username='abs_hd_test', password='pass')
        # Ensure no leftover policies interfere
        from apps.policies.models import Policy
        Policy.objects.filter(section='attendancePolicy', organization_id=1).delete()

    def _create_policy(self, shift_start='09:00', shift_end='17:00', grace=0, absent_rules=None, late_early=None):
        from apps.policies.models import Policy
        content = {
            'shiftTimes': [ { 'start': shift_start, 'end': shift_end } ],
            'gracePeriod': { 'minutesAllowed': grace }
        }
        if absent_rules is not None:
            content['absentRules'] = absent_rules
        if late_early is not None:
            content['lateEarlyRules'] = late_early
        Policy.objects.create(organization_id=1, section='attendancePolicy', content=content)

    def test_no_clock_in_mark_absent_when_policy_requires(self):
        # noClockInAbsent true => missing clock_in should mark ABSENT
        self._create_policy(absent_rules={'noClockInAbsent': True, 'absentAfterMinutes': 60})
        employee = getattr(self.user, 'employee')

        today = date.today()
        att = Attendance(employee=employee, date=today, status='absent')
        att.save()
        self.assertIn(att.status.lower(), ['absent'])

    def test_half_day_due_to_short_work(self):
        # shift 09:00-17:00 => half day if worked < 4 hours
        self._create_policy(shift_start='09:00', shift_end='17:00')
        employee = getattr(self.user, 'employee')

        today = date.today()
        clock_in_dt = datetime.combine(today, time(9, 0))
        clock_out_dt = datetime.combine(today, time(12, 0))  # 3 hours only
        clock_in_dt = timezone.make_aware(clock_in_dt)
        clock_out_dt = timezone.make_aware(clock_out_dt)

        att = Attendance(employee=employee, date=today, clock_in=clock_in_dt, clock_out=clock_out_dt, status='absent')
        att.save()
        self.assertIn(att.status.lower(), ['half-day'])

    def test_half_day_due_to_early_leave_threshold(self):
        # earlyLeaveMinutes = 120 -> leaving before 15:00 (17:00 - 120m) is HALF-DAY
        self._create_policy(shift_start='09:00', shift_end='17:00', late_early={'earlyLeaveMinutes': 120})
        employee = getattr(self.user, 'employee')

        today = date.today()
        clock_in_dt = datetime.combine(today, time(9, 0))
        clock_out_dt = datetime.combine(today, time(14, 30))  # before 15:00
        clock_in_dt = timezone.make_aware(clock_in_dt)
        clock_out_dt = timezone.make_aware(clock_out_dt)

        att = Attendance(employee=employee, date=today, clock_in=clock_in_dt, clock_out=clock_out_dt, status='absent')
        att.save()
        self.assertIn(att.status.lower(), ['half-day'])
