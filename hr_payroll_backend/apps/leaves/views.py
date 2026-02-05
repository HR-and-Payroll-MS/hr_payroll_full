"""
Views for Leaves app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.db.models import Q
from .models import LeaveRequest, LeaveApproval
from .serializers import LeaveRequestSerializer, LeaveRequestCreateSerializer
from apps.notifications.models import Notification


class LeaveRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing leave requests.
    """
    queryset = LeaveRequest.objects.select_related('employee').prefetch_related('approval_chain').all()
    ordering = ['-submitted_at']
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return LeaveRequestCreateSerializer
        return LeaveRequestSerializer
    
    def _is_manager_or_above(self, employee):
        """Check if employee is a department manager or has managerial role."""
        if not employee:
            return False
        job_title = getattr(employee, 'position', '') or ''
        # Check by title
        if 'MANAGER' in job_title.upper():
            return True
        # Check by relationship
        if employee.direct_reports.exists():
            return True
        if employee.managed_departments.exists():
            return True
        return False
    
    def get_queryset(self):
        queryset = super().get_queryset().order_by('-submitted_at')
        user = self.request.user
        
        # Filter by status if provided
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by employee if provided (for "My Requests" page)
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
            return queryset
            
        # Role-based filtering for approval pages
        if hasattr(user, 'employee') and user.employee:
            approver_role = self._get_approver_role(user)
            current_employee = user.employee
            
            # NOTE: Users CAN see their own requests in the list
            # They just CANNOT approve/deny their own (enforced in approve/deny actions)
            
            if approver_role == 'Manager':
                # Manager sees:
                # 1. Requests with status 'manager_approved' (ready for final approval)
                # 2. Requests from OTHER managers (skip line manager step, go directly to Manager)
                # 3. Approved/Denied history
                
                if not status_param:
                    # Default view for Manager: exclude 'pending' UNLESS requester is a manager
                    # Manager requests skip step 1 and go directly to Manager
                    manager_employee_ids = self._get_all_manager_ids()
                    
                    queryset = queryset.filter(
                        Q(status__in=['manager_approved', 'approved', 'denied']) |
                        Q(status='pending', employee_id__in=manager_employee_ids)
                    )
            
            elif approver_role == 'Line Manager':
                # Line Manager sees:
                # 1. Requests from their direct reports
                # 2. Requests from employees in departments they manage
                # 3. Their OWN requests (for viewing, not approving)
                
                filter_condition = Q(employee__line_manager=current_employee)
                
                managed_departments = current_employee.managed_departments.all()
                if managed_departments.exists():
                    filter_condition |= Q(employee__department__in=managed_departments)
                
                # Include own requests for viewing
                filter_condition |= Q(employee=current_employee)
                
                queryset = queryset.filter(filter_condition)
                
        return queryset
    
    def _get_all_manager_ids(self):
        """Get IDs of all employees who are managers."""
        from apps.employees.models import Employee
        
        manager_ids = set()
        
        # By title
        managers_by_title = Employee.objects.filter(
            Q(position__icontains='manager')
        ).values_list('id', flat=True)
        manager_ids.update(managers_by_title)
        
        # By direct reports
        managers_with_reports = Employee.objects.filter(
            direct_reports__isnull=False
        ).distinct().values_list('id', flat=True)
        manager_ids.update(managers_with_reports)
        
        # By managed departments
        managers_of_depts = Employee.objects.filter(
            managed_departments__isnull=False
        ).distinct().values_list('id', flat=True)
        manager_ids.update(managers_of_depts)
        
        return list(manager_ids)
    
    def _get_approver_role(self, user):
        """Determine the role of the current user for approval purposes."""
        # 1. Staff/Superusers can act as Manager (God mode for testing/admin)
        if user.is_authenticated and (user.is_superuser or user.is_staff):
            print(f"DEBUG: Role detection - user {user.username} is staff/superuser")
            return 'Manager'

        # 2. Check group membership
        if user.groups.filter(name__in=['Admin', 'Manager']).exists():
            print(f"DEBUG: Role detection - user {user.username} identified as Manager via group")
            return 'Manager'
        if user.groups.filter(name='Line Manager').exists():
            print(f"DEBUG: Role detection - user {user.username} identified as Line Manager via group")
            return 'Line Manager'

        if not hasattr(user, 'employee') or not user.employee:
            print(f"DEBUG: Role detection - user {user.username} has no employee profile")
            return None
        
        employee = user.employee
        job_title = getattr(employee, 'position', '') or ''
        print(f"DEBUG: Role detection - user {user.username}, position: {job_title}")
        
        # 3. Check if Department/Line Manager
        if job_title and ('MANAGER' in job_title.upper() or 'DEPARTMENT' in job_title.upper()):
            print(f"DEBUG: Role detection - user {user.username} identified as Line Manager")
            return 'Line Manager'
            
        if employee.direct_reports.exists():
            return 'Line Manager'
        
        if employee.managed_departments.exists():
            return 'Line Manager'
        
        if employee.department and employee.department.manager == employee:
            return 'Line Manager'
        
        return None

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'employee'):
            employee = user.employee
            leave_type = self.request.data.get('leave_type')
            
            # Policy Validation
            from apps.policies.utils import get_policy
            leave_policy = get_policy('leavePolicy')
            if leave_policy:
                eligibility = leave_policy.get('eligibilityRules', {})
                
                # Check Maternity Eligibility
                if leave_type == 'maternity':
                    min_months = eligibility.get('maternityMinServiceMonths', 0)
                    if employee.join_date:
                        days_service = (timezone.now().date() - employee.join_date).days
                        months_service = days_service // 30  # Approximate
                        if months_service < min_months:
                            from rest_framework.exceptions import ValidationError
                            raise ValidationError(f"You must have at least {min_months} months of service to request Maternity Leave. Current: ~{months_service} months.")

            leave_request = serializer.save(employee=employee)
            
            # If requester is a manager, skip step 1 (auto-approve manager step)
            if self._is_manager_or_above(employee):
                leave_request.status = 'manager_approved'
                leave_request.save()
                
                # Mark manager step as auto-approved
                LeaveApproval.objects.filter(
                    leave_request=leave_request,
                    step=1
                ).update(
                    status='approved',
                    approver=employee,
                    comment='Auto-approved (requester is a manager)',
                    decided_at=timezone.now()
                )
                
                # Notify Manager directly
                self._notify_manager_about_pending(leave_request)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a leave request (role-based two-step approval)."""
        leave_request = self.get_object()
        comment = request.data.get('comment', '')
        approver_role = self._get_approver_role(request.user)
        approver = getattr(request.user, 'employee', None)
        
        print(f"DEBUG: Approval attempt on request {leave_request.id}")
        print(f"DEBUG: User: {request.user.username}, Role: {approver_role}, Status: {leave_request.status}")
        print(f"DEBUG: Requester: {leave_request.employee.fullname}, Approver: {approver.fullname if approver else 'Admin'}")

        # CRITICAL: Prevent self-approval (unless it's an admin without employee profile)
        if approver and leave_request.employee_id == approver.id:
            print(f"DEBUG: Self-approval detected! Requester ID: {leave_request.employee_id}, Approver ID: {approver.id}")
            return Response(
                {'error': 'You cannot approve your own leave request.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        current_status = leave_request.status
        
        if current_status == 'pending':
            # First approval (Manager step)
            if approver_role == 'Line Manager':
                leave_request.status = 'manager_approved'
                leave_request.save()
                
                LeaveApproval.objects.filter(
                    leave_request=leave_request, 
                    step=1, 
                    status='pending'
                ).update(
                    status='approved',
                    approver=approver,
                    comment=comment,
                    decided_at=timezone.now()
                )
                
                self._notify_manager_about_pending(leave_request)
                
                return Response({
                    'status': 'manager_approved', 
                    'message': 'Approved by line manager. Awaiting manager approval.'
                })
            elif approver_role == 'Manager':
                return Response(
                    {'error': 'Pending requests must be approved by the Line Manager first.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            else:
                return Response(
                    {'error': f'Only line managers can approve pending requests. Your role: {approver_role}'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        elif current_status == 'manager_approved':
            # Second approval (Manager step)
            print(f"DEBUG: Checking Manager role for {request.user.username}. Role detected: {approver_role}")
            if approver_role == 'Manager':
                leave_request.status = 'approved'
                leave_request.save()
                
                LeaveApproval.objects.filter(
                    leave_request=leave_request, 
                    step=2, 
                    status='pending'
                ).update(
                    status='approved',
                    approver=approver,
                    comment=comment,
                    decided_at=timezone.now()
                )
                
                self._notify_employee_final_decision(leave_request, 'approved')
                
                return Response({
                    'status': 'approved', 
                    'message': 'Leave request fully approved.'
                })
            else:
                return Response(
                    {'error': f'Only Managers can give final approval. Your role: {approver_role}'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        else:
            return Response(
                {'error': f'Cannot approve request with status: {current_status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def deny(self, request, pk=None):
        """Deny a leave request."""
        leave_request = self.get_object()
        comment = request.data.get('comment', '')
        approver = getattr(request.user, 'employee', None)
        
        print(f"DEBUG: Denial attempt on request {leave_request.id}")
        print(f"DEBUG: User: {request.user.username}, Requester: {leave_request.employee.fullname}, Approver: {approver.fullname if approver else 'Admin'}")

        # CRITICAL: Prevent self-denial
        if approver and leave_request.employee_id == approver.id:
            print(f"DEBUG: Self-denial detected! Requester ID: {leave_request.employee_id}, Approver ID: {approver.id}")
            return Response(
                {'error': 'You cannot deny your own leave request.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        leave_request.status = 'denied'
        leave_request.save()
        
        LeaveApproval.objects.filter(
            leave_request=leave_request, 
            status='pending'
        ).update(
            status='denied',
            approver=approver,
            comment=comment,
            decided_at=timezone.now()
        )
        
        self._notify_employee_final_decision(leave_request, 'denied')
        
        return Response({'status': 'denied'})
    
    def _notify_manager_about_pending(self, leave_request):
        """Send notification to Manager about line-manager-approved leave request."""
        try:
            from apps.employees.models import Employee

            manager_employees = Employee.objects.filter(user_account__groups__name='Manager')

            for manager in manager_employees:
                Notification.objects.create(
                    recipient=manager,
                    sender=leave_request.employee,
                    title="Leave Request Pending Manager Approval",
                    message=f"{leave_request.employee.fullname}'s {leave_request.leave_type} leave request awaits your approval.",
                    notification_type='request',
                    link=f"/leaves/{leave_request.id}"
                )
        except Exception as e:
            print(f"Error notifying Manager: {e}")
    
    def _notify_employee_final_decision(self, leave_request, decision):
        """Send notification to employee about final leave decision."""
        try:
            Notification.objects.create(
                recipient=leave_request.employee,
                sender=None,
                title=f"Leave Request {decision.capitalize()}",
                message=f"Your {leave_request.leave_type} leave request from {leave_request.start_date} to {leave_request.end_date} has been {decision}.",
                notification_type='success' if decision == 'approved' else 'error',
                link=f"/leaves/{leave_request.id}"
            )
        except Exception as e:
            print(f"Error notifying employee: {e}")
