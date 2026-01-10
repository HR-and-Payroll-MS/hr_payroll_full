from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import TaxCode
from apps.notifications.models import Notification

@receiver(post_save, sender=TaxCode)
def notify_tax_code_change(sender, instance, created, **kwargs):
    """Notify all employees when a tax code is updated."""
    User = get_user_model()
    # Get all active users linked to an employee
    users = User.objects.filter(is_active=True).exclude(employee__isnull=True)
    
    action = "Created" if created else "Updated"
    status_msg = "enabled" if instance.is_active else "disabled"
    title = f"Tax Code Update: {instance.name}"
    
    if created:
        message = f"A new tax code '{instance.name}' has been created."
    else:
        message = f"Tax code '{instance.name}' has been {status_msg}."
        
    notifications = []
    for user in users:
        notifications.append(Notification(
            recipient=user.employee,
            title=title,
            message=message,
            notification_type='announcement',
            link='/policies' # Assuming tax info is visible there or company settings
        ))
    
    Notification.objects.bulk_create(notifications)
