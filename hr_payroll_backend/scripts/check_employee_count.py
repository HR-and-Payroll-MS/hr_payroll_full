import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from apps.employees.models import Employee

print('DB path:', BASE_DIR / 'db.sqlite3')
print('Employee count:', Employee.objects.count())
print('First 20 employee ids:', list(Employee.objects.values_list('id', flat=True)[:20]))
