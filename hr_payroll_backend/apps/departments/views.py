"""
Views for Departments app.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Department
from .serializers import DepartmentSerializer


from apps.core.permissions import IsHRManagerOrReadOnly, IsHRManager

class DepartmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing departments.
    """
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsHRManagerOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
            
        if IsHRManager().has_permission(self.request, self):
            return queryset

        # Otherwise, they only see their own department
        if hasattr(user, 'employee') and user.employee.department_id:
            return queryset.filter(id=user.employee.department_id)
            
        return queryset.none()
