"""Company Info model."""
from django.db import models

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
