import os, sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APIClient

User = get_user_model()
username = 'apitest'
password = 'TestPass123!'

user, created = User.objects.get_or_create(username=username)
if created:
    user.set_password(password)
    user.is_staff = True
    user.save()

# Ensure group exists and user is in HR group
group, _ = Group.objects.get_or_create(name='HR MANAGER')
user.groups.add(group)
user.save()

client = APIClient()
# Obtain token
resp = client.post('/api/v1/auth/djoser/jwt/create/', {'username': username, 'password': password}, format='json')
print('Token status:', resp.status_code, resp.data)
if resp.status_code != 200:
    print('Failed to get token; aborting.')
    sys.exit(1)

access = resp.data.get('access')
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
# Request employees list
r = client.get('/api/v1/employees/?page_size=1000')
print('Employees list status:', r.status_code)
print('Response type:', type(r.data))
if isinstance(r.data, list):
    print('Number of employees returned:', len(r.data))
else:
    # Pagination object
    print('Pagination response keys:', list(r.data.keys()))
    results = r.data.get('results') or []
    print('Number of results:', len(results))

# Also test without page_size
r2 = client.get('/api/v1/employees/')
print('\nDefault request status:', r2.status_code)
if isinstance(r2.data, list):
    print('Default returned list length:', len(r2.data))
else:
    print('Default pagination keys:', list(r2.data.keys()))
    print('Default results length:', len(r2.data.get('results') or []))
