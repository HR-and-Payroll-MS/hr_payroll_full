"""
Serializers for Leaves app.
"""
from rest_framework import serializers
from .models import LeaveRequest, LeaveApproval
from apps.employees.models import Employee


class LeaveApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveApproval
        fields = ['step', 'role', 'approver', 'approver_name', 'status', 'comment', 'decided_at']
    
    def get_approver_name(self, obj):
        return obj.approver.fullname if obj.approver else None


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    approval_chain = LeaveApprovalSerializer(many=True, read_only=True)
    # Expose single attachment as a list of attachments for frontend compatibility
    attachments = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_name', 'leave_type', 'start_date', 'end_date',
            'days', 'reason', 'status', 'attachment', 'attachments', 'submitted_at', 'approval_chain'
        ]
        read_only_fields = ['id', 'submitted_at']
    
    def get_employee_name(self, obj):
        return obj.employee.fullname

    def get_attachments(self, obj):
        if obj.attachment:
            return [{
                'file': obj.attachment.url,
                'name': obj.attachment.name.split('/')[-1] if obj.attachment.name else 'Attachment',
                'type': 'file'
            }]
        return []


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
