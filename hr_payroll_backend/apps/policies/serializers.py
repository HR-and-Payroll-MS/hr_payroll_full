from rest_framework import serializers
from .models import Policy

class PolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = Policy
        fields = ['id', 'organization_id', 'section', 'content', 'version', 'is_active', 'updated_at']
