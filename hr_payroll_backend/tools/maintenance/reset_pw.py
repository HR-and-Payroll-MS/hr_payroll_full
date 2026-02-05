import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

try:
    u = User.objects.get(username='admin')
    u.set_password('admin123')
    u.save()
    print("Successfully reset password for user 'admin' to 'admin123'")
except User.DoesNotExist:
    print("User 'admin' does not exist")
except Exception as e:
    print(f"Error: {e}")
