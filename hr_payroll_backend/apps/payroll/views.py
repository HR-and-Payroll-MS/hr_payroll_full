"""Views for Payroll app including TaxCode, Allowance, Deduction management."""
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db import models
from decimal import Decimal

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

        # Base queryset by role
        qs = PayrollPeriod.objects.prefetch_related('payslips', 'approval_logs').all()

        user_groups = [g.name.upper() for g in user.groups.all()]
        is_hr_manager = any(r in user_groups for r in ['MANAGER', 'ADMIN'])
        is_payroll_officer = 'PAYROLL' in user_groups

        if user.is_superuser:
            pass  # keep full queryset
        elif is_hr_manager and not is_payroll_officer:
            qs = qs.filter(status__in=['pending_approval', 'approved', 'finalized', 'rolled_back'])
        else:
            pass  # Payroll Officer: keep full queryset

        # Apply server-side filters: month/year
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month:
            qs = qs.filter(month=month)
        if year:
            try:
                qs = qs.filter(year=int(year))
            except ValueError:
                pass

        return qs
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

    def create(self, request, *args, **kwargs):
        """Override create to return the full PayrollPeriodSerializer (including id).

        The default create uses the 'create' serializer class which only exposes
        month/year for validation; returning the full serializer ensures the
        frontend receives the new period id immediately.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee = getattr(request.user, 'employee', None)
        instance = serializer.save(created_by=employee)
        out = PayrollPeriodSerializer(instance, context={'request': request})
        headers = self.get_success_headers(out.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['post'], url_path='generate')
    def generate(self, request, pk=None):
        """Generate payslips for this period."""
        period = self.get_object()
        tax_code_id = request.data.get('tax_code_id')
        tax_code_version_id = request.data.get('tax_code_version_id')
        
        if period.status not in ['draft', 'rolled_back', 'generated']:
            return Response(
                {'error': f"Cannot generate payroll in '{period.status}' status. Must be 'draft', 'rolled_back', or 'generated'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        employee = getattr(request.user, 'employee', None)
        
        try:
            service = PayrollCalculationService(period, performed_by=employee, tax_code_id=tax_code_id, tax_code_version_id=tax_code_version_id)
            payslips = service.generate_payroll()
            
            return Response({
                'message': f'Generated {len(payslips)} payslips for {period.month} {period.year}',
                'period': PayrollPeriodSerializer(period, context={'request': request}).data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        """Submit payroll for Manager approval."""
        period = self.get_object()
        employee = getattr(request.user, 'employee', None)
        notes = request.data.get('notes', '')
        
        try:
            period = submit_payroll(period, submitted_by=employee, notes=notes)
            
            # Notify Managers
            self._notify_hr_managers(period, 'Payroll Submitted for Approval',
                f'Payroll for {period.month} {period.year} has been submitted for your review.')
            
            return Response({
                'message': f'Payroll submitted for HR approval',
                'period': PayrollPeriodSerializer(period, context={'request': request}).data
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """Manager approves the payroll."""
        period = self.get_object()
        employee = getattr(request.user, 'employee', None)
        notes = request.data.get('notes', '')
        
        # Check if user is Manager
        if not request.user.groups.filter(name='Manager').exists():
            return Response(
                {'error': 'Only Managers can approve payroll'},
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
                'period': PayrollPeriodSerializer(period, context={'request': request}).data
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='rollback')
    def rollback(self, request, pk=None):
        """Manager rolls back payroll to Payroll Officer for corrections."""
        period = self.get_object()
        employee = getattr(request.user, 'employee', None)
        reason = request.data.get('reason', '')
        
        if not reason:
            return Response(
                {'error': 'Reason is required for rollback'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is Manager
        if not request.user.groups.filter(name='Manager').exists():
            return Response(
                {'error': 'Only Managers can rollback payroll'},
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
                'period': PayrollPeriodSerializer(period, context={'request': request}).data
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='finalize')
    def finalize(self, request, pk=None):
        """Manager finalizes payroll and sends notifications to all employees."""
        period = self.get_object()
        employee = getattr(request.user, 'employee', None)
        
        # Allow finalize by Managers or Payroll Officers (or the Payroll Officer who submitted)
        is_manager = request.user.groups.filter(name__iexact='Manager').exists()
        is_payroll = request.user.groups.filter(name__icontains='payroll').exists()
        is_submitter = hasattr(request.user, 'employee') and period.submitted_by and (request.user.employee == period.submitted_by)

        if not (is_manager or is_payroll or is_submitter):
            return Response(
                {'error': 'Only Managers or Payroll Officers may finalize payroll'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            period = finalize_payroll(period, finalized_by=employee)
            
            return Response({
                'message': f'Payroll finalized. Notifications sent to {period.payslips.count()} employees.',
                'period': PayrollPeriodSerializer(period, context={'request': request}).data
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='reopen')
    def reopen(self, request, pk=None):
        """Reopen a generated or rolled back payroll period to 'draft' for editing (Payroll Officer)."""
        period = self.get_object()

        user = request.user
        is_payroll_officer = (
            user.is_superuser
            or user.groups.filter(name__iexact='Payroll Officer').exists()
            or user.groups.filter(name__icontains='PAYROLL').exists()
        )
        if not is_payroll_officer:
            return Response({'error': 'Only Payroll Officers can reopen payroll to draft'}, status=status.HTTP_403_FORBIDDEN)

        if period.status not in ['generated', 'rolled_back']:
            return Response({'error': f"Cannot reopen payroll in '{period.status}' status"}, status=status.HTTP_400_BAD_REQUEST)

        old_status = period.status
        period.status = 'draft'
        period.save()

        PayrollApprovalLog.objects.create(
            period=period,
            action='reopened',
            performed_by=getattr(user, 'employee', None),
            notes='Reopened to draft for editing',
            previous_status=old_status,
            new_status='draft'
        )

        return Response({'message': 'Payroll reopened to draft', 'period': PayrollPeriodSerializer(period, context={'request': request}).data})
    
    def _notify_hr_managers(self, period, title, message):
        """Send notification to all Managers."""
        from apps.employees.models import Employee
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        hr_users = User.objects.filter(groups__name='Manager')
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
        if not user.groups.filter(name__in=['Manager', 'Payroll Officer']).exists():
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
            'payslip': PayslipSerializer(payslip, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='regenerate')
    def regenerate(self, request, pk=None):
        """Regenerate a single employee's payslip for the payslip's period.
        Allowed when period status is 'draft', 'rolled_back', or 'generated'.
        Optionally accepts 'tax_code_id' to override configured tax code.
        """
        payslip = self.get_object()
        period = payslip.period

        # Only Payroll Officers (or superusers) can regenerate
        user = request.user
        is_payroll_officer = (
            user.is_superuser
            or user.groups.filter(name__iexact='Payroll Officer').exists()
            or user.groups.filter(name__icontains='PAYROLL').exists()
        )
        if not is_payroll_officer:
            return Response({'error': 'Only Payroll Officers can regenerate payslips'}, status=status.HTTP_403_FORBIDDEN)

        # Check period status
        if period.status not in ['draft', 'rolled_back', 'generated']:
            return Response(
                {'error': f"Cannot regenerate payslip in '{period.status}' status. Allowed: draft, rolled_back, generated."},
                status=status.HTTP_400_BAD_REQUEST
            )

        tax_code_id = request.data.get('tax_code_id')
        tax_code_version_id = request.data.get('tax_code_version_id')
        # Optional per-payslip temporary adjustments
        override_adjustments = {}
        if 'one_off' in request.data or 'offset' in request.data:
            try:
                if 'one_off' in request.data:
                    override_adjustments['one_off'] = request.data.get('one_off')
                if 'offset' in request.data:
                    override_adjustments['offset'] = request.data.get('offset')
            except Exception:
                override_adjustments = {}
        performer = getattr(user, 'employee', None)

        try:
            service = PayrollCalculationService(period, performed_by=performer, tax_code_id=tax_code_id, tax_code_version_id=tax_code_version_id, override_adjustments=override_adjustments)
            new_pslip = service._calculate_for_employee(payslip.employee)

            # Update existing payslip fields from newly calculated values
            payslip.base_salary = new_pslip.base_salary
            payslip.total_allowances = new_pslip.total_allowances
            payslip.bonus = new_pslip.bonus
            payslip.overtime_hours = new_pslip.overtime_hours
            payslip.overtime_rate = new_pslip.overtime_rate
            payslip.overtime_pay = new_pslip.overtime_pay
            payslip.total_deductions = new_pslip.total_deductions
            payslip.tax_amount = new_pslip.tax_amount
            payslip.gross_pay = new_pslip.gross_pay
            payslip.net_pay = new_pslip.net_pay
            payslip.tax_code = new_pslip.tax_code
            payslip.tax_code_version = new_pslip.tax_code_version
            payslip.worked_days = new_pslip.worked_days
            payslip.absent_days = new_pslip.absent_days
            payslip.leave_days = new_pslip.leave_days
            payslip.details = new_pslip.details
            payslip.has_issues = new_pslip.has_issues
            payslip.issue_notes = new_pslip.issue_notes
            payslip.save()

            # Log the regeneration in approval logs without changing status
            PayrollApprovalLog.objects.create(
                period=period,
                action='regenerated_single',
                performed_by=performer,
                notes=f"Regenerated payslip for {payslip.employee.fullname}",
                previous_status=period.status,
                new_status=period.status
            )

            return Response({
                'message': 'Payslip regenerated successfully',
                'payslip': PayslipSerializer(payslip, context={'request': request}).data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='apply-adjustment')
    def apply_adjustment(self, request, pk=None):
        """Apply a manual adjustment to a single payslip and record it in details.adjustmentApplied.
        Positive numbers increase pay; negative numbers decrease pay. Gross and net are moved together by the amount.
        """
        payslip = self.get_object()
        period = payslip.period

        # Only allow before finalization
        if period.status == 'finalized':
            return Response({'error': 'Cannot adjust a finalized payslip'}, status=status.HTTP_400_BAD_REQUEST)

        # Permissions: Payroll or HR
        user = request.user
        is_payroll_or_hr = (
            user.is_superuser
            or user.groups.filter(name__iexact='Payroll Officer').exists()
            or user.groups.filter(name__icontains='PAYROLL').exists()
            or user.groups.filter(name__iexact='Manager').exists()
            or user.groups.filter(name__icontains='HR').exists()
        )
        if not is_payroll_or_hr:
            return Response({'error': 'Only Payroll or HR can adjust payslips'}, status=status.HTTP_403_FORBIDDEN)

        try:
            amt = Decimal(str(request.data.get('amount', 0) or 0)).quantize(Decimal('0.01'))
        except Exception:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        if amt == 0:
            return Response({'error': 'Amount must be non-zero'}, status=status.HTTP_400_BAD_REQUEST)

        note = request.data.get('note', '')

        # Update details.adjustmentApplied and optional notes
        details = payslip.details or {}
        current_adj = Decimal(str(details.get('adjustmentApplied', 0) or 0)).quantize(Decimal('0.01'))
        new_adj = (current_adj + amt).quantize(Decimal('0.01'))
        details['adjustmentApplied'] = float(new_adj)

        if note:
            notes_list = details.get('adjustmentNotes', [])
            if not isinstance(notes_list, list):
                notes_list = []
            notes_list.append({'note': note, 'amount': float(amt)})
            details['adjustmentNotes'] = notes_list

        # Move gross and net together by the adjustment amount
        payslip.gross_pay = (Decimal(str(payslip.gross_pay)) + amt).quantize(Decimal('0.01'))
        payslip.net_pay = (Decimal(str(payslip.net_pay)) + amt).quantize(Decimal('0.01'))
        payslip.details = details
        payslip.save()

        # Log action (without status change)
        PayrollApprovalLog.objects.create(
            period=period,
            action='manual_adjustment',
            performed_by=getattr(user, 'employee', None),
            notes=f"Adjustment {amt} applied. {note}".strip(),
            previous_status=period.status,
            new_status=period.status,
        )

        return Response({
            'message': 'Adjustment applied',
            'adjustmentApplied': float(new_adj),
            'payslip': PayslipSerializer(payslip, context={'request': request}).data,
        })

    @action(detail=True, methods=['post'], url_path='set-adjustment')
    def set_adjustment(self, request, pk=None):
        """Set a carryover adjustment on the employee (applied next payroll as offset).
        Positive = future deduction, Negative = future credit.
        """
        payslip = self.get_object()
        user = request.user
        is_payroll_officer = (
            user.is_superuser
            or user.groups.filter(name__iexact='Payroll Officer').exists()
            or user.groups.filter(name__icontains='PAYROLL').exists()
            or user.groups.filter(name__iexact='Manager').exists()
            or user.groups.filter(name__icontains='HR').exists()
        )
        if not is_payroll_officer:
            return Response({'error': 'Only Payroll or HR can set adjustments'}, status=status.HTTP_403_FORBIDDEN)

        try:
            adj_val = Decimal(str(request.data.get('adjustment', 0) or 0)).quantize(Decimal('0.01'))
        except Exception:
            return Response({'error': 'Invalid adjustment value'}, status=status.HTTP_400_BAD_REQUEST)

        payslip.employee.offset = adj_val
        payslip.employee.save(update_fields=['offset'])

        return Response({'message': 'Adjustment set for next payroll', 'adjustment': float(adj_val)})


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
            'results': PayslipSerializer(payslips, many=True, context={'request': request}).data
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
        
        return Response({'results': PayslipSerializer(queryset, many=True, context={'request': request}).data})




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
    queryset = TaxCode.objects.prefetch_related('versions', 'versions__allowances', 'allowances', 'deductions').all()
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

    def create(self, request, *args, **kwargs):
        """Create version and broadcast a payroll notification."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        self._notify_new_version(serializer.instance, request.user)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        tax_code = self.request.query_params.get('tax_code')
        if tax_code:
            queryset = queryset.filter(tax_code_id=tax_code)
        return queryset

    def _notify_new_version(self, version, user):
        """Notify Payroll/HR users when a new tax code version is created."""
        from django.contrib.auth import get_user_model

        try:
            User = get_user_model()
            sender_emp = getattr(user, 'employee', None)

            recipients = User.objects.filter(
                groups__name__in=['Payroll', 'Payroll Officer', 'Manager']
            ).distinct()

            title = f"New Tax Code Version v{version.version}"
            code_name = getattr(version.tax_code, 'name', None) or 'Tax Code'
            message = f"{code_name} updated. Valid from {version.valid_from}."

            for u in recipients:
                recipient_emp = getattr(u, 'employee', None)
                if not recipient_emp:
                    continue
                Notification.objects.create(
                    recipient=recipient_emp,
                    sender=sender_emp,
                    title=title,
                    message=message,
                    notification_type='payroll',
                    link='/Payroll/GeneratePayroll'
                )
        except Exception as notify_err:
            # Avoid breaking creation if notifications fail; log to console for debugging.
            print('Notification dispatch failed for tax code version:', notify_err)


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
    queryset = Allowance.objects.select_related('tax_code', 'tax_code_version').all()
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
        # Filter by tax code version
        version = self.request.query_params.get('tax_code_version') or self.request.query_params.get('version')
        if version:
            queryset = queryset.filter(tax_code_version_id=version)
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
