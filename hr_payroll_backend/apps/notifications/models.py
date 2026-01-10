"""
Notification models for HR & Payroll System.
"""
from django.db import models


class Notification(models.Model):
    """
    Notification for an employee.
    """
    TYPE_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('success', 'Success'),
        ('error', 'Error'),
        ('message', 'Message'),
        ('request', 'Request'),
        ('system', 'System'),
        ('leave', 'Leave'),
        ('promotion', 'Promotion'),
        ('policy', 'Policy'),
        ('hr', 'HR'),
        ('attendance', 'Attendance'),
        ('payroll', 'Payroll'),
    ]
    
    recipient = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    sender = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True, null=True, help_text="Frontend route to navigate to")
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='info')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.recipient.fullname} - {self.title}"
