import sys
import os
import json
from datetime import date

## Ensure project package is on PYTHONPATH so `config` package can be imported
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.utils import timezone
from django.db.models import Q
from apps.employees.models import Employee
from apps.departments.models import Department
from django.contrib.auth import get_user_model
from apps.attendance.models import Attendance

User = get_user_model()

empid = sys.argv[1] if len(sys.argv) > 1 else 'EMP0002'

def to_str(v):
    try:
        return str(v)
    except:
        return None

result = {}
emp = Employee.objects.filter(employee_id=empid).first()
if not emp:
    print(json.dumps({'error': f'Employee {empid} not found'}))
    sys.exit(0)

result['employee'] = {
    'id': emp.id,
    'employee_id': emp.employee_id,
    'fullname': emp.fullname,
    'department_id': emp.department_id,
    'department_name': emp.department.name if emp.department else None,
    'join_date': to_str(emp.join_date),
    'last_working_date': to_str(emp.last_working_date),
    'line_manager_id': emp.line_manager_id,
}

users = User.objects.filter(employee=emp)
result['user_accounts'] = [
    {
        'id': u.id,
        'username': u.username,
        'groups': list(u.groups.values_list('name', flat=True)),
    }
    for u in users
]

managed = list(Department.objects.filter(manager=emp).values('id', 'name'))
result['managed_departments'] = managed

# Determine departments to check: managed if any, otherwise fallback to employee.department
dept_ids = [d['id'] for d in managed] if managed else ([emp.department_id] if emp.department_id else [])

today = timezone.localdate()
result['today'] = to_str(today)

if not dept_ids:
    result['visible_employee_count'] = 0
    result['visible_employees'] = []
else:
    employees = (
        Employee.objects.filter(department_id__in=dept_ids)
        .filter(Q(join_date__lte=today) | Q(join_date__isnull=True))
        .filter(Q(last_working_date__isnull=True) | Q(last_working_date__gte=today))
        .distinct()
    )
    result['visible_employee_count'] = employees.count()
    result['visible_employees'] = [
        {
            'id': e.id,
            'employee_id': e.employee_id,
            'fullname': e.fullname,
            'join_date': to_str(e.join_date),
            'last_working_date': to_str(e.last_working_date),
        }
        for e in employees[:50]
    ]

    # emulate attendance response mapping
    att = Attendance.objects.filter(employee__department_id__in=dept_ids, date=to_str(today))
    att_map = {a.employee_id: a for a in att}
    data = []
    for e in employees[:50]:
        a = att_map.get(e.id)
        if a:
            data.append({'employee_id': e.id, 'employee_name': e.fullname, 'status': a.status})
        else:
            data.append({'employee_id': e.id, 'employee_name': e.fullname, 'status': '--'})
    result['attendance_preview'] = data

print(json.dumps(result, indent=2, default=to_str))