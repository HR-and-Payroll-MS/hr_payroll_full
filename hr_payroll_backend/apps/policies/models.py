"""Policy models."""
from django.db import models


class Policy(models.Model):
    """
    Stores organization policies as JSON content for various sections.
    Tax-related items (allowances, deductions, tax brackets) are managed 
    in the TaxCode model under the payroll app.
    """
    organization_id = models.IntegerField(default=0)
    section = models.CharField(max_length=100)  # leave, attendance, holiday, shift, overtime, disciplinary, jobstructure
    content = models.JSONField(default=dict)
    version = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Link to TaxCode for salary-related policies
    tax_code = models.ForeignKey(
        'payroll.TaxCode',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='policies',
        help_text='Tax code used for salary calculations in this organization'
    )
    
    class Meta:
        db_table = 'policies'
        unique_together = ['organization_id', 'section']
    
    def __str__(self):
        return f"Org {self.organization_id} - {self.section}"
