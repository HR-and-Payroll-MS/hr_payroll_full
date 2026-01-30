from django.test import TestCase
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.policies.models import Policy


class PoliciesAPITest(TestCase):
    def setUp(self):
        # Create HR group and user
        self.hr_group, _ = Group.objects.get_or_create(name='HR')
        User = get_user_model()
        self.user = User.objects.create_user(username='hr_test', password='pass')
        self.user.groups.add(self.hr_group)
        self.user.save()

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Ensure no pre-existing policy
        Policy.objects.filter(organization_id=1, section='attendancePolicy').delete()

    def test_put_and_get_policy_section(self):
        url = '/api/v1/orgs/1/policies/attendancePolicy/'
        payload = {'content': {'rules': [{'name': 'Be on time', 'enabled': True}]}}

        # PUT should create the policy and return it
        put_resp = self.client.put(url, data=payload, format='json')
        self.assertEqual(put_resp.status_code, 200, msg=f'PUT failed: {put_resp.content}')
        self.assertIn('content', put_resp.data)
        self.assertEqual(put_resp.data['content'], payload['content'])

        # The DB should contain the policy
        p = Policy.objects.get(organization_id=1, section='attendancePolicy')
        self.assertEqual(p.content, payload['content'])

        # Now GET and ensure the content matches
        get_resp = self.client.get(url)
        self.assertEqual(get_resp.status_code, 200)
        self.assertIn('content', get_resp.data)
        self.assertEqual(get_resp.data['content'], payload['content'])
