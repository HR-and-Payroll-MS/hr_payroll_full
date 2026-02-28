"""
Create a simple document file for each employee and attach it as an EmployeeDocument.

Usage:
  python hr_payroll_backend/scripts/add_documents_for_employees.py

Optional env var `DOCS_PER_EMPLOYEE` controls how many documents per employee (default 1).
"""
import os
from pathlib import Path
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ.pop('SQLITE_DB_NAME', None)

import django
django.setup()

from apps.employees.models import Employee, EmployeeDocument
from django.conf import settings


def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)


def make_doc_for_employee(emp: Employee, idx: int = 1):
    docs_dir = Path(settings.MEDIA_ROOT) / 'employees' / 'documents'
    ensure_dir(docs_dir)

    ts = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    filename = f"emp_{emp.id}_{idx}_{ts}.txt"
    filepath = docs_dir / filename

    content = (
        f"Document for {emp.fullname} (ID: {emp.id})\n"
        f"Created: {datetime.utcnow().isoformat()} UTC\n\n"
        "This is a generated placeholder document. Replace with real files as needed.\n"
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    # Create EmployeeDocument record (file field expects path relative to MEDIA_ROOT)
    rel_path = f"employees/documents/{filename}"
    doc = EmployeeDocument.objects.create(
        employee=emp,
        name=f"Placeholder Document {idx}",
        file=rel_path,
        uploaded_by=None,
    )
    return doc


def run(count_per_employee=1):
    created = 0
    for emp in Employee.objects.all():
        for i in range(1, count_per_employee + 1):
            make_doc_for_employee(emp, i)
            created += 1
    print(f"Created {created} documents for {Employee.objects.count()} employees.")


if __name__ == '__main__':
    try:
        n = int(os.environ.get('DOCS_PER_EMPLOYEE', '1'))
    except Exception:
        n = 1
    run(n)
