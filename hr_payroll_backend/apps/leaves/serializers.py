"""
Serializers for Leaves app.
"""
from rest_framework import serializers
from .models import LeaveRequest, LeaveApproval
from apps.employees.models import Employee
from django.utils.html import strip_tags
from django.conf import settings


class LeaveApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveApproval
        fields = ['step', 'role', 'approver', 'approver_name', 'status', 'comment', 'decided_at']
    
    def get_approver_name(self, obj):
        return obj.approver.fullname if obj.approver else None


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_info = serializers.SerializerMethodField()
    approval_chain = LeaveApprovalSerializer(many=True, read_only=True)
    # Expose single attachment as a list of attachments for frontend compatibility
    attachments = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_name', 'leave_type', 'start_date', 'end_date',
            'days', 'reason', 'status', 'attachment', 'attachments', 'submitted_at', 'approval_chain', 'employee_info'
        ]
        read_only_fields = ['id', 'submitted_at']
    
    def get_employee_name(self, obj):
        return obj.employee.fullname

    def get_employee_info(self, obj):
        emp = obj.employee
        if not emp:
            return None

        # build photo URL
        photo = None
        if emp.photo:
            try:
                photo = emp.photo.url
            except Exception:
                # fallback: construct from MEDIA_URL
                photo = f"{getattr(settings, 'MEDIA_URL', '/media/')}" + str(emp.photo)

        return {
            'id': emp.id,
            # fallback order: fullname, employee_id, email, default label
            'fullname': emp.fullname or emp.employee_id or getattr(emp, 'email', None) or 'Unknown Employee',
            'photo': photo,
            'department': emp.department.name if emp.department else 'N/A',
            'position': emp.position or emp.job_title or 'N/A',
        }

    def get_attachments(self, obj):
        if obj.attachment:
            return [{
                'file': obj.attachment.url,
                'name': obj.attachment.name.split('/')[-1] if obj.attachment.name else 'Attachment',
                'type': 'file'
            }]
        return []

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure reason is plain text (strip HTML tags)
        reason = data.get('reason')
        if reason:
            data['reason'] = strip_tags(reason)
        return data


class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), 
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = LeaveRequest
        fields = ['id', 'employee', 'leave_type', 'start_date', 'end_date', 'days', 'reason', 'attachment']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        leave_request = super().create(validated_data)
        
        # Create default approval chain
        LeaveApproval.objects.create(
            leave_request=leave_request,
            step=1,
            role='Manager',
            status='pending'
        )
        LeaveApproval.objects.create(
            leave_request=leave_request,
            step=2,
            role='HR',
            status='pending'
        )
        
        return leave_request
