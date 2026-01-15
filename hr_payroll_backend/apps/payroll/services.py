"""
Payroll Calculation Service.
Calculates payroll for all employees considering policies, tax codes, overtime, attendance, and leaves.
"""
from decimal import Decimal
import logging
import json
from datetime import date, datetime, timedelta
from calendar import monthrange
from django.db.models import Sum, Q
from django.utils import timezone

from .models import (
    PayrollPeriod, Payslip, PayrollApprovalLog,
    TaxCode, TaxCodeVersion, TaxBracket,
    Allowance, Deduction, EmployeeAllowance, EmployeeDeduction
)
from apps.employees.models import Employee
from apps.attendance.models import Attendance, OvertimeRequest
from apps.leaves.models import LeaveRequest
from apps.policies.models import Policy
from apps.company.models import CompanyInfo

# Rounding helpers
from decimal import ROUND_HALF_UP, ROUND_UP, ROUND_DOWN


class PayrollCalculationService:
    """
    Service to calculate monthly payroll for all employees.
    Considers: policies, tax codes, overtime, attendance, leaves.
    """
    
    def __init__(self, period: PayrollPeriod, performed_by: Employee = None, tax_code_id: int = None, tax_code_version_id: int = None, override_adjustments: dict = None):
        self.period = period
        self.performed_by = performed_by
        self.tax_code_id = tax_code_id
        self.tax_code_version_id = tax_code_version_id
        self.override_adjustments = override_adjustments or {}
        self.month_num = self._get_month_number(period.month)
        self.year = period.year
        self.working_days = self._calculate_working_days()
        # Initialize debug/logging before calling any helpers that may log
        self.debug_trace = []
        self.logger = logging.getLogger('payroll')
        
        # Load tax configuration
        self.tax_code = self._get_active_tax_code()
        self.tax_version = self._get_applicable_tax_version()
        self.tax_brackets = self._get_tax_brackets()
        
        # Load policies - use correct section names matching database
        self.overtime_policy = self._get_policy('overtimePolicy')
        self.attendance_policy = self._get_policy('attendancePolicy')
        self.holiday_policy = self._get_policy('holidayPolicy')
        self.shift_policy = self._get_policy('shiftPolicy')
        
        # Load company info for payslip details
        self.company_info = self._get_company_info()

        self._debug(
            'bootstrap',
            tax_code_id=getattr(self.tax_code, 'id', None),
            tax_code_code=getattr(self.tax_code, 'code', None),
            tax_version_id=getattr(self.tax_version, 'id', None),
            tax_version=getattr(self.tax_version, 'version', None),
            brackets=len(self.tax_brackets),
        )

    def _debug(self, label: str, **data):
        """Collect debug breadcrumbs and emit structured console logs."""
        if not hasattr(self, 'debug_trace'):
            self.debug_trace = []
        payload = {
            'label': label,
            'period': {'month': self.period.month, 'year': self.period.year},
            **data,
        }
        self.debug_trace.append(payload)
        try:
            self.logger.info('PAYROLL_DEBUG ' + json.dumps(payload, default=str))
        except Exception:
            # Fallback to simple string
            self.logger.info(f"PAYROLL_DEBUG {label} {payload}")
    
    def _get_month_number(self, month_name: str) -> int:
        """Convert month name to number."""
        months = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4,
            'May': 5, 'June': 6, 'July': 7, 'August': 8,
            'September': 9, 'October': 10, 'November': 11, 'December': 12
        }
        return months.get(month_name, 1)
    
    def _calculate_working_days(self) -> int:
        """Calculate working days in the month (excluding weekends)."""
        _, days_in_month = monthrange(self.year, self.month_num)
        working_days = 0
        for day in range(1, days_in_month + 1):
            d = date(self.year, self.month_num, day)
            if d.weekday() < 5:  # Monday to Friday
                working_days += 1
        return working_days
    
    def _get_active_tax_code(self):
        """Get the active tax code for the organization."""
        # 1. Use requested tax code (Strict Mode)
        if self.tax_code_id:
            try:
                tax_code = TaxCode.objects.get(id=self.tax_code_id)
                if not tax_code.is_active:
                    raise ValueError(f"Selected Tax Code '{tax_code.name}' is inactive.")
                return tax_code
            except TaxCode.DoesNotExist:
                raise ValueError(f"Tax Code with ID {self.tax_code_id} not found.")

        # 2. Fallback logic
        # Try to get from policy first
        policy = Policy.objects.filter(section='salary', is_active=True).first()
        if policy and policy.tax_code:
            return policy.tax_code
        # Fallback to any active tax code
        return TaxCode.objects.filter(is_active=True).first()
    
    def _get_applicable_tax_version(self):
        """Get the tax version applicable for this period."""
        if not self.tax_code:
            return None
        # Explicit override if provided
        if self.tax_code_version_id:
            try:
                tv = TaxCodeVersion.objects.get(id=self.tax_code_version_id)
                if tv.tax_code_id != self.tax_code.id:
                    self._debug('tax_version_mismatch_code', requested=self.tax_code_version_id, tax_code_id=self.tax_code.id, tv_tax_code_id=tv.tax_code_id)
                    return None
                if not tv.is_active:
                    self._debug('tax_version_inactive', version_id=tv.id)
                    return None
                period_date = date(self.year, self.month_num, 1)
                if tv.valid_from and tv.valid_from > period_date:
                    self._debug('tax_version_not_started', version_id=tv.id, valid_from=str(tv.valid_from), period=str(period_date))
                    return None
                if tv.valid_to and tv.valid_to < period_date:
                    self._debug('tax_version_expired', version_id=tv.id, valid_to=str(tv.valid_to), period=str(period_date))
                    return None
                self._debug('tax_version_selected', version_id=tv.id, source='override')
                return tv
            except TaxCodeVersion.DoesNotExist:
                self._debug('tax_version_not_found', requested=self.tax_code_version_id)
                return None

        period_date = date(self.year, self.month_num, 1)
        tv = TaxCodeVersion.objects.filter(
            tax_code=self.tax_code,
            is_active=True,
            valid_from__lte=period_date
        ).filter(
            Q(valid_to__isnull=True) | Q(valid_to__gte=period_date)
        ).order_by('-valid_from').first()
        if not tv:
            self._debug('no_applicable_version', tax_code_id=self.tax_code.id, period=str(period_date))
        else:
            self._debug('tax_version_selected', version_id=tv.id, source='auto')
        return tv
    
    def _get_tax_brackets(self):
        """Get tax brackets for the applicable version."""
        if not self.tax_version:
            return []
        return list(TaxBracket.objects.filter(
            tax_code_version=self.tax_version
        ).order_by('min_income'))
    
    def _get_policy(self, section: str):
        """Get policy content for a specific section (prioritizing Org 1)."""
        # Try Org 1 first (Organization focus)
        policy = Policy.objects.filter(organization_id=1, section=section, is_active=True).first()
        if policy:
            return policy.content
        # Fallback to Org 0 (System default)
        policy = Policy.objects.filter(organization_id=0, section=section, is_active=True).first()
        return policy.content if policy else {}
    
    def _get_company_info(self):
        """Get company information for payslip header."""
        company = CompanyInfo.objects.first()
        if company:
            return {
                'name': company.name,
                'address': company.address,
                'phone': company.phone,
                'email': company.email,
                'logo': company.logo.url if company.logo else None
            }
        return {
            'name': 'Company Name',
            'address': '',
            'phone': '',
            'email': '',
            'logo': None
        }

    def _round(self, amount: Decimal) -> Decimal:
        """Round amounts based on tax version rounding rules (default 2 decimals, nearest)."""
        if amount is None:
            return Decimal('0')
        rules = getattr(self.tax_version, 'rounding_rules', {}) or {}
        precision = int(rules.get('precision', 2)) if isinstance(rules.get('precision', 2), (int, float, str)) else 2
        method = str(rules.get('method', 'nearest')).lower()

        quant = Decimal('1').scaleb(-precision)  # 10^-precision
        if method == 'up':
            rounding = ROUND_UP
        elif method == 'down':
            rounding = ROUND_DOWN
        else:
            rounding = ROUND_HALF_UP  # default nearest

        try:
            return Decimal(amount).quantize(quant, rounding=rounding)
        except Exception:
            return Decimal('0').quantize(quant, rounding=rounding)
    
    def generate_payroll(self):
        """Generate payslips for all active employees."""
        # Delete existing payslips for this period if regenerating
        Payslip.objects.filter(period=self.period).delete()
        
        employees = Employee.objects.filter(status='Active')
        payslips = []
        
        for employee in employees:
            try:
                payslip = self._calculate_for_employee(employee)
                payslips.append(payslip)
            except Exception as e:
                # Create payslip with issue flag
                payslip = Payslip(
                    period=self.period,
                    employee=employee,
                    base_salary=employee.salary or Decimal('0'),
                    net_pay=Decimal('0'),
                    has_issues=True,
                    issue_notes=f"Calculation error: {str(e)}"
                )
                payslips.append(payslip)
        
        # Bulk create all payslips
        Payslip.objects.bulk_create(payslips)
        
        # Update period status
        old_status = self.period.status
        self.period.status = 'generated'
        self.period.save()
        
        # Log the action
        self._log_action('generated', old_status, 'generated', 
                        f"Generated {len(payslips)} payslips")
        
        return payslips
    
    def _calculate_for_employee(self, employee: Employee) -> Payslip:
        """Calculate individual payslip with all components."""
        # Capture per-employee context (preserve init debug breadcrumbs)
        self._debug(
            'bootstrap',
            employee=employee.id,
            tax_code_id=getattr(self.tax_code, 'id', None),
            tax_code_code=getattr(self.tax_code, 'code', None),
            tax_version_id=getattr(self.tax_version, 'id', None),
            tax_version=getattr(self.tax_version, 'version', None),
            bracket_count=len(self.tax_brackets),
        )

        issues = []
        # Pre-check: Missing tax version
        if not self.tax_version:
            issues.append('No active tax version for period; income tax set to 0.')
            self._debug('tax_version_missing', employee=employee.id)

        # 1. Base salary from employee record
        full_base_salary = employee.salary or Decimal('0')
        
        # Prorate if joined mid-month
        start_date = date(self.year, self.month_num, 1)
        _, last_day = monthrange(self.year, self.month_num)
        end_date = date(self.year, self.month_num, last_day)
        
        # Initialize days
        period_days = self.working_days
        payable_days = self.working_days
        
        if employee.join_date and employee.join_date > start_date:
            # Employee joined this month
            # Calculate working days from joining date to end of month
            working_days_after_joining = 0
            # Iterate from join_date to end_date
            join_day = employee.join_date.day
            curr_day = join_day
            
            while curr_day <= last_day:
                d = date(self.year, self.month_num, curr_day)
                if d.weekday() < 5:  # Monday to Friday (Standard)
                    working_days_after_joining += 1
                curr_day += 1
                
            payable_days = working_days_after_joining
            
            # Prorate formula: (Base / Period Working Days) * Payable Days
            if period_days > 0:
                base_salary = (full_base_salary / Decimal(str(period_days))) * Decimal(str(payable_days))
                base_salary = base_salary.quantize(Decimal('0.01'))
            else:
                base_salary = Decimal('0')
        else:
            base_salary = full_base_salary
        
        # 2. Calculate allowances
        allowances_data = self._calculate_allowances(employee, base_salary)
        total_allowances = sum(a['amount'] for a in allowances_data)
        
        # 3. Calculate overtime
        overtime_data = self._calculate_overtime(employee, base_salary)

        # 3a. One-off and offset adjustments
        # Allow override adjustments (per-payslip temporary inputs)
        one_off_source = self.override_adjustments.get('one_off', getattr(employee, 'one_off', 0) or 0)
        offset_source = self.override_adjustments.get('offset', getattr(employee, 'offset', 0) or 0)
        one_off_val = Decimal(str(one_off_source)).quantize(Decimal('0.01'))
        offset_val = Decimal(str(offset_source)).quantize(Decimal('0.01'))
        
        # 4. Get attendance data
        attendance_data = self._get_attendance_data(employee)
        
        # 5. Get leave data (all approved leaves)
        leave_data = self._get_leave_data(employee)
        
        # Calculate Absent Days (Deductive Logic + DB Records)
        # Absent = Expected Working Days - (Worked + Late) - Approved Leaves
        worked_count = attendance_data['worked_days'] # Present + Late
        total_leaves = leave_data['total_days']
        
        calculated_absent = max(0, payable_days - worked_count - total_leaves)
        
        # Use the greater of DB-recorded absent days vs calculated absent days to ensure we don't miss anything 
        # (Though calculated usually covers DB ones if they are on working days)
        final_absent_days = max(attendance_data['absent_days'], calculated_absent)
        
        # Update attendance data for payslip details
        attendance_data['absent_days'] = final_absent_days
        
        # 6. Calculate gross pay (include positive one-off and offset credits)
        extra_earnings = Decimal('0')
        if one_off_val > 0:
            extra_earnings += one_off_val
        if offset_val < 0:
            extra_earnings += (-offset_val)

        gross_pay = base_salary + Decimal(str(total_allowances)) + overtime_data['pay'] + extra_earnings
        gross_pay = self._round(gross_pay)
        
        # 7. Apply absence deduction (pro-rata)
        daily_rate = base_salary / Decimal(str(self.working_days)) if self.working_days > 0 else Decimal('0')
        absence_deduction = daily_rate * Decimal(str(final_absent_days + leave_data['unpaid_days']))
        absence_deduction = self._round(absence_deduction)
        
        # 8. Calculate deductions (include positive offset and negative one-off as post-tax)
        deductions_data = self._calculate_deductions(employee, gross_pay)
        if offset_val > 0:
            deductions_data.append({
                'label': 'Offset Adjustment',
                'amount': offset_val,
                'is_pretax': False
            })
        if one_off_val < 0:
            deductions_data.append({
                'label': 'One-off Adjustment',
                'amount': (-one_off_val),
                'is_pretax': False
            })
        
        # Add statutory deductions from tax code config
        statutory_configs = getattr(self.tax_version, 'statutory_deductions_config', [])
        for sc in statutory_configs:
            name = sc.get('name')
            percent = Decimal(str(sc.get('percent', 0)))
            if name and percent > 0:
                # Check if already present to avoid duplicates
                if not any(d['label'] == name for d in deductions_data):
                    deductions_data.append({
                        'label': name,
                        'amount': (gross_pay * (percent / Decimal('100'))).quantize(Decimal('0.01')),
                        'is_pretax': True # Statutory usually pre-tax
                    })

        # Pension (employee contribution as pre-tax deduction; employer recorded for info)
        employee_pension_amount = Decimal('0')
        employer_pension_amount = Decimal('0')
        pension_cfg = getattr(self.tax_version, 'pension_config', {}) or {}
        try:
            emp_pct = Decimal(str(pension_cfg.get('employeePercent', 0)))
            empl_pct = Decimal(str(pension_cfg.get('employerPercent', 0)))
        except Exception:
            emp_pct = Decimal('0')
            empl_pct = Decimal('0')

        if emp_pct > 0:
            employee_pension_amount = (gross_pay * (emp_pct / Decimal('100'))).quantize(Decimal('0.01'))
            # Avoid duplicate if a pension deduction already exists
            if not any('pension' in d['label'].lower() for d in deductions_data):
                deductions_data.append({
                    'label': 'Pension (Employee)',
                    'amount': employee_pension_amount,
                    'is_pretax': True
                })

        if empl_pct > 0:
            employer_pension_amount = (gross_pay * (empl_pct / Decimal('100'))).quantize(Decimal('0.01'))

        total_deductions = sum(d['amount'] for d in deductions_data) + absence_deduction
        total_deductions = self._round(total_deductions)
        
        # 9. Calculate tax
        # Apply exemptions from tax code config and exclude non-taxable allowances from tax base
        non_taxable_allowances_total = Decimal(str(sum(
            a['amount'] for a in allowances_data if not a.get('is_taxable', True)
        )))
        taxable_income = gross_pay - self._get_pretax_deductions(deductions_data) - non_taxable_allowances_total
        
        exemptions_configs = getattr(self.tax_version, 'exemptions_config', [])
        exemptions_applied = []
        # Overtime pay (Decimal) - used when exemptions exclude overtime
        overtime_pay = Decimal('0')
        try:
            overtime_pay = Decimal(str(overtime_data.get('pay', 0))) if isinstance(overtime_data, dict) else Decimal('0')
        except Exception:
            overtime_pay = Decimal('0')

        for ec in exemptions_configs:
            limit = Decimal(str(ec.get('limit', 0)))
            if limit <= 0:
                continue

            # Determine whether this exemption may reduce overtime (default: True)
            ot_taxable = bool(ec.get('overtimeTaxable', True))

            if ot_taxable:
                # Apply exemption against the whole taxable income
                applied = min(taxable_income, limit) if taxable_income > 0 else Decimal('0')
            else:
                # Apply exemption only against the non-overtime portion
                non_ot_taxable = taxable_income - overtime_pay
                if non_ot_taxable < 0:
                    non_ot_taxable = Decimal('0')
                applied = min(non_ot_taxable, limit) if non_ot_taxable > 0 else Decimal('0')

            # Subtract the actual applied amount (not the configured limit)
            taxable_income = max(Decimal('0'), taxable_income - applied)

            exemptions_applied.append({
                'name': ec.get('name') or 'Exemption',
                'applied': float(self._round(applied)),
                'limit': float(self._round(limit)),
                'overtimeTaxable': ot_taxable,
            })

        # Early reason markers
        if len(self.tax_brackets) == 0:
            self._debug('no_brackets', employee=employee.id)
        if taxable_income <= 0:
            self._debug('taxable_income_non_positive', employee=employee.id, taxable_income=float(self._round(taxable_income)))

        tax_amount = self._calculate_tax(taxable_income)
        tax_amount = self._round(tax_amount)

        # Capture core tax inputs/outputs for debugging
        self._debug(
            'tax_calc',
            employee=employee.id,
            gross=float(self._round(gross_pay)),
            pretax=float(self._round(self._get_pretax_deductions(deductions_data))),
            non_taxable_allowances=float(self._round(non_taxable_allowances_total)),
            taxable_income=float(self._round(taxable_income)),
            tax=float(tax_amount),
            bracket_count=len(self.tax_brackets),
            mode=getattr(self.tax_version, 'income_tax_config', {}).get('type', 'progressive') if getattr(self.tax_version, 'income_tax_config', None) else ('progressive' if len(self.tax_brackets) > 0 else 'flat')
        )

        # Anomaly: Tax exceeds 50% of taxable income
        try:
            if taxable_income > 0 and tax_amount > (taxable_income * Decimal('0.5')):
                issues.append('Tax exceeds 50% of taxable income; review tax brackets configuration.')
        except Exception:
            pass
        
        # 10. Calculate net pay
        net_pay = gross_pay - total_deductions - tax_amount
        net_pay = self._round(net_pay)
        
        # Build detailed breakdown
        all_earnings = [
            {'label': 'Basic Salary', 'amount': base_salary}
        ]
        
        # Add note if prorated
        if base_salary < full_base_salary:
            all_earnings[0]['label'] += f" (Prorated: {payable_days}/{period_days} days)"
            
        all_earnings += allowances_data
        
        if overtime_data['pay'] > 0:
            all_earnings.append({
                'label': overtime_data.get('label', f"Overtime ({overtime_data['hours']}h × {overtime_data['rate']}x)"),
                'amount': overtime_data['pay']
            })

        # Add one-off and offset credits to earnings breakdown
        if one_off_val > 0:
            all_earnings.append({
                'label': 'One-off Adjustment',
                'amount': one_off_val
            })
        if offset_val < 0:
            all_earnings.append({
                'label': 'Offset Credit',
                'amount': (-offset_val)
            })
        
        all_deductions = deductions_data.copy()
        if absence_deduction > 0:
            all_deductions.append({
                'label': f"Absence Deduction ({final_absent_days} days)",
                'amount': absence_deduction,
                'is_pretax': False
            })
        all_deductions.append({
            'label': 'Income Tax',
            'amount': tax_amount,
            'is_pretax': False
        })
        
        details = {
            'company': self.company_info,
            'month': f"{self.period.month} {self.period.year}",
            'paymentDate': date(self.year, self.month_num, 28).isoformat(),
            'paymentMethod': 'Bank Transfer',
            'earnings': [{**e, 'amount': float(self._round(e['amount']))} for e in all_earnings],
            'deductions': [{**d, 'amount': float(self._round(d['amount']))} for d in all_deductions],
            'taxSummary': {
                'mode': getattr(self.tax_version, 'income_tax_config', {}).get('type', 'progressive') if getattr(self.tax_version, 'income_tax_config', None) else ('progressive' if len(self.tax_brackets) > 0 else 'flat'),
                'nonTaxableAllowances': float(self._round(non_taxable_allowances_total)),
                'exemptionsApplied': exemptions_applied,
            },
            'attendance': {
                'workedDays': attendance_data['worked_days'],
                'absentDays': final_absent_days,
                'leaveDays': leave_data['unpaid_days'],
                'totalDays': self.working_days
            },
            'gross': float(self._round(gross_pay)),
            'totalDeductions': float(self._round(total_deductions + tax_amount)),
            'net': float(self._round(net_pay)),
            'contributions': {
                'employeePensionPercent': float(emp_pct),
                'employeePension': float(self._round(employee_pension_amount)),
                'employerPensionPercent': float(empl_pct),
                'employerPension': float(self._round(employer_pension_amount))
            },
            'warnings': issues,
            'adjustmentApplied': float(self._round(offset_val)) if offset_val != 0 else 0.0,
            'debug': self.debug_trace,
        }

        # Consume offset once after applying as carryover
        if offset_val != 0:
            employee.offset = Decimal('0')
            employee.save(update_fields=['offset'])
        
        return Payslip(
            period=self.period,
            employee=employee,
            base_salary=base_salary,
            total_allowances=Decimal(str(total_allowances)),
            bonus=Decimal('0'),
            overtime_hours=Decimal(str(overtime_data['hours'])),
            overtime_rate=Decimal(str(overtime_data['rate'])),
            overtime_pay=overtime_data['pay'],
            total_deductions=total_deductions,
            tax_amount=tax_amount,
            gross_pay=gross_pay,
            net_pay=net_pay,
            tax_code=self.tax_code,
            tax_code_version=self.tax_version,
            worked_days=attendance_data['worked_days'],
            absent_days=final_absent_days,
            leave_days=leave_data['unpaid_days'],
            details=details,
            has_issues=bool(issues),
            issue_notes='; '.join(issues) if issues else ''
        )
    
    def _calculate_allowances(self, employee: Employee, base_salary: Decimal):
        """Calculate all allowances for an employee using tax code version scoped allowances first."""
        allowances = []

        version_id = getattr(self.tax_version, 'id', None)
        code_id = getattr(self.tax_code, 'id', None)

        # Get employee-specific allowances (respect active flag)
        emp_allowances = EmployeeAllowance.objects.filter(
            employee=employee,
            is_active=True
        ).select_related('allowance')

        for ea in emp_allowances:
            allowance = ea.allowance
            if not allowance.is_active:
                continue
            # Strict scope: if a tax version is selected, only include allowances bound to that version
            if version_id:
                if allowance.tax_code_version_id != version_id:
                    continue
            else:
                # No version specified: allow tax_code-scoped allowances, skip others
                if code_id and allowance.tax_code_id and allowance.tax_code_id != code_id:
                    continue

            value = ea.custom_value if ea.custom_value else allowance.default_value

            if allowance.calculation_type == 'percentage' and allowance.percentage_value:
                value = base_salary * (allowance.percentage_value / Decimal('100'))

            allowances.append({
                'label': allowance.name,
                'amount': value.quantize(Decimal('0.01')),
                'is_taxable': bool(getattr(allowance, 'is_taxable', True))
            })

        # Get department/role-based allowances scoped by version first
        dept = employee.department.name if employee.department else None
        scoped_allowances = Allowance.objects.filter(is_active=True)
        if version_id:
            scoped_allowances = scoped_allowances.filter(tax_code_version_id=version_id)
        elif code_id:
            scoped_allowances = scoped_allowances.filter(tax_code_id=code_id)

        for allowance in scoped_allowances:
            # Skip if already in employee-specific
            if any(a['label'] == allowance.name for a in allowances):
                continue

            applies_to = allowance.applies_to or []
            if 'all' in applies_to or (dept and dept in applies_to):
                value = allowance.default_value
                if allowance.calculation_type == 'percentage' and allowance.percentage_value:
                    value = base_salary * (allowance.percentage_value / Decimal('100'))

                allowances.append({
                    'label': allowance.name,
                    'amount': value.quantize(Decimal('0.01')),
                    'is_taxable': bool(getattr(allowance, 'is_taxable', True))
                })

        return allowances
    
    def _calculate_overtime(self, employee: Employee, base_salary: Decimal):
        """Calculate overtime pay from approved overtime requests."""
        # Get approved overtime for this employee in this period
        start_date = date(self.year, self.month_num, 1)
        _, last_day = monthrange(self.year, self.month_num)
        end_date = date(self.year, self.month_num, last_day)
        
        overtime_requests = OvertimeRequest.objects.filter(
            employees=employee,
            date__gte=start_date,
            date__lte=end_date,
            status='approved'
        )
        
        # Aggregate hours by day type
        weekday_hours = Decimal('0')
        weekend_hours = Decimal('0')
        holiday_hours = Decimal('0')

        # Policy-configured rates
        base_ot_rate = Decimal('1.5')  # Default 1.5x
        weekend_rate = Decimal('2.0')  # Default 2x
        holiday_rate = Decimal('2.5')  # Default 2.5x

        if self.overtime_policy:
            try:
                base_ot_rate = Decimal(str(self.overtime_policy.get('overtimeRate', '1.5')))
                weekend_rate = Decimal(str(self.overtime_policy.get('weekendRate', '2.0')))
                holiday_rate = Decimal(str(self.overtime_policy.get('holidayRate', '2.5')))
            except Exception:
                pass

        # Holiday policy override for holiday OT rate
        try:
            if self.holiday_policy and self.holiday_policy.get('holidayPayRules'):
                holiday_rate = Decimal(str(self.holiday_policy.get('holidayPayRules', {}).get('holidayOvertimeRate', holiday_rate)))
        except Exception:
            pass

        # Determine weekly off names from shift policy (e.g., ["Sat", "Sun"]) or fallback to standard weekend
        weekly_off = []
        if self.shift_policy:
            weekly_off = self.shift_policy.get('weeklyOff', []) or []

        # Map weekday index to name used in policy
        weekday_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

        # Build set of holiday dates (YYYY-MM-DD) from policy
        holiday_dates = set()
        if self.holiday_policy:
            fixed = self.holiday_policy.get('fixedHolidays', []) or []
            company = self.holiday_policy.get('companyHolidays', []) or []
            for h in fixed + company:
                dstr = h.get('date')
                if dstr:
                    holiday_dates.add(dstr)

        # Classify each OT request's hours
        for ot in overtime_requests:
            ot_date = ot.date
            hours = Decimal(str(ot.hours))
            # Holiday check first
            if ot_date.isoformat() in holiday_dates:
                holiday_hours += hours
                continue
            # Weekend/off-day check
            day_name = weekday_names[ot_date.weekday()]
            if weekly_off and day_name in weekly_off:
                weekend_hours += hours
            elif not weekly_off and ot_date.weekday() >= 5:
                weekend_hours += hours
            else:
                weekday_hours += hours

        total_hours = weekday_hours + weekend_hours + holiday_hours

        # Calculate hourly rate (assuming standard working hours per day)
        hours_per_day = 8
        if self.shift_policy:
            try:
                hours_per_day = int(self.shift_policy.get('workingHoursPerDay', 8))
            except Exception:
                hours_per_day = 8

        monthly_hours = self.working_days * hours_per_day
        hourly_rate = base_salary / Decimal(str(monthly_hours)) if monthly_hours > 0 else Decimal('0')

        # Compute pay by type
        weekday_pay = self._round(hourly_rate * weekday_hours * base_ot_rate)
        weekend_pay = self._round(hourly_rate * weekend_hours * weekend_rate)
        holiday_pay = self._round(hourly_rate * holiday_hours * holiday_rate)
        overtime_pay = self._round(weekday_pay + weekend_pay + holiday_pay)

        # Build a descriptive label for payslip details
        parts = []
        if weekday_hours > 0:
            parts.append(f"{weekday_hours}h wkday @{base_ot_rate}x")
        if weekend_hours > 0:
            parts.append(f"{weekend_hours}h wknd @{weekend_rate}x")
        if holiday_hours > 0:
            parts.append(f"{holiday_hours}h hol @{holiday_rate}x")
        label = "Overtime (" + ", ".join(parts) + ")" if parts else "Overtime"

        return {
            'hours': total_hours,
            'rate': base_ot_rate,
            'weekendRate': weekend_rate,
            'holidayRate': holiday_rate,
            'weekdayHours': weekday_hours,
            'weekendHours': weekend_hours,
            'holidayHours': holiday_hours,
            'weekdayPay': weekday_pay,
            'weekendPay': weekend_pay,
            'holidayPay': holiday_pay,
            'label': label,
            'pay': overtime_pay
        }
    
    def _get_attendance_data(self, employee: Employee):
        """Get attendance summary for the period."""
        start_date = date(self.year, self.month_num, 1)
        _, last_day = monthrange(self.year, self.month_num)
        end_date = date(self.year, self.month_num, last_day)
        
        attendances = Attendance.objects.filter(
            employee=employee,
            date__gte=start_date,
            date__lte=end_date
        )
        
        worked_days = attendances.filter(status__iexact='present').count() + attendances.filter(status__iexact='late').count()
        absent_days = attendances.filter(status__iexact='absent').count()
        
        return {
            'worked_days': worked_days,
            'absent_days': absent_days
        }
    
    def _get_leave_data(self, employee: Employee):
        """Get unpaid and total leave days for the period."""
        start_date = date(self.year, self.month_num, 1)
        _, last_day = monthrange(self.year, self.month_num)
        end_date = date(self.year, self.month_num, last_day)
        
        # Get approved leave requests overlapping this period
        leaves = LeaveRequest.objects.filter(
            employee=employee,
            status='approved',
            start_date__lte=end_date,
            end_date__gte=start_date
        )
        
        total_days = sum(leave.days for leave in leaves)
        unpaid_days = sum(leave.days for leave in leaves if leave.leave_type == 'unpaid')
        
        return {
            'unpaid_days': unpaid_days,
            'total_days': total_days
        }
    
    def _calculate_deductions(self, employee: Employee, gross_pay: Decimal):
        """Calculate all deductions for an employee."""
        deductions = []
        
        # Get employee-specific deductions
        emp_deductions = EmployeeDeduction.objects.filter(
            employee=employee,
            is_active=True
        ).select_related('deduction')
        
        for ed in emp_deductions:
            deduction = ed.deduction
            if not deduction.is_active:
                continue
            
            value = ed.custom_value if ed.custom_value else deduction.default_value
            
            if deduction.calculation_type == 'percentage' and deduction.percentage_value:
                value = gross_pay * (deduction.percentage_value / Decimal('100'))
            
            deductions.append({
                'label': deduction.name,
                'amount': value.quantize(Decimal('0.01')),
                'is_pretax': deduction.is_pre_tax
            })
        
        # Get mandatory deductions
        dept = employee.department.name if employee.department else None
        mandatory_deductions = Deduction.objects.filter(is_active=True, is_mandatory=True)
        
        for deduction in mandatory_deductions:
            if any(d['label'] == deduction.name for d in deductions):
                continue
            
            applies_to = deduction.applies_to or []
            if 'all' in applies_to or (dept and dept in applies_to) or not applies_to:
                value = deduction.default_value
                if deduction.calculation_type == 'percentage' and deduction.percentage_value:
                    value = gross_pay * (deduction.percentage_value / Decimal('100'))
                
                deductions.append({
                    'label': deduction.name,
                    'amount': value.quantize(Decimal('0.01')),
                    'is_pretax': deduction.is_pre_tax
                })
        
        return deductions
    
    def _get_pretax_deductions(self, deductions):
        """Get total pre-tax deductions."""
        return Decimal(str(sum(d['amount'] for d in deductions if d.get('is_pretax', False))))
    
    def _calculate_tax(self, taxable_income: Decimal) -> Decimal:
        """Calculate income tax using flat or progressive rules based on version config."""
        if taxable_income <= 0:
            return Decimal('0')

        cfg = getattr(self.tax_version, 'income_tax_config', {}) or {}
        cfg_type = str(cfg.get('type', '')).lower()
        # Prefer explicit flatRate for flat configs; fall back to legacy 'rate'
        flat_rate = cfg.get('flatRate', cfg.get('rate', None))

        # Flat mode explicitly requested or fallback if no brackets but a rate is provided
        if cfg_type == 'flat' or (not self.tax_brackets and flat_rate is not None):
            try:
                rate = Decimal(str(flat_rate))
            except Exception:
                rate = Decimal('0')
            if rate <= 0:
                return Decimal('0')
            return (taxable_income * (rate / Decimal('100'))).quantize(Decimal('0.01'))

        # Progressive default using brackets
        if not self.tax_brackets:
            return Decimal('0')

        tax = Decimal('0')

        for bracket in self.tax_brackets:
            lower = bracket.min_income
            upper = bracket.max_income if bracket.max_income is not None else Decimal('Infinity')

            if taxable_income > lower:
                taxable_in_this_bracket = min(taxable_income, upper) - lower
                tax += taxable_in_this_bracket * (bracket.rate / Decimal('100'))

        # Safety cap: Tax should never exceed 50% of income
        if tax > taxable_income * Decimal('0.5'):
            pass

        return tax.quantize(Decimal('0.01'))
    
    def _log_action(self, action: str, previous_status: str, new_status: str, notes: str = ''):
        """Log an action in the approval workflow."""
        PayrollApprovalLog.objects.create(
            period=self.period,
            action=action,
            performed_by=self.performed_by,
            notes=notes,
            previous_status=previous_status,
            new_status=new_status
        )


def submit_payroll(period: PayrollPeriod, submitted_by: Employee, notes: str = ''):
    """Submit payroll for HR approval."""
    if period.status not in ['generated', 'rolled_back']:
        raise ValueError(f"Cannot submit payroll in '{period.status}' status")
    
    old_status = period.status
    period.status = 'pending_approval'
    period.submitted_by = submitted_by
    period.submitted_at = timezone.now()
    period.notes = notes
    period.save()
    
    PayrollApprovalLog.objects.create(
        period=period,
        action='submitted',
        performed_by=submitted_by,
        notes=notes,
        previous_status=old_status,
        new_status='pending_approval'
    )
    
    return period


def approve_payroll(period: PayrollPeriod, approved_by: Employee, notes: str = ''):
    """Approve payroll (HR Manager action)."""
    if period.status != 'pending_approval':
        raise ValueError(f"Cannot approve payroll in '{period.status}' status")
    
    old_status = period.status
    period.status = 'approved'
    period.approved_by = approved_by
    period.approved_at = timezone.now()
    period.notes = notes
    period.save()
    
    PayrollApprovalLog.objects.create(
        period=period,
        action='approved',
        performed_by=approved_by,
        notes=notes,
        previous_status=old_status,
        new_status='approved'
    )
    
    return period


def rollback_payroll(period: PayrollPeriod, rolled_back_by: Employee, reason: str):
    """Rollback payroll to draft (HR Manager action)."""
    if period.status not in ['pending_approval', 'approved']:
        raise ValueError(f"Cannot rollback payroll in '{period.status}' status")
    
    old_status = period.status
    period.status = 'rolled_back'
    period.notes = reason
    period.save()
    
    PayrollApprovalLog.objects.create(
        period=period,
        action='rolled_back',
        performed_by=rolled_back_by,
        notes=reason,
        previous_status=old_status,
        new_status='rolled_back'
    )
    
    return period


def finalize_payroll(period: PayrollPeriod, finalized_by: Employee):
    """Finalize payroll and send notifications to employees."""
    if period.status != 'approved':
        raise ValueError(f"Cannot finalize payroll in '{period.status}' status")
    
    old_status = period.status
    period.status = 'finalized'
    period.finalized_at = timezone.now()
    period.save()
    
    PayrollApprovalLog.objects.create(
        period=period,
        action='finalized',
        performed_by=finalized_by,
        notes='Payroll finalized and notifications sent',
        previous_status=old_status,
        new_status='finalized'
    )
    
    # Send notifications to all employees
    _send_payroll_notifications(period)
    
    return period


def _send_payroll_notifications(period: PayrollPeriod):
    """Send payslip ready notifications to all employees."""
    from apps.notifications.models import Notification
    
    for payslip in period.payslips.all():
        Notification.objects.create(
            recipient=payslip.employee,
            title=f"Payslip Ready - {period.month} {period.year}",
            message=f"Your payslip for {period.month} {period.year} is ready. Net Pay: {payslip.net_pay}",
            notification_type='payroll',
            link=f'/my-payslips/{payslip.id}'
        )
