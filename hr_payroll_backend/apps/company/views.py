from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Sum, Count, Avg
from datetime import datetime, timedelta
from .models import CompanyInfo
from .serializers import CompanyInfoSerializer

class CompanyInfoView(APIView):
    """
    GET /company-info/ - Get company info
    PUT /company-info/ - Update company info
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get(self, request):
        company = CompanyInfo.objects.first()
        if company:
            return Response(CompanyInfoSerializer(company).data)
        return Response({})
    
    def put(self, request):
        company = CompanyInfo.objects.first()
        if company:
            serializer = CompanyInfoSerializer(company, data=request.data, partial=True)
        else:
            serializer = CompanyInfoSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CheckNetworkView(APIView):
    """
    GET /company-info/check-network/
    Checks if the request is coming from the company network.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Logic to check IP address against allowed company IPs
        # For development/demo, we assume localhost/internal usage is valid.
        # You could check request.META.get('REMOTE_ADDR') here.
        
        is_local = True 
        # Example logic:
        # client_ip = request.META.get('REMOTE_ADDR')
        # if client_ip in ['127.0.0.1', '192.168.1.50']: is_local = True
        
        return Response({
            'is_local': is_local,
            'message': 'Connected to Company Network' if is_local else 'External Network Restricted'
        })


class DashboardStatsView(APIView):
    """
    GET /company-info/dashboard-stats/
    Returns role-specific dashboard statistics and data.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from datetime import datetime, timedelta
            
            user = request.user
            # Safely get role (normalize common variants)
            def _norm(role_name):
                if not role_name:
                    return None
                r = role_name.strip().lower().replace('-', '_').replace(' ', '_')
                if r in ['payroll_officer', 'payroll']:
                    return 'Payroll'
                if r in ['department_manager', 'dept_manager', 'line_manager', 'line_manager_member']:
                    return 'Department_Manager'
                if r in ['hr', 'hr_manager', 'manager', 'human_resources']:
                    return 'Manager'
                if r == 'employee':
                    return 'Employee'
                return role_name

            role = None
            if user.groups.exists():
                role = _norm(user.groups.first().name)
            
            # Try to get employee from user
            employee = None
            try:
                employee = user.employee
            except:
                pass
            
            today = datetime.now().date()
            current_month_start = today.replace(day=1)
            current_year_start = today.replace(month=1, day=1)
            
            # Get recent activities with safe fallback
            try:
                recent_activities = self._get_recent_activities(role, employee)
            except:
                recent_activities = []
            
            # Return data based on role with fallback
            try:
                if role == 'Manager':
                    return Response(self._get_hr_manager_data(today, current_month_start, current_year_start, recent_activities))
                elif role == 'Employee':
                    return Response(self._get_employee_data(employee, today, current_month_start, current_year_start, recent_activities))
                elif role == 'Payroll':
                    return Response(self._get_payroll_data(today, current_month_start, current_year_start, recent_activities))
                elif role in ['Department_Manager', 'Line Manager']:
                    return Response(self._get_dept_manager_data(employee, today, current_month_start, current_year_start, recent_activities))
                else:
                    return Response(self._get_hr_manager_data(today, current_month_start, current_year_start, recent_activities))
            except Exception as inner_e:
                # Return minimal fallback data
                import traceback
                traceback.print_exc()
                return Response({
                    'summary_cards': [
                        {'title': 'Error Loading', 'value': '-', 'subtitle': str(inner_e)[:30], 'icon': 'AlertCircle', 'color': 'bg-red-500'},
                    ],
                    'recent_activities': [],
                    'chart_data': {'bar': [], 'line': [], 'pie': []},
                    'quick_access': []
                })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e), 'trace': traceback.format_exc()}, status=500)
    
    def _get_recent_activities(self, role, employee):
        """Get top 5 recent activities based on role."""
        try:
            from apps.notifications.models import Notification
            from apps.leaves.models import LeaveRequest
            from django.db.models import Q
            
            activities = []
            
            # Get recent notifications - handle safely
            try:
                if role == 'Manager':
                    notifications = Notification.objects.order_by('-created_at')[:3]
                elif role in ['Department_Manager', 'Line Manager'] and employee and employee.department:
                    # Show notifications for me + my team members' requests potentially
                    # For now just show my notifications + team leave requests below
                    notifications = Notification.objects.filter(
                        Q(recipient=employee) | Q(sender=employee)
                    ).order_by('-created_at')[:3]
                elif employee:
                    notifications = Notification.objects.filter(
                        Q(recipient=employee) | Q(sender=employee)
                    ).order_by('-created_at')[:3]
                else:
                    notifications = []
                
                for notif in notifications:
                    sender_name = 'System'
                    if notif.sender:
                        try:
                            sender_name = notif.sender.fullname
                        except:
                            sender_name = 'Unknown'
                    
                    activities.append({
                        'type': 'notification',
                        'icon': 'Bell',
                        'title': notif.title or 'Notification',
                        'description': (notif.message[:50] + '...') if notif.message and len(notif.message) > 50 else (notif.message or ''),
                        'timestamp': notif.created_at.isoformat() if notif.created_at else '',
                        'user': sender_name
                    })
            except Exception as e:
                print(f"Error fetching notifications: {e}")
            
            # Get recent leave requests - handle safely
            try:
                if role == 'Manager':
                    leaves = LeaveRequest.objects.select_related('employee').order_by('-submitted_at')[:2]
                elif role in ['Department_Manager', 'Line Manager'] and employee and employee.department:
                    # Show LEAVES from my DEPARTMENT
                    leaves = LeaveRequest.objects.filter(
                        employee__department=employee.department
                    ).exclude(employee=employee).select_related('employee').order_by('-submitted_at')[:3]
                elif employee:
                    leaves = LeaveRequest.objects.filter(employee=employee).order_by('-submitted_at')[:2]
                else:
                    leaves = []
                
                for leave in leaves:
                    emp_name = 'Unknown'
                    if leave.employee:
                        try:
                            emp_name = leave.employee.fullname
                        except:
                            emp_name = 'Employee'
                    
                    activities.append({
                        'type': 'leave',
                        'icon': 'Calendar',
                        'title': f'{leave.leave_type or "Leave"} Request',
                        'description': f'{emp_name} - {leave.status or "Pending"}',
                        'timestamp': leave.submitted_at.isoformat() if leave.submitted_at else '',
                        'user': emp_name
                    })
            except Exception as e:
                print(f"Error fetching leaves: {e}")
            
            # Sort by timestamp and return top 5
            activities.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            return activities[:5]
        except Exception as e:
            print(f"Error in _get_recent_activities: {e}")
            return []
    
    def _get_hr_manager_data(self, today, month_start, year_start, recent_activities):
        """Dashboard data for Manager."""
        from apps.employees.models import Employee
        from apps.departments.models import Department
        from apps.leaves.models import LeaveRequest
        from apps.attendance.models import Attendance
        from apps.payroll.models import Payslip
        from django.db.models import Sum, Count
        
        total_employees = Employee.objects.filter(status='Active').count()
        pending_leaves = LeaveRequest.objects.filter(status='Pending').count()
        total_departments = Department.objects.count()
        
        # Monthly payroll total
        current_month = today.month
        current_year = today.year
        monthly_payroll = Payslip.objects.filter(
            period__month=current_month,
            period__year=current_year
        ).aggregate(total=Sum('net_pay'))['total'] or 0
        
        # Attendance by department for bar chart
        departments = Department.objects.all()
        dept_attendance = []
        for dept in departments[:6]:  # Limit to 6 departments
            dept_employees = dept.employees.filter(status='Active').count()
            present_today = Attendance.objects.filter(
                employee__department=dept,
                date=today,
                status__iexact='present'
            ).count()
            dept_attendance.append({
                'department': dept.name[:15],
                'total': dept_employees,
                'present': present_today,
                'absent': dept_employees - present_today
            })
        
        # Monthly payroll trend for line chart (last 6 months)
        from datetime import timedelta
        payroll_trend = []
        for i in range(5, -1, -1):
            month_date = today.replace(day=1) - timedelta(days=i*30)
            month_total = Payslip.objects.filter(
                period__year=month_date.year,
                period__month=month_date.month
            ).aggregate(total=Sum('net_pay'))['total'] or 0
            payroll_trend.append({
                'x': month_date.strftime('%b'),
                'y': float(month_total)
            })
        
        # Leave types for pie chart
        leave_types = LeaveRequest.objects.filter(
            submitted_at__gte=year_start
        ).values('leave_type').annotate(count=Count('id'))
        pie_data = [{'id': lt['leave_type'], 'label': lt['leave_type'], 'value': lt['count']} for lt in leave_types]
        
        return {
            'summary_cards': [
                {'title': 'Total Employees', 'value': total_employees, 'subtitle': 'active', 'icon': 'Users', 'color': 'bg-blue-500'},
                {'title': 'Pending Leaves', 'value': pending_leaves, 'subtitle': 'requests', 'icon': 'Calendar', 'color': 'bg-amber-500'},
                {'title': 'Monthly Payroll', 'value': f'${float(monthly_payroll):,.0f}', 'subtitle': 'this month', 'icon': 'DollarSign', 'color': 'bg-green-500'},
                {'title': 'Departments', 'value': total_departments, 'subtitle': 'total', 'icon': 'Building2', 'color': 'bg-indigo-500'},
            ],
            'recent_activities': recent_activities,
            'chart_data': {
                'bar': dept_attendance,
                'line': [{'id': 'payroll', 'data': payroll_trend}],
                'pie': pie_data or [{'id': 'No Data', 'label': 'No Data', 'value': 1}]
            },
            'quick_access': [
                {'title': 'Employee Attendance', 'subtitle': 'View daily attendance', 'icon': 'ClipboardCheck', 'path': '/hr_dashboard/Department_Attendance'},
                {'title': 'Add Employee', 'subtitle': 'Create new employee', 'icon': 'UserPlus', 'path': '/hr_dashboard/Addemployee'},
                {'title': 'Approve Requests', 'subtitle': 'Pending approvals', 'icon': 'CheckCircle', 'path': '/hr_dashboard/Approve_Reject'},
            ]
        }
    
    def _get_employee_data(self, employee, today, month_start, year_start, recent_activities):
        """Dashboard data for Employee."""
        from apps.attendance.models import Attendance
        from apps.leaves.models import LeaveRequest
        from apps.payroll.models import Payslip
        from apps.efficiency.models import EfficiencyEvaluation
        from django.db.models import Count, Avg
        
        if not employee:
            return {'error': 'Employee not found'}
        
        # Attendance rate this month
        total_days = (today - month_start).days + 1
        present_days = Attendance.objects.filter(
            employee=employee,
            date__gte=month_start,
            status__iexact='present'
        ).count()
        attendance_rate = round((present_days / max(total_days, 1)) * 100)
        
        # Leave balance (simplified - assume 20 annual leave days)
        used_leaves = LeaveRequest.objects.filter(
            employee=employee,
            status='Approved',
            start_date__gte=year_start
        ).count()
        leave_balance = max(20 - used_leaves, 0)
        
        # Latest payslip
        latest_payslip = Payslip.objects.filter(employee=employee).order_by('-period__year', '-period__month').first()
        next_payday = 'N/A'
        if latest_payslip and latest_payslip.period:
            try:
                # Construct end date from month/year
                import calendar
                last_day = calendar.monthrange(latest_payslip.period.year, latest_payslip.period.month)[1]
                end_date = datetime(latest_payslip.period.year, latest_payslip.period.month, last_day).date()
                next_payday = end_date.strftime('%b %d')
            except:
                pass
        
        # Performance score
        perf_score = EfficiencyEvaluation.objects.filter(employee=employee).order_by('-submitted_at').first()
        performance = round(perf_score.total_score, 1) if perf_score else 'N/A'
        
        # Weekly attendance for bar chart
        weekly_attendance = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            att = Attendance.objects.filter(employee=employee, date=day).first()
            weekly_attendance.append({
                'day': day.strftime('%a'),
                'hours': float(att.worked_hours) if att else 0,
                'status': att.status if att else 'absent'
            })
        
        # Monthly hours for line chart
        monthly_hours = []
        for i in range(5, -1, -1):
            month_date = today.replace(day=1) - timedelta(days=i*30)
            month_hours = Attendance.objects.filter(
                employee=employee,
                date__year=month_date.year,
                date__month=month_date.month
            ).aggregate(total=Sum('worked_hours'))['total'] or 0
            monthly_hours.append({
                'x': month_date.strftime('%b'),
                'y': float(month_hours)
            })
        
        # Attendance status pie chart
        statuses = Attendance.objects.filter(
            employee=employee,
            date__gte=year_start
        ).values('status').annotate(count=Count('id'))
        pie_data = [{'id': s['status'], 'label': s['status'], 'value': s['count']} for s in statuses]
        
        return {
            'summary_cards': [
                {'title': 'Attendance Rate', 'value': f'{attendance_rate}%', 'subtitle': 'this month', 'icon': 'TrendingUp', 'color': 'bg-blue-500'},
                {'title': 'Leave Balance', 'value': leave_balance, 'subtitle': 'days left', 'icon': 'Calendar', 'color': 'bg-green-500'},
                {'title': 'Next Payday', 'value': next_payday, 'subtitle': 'upcoming', 'icon': 'Wallet', 'color': 'bg-amber-500'},
                {'title': 'Performance', 'value': performance, 'subtitle': 'score', 'icon': 'Award', 'color': 'bg-indigo-500'},
            ],
            'recent_activities': recent_activities,
            'chart_data': {
                'bar': weekly_attendance,
                'line': [{'id': 'hours', 'data': monthly_hours}],
                'pie': pie_data or [{'id': 'No Data', 'label': 'No Data', 'value': 1}]
            },
            'quick_access': [
                {'title': 'Clock In/Out', 'subtitle': 'Office network only', 'icon': 'Clock', 'path': '/Employee/clock_in', 'requiresNetwork': True},
                {'title': 'Request Leave', 'subtitle': 'Submit leave request', 'icon': 'CalendarPlus', 'path': '/Employee/send_request'},
                {'title': 'View Payslip', 'subtitle': 'My payslips', 'icon': 'FileText', 'path': '/Employee/MyPayroll'},
            ]
        }
    
    def _get_payroll_data(self, today, month_start, year_start, recent_activities):
        """Dashboard data for Payroll Officer."""
        from apps.payroll.models import PayrollPeriod, Payslip
        from django.db.models import Sum, Count
        from apps.departments.models import Department
        
        pending_periods = PayrollPeriod.objects.filter(status__iexact='draft').count()
        processed_this_month = PayrollPeriod.objects.filter(
            status__in=['approved', 'finalized', 'Approved', 'Finalized'],
            created_at__gte=month_start
        ).count()

        total_disbursed = Payslip.objects.filter(
            period__status__iexact='finalized',
            period__created_at__gte=year_start
        ).aggregate(total=Sum('net_pay'))['total'] or 0

        pending_approval = PayrollPeriod.objects.filter(status__iexact='pending_approval').count()
        
        # Monthly totals for line chart
        from datetime import timedelta
        monthly_totals = []
        for i in range(5, -1, -1):
            month_date = today.replace(day=1) - timedelta(days=i*30)
            month_total = Payslip.objects.filter(
                period__year=month_date.year,
                period__month=month_date.month
            ).aggregate(total=Sum('net_pay'))['total'] or 0
            monthly_totals.append({
                'x': month_date.strftime('%b'),
                'y': float(month_total)
            })
        
        # Payroll by department for bar chart
        dept_payroll = []
        departments = Department.objects.all()[:6]
        for dept in departments:
            dept_total = Payslip.objects.filter(
                employee__department=dept,
                period__created_at__gte=month_start
            ).aggregate(total=Sum('net_pay'))['total'] or 0
            dept_payroll.append({
                'department': dept.name[:15],
                'amount': float(dept_total)
            })
        
        # Payroll status pie chart
        statuses = PayrollPeriod.objects.values('status').annotate(count=Count('id'))
        pie_data = [{'id': s['status'], 'label': s['status'], 'value': s['count']} for s in statuses]
        
        return {
            'summary_cards': [
                {'title': 'Pending Payrolls', 'value': pending_periods, 'subtitle': 'drafts', 'icon': 'FileEdit', 'color': 'bg-amber-500'},
                {'title': 'Processed', 'value': processed_this_month, 'subtitle': 'this month', 'icon': 'CheckCircle', 'color': 'bg-green-500'},
                {'title': 'Total Disbursed', 'value': f'${float(total_disbursed):,.0f}', 'subtitle': 'this year', 'icon': 'Banknote', 'color': 'bg-blue-500'},
                {'title': 'Pending Approval', 'value': pending_approval, 'subtitle': 'awaiting', 'icon': 'Clock', 'color': 'bg-indigo-500'},
            ],
            'recent_activities': recent_activities,
            'chart_data': {
                'bar': dept_payroll,
                'line': [{'id': 'disbursements', 'data': monthly_totals}],
                'pie': pie_data or [{'id': 'No Data', 'label': 'No Data', 'value': 1}]
            },
            'quick_access': [
                {'title': 'Process Payroll', 'subtitle': 'Generate payslips', 'icon': 'Calculator', 'path': '/Payroll/GeneratePayroll'},
                {'title': 'Generate Reports', 'subtitle': 'Payroll reports', 'icon': 'BarChart3', 'path': '/Payroll/PayrollReports'},
                {'title': 'Pending Reviews', 'subtitle': 'View submitted', 'icon': 'ClipboardList', 'path': '/Payroll/PendingPayrolls'},
            ]
        }
    
    def _get_dept_manager_data(self, employee, today, month_start, year_start, recent_activities):
        """Dashboard data for Department Manager."""
        from apps.employees.models import Employee
        from apps.attendance.models import Attendance
        from apps.leaves.models import LeaveRequest
        from apps.efficiency.models import EfficiencyEvaluation
        from django.db.models import Count, Avg
        
        if not employee or not employee.department:
            return {'error': 'Department not found'}
        
        department = employee.department
        team_members = Employee.objects.filter(department=department, status='Active')
        team_size = team_members.count()
        
        # Team attendance rate today
        present_today = Attendance.objects.filter(
            employee__department=department,
            date=today,
            status__iexact='present'
        ).count()
        attendance_rate = round((present_today / max(team_size, 1)) * 100)
        
        # Pending requests from team
        pending_requests = LeaveRequest.objects.filter(
            employee__department=department,
            status='Pending'
        ).count()
        
        # Team average performance
        avg_perf = EfficiencyEvaluation.objects.filter(
            employee__department=department
        ).aggregate(avg=Avg('total_score'))['avg']
        team_performance = round(avg_perf, 1) if avg_perf else 'N/A'
        
        # Daily team attendance for bar chart (last 7 days)
        daily_attendance = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            present = Attendance.objects.filter(
                employee__department=department,
                date=day,
                status__iexact='present'
            ).count()
            daily_attendance.append({
                'day': day.strftime('%a'),
                'present': present,
                'absent': team_size - present
            })
        
        # Team hours trend for line chart
        team_hours = []
        for i in range(5, -1, -1):
            month_date = today.replace(day=1) - timedelta(days=i*30)
            month_hours = Attendance.objects.filter(
                employee__department=department,
                date__year=month_date.year,
                date__month=month_date.month
            ).aggregate(total=Sum('worked_hours'))['total'] or 0
            team_hours.append({
                'x': month_date.strftime('%b'),
                'y': float(month_hours)
            })
        
        # Team member status pie chart
        statuses = team_members.values('status').annotate(count=Count('id'))
        pie_data = [{'id': s['status'], 'label': s['status'], 'value': s['count']} for s in statuses]
        
        return {
            'summary_cards': [
                {'title': 'Team Size', 'value': team_size, 'subtitle': 'members', 'icon': 'Users', 'color': 'bg-blue-500'},
                {'title': 'Team Attendance', 'value': f'{attendance_rate}%', 'subtitle': 'today', 'icon': 'UserCheck', 'color': 'bg-green-500'},
                {'title': 'Pending Requests', 'value': pending_requests, 'subtitle': 'awaiting', 'icon': 'MessageSquare', 'color': 'bg-amber-500'},
                {'title': 'Team Performance', 'value': team_performance, 'subtitle': 'avg score', 'icon': 'Trophy', 'color': 'bg-indigo-500'},
            ],
            'recent_activities': recent_activities,
            'chart_data': {
                'bar': daily_attendance,
                'line': [{'id': 'hours', 'data': team_hours}],
                'pie': pie_data or [{'id': 'No Data', 'label': 'No Data', 'value': 1}]
            },
            'quick_access': [
                {'title': 'Team Attendance', 'subtitle': 'View team records', 'icon': 'ClipboardCheck', 'path': '/department_manager/Team_Attendance'},
                {'title': 'Approve Requests', 'subtitle': 'Pending approvals', 'icon': 'CheckCircle', 'path': '/department_manager/Approve_Reject'},
                {'title': 'Team Reports', 'subtitle': 'Performance reports', 'icon': 'BarChart', 'path': '/department_manager/Team_Reports'},
            ]
        }

