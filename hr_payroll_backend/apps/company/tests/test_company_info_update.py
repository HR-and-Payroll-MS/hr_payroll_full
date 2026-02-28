from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.company.models import CompanyInfo


class CompanyInfoUpdateTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username='tester', password='pass')
        # ensure a CompanyInfo instance exists
        CompanyInfo.objects.all().delete()
        CompanyInfo.objects.create(name='OriginalCo')
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_update_company_name_persists(self):
        url = '/api/v1/company-info/'
        # verify original
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn('name', resp.data)
        self.assertEqual(resp.data.get('name'), 'OriginalCo')

        # update company name
        new_name = 'EditedCo-By-Test'
        put_resp = self.client.put(url, {'name': new_name}, format='json')
        self.assertEqual(put_resp.status_code, 200)
        self.assertEqual(put_resp.data.get('name'), new_name)

        # get again to confirm persistence
        resp2 = self.client.get(url)
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data.get('name'), new_name)
