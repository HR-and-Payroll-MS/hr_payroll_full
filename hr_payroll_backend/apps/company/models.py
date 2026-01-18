"""Company Info model."""
from django.db import models
from datetime import date

class CompanyInfo(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    country_code = models.CharField(max_length=10, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    description = models.TextField(blank=True)  # "Bio" from frontend
    logo = models.ImageField(upload_to='company/', null=True, blank=True)
    website = models.URLField(blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'company_info'
        verbose_name_plural = 'Company Info'
    
    def __str__(self):
        return self.name


# ===== Employee job and org partitions (Company app) =====

class EmployeeJobInfo(models.Model):
    employee = models.OneToOneField('employees.Employee', on_delete=models.CASCADE, related_name='job_info')
    employee_code = models.CharField(max_length=50, blank=True, null=True)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    department = models.ForeignKey('departments.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='job_infos')
    line_manager = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_job_infos')
    employment_type = models.CharField(max_length=50, blank=True, null=True)
    join_date = models.DateField(default=date.today, null=True, blank=True)
    service_years = models.IntegerField(default=0)

    class Meta:
        db_table = 'employee_job_info'

    def __str__(self):
        return f"JobInfo for {self.employee_id}"


class EmployeeContractInfo(models.Model):
    employee = models.OneToOneField('employees.Employee', on_delete=models.CASCADE, related_name='contract_info')
    contract_number = models.CharField(max_length=50, blank=True, null=True)
    contract_name = models.CharField(max_length=100, blank=True, null=True)
    contract_type = models.CharField(max_length=50, blank=True, null=True)
    contract_start_date = models.DateField(null=True, blank=True)
    contract_end_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'employee_contract_info'

    def __str__(self):
        return f"ContractInfo for {self.employee_id}"


class CompanyOrgNode(models.Model):
    employee = models.OneToOneField('employees.Employee', on_delete=models.CASCADE, related_name='org_node')
    in_org_chart = models.BooleanField(default=False)
    org_x = models.FloatField(default=0)
    org_y = models.FloatField(default=0)

    class Meta:
        db_table = 'company_org_nodes'

    def __str__(self):
        return f"OrgNode for {self.employee_id}"
