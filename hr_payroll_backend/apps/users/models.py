"""
Custom User model for HR & Payroll System.
"""
from django.contrib.auth.models import AbstractUser, Group
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Links to Employee model for HR-specific data.
    """
    employee = models.OneToOneField(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_account'
    )
    email = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    @property
    def employee_id(self):
        """Return employee ID for frontend compatibility."""
        return self.employee.id if self.employee else None
    
    def __str__(self):
        return self.username

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.otp}"


# ===== Employee profile partitions (Users app) =====

class EmployeeGeneralInfo(models.Model):
    employee = models.OneToOneField('employees.Employee', on_delete=models.CASCADE, related_name='general_info')
    gender = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    marital_status = models.CharField(max_length=50, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    personal_tax_id = models.CharField(max_length=50, blank=True, null=True)
    social_insurance = models.CharField(max_length=50, blank=True, null=True)
    health_care = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    email = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'employee_general_info'

    def __str__(self):
        return f"GeneralInfo for {self.employee_id}"


class EmployeeAddressInfo(models.Model):
    employee = models.OneToOneField('employees.Employee', on_delete=models.CASCADE, related_name='address_info')
    primary_address = models.TextField(blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    postcode = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'employee_address_info'

    def __str__(self):
        return f"AddressInfo for {self.employee_id}"


class EmployeeEmergencyInfo(models.Model):
    employee = models.OneToOneField('employees.Employee', on_delete=models.CASCADE, related_name='emergency_info')
    fullname = models.CharField(max_length=200, blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    relationship = models.CharField(max_length=50, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    postcode = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'employee_emergency_info'

    def __str__(self):
        return f"EmergencyInfo for {self.employee_id}"
