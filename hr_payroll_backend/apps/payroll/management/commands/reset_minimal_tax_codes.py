"""Reset tax codes to a minimal realistic set with versions.

Usage:
    python manage.py reset_minimal_tax_codes

This will delete all existing TaxCode/TaxCodeVersion/TaxBracket records
and recreate two tax codes each with several versions.
"""
from datetime import date
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.payroll.models import TaxCode, TaxCodeVersion, TaxBracket


class Command(BaseCommand):
    help = "Reset tax codes to two sample codes with 3-5 versions each"

    def handle(self, *args, **options):
        with transaction.atomic():
            self.stdout.write(self.style.WARNING("Clearing existing tax data..."))
            TaxBracket.objects.all().delete()
            TaxCodeVersion.objects.all().delete()
            TaxCode.objects.all().delete()

            self.stdout.write(self.style.SUCCESS("Existing tax codes removed."))

            # Tax Code 1: Standard Payroll Tax
            standard = TaxCode.objects.create(
                code="STD",
                name="Standard Payroll Tax",
                description="Default payroll tax regime for salaried employees.",
                is_active=True,
            )

            standard_versions = [
                {
                    "version": "2024-Q1",
                    "valid_from": date(2024, 1, 1),
                    "valid_to": date(2024, 3, 31),
                    "income_tax_config": {"rate": 0.18},
                },
                {
                    "version": "2024-Q2",
                    "valid_from": date(2024, 4, 1),
                    "valid_to": date(2024, 6, 30),
                    "income_tax_config": {"rate": 0.19},
                },
                {
                    "version": "2024-H2",
                    "valid_from": date(2024, 7, 1),
                    "valid_to": date(2024, 12, 31),
                    "income_tax_config": {"rate": 0.195},
                },
                {
                    "version": "2025-Current",
                    "valid_from": date(2025, 1, 1),
                    "valid_to": None,
                    "income_tax_config": {"rate": 0.2},
                },
            ]

            std_brackets = [
                {"min": 0, "max": 500, "rate": 0},
                {"min": 500, "max": 2000, "rate": 10},
                {"min": 2000, "max": None, "rate": 20},
            ]
            std_pension_cfg = {"employeePercent": 5, "employerPercent": 7}
            std_statutory_cfg = [{"name": "Social Security", "percent": 2.5}]

            for data in standard_versions:
                ver = TaxCodeVersion.objects.create(
                    tax_code=standard,
                    version=data["version"],
                    valid_from=data["valid_from"],
                    valid_to=data["valid_to"],
                    income_tax_config=data["income_tax_config"],
                    pension_config=std_pension_cfg,
                    statutory_deductions_config=std_statutory_cfg,
                    exemptions_config=[{"name": "Personal Allowance", "limit": 200}],
                    is_active=True,
                )
                for b in std_brackets:
                    TaxBracket.objects.create(
                        tax_code_version=ver,
                        min_income=b["min"],
                        max_income=b["max"],
                        rate=b["rate"],
                    )

            # Tax Code 2: Contractor Withholding
            contract = TaxCode.objects.create(
                code="CTR",
                name="Contractor Withholding",
                description="Withholding scheme for contractors and freelancers.",
                is_active=True,
            )

            contract_versions = [
                {
                    "version": "2024-Base",
                    "valid_from": date(2024, 1, 1),
                    "valid_to": date(2024, 8, 31),
                    "income_tax_config": {"rate": 0.10},
                },
                {
                    "version": "2024-SepAdj",
                    "valid_from": date(2024, 9, 1),
                    "valid_to": date(2024, 12, 31),
                    "income_tax_config": {"rate": 0.11},
                },
                {
                    "version": "2025-Current",
                    "valid_from": date(2025, 1, 1),
                    "valid_to": None,
                    "income_tax_config": {"rate": 0.12},
                },
            ]

            ctr_brackets = [
                {"min": 0, "max": 1000, "rate": 5},
                {"min": 1000, "max": 3000, "rate": 12},
                {"min": 3000, "max": None, "rate": 18},
            ]
            ctr_pension_cfg = {"employeePercent": 0, "employerPercent": 0}
            ctr_statutory_cfg = [{"name": "Withholding Levy", "percent": 1.5}]

            for data in contract_versions:
                ver = TaxCodeVersion.objects.create(
                    tax_code=contract,
                    version=data["version"],
                    valid_from=data["valid_from"],
                    valid_to=data["valid_to"],
                    income_tax_config=data["income_tax_config"],
                    pension_config=ctr_pension_cfg,
                    statutory_deductions_config=ctr_statutory_cfg,
                    exemptions_config=[{"name": "Base Exemption", "limit": 150}],
                    is_active=True,
                )
                for b in ctr_brackets:
                    TaxBracket.objects.create(
                        tax_code_version=ver,
                        min_income=b["min"],
                        max_income=b["max"],
                        rate=b["rate"],
                    )

        self.stdout.write(self.style.SUCCESS("Created 2 tax codes with fresh versions."))
        self.stdout.write(self.style.NOTICE("Run payroll generation to see the updated options."))
