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
    list_display = ['employee_code', 'fullname', 'email', 'department', 'job_title', 'status']
    list_filter = ['payroll_info__status', 'job_info__department', 'job_info__employment_type', 'general_info__gender']
    search_fields = ['first_name', 'last_name', 'general_info__email', 'job_info__employee_code']
    list_select_related = ['job_info__department', 'payroll_info', 'general_info']
    inlines = [EmployeeDocumentInline]

    fields = (('first_name', 'last_name'), 'photo')

    def employee_code(self, obj):
        ji = getattr(obj, 'job_info', None)
        return getattr(ji, 'employee_code', None) if ji else None
    employee_code.short_description = 'Employee ID'

    def email(self, obj):
        gi = getattr(obj, 'general_info', None)
        return getattr(gi, 'email', None) if gi else None

    def department(self, obj):
        ji = getattr(obj, 'job_info', None)
        dept = getattr(ji, 'department', None) if ji else None
        return dept.name if dept else None

    def job_title(self, obj):
        ji = getattr(obj, 'job_info', None)
        return getattr(ji, 'job_title', None) if ji else None

    def status(self, obj):
        pi = getattr(obj, 'payroll_info', None)
        return getattr(pi, 'status', None) if pi else None


@admin.register(EmployeeDocument)
class EmployeeDocumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'employee', 'document_type', 'uploaded_at']
    list_filter = ['document_type', 'uploaded_at']
    search_fields = ['name', 'employee__first_name', 'employee__last_name']
