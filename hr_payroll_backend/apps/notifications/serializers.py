"""
Serializers for Notifications app.
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    unread = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    sender_name = serializers.CharField(source='sender.fullname', read_only=True)
    recipient_name = serializers.CharField(source='recipient.fullname', read_only=True)
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'recipient_name', 'sender', 'sender_name', 'title', 'message', 'link', 'notification_type', 
                  'is_read', 'unread', 'created_at', 'createdAt']
        read_only_fields = ['id', 'created_at', 'createdAt']
    
    def get_unread(self, obj):
        return not obj.is_read


class NotificationCreateSerializer(serializers.ModelSerializer):
    recipient_id = serializers.IntegerField(required=False, write_only=True)
    receiver_group = serializers.CharField(required=False, write_only=True)
    receivers = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)

    class Meta:
        model = Notification
        fields = ['recipient', 'recipient_id', 'receiver_group', 'receivers', 'title', 'message', 'link', 'notification_type']
        extra_kwargs = {'recipient': {'required': False}}
