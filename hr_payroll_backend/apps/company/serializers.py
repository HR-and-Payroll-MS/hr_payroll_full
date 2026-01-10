from rest_framework import serializers
from .models import CompanyInfo

class CompanyInfoSerializer(serializers.ModelSerializer):
    # Map frontend field names to model fields
    countryCode = serializers.CharField(source='country_code', required=False, allow_blank=True)
    bio = serializers.CharField(source='description', required=False, allow_blank=True)
    
    class Meta:
        model = CompanyInfo
        fields = ['id', 'name', 'address', 'phone', 'email', 'logo', 'website', 
                  'tax_id', 'updated_at', 'countryCode', 'bio']
        extra_kwargs = {
            'name': {'required': False, 'allow_blank': True},
            'address': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
            'email': {'required': False, 'allow_blank': True},
            'website': {'required': False, 'allow_blank': True},
            'tax_id': {'required': False, 'allow_blank': True},
        }
