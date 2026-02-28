from django.core.management.base import BaseCommand, CommandError

class Command(BaseCommand):
    help = 'Send a notification from one employee to another via CLI'

    def add_arguments(self, parser):
        parser.add_argument('--sender', type=int, required=False, help='Sender employee id (optional)')
        parser.add_argument('--recipient', type=int, required=True, help='Recipient employee id')
        parser.add_argument('--title', type=str, required=True, help='Notification title')
        parser.add_argument('--message', type=str, required=True, help='Notification message')
        parser.add_argument('--type', dest='notification_type', type=str, default='info', help='Notification type')

    def handle(self, *args, **options):
        from apps.employees.models import Employee
        from apps.notifications.models import Notification

        sender_id = options.get('sender')
        recipient_id = options.get('recipient')
        title = options.get('title')
        message = options.get('message')
        ntype = options.get('notification_type') or 'info'

        try:
            recipient = Employee.objects.get(id=recipient_id)
        except Employee.DoesNotExist:
            raise CommandError(f'Recipient with id={recipient_id} not found')

        sender = None
        if sender_id:
            try:
                sender = Employee.objects.get(id=sender_id)
            except Employee.DoesNotExist:
                raise CommandError(f'Sender with id={sender_id} not found')

        notif = Notification.objects.create(
            recipient=recipient,
            sender=sender,
            title=title,
            message=message,
            notification_type=ntype,
        )

        self.stdout.write(self.style.SUCCESS(f'Notification {notif.id} sent to {recipient.fullname}'))
