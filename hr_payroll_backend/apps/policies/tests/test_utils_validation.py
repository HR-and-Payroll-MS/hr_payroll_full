from django.test import SimpleTestCase
from apps.policies.utils import validate_policy_content


class PolicyUtilsValidationTests(SimpleTestCase):
    def test_attendance_valid_minimal(self):
        content = {
            'shiftTimes': [
                {'title': 'Day', 'start': '08:00', 'end': '17:00'}
            ],
            'gracePeriod': {'lateAfter': 30},
            'absentRules': {'absentAfterMinutes': 180, 'noClockInAbsent': True}
        }
        self.assertTrue(validate_policy_content('attendancePolicy', content))

    def test_attendance_invalid_time(self):
        content = {'shiftTimes': [{'start': '8am', 'end': '17:00'}]}
        self.assertFalse(validate_policy_content('attendancePolicy', content))

    def test_attendance_invalid_grace(self):
        content = {'gracePeriod': {'lateAfter': 'thirty'}}
        self.assertFalse(validate_policy_content('attendancePolicy', content))

    def test_non_dict_content(self):
        self.assertFalse(validate_policy_content('attendancePolicy', None))
