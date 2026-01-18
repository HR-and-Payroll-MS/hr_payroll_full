from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Announcement, AnnouncementAttachment
from .serializers import AnnouncementSerializer

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @action(detail=True, methods=['post'], url_path='track-view')
    def track_view(self, request, pk=None):
        announcement = self.get_object()
        announcement.views += 1
        announcement.save(update_fields=['views'])
        print(f"DEBUG: track_view hit for announcement {announcement.id}, new views: {announcement.views}")
        return Response({'status': 'view tracked', 'views': announcement.views})

    def destroy(self, request, *args, **kwargs):
        # Only authors or HR managers should be able to delete announcements
        # For simplicity, we'll check if the user has Manager/HR role or is the author
        user = request.user
        instance = self.get_object()
        
        is_hr = False
        if hasattr(user, 'employee') and user.employee:
            ji = getattr(user.employee, 'job_info', None)
            pos = (ji.position or '').lower() if ji else ""
            groups = user.groups.values_list('name', flat=True)
            is_hr = 'hr' in pos or 'human resources' in pos or 'Manager' in groups or 'Admin' in groups
            
        if user.is_staff or is_hr or instance.author == getattr(user, 'employee', None):
            return super().destroy(request, *args, **kwargs)
        
        return Response({'detail': 'You do not have permission to delete this announcement.'}, status=403)

    def perform_create(self, serializer):
        user = self.request.user
        author = user.employee if hasattr(user, 'employee') else None
        announcement = serializer.save(author=author)
        
        # Handle multiple attachments
        attachments = self.request.FILES.getlist('attachments')
        
        # Check if user already provided a main image effectively (via image field? No, we assume null from serializer)
        # We'll use the first image attachment as the main image if main image is empty.
        
        for file in attachments:
            file_type = 'file'
            if file.content_type.startswith('image/'):
                file_type = 'image'
            elif file.content_type.startswith('video/'):
                file_type = 'video'
            elif file.content_type.startswith('audio/'):
                file_type = 'audio'
                
            AnnouncementAttachment.objects.create(
                announcement=announcement,
                file=file,
                file_type=file_type
            )
            
            # Set Cover Image if missing
            if file_type == 'image' and not announcement.image:
                announcement.image.save(file.name, file, save=True)

        # Emit Socket Event manually (to include attachments)
        try:
            from config.socket_app import sio
            author_name = announcement.author.general.fullname if announcement.author and hasattr(announcement.author, 'general') else "HR"
            
            # Serialize attachments for socket
            att_list = []
            request = self.request
            for att in announcement.attachments.all():
                url = att.file.url if att.file else ''
                if url and request:
                    url = request.build_absolute_uri(url)
                    
                att_list.append({
                    'file': url,
                    'file_type': att.file_type
                })
            
            data = {
                'id': announcement.id,
                'title': announcement.title,
                'message': announcement.content, 
                'created_at': announcement.created_at.isoformat(),
                'author': author_name,
                'is_pinned': announcement.is_pinned,
                'attachments': att_list
            }
            sio.emit('new_announcement', data)
            print(f"Socket emit: new_announcement {data['id']} (View)")
        except Exception as e:
            print(f"Socket emit error: {e}")
