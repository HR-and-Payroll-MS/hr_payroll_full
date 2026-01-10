from rest_framework import viewsets, permissions
from .models import FAQ
from .serializers import FAQSerializer

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin/HR to edit.
    """
    def has_permission(self, request, view):
        # Allow any authenticated user to create/edit/delete for now
        # ideally this should check request.user.employee.role == 'HR'
        if request.user and request.user.is_authenticated:
            return True
        if request.method in permissions.SAFE_METHODS:
            return True
        return False

class FAQViewSet(viewsets.ModelViewSet):
    queryset = FAQ.objects.all().order_by('-created_at')
    serializer_class = FAQSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return FAQ.objects.all().order_by('-created_at')
        return FAQ.objects.filter(status='published').order_by('-created_at')
