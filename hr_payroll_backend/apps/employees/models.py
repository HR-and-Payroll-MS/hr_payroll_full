"""
Employee core model for HR & Payroll System.
Partitioned data lives in respective apps: users (profile/address/emergency),
company (job/contract/org), payroll (payroll info), attendance (work schedule link).
"""
from django.db import models
from datetime import date


class Employee(models.Model):
    """Core Employee identity. All detailed info is partitioned in other apps."""
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    photo = models.ImageField(upload_to='employees/photos/', null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'employees'
        ordering = ['first_name', 'last_name']
    
    @property
    def fullname(self):
        """Full name for display purposes."""
        return f"{self.first_name} {self.last_name}".strip()
    
    def __str__(self):
        # Prefer job code if available
        try:
            from apps.company.models import EmployeeJobInfo
            job = EmployeeJobInfo.objects.filter(employee=self).first()
            code = job.employee_code if job and job.employee_code else 'EMP'
            return f"{self.fullname} ({code})"
        except Exception:
            return self.fullname


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
