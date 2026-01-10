"""
Serializers for Departments app.
"""
from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for departments."""
    manager_name = serializers.SerializerMethodField()
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'description', 'manager', 'manager_name', 
                  'parent', 'is_active', 'employee_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_manager_name(self, obj):
        return obj.manager.fullname if obj.manager else None
    
    def get_employee_count(self, obj):
        return obj.employees.count()
