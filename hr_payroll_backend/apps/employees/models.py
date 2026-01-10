"""
Employee models for HR & Payroll System.
Matches the frontend data structure with nested general/job/payroll fields.
"""
from django.db import models
from datetime import date


class Employee(models.Model):
    """
    Main Employee model containing all employee information.
    Structured to match frontend's nested data format (general, job, payroll).
    """
    
    # ============== GENERAL INFORMATION ==============
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    marital_status = models.CharField(max_length=50, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    personal_tax_id = models.CharField(max_length=50, blank=True, null=True)
    social_insurance = models.CharField(max_length=50, blank=True, null=True)
    health_care = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    email = models.CharField(max_length=255, blank=True, null=True)
    photo = models.ImageField(upload_to='employees/photos/', null=True, blank=True)
    
    # Address Information
    primary_address = models.TextField(blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    postcode = models.CharField(max_length=20, blank=True, null=True)
    
    # Emergency Contact
    emergency_fullname = models.CharField(max_length=200, blank=True, null=True)
    emergency_phone = models.CharField(max_length=30, blank=True, null=True)
    emergency_relationship = models.CharField(max_length=50, blank=True, null=True)
    emergency_state = models.CharField(max_length=100, blank=True, null=True)
    emergency_city = models.CharField(max_length=100, blank=True, null=True)
    emergency_postcode = models.CharField(max_length=20, blank=True, null=True)
    
    # ============== JOB INFORMATION ==============
    employee_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )
    line_manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='direct_reports'
    )
    employment_type = models.CharField(max_length=50, blank=True, null=True)  # Full-time, Part-time, Contract
    join_date = models.DateField(default=date.today, null=True, blank=True)
    service_years = models.IntegerField(default=0)
    
    # Work Schedule (New Feature)
    work_schedule = models.ForeignKey(
        'attendance.WorkSchedule',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )
    
    # Contract Information
    contract_number = models.CharField(max_length=50, blank=True, null=True)
    contract_name = models.CharField(max_length=100, blank=True, null=True)
    contract_type = models.CharField(max_length=50, blank=True, null=True)
    contract_start_date = models.DateField(null=True, blank=True)
    contract_end_date = models.DateField(null=True, blank=True)
    
    # ============== PAYROLL INFORMATION ==============
    status = models.CharField(max_length=50, default='Active')  # Active, Inactive, Terminated
    salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    last_working_date = models.DateField(null=True, blank=True)
    offset = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    one_off = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    bank_account = models.CharField(max_length=50, blank=True, null=True)
    
    # ============== ORG CHART ==============
    in_org_chart = models.BooleanField(default=False)  # Employee must be explicitly added to org chart
    org_x = models.FloatField(default=0)
    org_y = models.FloatField(default=0)
    
    # ============== METADATA ==============
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'employees'
        ordering = ['first_name', 'last_name']
    
    @property
    def fullname(self):
        """Full name for display purposes."""
        return f"{self.first_name} {self.last_name}".strip()
    
    def save(self, *args, **kwargs):
        """Auto-generate employee_id if not provided."""
        if not self.employee_id:
            # Generate employee ID like EMP001, EMP002, etc.
            last_emp = Employee.objects.order_by('-id').first()
            if last_emp:
                self.employee_id = f"EMP{last_emp.id + 1:04d}"
            else:
                self.employee_id = "EMP0001"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.fullname} ({self.employee_id})"


class EmployeeDocument(models.Model):
    """
    Documents/files associated with an employee.
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='employees/documents/')
    document_type = models.CharField(max_length=50, blank=True, default='General')  # CV, Contract, ID, etc.
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_documents')
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'employee_documents'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.employee.fullname} - {self.name}"
