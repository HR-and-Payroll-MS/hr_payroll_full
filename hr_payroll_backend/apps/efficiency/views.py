from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.utils import timezone
from apps.core.permissions import IsHRManager
from apps.employees.models import Employee
from .models import EfficiencyTemplate, EfficiencyEvaluation
from .serializers import EfficiencyTemplateSerializer, EfficiencyEvaluationSerializer

class TemplateSchemaView(APIView):
    """GET /efficiency/templates/schema/"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        template = EfficiencyTemplate.objects.filter(is_active=True).first()
        if template:
            return Response(template.schema)
        return Response({})

class TemplateSchemaSetView(APIView):
    """PUT /efficiency/templates/schema-set/"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        template, created = EfficiencyTemplate.objects.get_or_create(
            is_active=True,
            defaults={'schema': request.data}
        )
        if not created:
            template.schema = request.data
            template.save()
        return Response(EfficiencyTemplateSerializer(template).data)

class EvaluationSubmitView(APIView):
    """POST /efficiency/evaluations/submit/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        employee_id = data.get('employee_id')
        
        # Get Template ID or default to active
        template_id = data.get('template_id')
        if not template_id:
             active_template = EfficiencyTemplate.objects.filter(is_active=True).first()
             template_id = active_template.id if active_template else None
        
        # Submitter role check
        user = request.user
        if not IsHRManager().has_permission(request, self):
            user_groups = [g.name.upper() for g in user.groups.all()]
            is_line_manager = 'LINE MANAGER' in user_groups or 'DEPARTMENT MANAGER' in user_groups
            if is_line_manager:
                target_emp = Employee.objects.get(id=employee_id)
                if target_emp.department_id != user.employee.department_id:
                    return Response({"error": "You can only submit evaluations for your own department"}, status=403)
            else:
                return Response({"error": "You don't have permission to submit evaluations"}, status=403)

        # Prevent duplicates
        evaluation, created = EfficiencyEvaluation.objects.update_or_create(
            employee_id=employee_id,
            template_id=template_id,
            defaults={
                'evaluator_id': request.user.employee.id if hasattr(request.user, 'employee') else None,
                'report_data': data, 
                'total_score': data.get('totalEfficiency', 0.0),
                'submitted_at': timezone.now()
            }
        )
        
        serializer = EfficiencyEvaluationSerializer(evaluation)
        msg = "Efficiency evaluation submitted successfully" if created else "Efficiency evaluation updated successfully"
        return Response({"message": msg, "data": serializer.data}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class EfficiencyEvaluationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EfficiencyEvaluation.objects.all().select_related('employee', 'evaluator', 'template', 'employee__department')
    serializer_class = EfficiencyEvaluationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
            
        if IsHRManager().has_permission(self.request, self):
            return queryset
            
        user_groups = [g.name.upper() for g in user.groups.all()]
        is_line_manager = 'LINE MANAGER' in user_groups or 'DEPARTMENT MANAGER' in user_groups
        
        if is_line_manager and hasattr(user, 'employee'):
            # Only see evaluations for their department
            if user.employee.department_id:
                return queryset.filter(employee__department_id=user.employee.department_id)
            return queryset.none()
            
        # Regular employees see only their own
        if hasattr(user, 'employee'):
            return queryset.filter(employee=user.employee)
            
        return queryset.none()
    
    @action(detail=False, methods=['get'])
    def my_evaluations(self, request):
        """
        Return evaluations where the employee is the logged-in user's employee profile.
        """
        if not hasattr(request.user, 'employee'):
            return Response({"error": "User is not an employee"}, status=400)
            
        evals = self.get_queryset().filter(employee=request.user.employee) 
        # Note: get_queryset() might filter out own evaluation if manager is not in their own department (unlikely but possible)
        # So for 'my_evaluations' we might want direct access, but usually manager IS in the department.
        # Safe to use get_queryset() logic or just filter base queryset if logic conflicts.
        # Given "my_evaluations" is personal, maybe we relax the role filter?
        # Actually, if I am a manager, I should see MY evaluations too. 
        # The role filter restricts to "Employees in my department". If I am in my department, I see mine. Correct.
        serializer = self.get_serializer(evals, many=True)
        return Response(serializer.data)

