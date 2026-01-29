"""
Unit Test for Payroll Calculation Service Logic.
Focuses on white-box testing of internal calculation methods.
"""
import os
import sys
import django
import unittest
from datetime import date
from unittest.mock import MagicMock

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.payroll.services import PayrollCalculationService
from apps.payroll.models import PayrollPeriod

class TestPayrollCalculationLogic(unittest.TestCase):
    
    def setUp(self):
        self.period_jan_2026 = MagicMock(spec=PayrollPeriod)
        self.period_jan_2026.month = 'January'
        self.period_jan_2026.year = 2026
        
        PayrollCalculationService._get_active_tax_code = MagicMock(return_value=None)
        PayrollCalculationService._get_applicable_tax_version = MagicMock(return_value=None)
        PayrollCalculationService._get_tax_brackets = MagicMock(return_value=[])
        PayrollCalculationService._get_policy = MagicMock(return_value={})
        PayrollCalculationService._get_company_info = MagicMock(return_value={})

        self.service = PayrollCalculationService(self.period_jan_2026)

    def test_get_month_number(self):
        """Test the conversion of month name to number."""
        print("\nRunning test_get_month_number...")
        self.assertEqual(self.service._get_month_number('January'), 1)
        self.assertEqual(self.service._get_month_number('December'), 12)
        self.assertEqual(self.service._get_month_number('Invalid'), 1) # Default
        print("✅ test_get_month_number Passed")

    def test_calculate_working_days_jan_2026(self):
        """
        Verify working days calculation for January 2026.
        Jan 2026 starts on Thursday. 
        Total days: 31
        Weekends: 3rd, 4th, 10th, 11th, 17th, 18th, 24th, 25th, 31st (9 days)
        Working days: 31 - 9 = 22
        """
        print("\nRunning test_calculate_working_days_jan_2026...")
        self.assertEqual(self.service.working_days, 22)
        print(f"✅ Calculated working days for Jan 2026: {self.service.working_days}")

if __name__ == '__main__':
    unittest.main()
