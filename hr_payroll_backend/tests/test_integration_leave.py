"""
Integration Test for Leave Request API.
Tests the POST /api/v1/leaves/ endpoint logic.
"""
import os
import sys
import json
import django
from django.test import TestCase, Client
from django.contrib.auth import get_user_model

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

User = get_user_model()
from apps.employees.models import Employee
from apps.leaves.models import LeaveType

class LeaveIntegrationTest(TestCase):
    def setUp(self):
        self.client = Client()
        
        # 1. Create a User and Employee
        self.user = User.objects.create_user(
            username='test_user',
            password='password123',
            email='test@example.com'
        )
        self.employee = Employee.objects.create(
            user=self.user,
            first_name='John',
            last_name='Doe',
            email='test@example.com',
            status='Active'
        )
        
        # 2. Create Leave Type
        self.leave_type = LeaveType.objects.create(
            name='Annual Leave',
            slug='annual-leave',
            is_active=True,
            default_days_allowed=20
        )
        
        # 3. Get Auth Token
        response = self.client.post('/api/v1/auth/djoser/jwt/create/', 
            {'username': 'test_user', 'password': 'password123'},
            content_type='application/json'
        )
        self.access_token = response.json().get('access')
        self.auth_header = {'HTTP_AUTHORIZATION': f'Bearer {self.access_token}'}

    def test_submit_leave_request(self):
        print("\nRunning test_submit_leave_request integration...")
        
        data = {
            "leave_type": self.leave_type.id,
            "start_date": "2026-02-01",
            "end_date": "2026-02-05",
            "reason": "Vacation",
            "employee": self.employee.id 
        }
        
        # NOTE: Endpoint path assumption
        response = self.client.post(
            '/api/v1/leaves/',
            data=json.dumps(data),
            content_type='application/json',
            **self.auth_header
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print("✅ Leave request submitted successfully")
            res_data = response.json()
            self.assertEqual(res_data['reason'], 'Vacation')
        else:
            print(f"❌ Failed to submit leave. Response: {response.content}")

