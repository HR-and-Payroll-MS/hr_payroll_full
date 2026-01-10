"""
Views for Notifications app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db import models
from .models import Notification
from .serializers import NotificationSerializer, NotificationCreateSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notifications.
    """
    queryset = Notification.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        sender = request.user.employee if hasattr(request.user, 'employee') else None
        
        recipient_id = data.get('recipient_id')
        receiver_group = data.get('receiver_group')
        receivers = data.get('receivers')
        
        # Resolve 'related_link' from raw data if 'link' is empty
        link = data.get('link') or request.data.get('related_link') or ''
        
        # Determine recipients
        recipients = []
        from apps.employees.models import Employee
        
        if recipient_id:
            try:
                recipients = [Employee.objects.get(id=recipient_id)]
            except (Employee.DoesNotExist, ValueError):
                return Response({"detail": "Recipient not found"}, status=status.HTTP_404_NOT_FOUND)
        
        elif receiver_group:
            # Simple group mapping logic (more flexible matching)
            receiver_group_lower = receiver_group.lower()
            
            if receiver_group_lower == 'my_manager':
                if sender:
                    # Try line manager first
                    if sender.line_manager:
                        recipients = [sender.line_manager]
                    # Fallback to department manager
                    elif sender.department and sender.department.manager:
                        recipients = [sender.department.manager]
            elif receiver_group_lower in ['hr', 'human resources']:
                recipients = Employee.objects.filter(
                    models.Q(department__name__icontains='HR') | 
                    models.Q(department__name__icontains='Human Resources') | 
                    models.Q(position__icontains='HR')
                )
            elif receiver_group_lower == 'it':
                recipients = Employee.objects.filter(
                    models.Q(department__name__icontains='IT') | 
                    models.Q(department__name__icontains='Information Technology')
                )
            elif receiver_group_lower == 'marketing':
                recipients = Employee.objects.filter(department__name__icontains='Marketing')
            elif receiver_group_lower == 'payroll':
                recipients = Employee.objects.filter(
                    models.Q(department__name__icontains='Payroll') | 
                    models.Q(position__icontains='Payroll')
                )
            elif receiver_group_lower in ['management', 'manager']:
                recipients = Employee.objects.filter(position__icontains='Manager')
            elif receiver_group_lower in ['employee', 'all', 'interns']:
                recipients = Employee.objects.all()
            else:
                 # Default: Try to match department name flexibly
                 recipients = Employee.objects.filter(department__name__icontains=receiver_group)
            
            # If still no recipients (and it's a QuerySet), fall back or error
            if isinstance(recipients, models.QuerySet):
                if not recipients.exists():
                     recipients = Employee.objects.all()
            elif not recipients:
                 # It's an empty list
                 recipients = Employee.objects.all()

        elif receivers and 'ALL' in receivers:
            recipients = Employee.objects.all()
            
        if not recipients:
             return Response({"detail": f"No valid recipients found for group: {receiver_group}"}, status=status.HTTP_400_BAD_REQUEST)

        # Create Notifications (using loop to trigger post_save signals for Sockets)
        created_count = 0
        for recipient in recipients:
            if recipient == sender and len(recipients) > 1: 
                continue # Don't notify self in group broadcasts
            
            Notification.objects.create(
                recipient=recipient,
                sender=sender,
                title=data['title'],
                message=data['message'],
                notification_type=data.get('notification_type', 'info'),
                link=link
            )
            created_count += 1

        return Response({"status": "success", "sent_count": created_count}, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        # Deprecated by custom create method above
        pass
    
    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'employee') or not user.employee:
            return Notification.objects.none()
            
        notif_type = self.request.query_params.get('type')
        if notif_type == 'sent':
            return Notification.objects.filter(sender=user.employee)
        return Notification.objects.filter(recipient=user.employee)
    
    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """Mark a notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})


class MarkAllReadView(APIView):
    """
    POST /notifications/mark-all-read/
    Mark all notifications as read for current user.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        if user.employee:
            Notification.objects.filter(recipient=user.employee, is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})
