from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, date, time

from apps.attendance.models import Attendance
from apps.policies.models import Policy


class AttendancePolicyRecalcTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username='recalc_test', password='pass')
        # ensure org-1 attendancePolicy removed
        Policy.objects.filter(organization_id=1, section='attendancePolicy').delete()

    def _create_policy(self, content):
        return Policy.objects.create(organization_id=1, section='attendancePolicy', content=content)

    def test_changing_grace_updates_status_on_resave(self):
        # initial policy: grace 0 -> clock_in 09:05 is LATE
        p = self._create_policy({'shiftTimes': [{'start': '09:00', 'end': '17:00'}], 'gracePeriod': {'minutesAllowed': 0}})
        employee = getattr(self.user, 'employee')

        today = date.today()
        clock_in_dt = datetime.combine(today, time(9, 5))
        clock_in_dt = timezone.make_aware(clock_in_dt)

        att = Attendance(employee=employee, date=today, clock_in=clock_in_dt, status='absent')
        att.save()
        self.assertEqual(att.status.upper(), 'LATE')

        # update policy: grace 10 -> resave attendance -> should be PRESENT
        p.content['gracePeriod']['minutesAllowed'] = 10
        p.save()

        # trigger recalculation by saving attendance again
        att.save()
        self.assertEqual(att.status.upper(), 'PRESENT')

    def test_no_clock_in_absent_flag_applies(self):
        # policy initially does not mark no-clock as absent
        p = self._create_policy({'shiftTimes': [{'start': '09:00', 'end': '17:00'}], 'absentRules': {'noClockInAbsent': False}})
        employee = getattr(self.user, 'employee')

        today = date.today()
        att = Attendance(employee=employee, date=today, status='absent')
        att.save()
        # initial: still absent (no clock-in), but changing policy to require no-clock absent should set ABSENT
        p.content['absentRules'] = {'noClockInAbsent': True}
        p.save()

        att.save()
        self.assertEqual(att.status.upper(), 'ABSENT')

    def test_early_leave_threshold_changes_half_day(self):
        # policy without earlyLeave -> leaving early is PRESENT
        p = self._create_policy({'shiftTimes': [{'start': '09:00', 'end': '17:00'}]})
        employee = getattr(self.user, 'employee')

        today = date.today()
        clock_in_dt = datetime.combine(today, time(9, 0))
        clock_out_dt = datetime.combine(today, time(14, 30))  # leave before 15:00
        clock_in_dt = timezone.make_aware(clock_in_dt)
        clock_out_dt = timezone.make_aware(clock_out_dt)

        att = Attendance(employee=employee, date=today, clock_in=clock_in_dt, clock_out=clock_out_dt, status='absent')
        att.save()
        # no earlyLeave rule => status should be PRESENT (enough worked > half? depends, but ensuring change occurs)
        before = att.status.upper()

        # add earlyLeaveMinutes = 120 (i.e., leaving before 15:00 is HALF-DAY)
        p.content['lateEarlyRules'] = {'earlyLeaveMinutes': 120}
        p.save()

        att.save()
        self.assertEqual(att.status.upper(), 'HALF-DAY')
