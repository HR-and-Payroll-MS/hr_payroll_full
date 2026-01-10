from rest_framework import serializers
from .models import Announcement, AnnouncementAttachment

class AnnouncementAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnouncementAttachment
        fields = ['id', 'file', 'file_type', 'created_at']

class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    attachments = AnnouncementAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'priority', 'author', 'author_name', 'image', 'is_pinned', 'views', 'created_at', 'updated_at', 'attachments']
        read_only_fields = ['id', 'author', 'views', 'created_at', 'updated_at']
    
    def get_author_name(self, obj):
        return obj.author.fullname if obj.author else None
