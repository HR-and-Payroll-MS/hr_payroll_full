"""
Integration Tests for API Security.
Focuses on Authentication and Authorization vulnerabilities.
"""
import os
import sys
import json
import django
from django.test import TestCase, Client
from django.contrib.auth import get_user_model

# Setup Django environment if run independently
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

User = get_user_model()
from apps.employees.models import Employee

class SecurityTest(TestCase):
    def setUp(self):
        self.client = Client()
        
        # 1. Create a Regular User (Not Admin/HR)
        self.user = User.objects.create_user(
            username='regular_employee',
            password='password123',
            email='regular@example.com'
        )
        
        # 2. Create associated Employee profile
        self.employee = Employee.objects.create(
            user=self.user,
            first_name='Regular',
            last_name='User',
            email='regular@example.com',
            status='Active'
        )
        
        # 3. Get Auth Token for the regular user
        response = self.client.post('/api/v1/auth/djoser/jwt/create/', 
            {'username': 'regular_employee', 'password': 'password123'},
            content_type='application/json'
        )
        self.access_token = response.json().get('access')
        self.auth_header = {'HTTP_AUTHORIZATION': f'Bearer {self.access_token}'}

    def test_authentication_required(self):
        """
        Test Case 1: Authentication
        Endpoint: GET /api/v1/users/me/
        Scenario: Request without authentication token.
        Expected Result: 401 Unauthorized.
        """
        print("\nRunning test_authentication_required...")
        
        # Executing the Request without header
        response = self.client.get('/api/v1/users/me/')
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ API correctly requires authentication (401 Unauthorized)")
        else:
            print(f"❌ Failed. Expected 401, got {response.status_code}")
            
        self.assertEqual(response.status_code, 401)

    def test_authorization_enforced(self):
        """
        Test Case 2: Authorization
        Endpoint: POST /api/v1/payroll/allowances/
        Scenario: Regular employee trying to create payroll allowance (Admin/HR only).
        Expected Result: 403 Forbidden.
        """
        print("\nRunning test_authorization_enforced...")
        
        data = {
            "name": "Housing Allowance",
            "is_taxable": True,
            "calculation_type": "Fixed"
        }
        
        # Executing the Request with valid token but insufficient permissions
        response = self.client.post(
            '/api/v1/payroll/allowances/',
            data=json.dumps(data),
            content_type='application/json',
            **self.auth_header
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 403:
            print("✅ API correctly enforces role-based access control (403 Forbidden)")
        else:
            print(f"❌ Failed. Expected 403, got {response.status_code}")
        
        self.assertEqual(response.status_code, 403)
