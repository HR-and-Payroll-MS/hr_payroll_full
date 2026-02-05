"""Test script to debug dashboard API error."""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from apps.company.views import DashboardStatsView

User = get_user_model()

# Get first user
user = User.objects.first()
print(f"Testing with user: {user}")
print(f"User groups: {list(user.groups.all())}")

# Check if user has employee
try:
    emp = user.employee
    print(f"User employee: {emp}")
except Exception as e:
    print(f"No employee linked: {e}")

# Create mock request
factory = APIRequestFactory()
request = factory.get('/api/v1/company-info/dashboard-stats/')
request.user = user

# Try to call the view
view = DashboardStatsView.as_view()
try:
    response = view(request)
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.data}")
except Exception as e:
    import traceback
    print(f"ERROR: {e}")
    traceback.print_exc()
