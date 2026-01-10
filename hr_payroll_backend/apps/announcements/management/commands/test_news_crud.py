import os
import django
from decimal import Decimal
from django.core.files.uploadedfile import SimpleUploadedFile

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hr_payroll_backend.config.settings')
django.setup()

from apps.announcements.models import Announcement
from apps.employees.models import Employee
from apps.users.models import User

def test_news_crud():
    print("Testing News CRUD Operations...")
    
    # 1. Setup author
    author_user, _ = User.objects.get_or_create(username='news_admin', email='news@example.com')
    # Signal should have created employee, but let's ensure it exists and has fields
    author_emp = getattr(author_user, 'employee', None)
    if not author_emp:
        author_emp = Employee.objects.create(
            first_name='News', 
            last_name='Admin', 
            employee_id='NEWS001'
        )
        author_user.employee = author_emp
        author_user.save()
    else:
        author_emp.employee_id = 'NEWS001'
        author_emp.save()

    # 2. Create
    print("Creating announcement...")
    announcement = Announcement.objects.create(
        title="Test News",
        content="Initial Content",
        author=author_emp,
        priority="Normal"
    )
    assert announcement.id is not None
    print(f"OK: Created announcement {announcement.id}")

    # 3. Update
    print("Updating announcement...")
    announcement.title = "Updated Title"
    announcement.content = "Updated Content"
    announcement.priority = "High"
    announcement.save()
    
    refreshed = Announcement.objects.get(id=announcement.id)
    assert refreshed.title == "Updated Title"
    assert refreshed.content == "Updated Content"
    assert refreshed.priority == "High"
    print("OK: Updated announcement verified")

    # 4. Delete
    print("Deleting announcement...")
    ann_id = announcement.id
    announcement.delete()
    assert not Announcement.objects.filter(id=ann_id).exists()
    print("OK: Deleted announcement verified")

    print("\nVerification PASSED")

if __name__ == "__main__":
    test_news_crud()
