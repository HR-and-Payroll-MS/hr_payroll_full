"""Payroll models for HR & Payroll System.
Includes TaxCode, Allowance, Deduction, TaxBracket for complete payroll management.
"""
from django.db import models
from decimal import Decimal


class PayrollPeriod(models.Model):
    """Represents a monthly payroll period for generating payslips."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('generated', 'Generated'),
        ('pending_approval', 'Pending HR Approval'),
        ('approved', 'Approved'),
        ('finalized', 'Finalized'),
        ('rolled_back', 'Rolled Back'),
    ]
    
    month = models.CharField(max_length=20)  # e.g. "January", "February"
    year = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Workflow tracking
    created_by = models.ForeignKey(
        'employees.Employee', 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='payroll_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    submitted_by = models.ForeignKey(
        'employees.Employee', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='payroll_submitted'
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    approved_by = models.ForeignKey(
        'employees.Employee', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='payroll_approved'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    finalized_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)  # For rollback reasons, adjustments, etc.
    
    class Meta:
        db_table = 'payroll_periods'
        unique_together = ['month', 'year']
        ordering = ['-year', '-month']
    
    def __str__(self):
        return f"{self.month} {self.year} ({self.status})"


class PayrollApprovalLog(models.Model):
    """Tracks all status changes in payroll approval workflow."""
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('generated', 'Generated'),
        ('submitted', 'Submitted for Approval'),
        ('approved', 'Approved'),
        ('finalized', 'Finalized'),
        ('rolled_back', 'Rolled Back'),
    ]
    
    period = models.ForeignKey(
        PayrollPeriod, 
        on_delete=models.CASCADE, 
        related_name='approval_logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    performed_by = models.ForeignKey(
        'employees.Employee', 
        on_delete=models.SET_NULL, 
        null=True
    )
    performed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    previous_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    
    class Meta:
        db_table = 'payroll_approval_logs'
        ordering = ['-performed_at']
    
    def __str__(self):
        return f"{self.period} - {self.action} by {self.performed_by}"


class Payslip(models.Model):
    """Individual payslip for an employee in a payroll period."""
    period = models.ForeignKey(PayrollPeriod, on_delete=models.CASCADE, related_name='payslips')
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE)
    
    # Base compensation
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Allowances & bonuses
    total_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Overtime tracking
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    overtime_rate = models.DecimalField(max_digits=5, decimal_places=2, default=1.5)  # multiplier
    overtime_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Deductions
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Final amount
    gross_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Tax code tracking
    tax_code = models.ForeignKey(
        'TaxCode', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    tax_code_version = models.ForeignKey(
        'TaxCodeVersion', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    # Attendance tracking
    worked_days = models.IntegerField(default=0)
    absent_days = models.IntegerField(default=0)
    leave_days = models.IntegerField(default=0)  # unpaid leave
    
    # Issue tracking for Payroll Officer communication
    has_issues = models.BooleanField(default=False)
    issue_notes = models.TextField(blank=True)
    
    # Detailed breakdown stored as JSON
    details = models.JSONField(default=dict)
    # Structure: {
    #   "earnings": [{"label": "...", "amount": ...}, ...],
    #   "deductions": [{"label": "...", "amount": ...}, ...],
    #   "company": {"name": "...", "address": "...", ...},
    # }
    
    class Meta:
        db_table = 'payslips'
        unique_together = ['period', 'employee']
    
    def __str__(self):
        return f"{self.employee} - {self.period}"




# ============== TAX CODE MANAGEMENT ==============

class TaxCode(models.Model):
    """
    Main TaxCode model representing a tax configuration.
    A TaxCode can have multiple versions for different validity periods.
    """
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tax_codes'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class TaxCodeVersion(models.Model):
    """Version of a TaxCode with validity period and configurations."""
    tax_code = models.ForeignKey(TaxCode, on_delete=models.CASCADE, related_name='versions')
    version = models.CharField(max_length=20)
    valid_from = models.DateField()
    valid_to = models.DateField(null=True, blank=True)  # null = currently active
    is_active = models.BooleanField(default=True)
    is_locked = models.BooleanField(default=False)  # Locked versions can't be edited
    
    # Tax configuration as JSON for flexibility
    income_tax_config = models.JSONField(default=dict)
    pension_config = models.JSONField(default=dict)
    rounding_rules = models.JSONField(default=dict)
    compliance_notes = models.JSONField(default=list)
    statutory_deductions_config = models.JSONField(default=list) # [{name, percent}]
    exemptions_config = models.JSONField(default=list) # [{name, limit, overtimeTaxable}]
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tax_code_versions'
        ordering = ['-valid_from']
        unique_together = ['tax_code', 'version']
    
    def __str__(self):
        return f"{self.tax_code.code} v{self.version}"


# ============== ALLOWANCES ==============

class Allowance(models.Model):
    """
    Represents an allowance type that can be applied to employees.
    Examples: Transport Allowance, Housing Allowance, Meal Allowance.
    """
    CALCULATION_TYPES = [
        ('fixed', 'Fixed Amount'),
        ('percentage', 'Percentage of Salary'),
        ('formula', 'Custom Formula'),
    ]
    
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    calculation_type = models.CharField(max_length=20, choices=CALCULATION_TYPES, default='fixed')
    default_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    percentage_value = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # For percentage type
    formula = models.TextField(blank=True)  # For formula type
    
    is_taxable = models.BooleanField(default=True)  # Whether this allowance is taxable
    is_active = models.BooleanField(default=True)
    
    # Applicability - JSON array of: "all", department names, role names, etc.
    applies_to = models.JSONField(default=list)  # ["all"] or ["Engineering", "HR"] or ["Manager"]
    
    tax_code = models.ForeignKey(TaxCode, on_delete=models.SET_NULL, null=True, blank=True, related_name='allowances')
    tax_code_version = models.ForeignKey(TaxCodeVersion, on_delete=models.CASCADE, null=True, blank=True, related_name='allowances')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'allowances'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


# ============== DEDUCTIONS ==============

class Deduction(models.Model):
    """
    Represents a deduction type that can be applied to employees.
    Examples: Pension, Health Insurance, Tax, Loan Repayment.
    """
    CALCULATION_TYPES = [
        ('fixed', 'Fixed Amount'),
        ('percentage', 'Percentage of Salary'),
        ('tiered', 'Tiered (Tax Brackets)'),
        ('formula', 'Custom Formula'),
    ]
    
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    calculation_type = models.CharField(max_length=20, choices=CALCULATION_TYPES, default='fixed')
    default_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    percentage_value = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    formula = models.TextField(blank=True)
    
    is_mandatory = models.BooleanField(default=False)  # Required deduction (e.g., tax)
    is_pre_tax = models.BooleanField(default=False)  # Deducted before tax calculation
    is_active = models.BooleanField(default=True)
    
    # Applicability
    applies_to = models.JSONField(default=list)  # ["all"] or specific departments/roles
    
    tax_code = models.ForeignKey(TaxCode, on_delete=models.SET_NULL, null=True, blank=True, related_name='deductions')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'deductions'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


# ============== TAX BRACKETS ==============

class TaxBracket(models.Model):
    """
    Tax brackets for tiered tax calculation.
    Linked to a TaxCodeVersion for version-specific brackets.
    """
    tax_code_version = models.ForeignKey(TaxCodeVersion, on_delete=models.CASCADE, related_name='tax_brackets')
    
    min_income = models.DecimalField(max_digits=12, decimal_places=2)
    max_income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)  # null = no upper limit
    rate = models.DecimalField(max_digits=5, decimal_places=2)  # Percentage rate
    
    # Optional application rules
    applies_to = models.JSONField(default=list)  # ["all"] or specific groups
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'tax_brackets'
        ordering = ['min_income']
    
    def __str__(self):
        max_str = f"{self.max_income}" if self.max_income else "∞"
        return f"{self.min_income} - {max_str}: {self.rate}%"


# ============== EMPLOYEE ALLOWANCE/DEDUCTION ASSIGNMENTS ==============

class EmployeeAllowance(models.Model):
    """Links an allowance to a specific employee with optional override values."""
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='employee_allowances')
    allowance = models.ForeignKey(Allowance, on_delete=models.CASCADE)
    
    # Override values (if different from default)
    custom_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'employee_allowances'
        unique_together = ['employee', 'allowance']
    
    def __str__(self):
        return f"{self.employee} - {self.allowance.name}"


class EmployeeDeduction(models.Model):
    """Links a deduction to a specific employee with optional override values."""
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='employee_deductions')
    deduction = models.ForeignKey(Deduction, on_delete=models.CASCADE)
    
    # Override values (if different from default)
    custom_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'employee_deductions'
        unique_together = ['employee', 'deduction']
    
    def __str__(self):
        return f"{self.employee} - {self.deduction.name}"


# ===== Employee payroll partition (Payroll app) =====

class EmployeePayrollInfo(models.Model):
    employee = models.OneToOneField('employees.Employee', on_delete=models.CASCADE, related_name='payroll_info')
    status = models.CharField(max_length=50, default='Active')
    salary = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    last_working_date = models.DateField(null=True, blank=True)
    offset = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    one_off = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    bank_account = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'employee_payroll_info'

    def __str__(self):
        return f"PayrollInfo for {self.employee_id}"
