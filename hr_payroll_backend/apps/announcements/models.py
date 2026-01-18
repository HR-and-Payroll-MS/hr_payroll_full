"""Announcement models."""
from django.db import models

class Announcement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True, related_name='announcements')
    image = models.ImageField(upload_to='announcements/', null=True, blank=True)
    priority = models.CharField(max_length=20, default='Normal', choices=[('Normal', 'Normal'), ('High', 'High'), ('Urgent', 'Urgent')])
    is_pinned = models.BooleanField(default=False)
    views = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'announcements'
        ordering = ['-is_pinned', '-created_at']
    
    def __str__(self):
        return self.title


class AnnouncementAttachment(models.Model):
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='announcements/attachments/')
    file_type = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'announcement_attachments'
        ordering = ['created_at']

    def __str__(self):
        return f"Attachment for {self.announcement.title}"


class AnnouncementView(models.Model):
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='view_interactions')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'announcement_views'
        unique_together = ('announcement', 'user')
