"""
Serializers for Chat App.
"""
from rest_framework import serializers
from .models import Conversation, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatUserSerializer(serializers.ModelSerializer):
    """Minimal user info for chat."""
    name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'avatar', 'role', 'employee_id']

    def get_name(self, obj):
        if hasattr(obj, 'employee') and obj.employee:
            return obj.employee.fullname
        return obj.email.split('@')[0]

    def get_avatar(self, obj):
        # Return a default or real avatar
        # In a real app, might be obj.employee.profile_picture.url
        if hasattr(obj, 'employee') and obj.employee and obj.employee.photo:
             # Assuming photo is a FileField/ImageField, returning url
             # Need full URL construction if not handled by serializer field automatically
             try:
                url = obj.employee.photo.url
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(url)
                return url
             except:
                pass
        return f"https://ui-avatars.com/api/?name={self.get_name(obj)}&background=random"

    def get_role(self, obj):
        if obj.groups.exists():
            return obj.groups.first().name
        return 'Employee'

    def get_employee_id(self, obj):
        if hasattr(obj, 'employee') and obj.employee:
            return obj.employee.id
        return None

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    reply_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'sender_name', 
            'content', 'attachment', 'attachment_url',
            'message_type', 'reply_to', 'reply_preview', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'sender', 'conversation']

    def get_sender_name(self, obj):
        if hasattr(obj.sender, 'employee') and obj.sender.employee:
            return obj.sender.employee.fullname
        return obj.sender.email

    def get_attachment_url(self, obj):
        if obj.attachment:
            url = obj.attachment.url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_reply_preview(self, obj):
        if obj.reply_to:
            rp = obj.reply_to
            kind = rp.message_type
            text = rp.content or ''
            # Prefer attachment URL to identify media reply
            media = rp.attachment.url if rp.attachment else None
            request = self.context.get('request')
            if request and media:
                media = request.build_absolute_uri(media)
            return {
                'id': rp.id,
                'type': kind,
                'text': text,
                'mediaUrl': media,
                'sender': rp.sender_id,
            }
        return None

class ConversationSerializer(serializers.ModelSerializer):
    """
    Serializer to list conversations with last message.
    """
    last_message = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'updated_at', 'last_message', 'other_participant', 'unread_count']

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            # Pass context for attachment URL
            return MessageSerializer(last_msg, context=self.context).data
        return None

    def get_other_participant(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return None
        
        # Find the participant that is NOT the current user
        other = obj.participants.exclude(id=request.user.id).first()
        if other:
            # Pass context for avatar URL
            return ChatUserSerializer(other, context=self.context).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
