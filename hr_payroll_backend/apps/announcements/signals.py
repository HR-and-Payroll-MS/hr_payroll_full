from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Announcement
from config.socket_app import sio

@receiver(post_save, sender=Announcement)
def send_announcement_socket(sender, instance, created, **kwargs):
    # Creation is handled in View to await attachments
    if created:
        return

    try:
        author_name = instance.author.general.fullname if instance.author and hasattr(instance.author, 'general') else "HR"
    except:
        author_name = "HR"

        data = {
            'id': instance.id,
            'title': instance.title,
            'message': instance.content, 
            'created_at': instance.created_at.isoformat(),
            'author': author_name,
            'is_pinned': instance.is_pinned,
            # 'image': instance.image.url if instance.image else None # Add if needed, handle domain
        }
        try:
            sio.emit('new_announcement', data)
            print(f"Socket emit: new_announcement {data['id']}")
        except Exception as e:
            print(f"Socket emit error: {e}")

@receiver(post_delete, sender=Announcement)
def delete_announcement_socket(sender, instance, **kwargs):
    try:
        sio.emit('delete_announcement', instance.id)
        print(f"Socket emit: delete_announcement {instance.id}")
    except Exception as e:
        print(f"Socket emit error: {e}")
