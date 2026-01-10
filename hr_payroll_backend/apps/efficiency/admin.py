from django.contrib import admin
from .models import EfficiencyTemplate, EfficiencyEvaluation

@admin.register(EfficiencyTemplate)
class EfficiencyTemplateAdmin(admin.ModelAdmin):
    list_display = ['id', 'is_active', 'created_at', 'updated_at']

@admin.register(EfficiencyEvaluation)
class EfficiencyEvaluationAdmin(admin.ModelAdmin):
    list_display = ['employee', 'evaluator', 'submitted_at']
