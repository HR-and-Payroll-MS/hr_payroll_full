"""Efficiency/Performance models."""
from django.db import models

class EfficiencyTemplate(models.Model):
    schema = models.JSONField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'efficiency_templates'

class EfficiencyEvaluation(models.Model):
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='evaluations')
    evaluator = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True, related_name='evaluations_given')
    template = models.ForeignKey(EfficiencyTemplate, on_delete=models.SET_NULL, null=True)
    report_data = models.JSONField(default=dict)
    total_score = models.FloatField(default=0.0)
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'efficiency_evaluations'
        ordering = ['-submitted_at']
