import random
import time as time_module
from datetime import date, datetime, timedelta, time as dtime
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import transaction, connection, OperationalError
from django.utils import timezone

from apps.employees.models import Employee
from apps.departments.models import Department
from apps.attendance.models import Attendance, WorkSchedule
from apps.payroll.models import PayrollPeriod, Payslip, TaxCode, TaxCodeVersion


class Command(BaseCommand):
    help = "Seed 80 Ethiopian employees with attendance and three months of payslips"

    def handle(self, *args, **options):
        # Reduce SQLITE busy errors when concurrent connections exist
        if connection.vendor == "sqlite":
            with connection.cursor() as cursor:
                cursor.execute("PRAGMA busy_timeout = 5000;")

        with transaction.atomic():
            self.stdout.write(self.style.MIGRATE_HEADING("Seeding Ethiopian demo data (80 employees)"))
            self._ensure_groups()
            work_schedule = self._retry_locked(self._ensure_work_schedule)
            departments = self._ensure_departments()

            # Build name pools (ASCII transliterations to satisfy editing constraints)
            first_names = [
                "Abebe", "Biruk", "Chala", "Daniel", "Eleni", "Fikirte", "Genet", "Hana",
                "Israel", "Jemal", "Kalkidan", "Lemi", "Meron", "Nardos", "Oromia", "Pawlos",
                "Rahel", "Selam", "Tesfaye", "Winta", "Yordanos", "Zerihun", "Mebratu", "Kidist",
                "Mekdes", "Amanuel", "Betelhem", "Saron", "Lidya", "Hiwot", "Samrawit", "Rediet",
                "Yonas", "Brook", "Mikiyas", "Nahom", "Hanna", "Mahi", "Frehiwot", "Ruth",
            ]
            last_names = [
                "Bekele", "Tadesse", "Worku", "Habte", "Wondimu", "Tesfahun", "Gebre", "Alemu",
                "Getachew", "Kebede", "Dibaba", "Haile", "Mengistu", "Amare", "Fekadu", "Bayu",
                "Girma", "Belachew", "Molla", "Desalegn", "Gebremedhin", "Tilahun", "Abate",
                "Yohannes", "Ashenafi", "Berhanu", "Tsegaye", "Legesse", "Gebrekidan", "Zewde",
                "Eshetu", "Fantahun", "Fisseha", "Wolde", "Tamrat", "Abera", "Ayalew", "Hailu",
            ]

            today = date.today()
            base_join = today - timedelta(days=120)  # ~4 months ago

            employees = []

            # 1 payroll officer
            payroll_emp = self._create_employee(
                first="Bereket",
                last="Kebede",
                job_title="Payroll Officer",
                department=departments["Finance"],
                join_date=base_join + timedelta(days=1),
                salary=Decimal("32000"),
                work_schedule=work_schedule,
            )
            employees.append(payroll_emp)

            # 3 department managers
            manager_names = [("Lensa", "Bekele"), ("Samuel", "Tesfaye"), ("Selam", "Alemu")]
            dept_keys = list(departments.keys())
            for idx, (first, last) in enumerate(manager_names):
                dept = departments[dept_keys[idx % len(dept_keys)]]
                emp = self._create_employee(
                    first=first,
                    last=last,
                    job_title="Department Manager",
                    department=dept,
                    join_date=base_join + timedelta(days=2 + idx),
                    salary=Decimal("28000"),
                    work_schedule=work_schedule,
                )
                dept.manager = emp
                dept.save(update_fields=["manager"])
                employees.append(emp)

            # Remaining employees
            remaining = 80 - len(employees)
            for i in range(remaining):
                first = random.choice(first_names)
                last = random.choice(last_names)
                dept = departments[dept_keys[i % len(dept_keys)]]
                line_manager = dept.manager
                salary = Decimal(str(random.randint(12000, 25000)))
                join_date = base_join + timedelta(days=random.randint(0, 25))
                emp = self._create_employee(
                    first=first,
                    last=last,
                    job_title="Software Engineer" if i % 2 == 0 else "Analyst",
                    department=dept,
                    line_manager=line_manager,
                    join_date=join_date,
                    salary=salary,
                    work_schedule=work_schedule,
                )
                employees.append(emp)

            self.stdout.write(self.style.SUCCESS(f"Created {len(employees)} employees"))

            # Attendance for last 90 days (skip weekends)
            self._seed_attendance(employees, days=90)

            # Three months of payslips up to last month
            self._seed_payslips(employees, months_back=3)

            # Use standard success style to avoid missing MIGRATE_SUCCESS attribute on some Django versions
            self.stdout.write(self.style.SUCCESS("Ethiopian demo data seed complete."))

    def _ensure_groups(self):
        for name in ["Payroll", "Manager", "Employee", "Line Manager"]:
            Group.objects.get_or_create(name=name)

    def _ensure_work_schedule(self):
        ws, _ = WorkSchedule.objects.get_or_create(
            title="Standard 9-6",
            defaults={
                "start_time": dtime(9, 0),
                "end_time": dtime(18, 0),
                "days_of_week": [0, 1, 2, 3, 4],
                "schedule_type": "Fixed Time",
                "hours_per_day": "08:00",
                "hours_per_week": "40:00",
            },
        )
        return ws

    def _retry_locked(self, fn, retries: int = 5, delay: float = 1.0):
        """Retry helper for transient SQLite locking errors."""
        for attempt in range(retries):
            try:
                return fn()
            except OperationalError as exc:
                if "locked" in str(exc).lower() and attempt < retries - 1:
                    time_module.sleep(delay)
                    continue
                raise

    def _ensure_departments(self):
        dept_defs = {
            "Finance": "Handles payroll and finance operations",
            "Engineering": "Builds and maintains products",
            "Operations": "Keeps the business running day to day",
        }
        departments = {}
        for code, desc in dept_defs.items():
            dept, _ = Department.objects.get_or_create(
                code=code[:10],
                defaults={"name": code, "description": desc},
            )
            departments[code] = dept
        return departments

    def _create_employee(
        self,
        first: str,
        last: str,
        job_title: str,
        department: Department,
        join_date: date,
        salary: Decimal,
        work_schedule: WorkSchedule,
        line_manager: Employee = None,
    ) -> Employee:
        phone = f"+2519{random.randint(10000000, 99999999)}"
        email = f"{first.lower()}.{last.lower()}@example.et"
        emp = Employee.objects.create(
            first_name=first,
            last_name=last,
            gender="Female" if first.endswith("a") else "Male",
            date_of_birth=date(1990, random.randint(1, 12), random.randint(1, 28)),
            marital_status=random.choice(["Single", "Married"]),
            nationality="Ethiopian",
            personal_tax_id=f"TIN{random.randint(100000, 999999)}",
            social_insurance=f"SI{random.randint(100000, 999999)}",
            health_care="MOH",
            phone=phone,
            primary_address="Kazanchis, Addis Ababa",
            country="Ethiopia",
            state="Addis Ababa",
            city="Addis Ababa",
            postcode="1000",
            emergency_fullname=f"{first} {last}",
            emergency_phone=f"+2519{random.randint(10000000, 99999999)}",
            emergency_relationship="Sibling",
            emergency_state="Addis Ababa",
            emergency_city="Addis Ababa",
            emergency_postcode="1000",
            job_title=job_title,
            position=job_title,
            department=department,
            line_manager=line_manager,
            employment_type="Full-time",
            join_date=join_date,
            contract_number=f"CN-{random.randint(1000,9999)}",
            contract_name=f"{job_title} Contract",
            contract_type="Permanent",
            contract_start_date=join_date,
            status="Active",
            salary=salary,
            bank_name="Commercial Bank of Ethiopia",
            bank_account=f"1000{random.randint(100000000, 999999999)}",
            in_org_chart=True,
            org_x=random.uniform(0, 100),
            org_y=random.uniform(0, 100),
            work_schedule=work_schedule,
        )
        return emp

    def _seed_attendance(self, employees, days: int = 90):
        self.stdout.write(self.style.HTTP_INFO(f"Creating attendance for last {days} days (weekdays only)..."))
        start_date = date.today() - timedelta(days=days)
        created = 0
        for single_date in (start_date + timedelta(n) for n in range(days + 1)):
            if single_date.weekday() >= 5:  # skip weekends
                continue
            for emp in employees:
                # If the employee joined after this date, skip
                if emp.join_date and single_date < emp.join_date:
                    continue
                clock_in_hour = random.choice([8, 8, 9, 9, 9, 10])
                is_late = clock_in_hour >= 9 and random.random() < 0.25
                clock_in_dt = datetime.combine(single_date, dtime(clock_in_hour, random.randint(0, 20)))
                clock_out_dt = clock_in_dt + timedelta(hours=8, minutes=random.randint(0, 30))
                status = "PRESENT"
                if random.random() < 0.05:
                    status = "ABSENT"
                    clock_in_dt = None
                    clock_out_dt = None
                elif is_late:
                    status = "LATE"

                Attendance.objects.update_or_create(
                    employee=emp,
                    date=single_date,
                    defaults={
                        "clock_in": timezone.make_aware(clock_in_dt) if clock_in_dt else None,
                        "clock_out": timezone.make_aware(clock_out_dt) if clock_out_dt else None,
                        "clock_in_location": "Addis Ababa HQ",
                        "clock_out_location": "Addis Ababa HQ",
                        "status": status,
                        "worked_hours": Decimal("8.0") if status != "ABSENT" else Decimal("0.0"),
                        "notes": "",
                    },
                )
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Attendance rows touched: {created}"))

    def _seed_payslips(self, employees, months_back: int = 3):
        self.stdout.write(self.style.HTTP_INFO("Creating payroll periods and payslips..."))
        # Ensure tax code placeholders
        tax_code, _ = TaxCode.objects.get_or_create(
            code="STANDARD",
            defaults={"name": "Standard Tax", "description": "Flat placeholder tax"},
        )
        version, _ = TaxCodeVersion.objects.get_or_create(
            tax_code=tax_code,
            version="2026-v1",
            defaults={"valid_from": date(2025, 1, 1)},
        )

        today = date.today()
        periods = []
        for offset in range(months_back, 0, -1):
            month_date = today.replace(day=1) - timedelta(days=30 * offset)
            month_name = month_date.strftime("%B")
            period, _ = PayrollPeriod.objects.get_or_create(
                month=month_name,
                year=month_date.year,
                defaults={"status": "finalized"},
            )
            periods.append(period)

        total_payslips = 0
        for period in periods:
            for emp in employees:
                # If joined after period month end, skip
                period_end = date(period.year, self._month_number(period.month), 28)
                if emp.join_date and emp.join_date > period_end:
                    continue

                base = emp.salary
                allowances = Decimal("1500.00")
                overtime_hours = Decimal(str(random.randint(0, 10)))
                overtime_pay = overtime_hours * Decimal("120")
                gross = base + allowances + overtime_pay
                tax = (gross * Decimal("0.1")).quantize(Decimal("0.01"))
                pension = (base * Decimal("0.07")).quantize(Decimal("0.01"))
                deductions = tax + pension
                net = gross - deductions

                Payslip.objects.update_or_create(
                    period=period,
                    employee=emp,
                    defaults={
                        "base_salary": base,
                        "total_allowances": allowances,
                        "bonus": Decimal("0.00"),
                        "overtime_hours": overtime_hours,
                        "overtime_pay": overtime_pay,
                        "overtime_rate": Decimal("1.5"),
                        "total_deductions": deductions,
                        "tax_amount": tax,
                        "gross_pay": gross,
                        "net_pay": net,
                        "tax_code": tax_code,
                        "tax_code_version": version,
                        "worked_days": 20,
                        "absent_days": 1,
                        "leave_days": 0,
                        "details": {
                            "earnings": [
                                {"label": "Base Salary", "amount": float(base)},
                                {"label": "Allowances", "amount": float(allowances)},
                                {"label": "Overtime", "amount": float(overtime_pay)},
                            ],
                            "deductions": [
                                {"label": "Tax", "amount": float(tax)},
                                {"label": "Pension", "amount": float(pension)},
                            ],
                            "company": {"name": "Addis Solutions", "address": "Addis Ababa"},
                        },
                    },
                )
                total_payslips += 1
        self.stdout.write(self.style.SUCCESS(f"Payslips created/updated: {total_payslips}"))

    @staticmethod
    def _month_number(name: str) -> int:
        return {
            "January": 1,
            "February": 2,
            "March": 3,
            "April": 4,
            "May": 5,
            "June": 6,
            "July": 7,
            "August": 8,
            "September": 9,
            "October": 10,
            "November": 11,
            "December": 12,
        }[name]
