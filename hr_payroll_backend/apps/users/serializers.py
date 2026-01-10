"""
Serializers for User endpoints.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class CurrentUserSerializer(serializers.ModelSerializer):
    """
    Serializer for /users/me/ endpoint.
    Returns user info with groups and employee_id for frontend.
    """
    groups = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )
    employee_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'groups', 'employee_id']
        read_only_fields = fields
    
    def get_employee_id(self, obj):
        """Return the linked employee ID."""
        return obj.employee.id if obj.employee else None


class UserSerializer(serializers.ModelSerializer):
    """
    Basic User serializer for other views.
    """
    groups = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'groups']
        read_only_fields = ['id', 'username', 'groups']
