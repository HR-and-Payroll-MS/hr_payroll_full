"""
Admin configuration for Employees app.
"""
from django.contrib import admin
from .models import Employee, EmployeeDocument


class EmployeeDocumentInline(admin.TabularInline):
    model = EmployeeDocument
    fk_name = 'employee'
    extra = 0


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'fullname', 'get_email', 'department', 'job_title', 'status']
    list_filter = ['status', 'department', 'employment_type', 'gender']
    search_fields = ['first_name', 'last_name', 'user_account__email', 'employee_id']
    list_select_related = ['department']
    inlines = [EmployeeDocumentInline]
    
    fieldsets = (
        ('General Information', {
            'fields': (
                ('first_name', 'last_name'),
                ('gender', 'date_of_birth', 'marital_status'),
                ('nationality', 'personal_tax_id'),
                ('phone',),
                'photo',
            )
        }),
        ('Address', {
            'fields': (
                'primary_address',
                ('country', 'state'),
                ('city', 'postcode'),
            )
        }),
        ('Emergency Contact', {
            'fields': (
                ('emergency_fullname', 'emergency_phone'),
                ('emergency_state', 'emergency_city', 'emergency_postcode'),
            ),
            'classes': ('collapse',)
        }),
        ('Job Information', {
            'fields': (
                'employee_id',
                ('job_title', 'position'),
                ('department', 'line_manager'),
                ('employment_type', 'join_date', 'service_years'),
            )
        }),
        ('Contract', {
            'fields': (
                ('contract_number', 'contract_name', 'contract_type'),
                ('contract_start_date', 'contract_end_date'),
            ),
            'classes': ('collapse',)
        }),
        ('Payroll', {
            'fields': (
                ('status', 'salary'),
                ('offset', 'one_off'),
                'last_working_date',
                ('bank_name', 'bank_account'),
            )
        }),
    )

    def get_email(self, obj):
        try:
            return obj.user_account.email if obj.user_account else None
        except Exception:
            return None
    get_email.short_description = 'Email'


@admin.register(EmployeeDocument)
class EmployeeDocumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'employee', 'document_type', 'uploaded_at']
    list_filter = ['document_type', 'uploaded_at']
    search_fields = ['name', 'employee__first_name', 'employee__last_name']
