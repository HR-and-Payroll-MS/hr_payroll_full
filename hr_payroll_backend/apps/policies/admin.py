from django.contrib import admin
from .models import Policy

@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = ['organization_id', 'section', 'version', 'is_active', 'updated_at']
    list_filter = ['is_active', 'section']
