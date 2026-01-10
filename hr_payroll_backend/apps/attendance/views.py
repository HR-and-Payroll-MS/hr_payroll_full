"""
Views for Attendance app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db.models import Count, Q
from datetime import date, datetime
from .models import Attendance, OvertimeRequest, WorkSchedule
from .serializers import AttendanceSerializer, AttendanceTodaySerializer, DepartmentAttendanceSerializer, OvertimeRequestSerializer, WorkScheduleSerializer
from apps.core.permissions import IsHRManagerOrReadOnly, IsHRManager
from apps.employees.models import Employee
from apps.notifications.models import Notification

class WorkScheduleViewSet(viewsets.ModelViewSet):
    """
    CRUD for Work Schedules.
    Includes capability to bulk assign schedules.
    """
    serializer_class = WorkScheduleSerializer
    permission_classes = [IsAuthenticated, IsHRManagerOrReadOnly]
    queryset = WorkSchedule.objects.all()

    def get_queryset(self):
        queryset = WorkSchedule.objects.all()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
            
        if IsHRManager().has_permission(self.request, self):
            return queryset

        # Regular employees and Line Managers see ONLY their assigned schedule
        if hasattr(user, 'employee') and user.employee:
            if user.employee.work_schedule_id:
                return queryset.filter(id=user.employee.work_schedule_id)
            
        return queryset.none()

    @action(detail=True, methods=['post'], url_path='assign-bulk')
    def assign_bulk(self, request, pk=None):
        """
        Assign this schedule to a list of employees or departments.
        Payload: {
            "employee_ids": [1, 2, ...],
            "department_ids": [5, ...],
            "all_employees": false
        }
        """
        schedule = self.get_object()
        data = request.data
        employee_ids = data.get('employee_ids', [])
        department_ids = data.get('department_ids', [])
        all_employees = data.get('all_employees', False)

        employees_to_update = Employee.objects.none()

        if all_employees:
            employees_to_update = Employee.objects.all()
        else:
            if department_ids:
                employees_to_update = employees_to_update | Employee.objects.filter(department_id__in=department_ids)
            if employee_ids:
                employees_to_update = employees_to_update | Employee.objects.filter(id__in=employee_ids)

        count = employees_to_update.count()
        employees_to_update.distinct().update(work_schedule=schedule)

        # Send notifications
        sender = None
        if hasattr(request.user, 'employee'):
            sender = request.user.employee
            
        for emp in employees_to_update:
            try:
                Notification.objects.create(
                    recipient=emp,
                    sender=sender,
                    title="Work Schedule Assigned",
                    message=f"A new work schedule '{schedule.title}' has been assigned to you ({schedule.start_time.strftime('%H:%M')} - {schedule.end_time.strftime('%H:%M')}).",
                    notification_type='attendance',
                    link="/Employee/setting/WorkSchedule"
                )
            except Exception as e:
                print(f"Failed to send notification to {emp.fullname}: {e}")

        return Response({'message': f"Schedule '{schedule.title}' assigned to {count} employees."})


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing attendance records.
    """
    queryset = Attendance.objects.select_related('employee', 'employee__department').all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Filter by employee
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        
        # Filter by status
        attendance_status = self.request.query_params.get('status')
        if attendance_status:
            queryset = queryset.filter(status__iexact=attendance_status)
        
        # Filter by month/year
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month:
            queryset = queryset.filter(date__month=month)
        if year:
            queryset = queryset.filter(date__year=year)
            
        return queryset


class AttendanceStatsView(APIView):
    """
    GET /employees/<id>/attendances/stats/
    Returns attendance summary stats for an employee (current year by default).
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, employee_id=None):
        from django.utils import timezone
        target_year = request.query_params.get('year', timezone.localdate().year)
        
        if not employee_id:
            employee_id = request.query_params.get('employee_id')
            
        if not employee_id:
            return Response({"error": "employee_id is required"}, status=400)
            
        # Get stats for the specific year
        queryset = Attendance.objects.filter(employee_id=employee_id, date__year=target_year)
        
        stats = {
            'present': queryset.filter(status__iexact='PRESENT').count(),
            'late': queryset.filter(status__iexact='LATE').count(),
            'absent': queryset.filter(status__iexact='ABSENT').count(),
            'permission': queryset.filter(status__iexact='PERMISSION').count(),
            'leave': queryset.filter(status__iexact='LEAVE').count(),
        }
        
        return Response(stats)


class DepartmentAttendanceView(APIView):
    """
    GET /attendances/departments/
    Returns attendance summary by department for a given date.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from apps.departments.models import Department
        from apps.employees.models import Employee
        
        from django.utils import timezone
        target_date = request.query_params.get('date', timezone.localdate().isoformat())
        
        departments = Department.objects.filter(is_active=True)
        data = []
        
        for dept in departments:
            # Only count employees who have joined by target_date and are not terminated before target_date
            employees = Employee.objects.filter(
                department=dept
            ).filter(
                Q(join_date__lte=target_date) | Q(join_date__isnull=True)
            ).filter(
                Q(last_working_date__isnull=True) | Q(last_working_date__gte=target_date)
            )
            total = employees.count()
            
            if total == 0:
                continue
            
            attendances = Attendance.objects.filter(
                employee__department=dept,
                date=target_date
            )
            
            present = attendances.filter(status__iexact='PRESENT').count()
            late = attendances.filter(status__iexact='LATE').count()
            permission = attendances.filter(status__iexact='PERMISSION').count()
            absent = total - present - late - permission
            
            # Calculate Overtime
            # Count unique employees in this department who have overtime on this date
            from .models import OvertimeRequest
            # Get overtime requests for this date involving employees of this department
            # (Filtering by employee__department handles the join)
            ot_count = OvertimeRequest.objects.filter(
                date=target_date,
                employees__department=dept
            ).values('employees').distinct().count()

            data.append({
                'department_name': dept.name,
                'department_id': dept.id,
                'total_employees': total,
                'present': present + late,  # Present includes late
                'absent': absent if absent > 0 else 0,
                'late': late,
                'permission': permission,
                'overtime': ot_count,
                'date': target_date
            })
        
        return Response(data)


class DepartmentAttendanceDetailView(APIView):
    """
    GET /attendances/departments/{id}/
    Returns list of employee attendance for a specific department.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            from apps.employees.models import Employee
            
            from django.utils import timezone
            target_date = request.query_params.get('date', timezone.localdate().isoformat())
            
            # Get all employees who should have attendance on this date (respect join_date and last_working_date)
            employees = Employee.objects.select_related('work_schedule').filter(
                department_id=pk
            ).filter(
                Q(join_date__lte=target_date) | Q(join_date__isnull=True)
            ).filter(
                Q(last_working_date__isnull=True) | Q(last_working_date__gte=target_date)
            )
            
            # AUTO-INITIALIZE ABSENT RECORDS
            # Find employees who don't have a record for this date
            existing_att_ids = Attendance.objects.filter(
                employee__in=employees, 
                date=target_date
            ).values_list('employee_id', flat=True)
            
            missing_emps = employees.exclude(id__in=existing_att_ids)
            
            if missing_emps.exists():
                # Only create for past or current dates
                from django.utils import timezone
                if str(target_date) <= str(timezone.localdate().isoformat()):
                    new_records = [
                        Attendance(
                            employee=emp,
                            date=target_date,
                            status='ABSENT'
                        ) for emp in missing_emps
                    ]
                    Attendance.objects.bulk_create(new_records, ignore_conflicts=True)

            # Re-fetch or iterate
            attendances = Attendance.objects.filter(employee__in=employees, date=target_date)
            att_map = {a.employee_id: a for a in attendances}

            data = []
            for emp in employees:
                att = att_map.get(emp.id)
                
                if att:
                    from django.utils import timezone
                    clock_in = timezone.localtime(att.clock_in).strftime('%H:%M:%S') if att.clock_in else '--:--'
                    clock_out = timezone.localtime(att.clock_out).strftime('%H:%M:%S') if att.clock_out else '--:--'
                    
                    ws_hours_str = '8h'
                    try:
                        if emp.work_schedule:
                            from datetime import timedelta, date, datetime
                            d = date(2000, 1, 1)
                            s_dt = datetime.combine(d, emp.work_schedule.start_time)
                            e_dt = datetime.combine(d, emp.work_schedule.end_time)
                            if e_dt < s_dt: e_dt += timedelta(days=1)
                            diff_ws = (e_dt - s_dt).total_seconds() / 3600.0
                            ws_hours_str = f"{diff_ws:.2f}h".replace('.00h', 'h')
                    except Exception: ws_hours_str = '8h'

                    record = {
                        'id': att.id,
                        'employee_id': emp.id,
                        'employee_name': emp.fullname,
                        'employee_photo': request.build_absolute_uri(emp.photo.url) if emp.photo else None,
                        'job_title': emp.job_title,
                        'date': att.date,
                        'clock_in': clock_in,
                        'clock_in_location': att.clock_in_location,
                        'clock_out': clock_out,
                        'clock_out_location': att.clock_out_location,
                        'status': att.status.upper(),
                        'work_schedule_hours': ws_hours_str,
                        'paid_time': f"{att.worked_hours}h",
                        'notes': '',
                        'view': True
                    }
                else:
                    # Future date fallback (no bulk creation for future)
                    record = {
                        'id': None,
                        'employee_id': emp.id,
                        'employee_name': emp.fullname,
                        'employee_photo': request.build_absolute_uri(emp.photo.url) if emp.photo else None,
                        'job_title': emp.job_title,
                        'date': target_date,
                        'clock_in': '--:--',
                        'clock_in_location': '-',
                        'clock_out': '--:--',
                        'clock_out_location': '-',
                        'status': '--',
                        'work_schedule_hours': '8h',
                        'paid_time': '0h',
                        'notes': '',
                        'view': False
                    }
                data.append(record)
                
            return Response(data)
        except Exception as e:
            import traceback
            with open('view_error.log', 'w') as f:
                f.write(traceback.format_exc())
            raise e


class MyAttendanceView(APIView):
    """
    GET /attendances/my/
    Returns attendance for the current logged-in user's employee.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if not hasattr(user, 'employee') or not user.employee:
            return Response(
                {'error': 'No employee linked to user'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get current month's attendance by default
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        
        queryset = Attendance.objects.filter(employee=user.employee)
        
        if month and year:
            queryset = queryset.filter(date__year=year, date__month=month)
        
        from django.utils import timezone
        # Ensure 'Today' is present in the results if it falls within the requested range (or no range)
        today = timezone.localdate()
        # Check if we should include today
        include_today = True
        if month and year:
            if int(month) != today.month or int(year) != today.year:
                include_today = False
        
        results = list(queryset)
        
        if include_today:
            # Check if today exists in results (more robustly)
            has_today = any(r.date == today for r in results)
            if not has_today:
                # Double check DB just in case results list is weird
                has_today_in_db = queryset.filter(date=today).exists()
                if not has_today_in_db:
                    # Create a temporary unsaved record for today
                    dummy = Attendance(
                        employee=user.employee,
                        date=today,
                        status='ABSENT',
                        clock_in=None,
                        clock_out=None
                    )
                    dummy.id = -1
                    results.insert(0, dummy)
                
        serializer = AttendanceSerializer(results, many=True)
        return Response({'results': serializer.data})

class ManagerDepartmentAttendanceView(APIView):
    """
    GET /attendances/manager/department/
    Returns list of employee attendance for the logged-in manager's department.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.employees.models import Employee
        from apps.departments.models import Department
        
        user_groups = list(request.user.groups.values_list('name', flat=True))
        is_dm = 'Department Manager' in user_groups
        
        managed_depts = Department.objects.filter(manager=request.user.employee)
        
        # If no explicitly managed departments, fall back to their own department if they have the DM role
        if not managed_depts.exists() and is_dm and request.user.employee.department:
            managed_depts = Department.objects.filter(id=request.user.employee.department.id)
            
        if not managed_depts.exists():
            return Response([], status=200) # No departments found
            
        from django.utils import timezone
        target_date = request.query_params.get('date', timezone.localdate().isoformat())
        
        # Get all employees in these departments
        employees = Employee.objects.filter(
            department__in=managed_depts
        ).filter(
            Q(join_date__lte=target_date) | Q(join_date__isnull=True)
        ).filter(
            Q(last_working_date__isnull=True) | Q(last_working_date__gte=target_date)
        ).distinct()
        
        # AUTO-INITIALIZE ABSENT RECORDS
        existing_att_ids = Attendance.objects.filter(
            employee__in=employees, 
            date=target_date
        ).values_list('employee_id', flat=True)
        
        missing_emps = employees.exclude(id__in=existing_att_ids)
        
        if missing_emps.exists():
            from django.utils import timezone
            if str(target_date) <= str(timezone.localdate().isoformat()):
                new_records = [
                    Attendance(
                        employee=emp,
                        date=target_date,
                        status='ABSENT'
                    ) for emp in missing_emps
                ]
                Attendance.objects.bulk_create(new_records, ignore_conflicts=True)

        # Refetch
        attendances = Attendance.objects.filter(employee__in=employees, date=target_date)
        att_map = {a.employee_id: a for a in attendances}

        data = []
        for emp in employees:
            att = att_map.get(emp.id)
            if att:
                from django.utils import timezone
                clock_in = timezone.localtime(att.clock_in).strftime('%H:%M:%S') if att.clock_in else '--:--'
                clock_out = timezone.localtime(att.clock_out).strftime('%H:%M:%S') if att.clock_out else '--:--'
                
                record = {
                    'id': att.id,
                    'employee_id': emp.id, 
                    'employee_name': emp.fullname,
                    'employee_photo': request.build_absolute_uri(att.employee.photo.url) if att.employee.photo else None,
                    'job_title': emp.job_title,
                    'date': att.date,
                    'clock_in': clock_in,
                    'clock_in_location': att.clock_in_location,
                    'clock_out': clock_out,
                    'clock_out_location': att.clock_out_location,
                    'status': att.status.upper(),
                    'work_schedule_hours': '8h', # Mock
                    'paid_time': f"{att.worked_hours}h",
                    'notes': att.notes or '',
                    'view': "View"
                }
            else:
                record = {
                    'id': None,
                    'employee_id': emp.id,
                    'employee_name': emp.fullname,
                    'employee_photo': request.build_absolute_uri(emp.photo.url) if emp.photo else None,
                    'job_title': emp.job_title,
                    'date': target_date,
                    'clock_in': '--:--',
                    'clock_in_location': '-',
                    'clock_out': '--:--',
                    'clock_out_location': '-',
                    'status': '--',
                    'work_schedule_hours': '8h',
                    'paid_time': '0h',
                    'notes': '',
                    'view': "View"
                }
            data.append(record)
            
        return Response(data)


class OvertimeRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing overtime requests."""
    queryset = OvertimeRequest.objects.all()
    serializer_class = OvertimeRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        user_groups = list(user.groups.values_list('name', flat=True))
        is_hr_admin = any(role in user_groups for role in ['Admin', 'Payroll'])
        
        if not is_hr_admin:
            # Filter by manager OR employee
            if hasattr(user, 'employee'):
                emp = user.employee
                queryset = queryset.filter(Q(manager=emp) | Q(employees=emp)).distinct()
        return queryset

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        from apps.policies.utils import get_policy
        from decimal import Decimal
        from apps.departments.models import Department
        from apps.employees.models import Employee
        
        # Overtime Policy Check
        ot_policy = get_policy('overtimePolicy')
        requested_hours_raw = self.request.data.get('hours', 0)
        try:
            # Handle potential empty strings or invalid types
            requested_hours = Decimal(str(requested_hours_raw) if requested_hours_raw else '0')
        except:
            requested_hours = Decimal('0')

        if ot_policy:
            min_minutes = ot_policy.get('minOvertimeMinutes', 0)
            if requested_hours * 60 < min_minutes:
                raise ValidationError(f"Overtime request does not meet the minimum requirement of {min_minutes} minutes.")

        # Auto-assign manager if not provided
        if hasattr(self.request.user, 'employee'):
            manager = self.request.user.employee
            
            # Use same logic as employee visibility to find allowed departments
            user_groups = list(self.request.user.groups.values_list('name', flat=True))
            is_dm = 'Department Manager' in user_groups
            is_hr_admin = any(role in user_groups for role in ['Admin', 'Payroll'])
            
            managed_depts = Department.objects.filter(manager=manager)
            if not managed_depts.exists() and is_dm and manager.department:
                managed_depts = Department.objects.filter(id=manager.department.id)
            
            # Security: Check if all employees are manageable by this user
            employee_ids = self.request.data.get('employees', [])
            
            # Also check join_date for target overtime date
            target_date = self.request.data.get('date')
            if target_date:
                pre_join_emps = Employee.objects.filter(id__in=employee_ids, join_date__gt=target_date)
                if pre_join_emps.exists():
                    names = ", ".join([e.fullname for e in pre_join_emps])
                    raise ValidationError(f"Cannot assign overtime to employees before their join date: {names}")

            # Correctly check against ALL managed departments if not HR/Admin
            if not is_hr_admin:
                invalid_emps = Employee.objects.filter(id__in=employee_ids).exclude(department__in=managed_depts)
                if invalid_emps.exists():
                    names = ", ".join([e.fullname for e in invalid_emps])
                    raise ValidationError(f"Cannot assign overtime to employees outside your managed departments: {names}")
            
            instance = serializer.save(manager=manager)
            
            # Create notifications for employees
            from apps.notifications.models import Notification
            for emp_id in employee_ids:
                try:
                    target_emp = Employee.objects.get(id=emp_id)
                    Notification.objects.create(
                        recipient=target_emp,
                        sender=manager,
                        title="New Overtime Assigned",
                        message=f"You have been assigned {instance.hours} hours of overtime for {instance.date}. Reason: {instance.justification}",
                        notification_type='attendance',
                        link=f"/employee/myovertime"
                    )
                except Exception as e:
                    print(f"Error creating overtime notification for emp {emp_id}: {e}")
        else:
            serializer.save()
