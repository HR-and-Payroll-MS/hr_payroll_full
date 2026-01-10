"""
Payroll Calculation Service.
Calculates payroll for all employees considering policies, tax codes, overtime, attendance, and leaves.
"""
from decimal import Decimal
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


class PayrollCalculationService:
    """
    Service to calculate monthly payroll for all employees.
    Considers: policies, tax codes, overtime, attendance, leaves.
    """
    
    def __init__(self, period: PayrollPeriod, performed_by: Employee = None, tax_code_id: int = None):
        self.period = period
        self.performed_by = performed_by
        self.tax_code_id = tax_code_id
        self.month_num = self._get_month_number(period.month)
        self.year = period.year
        self.working_days = self._calculate_working_days()
        
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
        
        period_date = date(self.year, self.month_num, 1)
        return TaxCodeVersion.objects.filter(
            tax_code=self.tax_code,
            is_active=True,
            valid_from__lte=period_date
        ).filter(
            Q(valid_to__isnull=True) | Q(valid_to__gte=period_date)
        ).order_by('-valid_from').first()
    
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
        
        # 6. Calculate gross pay
        gross_pay = base_salary + Decimal(str(total_allowances)) + overtime_data['pay']
        
        # 7. Apply absence deduction (pro-rata)
        daily_rate = base_salary / Decimal(str(self.working_days)) if self.working_days > 0 else Decimal('0')
        absence_deduction = daily_rate * Decimal(str(final_absent_days + leave_data['unpaid_days']))
        
        # 8. Calculate deductions
        deductions_data = self._calculate_deductions(employee, gross_pay)
        
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

        total_deductions = sum(d['amount'] for d in deductions_data) + absence_deduction
        
        # 9. Calculate tax
        # Apply exemptions from tax code config
        taxable_income = gross_pay - self._get_pretax_deductions(deductions_data)
        
        exemptions_configs = getattr(self.tax_version, 'exemptions_config', [])
        for ec in exemptions_configs:
            limit = Decimal(str(ec.get('limit', 0)))
            if limit > 0:
                taxable_income = max(0, taxable_income - limit)

        tax_amount = self._calculate_tax(taxable_income)
        
        # 10. Calculate net pay
        net_pay = gross_pay - total_deductions - tax_amount
        
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
                'label': f"Overtime ({overtime_data['hours']}h × {overtime_data['rate']}x)",
                'amount': overtime_data['pay']
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
            'earnings': [{**e, 'amount': float(e['amount'])} for e in all_earnings],
            'deductions': [{**d, 'amount': float(d['amount'])} for d in all_deductions],
            'attendance': {
                'workedDays': attendance_data['worked_days'],
                'absentDays': final_absent_days,
                'leaveDays': leave_data['unpaid_days'],
                'totalDays': self.working_days
            },
            'gross': float(gross_pay),
            'totalDeductions': float(total_deductions + tax_amount),
            'net': float(net_pay)
        }
        
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
            details=details
        )
    
    def _calculate_allowances(self, employee: Employee, base_salary: Decimal):
        """Calculate all allowances for an employee."""
        allowances = []
        
        # Get employee-specific allowances
        emp_allowances = EmployeeAllowance.objects.filter(
            employee=employee,
            is_active=True
        ).select_related('allowance')
        
        for ea in emp_allowances:
            allowance = ea.allowance
            if not allowance.is_active:
                continue
            
            value = ea.custom_value if ea.custom_value else allowance.default_value
            
            if allowance.calculation_type == 'percentage' and allowance.percentage_value:
                value = base_salary * (allowance.percentage_value / Decimal('100'))
            
            allowances.append({
                'label': allowance.name,
                'amount': value.quantize(Decimal('0.01'))
            })
        
        # Get department/role-based allowances
        dept = employee.department.name if employee.department else None
        general_allowances = Allowance.objects.filter(is_active=True)
        
        for allowance in general_allowances:
            # Skip if already in employee-specific
            if any(a['label'] == allowance.name for a in allowances):
                continue
            
            # Check applicability
            applies_to = allowance.applies_to or []
            if 'all' in applies_to or (dept and dept in applies_to):
                value = allowance.default_value
                if allowance.calculation_type == 'percentage' and allowance.percentage_value:
                    value = base_salary * (allowance.percentage_value / Decimal('100'))
                
                allowances.append({
                    'label': allowance.name,
                    'amount': value.quantize(Decimal('0.01'))
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
        
        total_hours = sum(Decimal(str(ot.hours)) for ot in overtime_requests)
        
        # Get overtime rate from policy or default
        # Uses field name 'overtimeRate' from overtimePolicy
        ot_rate = Decimal('1.5')  # Default 1.5x
        weekend_rate = Decimal('2.0')  # Default 2x for weekends
        holiday_rate = Decimal('2.5')  # Default 2.5x for holidays
        
        if self.overtime_policy:
            ot_rate = Decimal(str(self.overtime_policy.get('overtimeRate', '1.5')))
            weekend_rate = Decimal(str(self.overtime_policy.get('weekendRate', '2.0')))
            holiday_rate = Decimal(str(self.overtime_policy.get('holidayRate', '2.5')))
        
        # Get holiday overtime rate from holiday policy if available
        if self.holiday_policy and self.holiday_policy.get('holidayPayRules'):
            holiday_rate = Decimal(str(self.holiday_policy.get('holidayPayRules', {}).get('holidayOvertimeRate', holiday_rate)))
        
        # Calculate hourly rate (assuming standard 8-hour day, working_days month)
        # Get working hours per day from shift policy
        hours_per_day = 8
        if self.shift_policy:
            hours_per_day = self.shift_policy.get('workingHoursPerDay', 8)
        
        monthly_hours = self.working_days * hours_per_day
        hourly_rate = base_salary / Decimal(str(monthly_hours)) if monthly_hours > 0 else Decimal('0')
        
        # TODO: Apply different rates based on whether OT was on weekend/holiday
        # For now, use standard overtime rate
        overtime_pay = hourly_rate * Decimal(str(total_hours)) * Decimal(str(ot_rate))
        
        return {
            'hours': total_hours,
            'rate': ot_rate,
            'weekendRate': weekend_rate,
            'holidayRate': holiday_rate,
            'pay': overtime_pay.quantize(Decimal('0.01'))
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
        """Calculate income tax using progressive tax brackets."""
        if not self.tax_brackets or taxable_income <= 0:
            return Decimal('0')
        
        tax = Decimal('0')
        
        # Robust progressive calculation
        for bracket in self.tax_brackets:
            lower = bracket.min_income
            upper = bracket.max_income if bracket.max_income is not None else Decimal('Infinity')
            
            if taxable_income > lower:
                # Calculate portion of income in this bracket
                taxable_in_this_bracket = min(taxable_income, upper) - lower
                tax += taxable_in_this_bracket * (bracket.rate / Decimal('100'))
        
        # Safety cap: Tax should never exceed 50% of income (unless rates are crazy)
        if tax > taxable_income * Decimal('0.5'):
            # This is likely a configuration error in brackets, log it
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
