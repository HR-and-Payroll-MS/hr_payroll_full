"""
Seed demo departments, work schedules, users, and employees with the new partitioned schema.
Run with: python manage.py seed_employees
"""
from datetime import date, time
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models.signals import post_save

from apps.departments.models import Department
from apps.employees import signals as employee_signals
from apps.employees.models import Employee
from apps.users.models import (
    EmployeeGeneralInfo,
    EmployeeAddressInfo,
    EmployeeEmergencyInfo,
)
from apps.company.models import EmployeeJobInfo, EmployeeContractInfo, CompanyOrgNode
from apps.payroll.models import EmployeePayrollInfo
from apps.attendance.models import WorkSchedule, EmployeeWorkScheduleLink

User = get_user_model()


class Command(BaseCommand):
    help = "Seed demo data for employees with partitioned tables"

    def handle(self, *args, **options):
        # Disconnect employee auto-create signals while we seed to avoid referencing legacy fields
        post_save.disconnect(employee_signals.create_user_for_employee, sender=Employee)
        post_save.disconnect(employee_signals.sync_user_groups, sender=Employee)
        post_save.disconnect(employee_signals.create_employee_for_user, sender=User)

        try:
            with transaction.atomic():
                self._seed_departments()
                schedule = self._seed_work_schedules()
                self._seed_employees(schedule)
        finally:
            # Reconnect signals after seeding
            post_save.connect(employee_signals.create_user_for_employee, sender=Employee)
            post_save.connect(employee_signals.sync_user_groups, sender=Employee)
            post_save.connect(employee_signals.create_employee_for_user, sender=User)

    def _seed_departments(self):
        departments = [
            {"code": "HR", "name": "Human Resources", "description": "People operations"},
            {"code": "FIN", "name": "Finance", "description": "Finance and accounting"},
            {"code": "ENG", "name": "Engineering", "description": "Product engineering"},
            {"code": "OPS", "name": "Operations", "description": "Business operations"},
        ]
        for dept in departments:
            Department.objects.get_or_create(
                code=dept["code"],
                defaults={"name": dept["name"], "description": dept["description"]},
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(departments)} departments"))

    def _seed_work_schedules(self):
        schedule, _ = WorkSchedule.objects.get_or_create(
            title="Day Shift",
            defaults={
                "start_time": time(9, 0),
                "end_time": time(17, 0),
                "days_of_week": [0, 1, 2, 3, 4],
                "schedule_type": "Fixed Time",
                "hours_per_day": "08:00",
                "hours_per_week": "40:00",
            },
        )
        return schedule

    def _seed_employees(self, schedule):
        # Preload departments map
        dept_map = {d.code: d for d in Department.objects.all()}

        demo_employees = [
            {
                "first_name": "Sara",
                "last_name": "Haile",
                "code": "EMP0001",
                "general": {
                    "gender": "Female",
                    "date_of_birth": date(1990, 5, 12),
                    "marital_status": "Single",
                    "nationality": "Ethiopian",
                    "personal_tax_id": "TX-001",
                    "social_insurance": "SI-100",
                    "health_care": "HC-200",
                    "phone": "+251911000001",
                    "email": "sara.haile@example.com",
                },
                "address": {
                    "primary_address": "Bole, Addis Ababa",
                    "country": "Ethiopia",
                    "state": "Addis Ababa",
                    "city": "Addis Ababa",
                    "postcode": "1000",
                },
                "emergency": {
                    "fullname": "Mimi Haile",
                    "phone": "+251911000010",
                    "relationship": "Sister",
                    "state": "Addis Ababa",
                    "city": "Addis Ababa",
                    "postcode": "1000",
                },
                "job": {
                    "job_title": "HR Manager",
                    "position": "Manager",
                    "department": "HR",
                    "employment_type": "Full-Time",
                    "join_date": date(2022, 1, 15),
                    "service_years": 3,
                },
                "contract": {
                    "contract_number": "HR-2022-01",
                    "contract_name": "Full Time",
                    "contract_type": "Permanent",
                    "contract_start_date": date(2022, 1, 15),
                },
                "payroll": {
                    "status": "Active",
                    "salary": Decimal("15000.00"),
                    "bank_name": "Dashen Bank",
                    "bank_account": "1002003001",
                },
            },
            {
                "first_name": "Bekele",
                "last_name": "Tadesse",
                "code": "EMP0002",
                "general": {
                    "gender": "Male",
                    "date_of_birth": date(1988, 8, 22),
                    "marital_status": "Married",
                    "nationality": "Ethiopian",
                    "personal_tax_id": "TX-002",
                    "social_insurance": "SI-101",
                    "health_care": "HC-201",
                    "phone": "+251911000002",
                    "email": "bekele.tadesse@example.com",
                },
                "address": {
                    "primary_address": "CMC, Addis Ababa",
                    "country": "Ethiopia",
                    "state": "Addis Ababa",
                    "city": "Addis Ababa",
                    "postcode": "1000",
                },
                "emergency": {
                    "fullname": "Lulit Bekele",
                    "phone": "+251911000020",
                    "relationship": "Spouse",
                    "state": "Addis Ababa",
                    "city": "Addis Ababa",
                    "postcode": "1000",
                },
                "job": {
                    "job_title": "Finance Officer",
                    "position": "Senior Specialist",
                    "department": "FIN",
                    "employment_type": "Full-Time",
                    "join_date": date(2021, 6, 1),
                    "service_years": 4,
                },
                "contract": {
                    "contract_number": "FIN-2021-11",
                    "contract_name": "Full Time",
                    "contract_type": "Permanent",
                    "contract_start_date": date(2021, 6, 1),
                },
                "payroll": {
                    "status": "Active",
                    "salary": Decimal("18000.00"),
                    "bank_name": "CBE",
                    "bank_account": "2003004002",
                },
            },
            {
                "first_name": "Liya",
                "last_name": "Kebede",
                "code": "EMP0003",
                "general": {
                    "gender": "Female",
                    "date_of_birth": date(1995, 3, 10),
                    "marital_status": "Single",
                    "nationality": "Ethiopian",
                    "personal_tax_id": "TX-003",
                    "social_insurance": "SI-102",
                    "health_care": "HC-202",
                    "phone": "+251911000003",
                    "email": "liya.kebede@example.com",
                },
                "address": {
                    "primary_address": "Piassa, Addis Ababa",
                    "country": "Ethiopia",
                    "state": "Addis Ababa",
                    "city": "Addis Ababa",
                    "postcode": "1000",
                },
                "emergency": {
                    "fullname": "Sara Kebede",
                    "phone": "+251911000030",
                    "relationship": "Sister",
                    "state": "Addis Ababa",
                    "city": "Addis Ababa",
                    "postcode": "1000",
                },
                "job": {
                    "job_title": "Software Engineer",
                    "position": "Engineer II",
                    "department": "ENG",
                    "employment_type": "Full-Time",
                    "join_date": date(2023, 2, 1),
                    "service_years": 2,
                },
                "contract": {
                    "contract_number": "ENG-2023-05",
                    "contract_name": "Full Time",
                    "contract_type": "Permanent",
                    "contract_start_date": date(2023, 2, 1),
                },
                "payroll": {
                    "status": "Active",
                    "salary": Decimal("22000.00"),
                    "bank_name": "Awash Bank",
                    "bank_account": "3004005003",
                },
            },
            {
                "first_name": "Samuel",
                "last_name": "Getachew",
                "code": "EMP0004",
                "general": {
                    "gender": "Male",
                    "date_of_birth": date(1992, 11, 2),
                    "marital_status": "Married",
                    "nationality": "Ethiopian",
                    "personal_tax_id": "TX-004",
                    "social_insurance": "SI-103",
                    "health_care": "HC-203",
                    "phone": "+251911000004",
                    "email": "samuel.getachew@example.com",
                },
                "address": {
                    "primary_address": "Gerji, Addis Ababa",
                    "country": "Ethiopia",
                    "state": "Addis Ababa",
                    "city": "Addis Ababa",
                    "postcode": "1000",
                },
                "emergency": {
                    "fullname": "Hana Getachew",
                    "phone": "+251911000040",
                    "relationship": "Spouse",
                    "state": "Addis Ababa",
                    "city": "Addis Ababa",
                    "postcode": "1000",
                },
                "job": {
                    "job_title": "Operations Lead",
                    "position": "Manager",
                    "department": "OPS",
                    "employment_type": "Full-Time",
                    "join_date": date(2020, 9, 1),
                    "service_years": 5,
                },
                "contract": {
                    "contract_number": "OPS-2020-09",
                    "contract_name": "Full Time",
                    "contract_type": "Permanent",
                    "contract_start_date": date(2020, 9, 1),
                },
                "payroll": {
                    "status": "Active",
                    "salary": Decimal("20000.00"),
                    "bank_name": "Nib Bank",
                    "bank_account": "4005006004",
                },
            },
        ]

        for idx, data in enumerate(demo_employees, start=1):
            emp, created = Employee.objects.get_or_create(
                first_name=data["first_name"],
                last_name=data["last_name"],
            )

            EmployeeGeneralInfo.objects.update_or_create(
                employee=emp,
                defaults=data["general"],
            )
            EmployeeAddressInfo.objects.update_or_create(
                employee=emp,
                defaults=data["address"],
            )
            EmployeeEmergencyInfo.objects.update_or_create(
                employee=emp,
                defaults=data["emergency"],
            )

            dept = dept_map.get(data["job"]["department"])
            job_defaults = {
                "employee_code": data.get("code") or f"EMP{idx:04d}",
                "job_title": data["job"].get("job_title"),
                "position": data["job"].get("position"),
                "department": dept,
                "employment_type": data["job"].get("employment_type"),
                "join_date": data["job"].get("join_date"),
                "service_years": data["job"].get("service_years", 0),
            }
            EmployeeJobInfo.objects.update_or_create(
                employee=emp,
                defaults=job_defaults,
            )

            EmployeeContractInfo.objects.update_or_create(
                employee=emp,
                defaults=data["contract"],
            )

            payroll_defaults = data["payroll"].copy()
            payroll_defaults.setdefault("offset", Decimal("0"))
            payroll_defaults.setdefault("one_off", Decimal("0"))
            EmployeePayrollInfo.objects.update_or_create(
                employee=emp,
                defaults=payroll_defaults,
            )

            # Work schedule link
            EmployeeWorkScheduleLink.objects.update_or_create(
                employee=emp,
                defaults={"work_schedule": schedule},
            )

            # Org node for chart positioning (simple grid)
            CompanyOrgNode.objects.update_or_create(
                employee=emp,
                defaults={
                    "in_org_chart": True,
                    "org_x": float(idx * 2),
                    "org_y": float(idx),
                },
            )

            # Create user account if missing
            user, _ = User.objects.get_or_create(
                username=data["code"].lower(),
                defaults={
                    "email": data["general"].get("email"),
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "employee": emp,
                },
            )
            if not user.has_usable_password():
                user.set_password("Password123!")
                user.save()

            self.stdout.write(self.style.SUCCESS(f"Seeded employee {emp.fullname} ({job_defaults['employee_code']})"))

        self.stdout.write(self.style.SUCCESS("Employee seeding complete"))
