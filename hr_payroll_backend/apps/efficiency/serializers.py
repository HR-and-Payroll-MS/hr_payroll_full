from rest_framework import serializers
from .models import EfficiencyTemplate, EfficiencyEvaluation

class EfficiencyTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EfficiencyTemplate
        fields = ['id', 'schema', 'is_active', 'created_at', 'updated_at']

class EfficiencyEvaluationSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_photo = serializers.SerializerMethodField()
    employee_email = serializers.SerializerMethodField()
    employee_job_title = serializers.SerializerMethodField()
    
    evaluator_name = serializers.SerializerMethodField()
    evaluator_photo = serializers.SerializerMethodField()
    evaluator_job_title = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    
    data = serializers.JSONField(source='report_data', read_only=True)  # Legacy support for frontend calling it 'data'
    
    class Meta:
        model = EfficiencyEvaluation
        fields = [
            'id', 'employee', 'employee_name', 'employee_photo', 'employee_email', 'employee_job_title',
            'department_name', 'evaluator', 'evaluator_name', 'evaluator_photo', 'evaluator_job_title',
            'template', 'report_data', 'data', 'total_score', 'submitted_at'
        ]
    
    def get_employee_name(self, obj):
        return obj.employee.fullname if obj.employee else None

    def get_employee_photo(self, obj):
        if obj.employee and obj.employee.photo:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.employee.photo.url)
                return obj.employee.photo.url
            except Exception:
                return obj.employee.photo.url
        return None

    def get_employee_email(self, obj):
        return getattr(getattr(obj.employee, 'general_info', None), 'email', None) if obj.employee else None

    def get_employee_job_title(self, obj):
        return getattr(getattr(obj.employee, 'job_info', None), 'job_title', None) if obj.employee else None
    
    def get_department_name(self, obj):
        dept = getattr(getattr(getattr(obj.employee, 'job_info', None), 'department', None), 'name', None) if obj.employee else None
        return dept or 'General'
    
    def get_evaluator_name(self, obj):
        return obj.evaluator.fullname if obj.evaluator else None

    def get_evaluator_photo(self, obj):
        if obj.evaluator and obj.evaluator.photo:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.evaluator.photo.url)
                return obj.evaluator.photo.url
            except Exception:
                return obj.evaluator.photo.url
        return None

    def get_evaluator_job_title(self, obj):
        return getattr(getattr(obj.evaluator, 'job_info', None), 'job_title', None) if obj.evaluator else None
