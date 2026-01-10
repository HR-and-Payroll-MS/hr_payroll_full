from django.contrib import admin
from .models import LeaveRequest, LeaveApproval

class LeaveApprovalInline(admin.TabularInline):
    model = LeaveApproval
    extra = 0

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'days', 'status', 'submitted_at']
    list_filter = ['status', 'leave_type', 'submitted_at']
    search_fields = ['employee__first_name', 'employee__last_name']
    inlines = [LeaveApprovalInline]
