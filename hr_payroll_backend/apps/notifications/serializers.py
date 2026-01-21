"""
Serializers for Notifications app.
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    unread = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    sender_name = serializers.CharField(source='sender.fullname', read_only=True)
    sender_role = serializers.SerializerMethodField()
    recipient_name = serializers.CharField(source='recipient.fullname', read_only=True)
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'recipient_name', 'sender', 'sender_name', 'sender_role', 'title', 'message', 'link', 'notification_type', 
                  'is_read', 'unread', 'created_at', 'createdAt']
        read_only_fields = ['id', 'created_at', 'createdAt']
    
    def get_unread(self, obj):
        return not obj.is_read

    def get_sender_role(self, obj):
        if obj.sender and hasattr(obj.sender, 'user_account') and obj.sender.user_account:
             groups = obj.sender.user_account.groups.values_list('name', flat=True)
             if 'HR Manager' in groups: return 'HR Manager'
             if 'Manager' in groups: return 'Manager'
             if 'Line Manager' in groups: return 'Line Manager'
             if 'Payroll' in groups: return 'Payroll'
             if 'Employee' in groups: return 'Employee'
             if groups: return list(groups)[0]
        return None


class NotificationCreateSerializer(serializers.ModelSerializer):
    recipient_id = serializers.IntegerField(required=False, write_only=True)
    receiver_group = serializers.CharField(required=False, write_only=True)
    receivers = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)

    class Meta:
        model = Notification
        fields = ['recipient', 'recipient_id', 'receiver_group', 'receivers', 'title', 'message', 'link', 'notification_type']
        extra_kwargs = {'recipient': {'required': False}}
