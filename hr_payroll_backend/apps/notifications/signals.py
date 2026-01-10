from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from config.socket_app import sio

@receiver(post_save, sender=Notification)
def send_notification_socket(sender, instance, created, **kwargs):
    if created:
        room = f"user_{instance.recipient.id}"
        
        try:
             sender_name = instance.sender.fullname if instance.sender else 'System'
        except:
             sender_name = 'System'

        data = {
            'id': instance.id,
            'title': instance.title,
            'message': instance.message,
            'type': instance.notification_type,
            'link': instance.link,
            'sender': sender_name,
            'created_at': instance.created_at.isoformat() if instance.created_at else ""
        }
        
        try:
             # E.g. emit 'new_notification'
             # Frontend: socket.on('new_notification', (data) => ...)
             sio.emit('new_notification', data, room=room)
        except Exception as e:
             # Just log, don't break transaction
             print(f"Socket emit error: {e}")
