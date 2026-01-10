"""Views for Payroll app including TaxCode, Allowance, Deduction management."""
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db import models

from .models import (
    PayrollPeriod, Payslip, PayrollApprovalLog, TaxCode, TaxCodeVersion,
    Allowance, Deduction, TaxBracket, EmployeeAllowance, EmployeeDeduction
)
from .serializers import (
    PayrollPeriodSerializer, PayrollPeriodListSerializer, PayrollPeriodCreateSerializer,
    PayslipSerializer, PayslipUpdateSerializer,
    TaxCodeSerializer, TaxCodeListSerializer, TaxCodeVersionSerializer,
    AllowanceSerializer, AllowanceListSerializer,
    DeductionSerializer, DeductionListSerializer,
    TaxBracketSerializer, EmployeeAllowanceSerializer, EmployeeDeductionSerializer
)
from .services import (
    PayrollCalculationService, submit_payroll, approve_payroll, 
    rollback_payroll, finalize_payroll
)
from apps.core.permissions import IsHRManager, IsPayrollOfficer
from apps.notifications.models import Notification


class PayrollPeriodViewSet(viewsets.ModelViewSet):
    """
    CRUD for payroll periods with workflow actions.
    
    Endpoints:
    - GET /payroll/periods/ - List all payroll periods
    - POST /payroll/periods/ - Create new payroll period
    - GET /payroll/periods/{id}/ - Get payroll period with payslips
    - POST /payroll/periods/{id}/generate/ - Generate payslips
    - POST /payroll/periods/{id}/submit/ - Submit for HR approval
    - POST /payroll/periods/{id}/approve/ - HR approves payroll
    - POST /payroll/periods/{id}/rollback/ - HR rolls back payroll
    - POST /payroll/periods/{id}/finalize/ - HR finalizes payroll
    """
    def get_queryset(self):
        """
        Filter payroll periods based on user role and status.
        Payroll Officers see everything.
        HR Managers only see submitted, approved, and finalized payrolls.
        """
        user = self.request.user
        if not user.is_authenticated:
            return PayrollPeriod.objects.none()

        # Check roles based on actual system group names
        user_groups = [g.name.upper() for g in user.groups.all()]
        is_hr_manager = any(r in user_groups for r in ['HR MANAGER', 'MANAGER', 'ADMIN'])
        is_payroll_officer = 'PAYROLL' in user_groups

        # Superusers see everything
        if user.is_superuser:
            return PayrollPeriod.objects.prefetch_related('payslips', 'approval_logs').all()

        # If user is in HR Manager role but NOT in Payroll role, filter statuses
        if is_hr_manager and not is_payroll_officer:
            return PayrollPeriod.objects.filter(
                status__in=['pending_approval', 'approved', 'finalized', 'rolled_back']
            ).prefetch_related('payslips', 'approval_logs')

        # Payroll Officers see all (to manage drafts/rolls)
        return PayrollPeriod.objects.prefetch_related('payslips', 'approval_logs').all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PayrollPeriodListSerializer
        elif self.action == 'create':
            return PayrollPeriodCreateSerializer
        return PayrollPeriodSerializer
    
    def perform_create(self, serializer):
        """Set created_by to current user's employee."""
        employee = getattr(self.request.user, 'employee', None)
        serializer.save(created_by=employee)
    
    @action(detail=True, methods=['post'], url_path='generate')
    def generate(self, request, pk=None):
        """Generate payslips for this period."""
        period = self.get_object()
        tax_code_id = request.data.get('tax_code_id')
        
        if period.status not in ['draft', 'rolled_back', 'generated']:
            return Response(
                {'error': f"Cannot generate payroll in '{period.status}' status. Must be 'draft', 'rolled_back', or 'generated'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        employee = getattr(request.user, 'employee', None)
        
        try:
            service = PayrollCalculationService(period, performed_by=employee, tax_code_id=tax_code_id)
            payslips = service.generate_payroll()
            
            return Response({
                'message': f'Generated {len(payslips)} payslips for {period.month} {period.year}',
                'period': PayrollPeriodSerializer(period).data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        """Submit payroll for HR Manager approval."""
        period = self.get_object()
        employee = getattr(request.user, 'employee', None)
        notes = request.data.get('notes', '')
        
        try:
            period = submit_payroll(period, submitted_by=employee, notes=notes)
            
            # Notify HR Managers
            self._notify_hr_managers(period, 'Payroll Submitted for Approval',
                f'Payroll for {period.month} {period.year} has been submitted for your review.')
            
            return Response({
                'message': f'Payroll submitted for HR approval',
                'period': PayrollPeriodSerializer(period).data
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """HR Manager approves the payroll."""
        period = self.get_object()
        employee = getattr(request.user, 'employee', None)
        notes = request.data.get('notes', '')
        
        # Check if user is HR Manager
        if not request.user.groups.filter(name='HR Manager').exists():
            return Response(
                {'error': 'Only HR Managers can approve payroll'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            period = approve_payroll(period, approved_by=employee, notes=notes)
            
            # Notify payroll officer
            if period.submitted_by:
                Notification.objects.create(
                    recipient=period.submitted_by,
                    title=f'Payroll Approved - {period.month} {period.year}',
                    message=f'The payroll you submitted has been approved. You can now finalize it.',
                    notification_type='payroll',
                    link=f'/payroll/{period.id}'
                )
            
            return Response({
                'message': f'Payroll approved',
                'period': PayrollPeriodSerializer(period).data
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='rollback')
    def rollback(self, request, pk=None):
        """HR Manager rolls back payroll to Payroll Officer for corrections."""
        period = self.get_object()
        employee = getattr(request.user, 'employee', None)
        reason = request.data.get('reason', '')
        
        if not reason:
            return Response(
                {'error': 'Reason is required for rollback'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is HR Manager
        if not request.user.groups.filter(name='HR Manager').exists():
            return Response(
                {'error': 'Only HR Managers can rollback payroll'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            period = rollback_payroll(period, rolled_back_by=employee, reason=reason)
            
            # Notify payroll officer
            if period.submitted_by:
                Notification.objects.create(
                    recipient=period.submitted_by,
                    title=f'Payroll Rolled Back - {period.month} {period.year}',
                    message=f'The payroll has been rolled back for corrections. Reason: {reason}',
                    notification_type='payroll',
                    link=f'/payroll/{period.id}'
                )
            
            return Response({
                'message': f'Payroll rolled back',
                'period': PayrollPeriodSerializer(period).data
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='finalize')
    def finalize(self, request, pk=None):
        """HR Manager finalizes payroll and sends notifications to all employees."""
        period = self.get_object()
        employee = getattr(request.user, 'employee', None)
        
        # Check if user is HR Manager
        if not request.user.groups.filter(name='HR Manager').exists():
            return Response(
                {'error': 'Only HR Managers can finalize payroll'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            period = finalize_payroll(period, finalized_by=employee)
            
            return Response({
                'message': f'Payroll finalized. Notifications sent to {period.payslips.count()} employees.',
                'period': PayrollPeriodSerializer(period).data
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def _notify_hr_managers(self, period, title, message):
        """Send notification to all HR Managers."""
        from apps.employees.models import Employee
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        hr_users = User.objects.filter(groups__name='HR Manager')
        for user in hr_users:
            if user.employee:
                Notification.objects.create(
                    recipient=user.employee,
                    title=title,
                    message=message,
                    notification_type='payroll',
                    link=f'/payroll/{period.id}'
                )


class PayslipViewSet(viewsets.ModelViewSet):
    """
    ViewSet for individual payslips.
    
    - GET /payroll/payslips/ - List payslips (filtered by period, employee)
    - GET /payroll/payslips/{id}/ - Get single payslip
    - PATCH /payroll/payslips/{id}/ - Update payslip (Payroll Officer only)
    - POST /payroll/payslips/{id}/contact/ - Send message to employee about issues
    """
    queryset = Payslip.objects.select_related('employee', 'period', 'tax_code', 'tax_code_version').all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return PayslipUpdateSerializer
        return PayslipSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by period
        period = self.request.query_params.get('period')
        if period:
            queryset = queryset.filter(period_id=period)
        
        # Filter by employee (for employee's own payslips)
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        
        # If regular employee, only show their own payslips
        user = self.request.user
        if not user.groups.filter(name__in=['HR Manager', 'Payroll Officer']).exists():
            if hasattr(user, 'employee') and user.employee:
                queryset = queryset.filter(employee=user.employee)
        
        return queryset
    
    @action(detail=True, methods=['post'], url_path='contact')
    def contact(self, request, pk=None):
        """Send a message to the employee about payslip issues."""
        payslip = self.get_object()
        message_text = request.data.get('message', '')
        
        if not message_text:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sender = getattr(request.user, 'employee', None)
        
        # Create notification for employee
        Notification.objects.create(
            recipient=payslip.employee,
            sender=sender,
            title=f'Payroll Query - {payslip.period.month} {payslip.period.year}',
            message=message_text,
            notification_type='payroll',
            link=f'/my-payslips/{payslip.id}'
        )
        
        # Mark payslip as having issues
        payslip.has_issues = True
        payslip.issue_notes = message_text
        payslip.save()
        
        return Response({
            'message': f'Notification sent to {payslip.employee.fullname}',
            'payslip': PayslipSerializer(payslip).data
        })


class MyPayslipsView(APIView):
    """GET /payroll/my-payslips/ - Get current employee's payslips."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        employee = getattr(request.user, 'employee', None)
        if not employee:
            return Response({'error': 'No employee profile linked'}, status=status.HTTP_404_NOT_FOUND)
        
        # Only show finalized payslips to employees
        payslips = Payslip.objects.filter(
            employee=employee,
            period__status='finalized'
        ).select_related('period', 'tax_code', 'tax_code_version').order_by('-period__year', '-period__month')
        
        return Response({
            'results': PayslipSerializer(payslips, many=True).data
        })


class PayrollReportsView(APIView):
    """GET /payroll/reports/ - Get payroll reports with filtering."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        
        queryset = Payslip.objects.select_related('employee', 'period', 'tax_code').all()
        if month and year:
            queryset = queryset.filter(period__month=month, period__year=year)
        
        return Response({'results': PayslipSerializer(queryset, many=True).data})




# ============== TAX CODE VIEWS ==============

class TaxCodeViewSet(viewsets.ModelViewSet):
    """
    CRUD for Tax Codes.
    
    Endpoints:
    - GET /payroll/tax-codes/ - List all tax codes
    - POST /payroll/tax-codes/ - Create new tax code
    - GET /payroll/tax-codes/{id}/ - Get tax code details
    - PUT /payroll/tax-codes/{id}/ - Update tax code
    - DELETE /payroll/tax-codes/{id}/ - Delete tax code
    """
    queryset = TaxCode.objects.prefetch_related('versions', 'allowances', 'deductions').all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TaxCodeListSerializer
        return TaxCodeSerializer
    
    @action(detail=True, methods=['post'], url_path='add-version')
    def add_version(self, request, pk=None):
        """Add a new version to a tax code."""
        tax_code = self.get_object()
        serializer = TaxCodeVersionSerializer(data={**request.data, 'tax_code': tax_code.id})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaxCodeVersionViewSet(viewsets.ModelViewSet):
    """CRUD for Tax Code versions."""
    queryset = TaxCodeVersion.objects.prefetch_related('tax_brackets').all()
    serializer_class = TaxCodeVersionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        tax_code = self.request.query_params.get('tax_code')
        if tax_code:
            queryset = queryset.filter(tax_code_id=tax_code)
        return queryset


class TaxBracketViewSet(viewsets.ModelViewSet):
    """CRUD for Tax Brackets."""
    queryset = TaxBracket.objects.all()
    serializer_class = TaxBracketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        version = self.request.query_params.get('version')
        if version:
            queryset = queryset.filter(tax_code_version_id=version)
        return queryset


# ============== ALLOWANCE VIEWS ==============

class AllowanceViewSet(viewsets.ModelViewSet):
    """
    CRUD for Allowances.
    
    Endpoints:
    - GET /payroll/allowances/ - List all allowances
    - POST /payroll/allowances/ - Create new allowance
    - GET /payroll/allowances/{id}/ - Get allowance details
    - PUT /payroll/allowances/{id}/ - Update allowance
    - DELETE /payroll/allowances/{id}/ - Delete allowance
    """
    queryset = Allowance.objects.select_related('tax_code').all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AllowanceListSerializer
        return AllowanceSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by active status
        active = self.request.query_params.get('active')
        if active is not None:
            queryset = queryset.filter(is_active=(active.lower() == 'true'))
        # Filter by tax code
        tax_code = self.request.query_params.get('tax_code')
        if tax_code:
            queryset = queryset.filter(tax_code_id=tax_code)
        return queryset


# ============== DEDUCTION VIEWS ==============

class DeductionViewSet(viewsets.ModelViewSet):
    """
    CRUD for Deductions.
    
    Endpoints:
    - GET /payroll/deductions/ - List all deductions
    - POST /payroll/deductions/ - Create new deduction
    - GET /payroll/deductions/{id}/ - Get deduction details
    - PUT /payroll/deductions/{id}/ - Update deduction
    - DELETE /payroll/deductions/{id}/ - Delete deduction
    """
    queryset = Deduction.objects.select_related('tax_code').all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DeductionListSerializer
        return DeductionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by active status
        active = self.request.query_params.get('active')
        if active is not None:
            queryset = queryset.filter(is_active=(active.lower() == 'true'))
        # Filter by mandatory
        mandatory = self.request.query_params.get('mandatory')
        if mandatory is not None:
            queryset = queryset.filter(is_mandatory=(mandatory.lower() == 'true'))
        # Filter by tax code
        tax_code = self.request.query_params.get('tax_code')
        if tax_code:
            queryset = queryset.filter(tax_code_id=tax_code)
        return queryset


# ============== EMPLOYEE ASSIGNMENT VIEWS ==============

class EmployeeAllowanceViewSet(viewsets.ModelViewSet):
    """CRUD for employee allowance assignments."""
    queryset = EmployeeAllowance.objects.select_related('employee', 'allowance').all()
    serializer_class = EmployeeAllowanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        employee = self.request.query_params.get('employee')
        if employee:
            queryset = queryset.filter(employee_id=employee)
        return queryset


class EmployeeDeductionViewSet(viewsets.ModelViewSet):
    """CRUD for employee deduction assignments."""
    queryset = EmployeeDeduction.objects.select_related('employee', 'deduction').all()
    serializer_class = EmployeeDeductionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        employee = self.request.query_params.get('employee')
        if employee:
            queryset = queryset.filter(employee_id=employee)
        return queryset
