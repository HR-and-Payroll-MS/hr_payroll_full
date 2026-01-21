"""
Views for Employees app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from .models import Employee, EmployeeDocument
from .serializers import (
    EmployeeListSerializer,
    EmployeeDetailSerializer,
    EmployeeCreateSerializer,
    EmployeeDocumentSerializer
)
from apps.departments.models import Department
from apps.core.permissions import IsHRManager


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing employees.
    
    Endpoints:
    - GET /employees/ - List all employees
    - POST /employees/ - Create new employee
    - GET /employees/{id}/ - Get employee details
    - PUT /employees/{id}/ - Update employee
    - PATCH /employees/{id}/ - Partial update
    - DELETE /employees/{id}/ - Delete employee
    """
    queryset = Employee.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        elif self.action == 'retrieve':
            return EmployeeDetailSerializer
        return EmployeeCreateSerializer
    
    def create(self, request, *args, **kwargs):
        """Override create to add debug logging."""
        print("=" * 50)
        print("EMPLOYEE CREATE DEBUG")
        print("Request data:", dict(request.data))
        print("Request FILES:", request.FILES)
        print("=" * 50)
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("VALIDATION ERRORS:", serializer.errors)
            from rest_framework.response import Response
            return Response(serializer.errors, status=400)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        from rest_framework.response import Response
        from rest_framework import status
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def get_queryset(self):
        try:
            queryset = Employee.objects.select_related(
                'job_info',
                'job_info__department',
                'job_info__line_manager',
                'payroll_info',
                'general_info',
                'address_info',
                'emergency_info',
                'work_schedule_link',
                'contract_info',
                'org_node'
            ).all()
            user = self.request.user
            
            if not user.is_authenticated:
                return Employee.objects.none()
                
            if IsHRManager().has_permission(self.request, self):
                return queryset

            # Line Manager Scoping
            user_groups = [g.name.upper() for g in user.groups.all()]
            is_line_manager = 'LINE MANAGER' in user_groups or 'DEPARTMENT MANAGER' in user_groups
            if is_line_manager:
                from apps.departments.models import Department
                # Use getattr to be safe if employee is missing
                employee = getattr(user, 'employee', None)
                if employee:
                    managed_dept_ids = list(Department.objects.filter(manager=employee).values_list('id', flat=True))
                    # Fallback to the employee's own department from job info
                    if not managed_dept_ids:
                        dept_id = getattr(getattr(employee, 'job_info', None), 'department_id', None)
                        if dept_id:
                            managed_dept_ids = [dept_id]
                    
                    if managed_dept_ids:
                        return queryset.filter(job_info__department_id__in=managed_dept_ids)
                return queryset.none()

            # Regular Employee
            if hasattr(user, 'employee') and user.employee:
                return queryset.filter(id=user.employee.id)
            return queryset.none()
            # --- Standard Filters ---
            # Filter by department
            department = self.request.query_params.get('department')
            if department:
                queryset = queryset.filter(job_info__department__name=department)
            
            # Filter by status
            status_param = self.request.query_params.get('status')
            if status_param:
                queryset = queryset.filter(payroll_info__status=status_param)
            
            # Filter by employment type
            emp_type = self.request.query_params.get('employment_type')
            if emp_type:
                queryset = queryset.filter(job_info__employment_type=emp_type)
            
            # Search by name
            search = self.request.query_params.get('search')
            if search:
                from django.db import models
                queryset = queryset.filter(
                    models.Q(first_name__icontains=search) |
                    models.Q(last_name__icontains=search) |
                    models.Q(email__icontains=search)
                )
            
            return queryset
        except Exception as e:
            import traceback
            err_msg = traceback.format_exc()
            with open('queryset_error.log', 'w') as f:
                f.write(err_msg)
            raise e
    
    @action(detail=True, methods=['post'], url_path='upload-document')
    def upload_document(self, request, pk=None):
        """
        Upload a document for an employee.
        POST /employees/{id}/upload-document/
        """
        employee = self.get_object()
        # Accept 'documents' (plural) or 'file' (singular)
        files = request.FILES.getlist('documents') or request.FILES.getlist('file')
        
        if not files:
            return Response(
                {'error': 'No files provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Determine who is uploading
        uploader = None
        if hasattr(request.user, 'employee'):
            uploader = request.user.employee
            
        doc_type = request.data.get('document_type') or request.data.get('type', 'General')
        notes = request.data.get('notes', '')
        
        created_docs = []
        for file in files:
            doc = EmployeeDocument.objects.create(
                employee=employee,
                name=file.name,
                file=file,
                document_type=doc_type,
                notes=notes,
                uploaded_by=uploader
            )
            created_docs.append(EmployeeDocumentSerializer(doc, context={'request': request}).data)
        
        return Response(created_docs, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], url_path='attendances/clock-in')
    def clock_in(self, request, pk=None):
        """
        Clock in for an employee.
        POST /employees/{id}/attendances/clock-in/
        """
        from apps.attendance.models import Attendance
        from django.utils import timezone
        from datetime import date
        
        employee = self.get_object()
        today = date.today()
        
        # 1. Warning if clocking in after shift end (but allow it as per user request)
        message = 'Clocked in successfully'
        # Use work schedule link
        link = getattr(employee, 'work_schedule_link', None)
        ws = getattr(link, 'work_schedule', None)
        if ws:
            now_local = timezone.localtime(timezone.now()).time()
            if ws.end_time and now_local > ws.end_time:
                message += f" (Note: You are clocking in after your scheduled shift end of {ws.end_time.strftime('%H:%M')})"

        # Check if already clocked in today
        attendance, created = Attendance.objects.get_or_create(
            employee=employee,
            date=today,
            defaults={
                'clock_in': timezone.now(),
                'clock_in_location': request.data.get('clock_in_location', ''),
                'status': 'present' # Default fallback, model save() will refine it
            }
        )
        
        if not created and attendance.clock_in:
            return Response(
                {'error': 'Already clocked in today'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not created:
            attendance.clock_in = timezone.now()
            attendance.clock_in_location = request.data.get('clock_in_location', '')
            # DO NOT force 'present' here. Let model.save() handle it based on policy
            attendance.save()
        else:
            # If created with defaults, we still need to trigger save() logic for late/present
            attendance.save()
        
        return Response({
            'message': message,
            'clock_in': attendance.clock_in.isoformat(),
            'attendance_id': attendance.id
        }, status=status.HTTP_200_OK)
    

    @action(detail=True, methods=['post'], url_path='attendances/clock-out')
    def clock_out(self, request, pk=None):
        """
        Clock out for an employee.
        POST /employees/{id}/attendances/clock-out/
        """
        from apps.attendance.models import Attendance
        from django.utils import timezone
        from datetime import date
        
        employee = self.get_object()
        today = date.today()
        
        try:
            # Use filter().first() to avoid MultipleObjectsReturned crash
            attendance = Attendance.objects.filter(employee=employee, date=today).first()
            
            if not attendance:
                return Response(
                    {'error': 'No clock-in record found for today'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if attendance.clock_out:
                return Response(
                    {'error': 'Already clocked out today'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            attendance.clock_out = timezone.now()
            attendance.clock_out_location = request.data.get('clock_out_location', '')
            
            # Calculate worked hours (Model save logic also does this, but we do it here for response)
            if attendance.clock_in:
                # Ensure compatibility between timestamps usually handled by Django, but purely mostly redundant if model handles it.
                # Logic in model save() will handle the heavy lifting of OT etc.
                pass
            
            attendance.save()
            
            message = 'Clocked out successfully'
            
            # Optional: Warning if clocking out after scheduled time
            link = getattr(employee, 'work_schedule_link', None)
            ws = getattr(link, 'work_schedule', None)
            if ws:
                from datetime import datetime
                now_local = timezone.localtime(timezone.now()).time()
                if ws.end_time and now_local > ws.end_time:
                    message += f" (Note: You are clocking out after your scheduled time of {ws.end_time.strftime('%H:%M')})"

            return Response({
                'message': message,
                'clock_out': attendance.clock_out.isoformat(),
                'worked_hours': attendance.worked_hours,
                'attendance_id': attendance.id
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            err_msg = traceback.format_exc()
            with open('clock_out_error.log', 'w') as f:
                f.write(err_msg)
            print(err_msg)
            return Response(
                {'error': f'Clock-out failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='promote-manager')
    def promote_to_manager(self, request, pk=None):
        """
        Promote employee to Department Manager.
        POST /employees/{id}/promote-manager/
        Body: { "department_id": <id> }  (Optional, defaults to current department)
        """
        from django.contrib.auth.models import Group
        from apps.departments.models import Department
        
        employee = self.get_object()
        dept_id = request.data.get('department_id')
        
        target_department = None
        if dept_id:
            try:
                target_department = Department.objects.get(id=dept_id)
            except Department.DoesNotExist:
                return Response({'error': 'Department found'}, status=400)
        else:
            ji = getattr(employee, 'job_info', None)
            target_department = getattr(ji, 'department', None)
            
        if not target_department:
            return Response({'error': 'No department specified and employee has no current department'}, status=400)

        # 1. Update Employee Department (if changed)
        ji = getattr(employee, 'job_info', None)
        if ji and ji.department != target_department:
            ji.department = target_department
            ji.save()
            
        # 2. Update Job Title (Signal will handle group changes: Employee -> Manager/Line Manager)
        if ji:
            ji.job_title = 'Department Manager'
            ji.save()
        
        # 3. Set as Manager of the Department
        target_department.manager = employee
        target_department.save()
        
        # 4. Notify Employee
        from apps.notifications.models import Notification
        Notification.objects.create(
            recipient=employee,
            sender=request.user.employee if hasattr(request.user, 'employee') else None,
            title="Promotion: Department Manager",
            message=f"Congratulations! You have been promoted to Manager of the {target_department.name} department.",
            notification_type='promotion',
            link="/my-profile"
        )
        
        return Response({
            'message': f'Successfully promoted {employee.fullname} to manager of {target_department.name}',
            'department': target_department.name
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='demote-manager')
    def demote_from_manager(self, request, pk=None):
        """
        Demote employee from Department Manager role.
        POST /employees/{id}/demote-manager/
        """
        from django.contrib.auth.models import Group
        from apps.departments.models import Department
        
        employee = self.get_object()
        
        # 1. Reset Job Title (Signal will handle group changes: -> Employee)
        ji = getattr(employee, 'job_info', None)
        if ji:
            ji.job_title = 'Employee'
            ji.save()
        
        # 2. Remove employee as manager from any departments they manage
        managed_departments = Department.objects.filter(manager=employee)
        dept_names = list(managed_departments.values_list('name', flat=True))
        managed_departments.update(manager=None)
        
        # 3. Notify Employee
        from apps.notifications.models import Notification
        Notification.objects.create(
            recipient=employee,
            sender=request.user.employee if hasattr(request.user, 'employee') else None,
            title="Position Update: Manager Role Removed",
            message=f"Your role as Department Manager has been removed.",
            notification_type='warning',
            link="/my-profile"
        )
        
        return Response({
            'message': f'Successfully demoted {employee.fullname} from manager role',
            'removed_from_departments': dept_names
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get', 'put'], url_path='org-chart')
    def org_chart(self, request):
        """
        GET: Generate Org Chart data (Nodes & Edges) - only for employees in_org_chart=True.
        PUT: Update Org Structure (Create/Update nodes & edges). 
             Employees removed from the chart are NOT deleted - they are just removed from the org chart.
        """
        if request.method == 'GET':
            from apps.company.models import CompanyOrgNode, EmployeeJobInfo
            employees = Employee.objects.select_related('line_manager', 'department').all()
            org_nodes = CompanyOrgNode.objects.filter(in_org_chart=True)

            nodes = []
            edges = []

            # Build map for quick lookup
            node_by_emp_id = {n.employee_id: n for n in org_nodes}

            for emp in employees:
                org = node_by_emp_id.get(emp.id)
                if not org:
                    continue
                is_root = emp.line_manager is None or (emp.line_manager_id not in node_by_emp_id)
                image_url = ''
                if emp.photo:
                    try:
                        image_url = request.build_absolute_uri(emp.photo.url)
                    except Exception:
                        image_url = emp.photo.url
                node = {
                    'id': str(emp.id),
                    'type': 'orgCard',
                    'data': {
                        'name': f"{emp.first_name} {emp.last_name}",
                        'role': emp.job_title or 'Employee',
                        'department': emp.department.name if emp.department else 'General',
                        'image': image_url,
                        'isRoot': is_root
                    },
                    'position': {'x': org.org_x, 'y': org.org_y}
                }
                nodes.append(node)

                if emp.line_manager and (emp.line_manager_id in node_by_emp_id):
                    edge = {
                        'id': f"e{emp.line_manager.id}-{emp.id}",
                        'source': str(emp.line_manager.id),
                        'target': str(emp.id),
                        'type': 'smoothstep'
                    }
                    edges.append(edge)

            return Response({'nodes': nodes, 'edges': edges}, status=status.HTTP_200_OK)
        
        elif request.method == 'PUT':
            from apps.company.models import CompanyOrgNode
            nodes = request.data.get('nodes', [])
            edges = request.data.get('edges', [])

            uuid_map = {}  # client_id -> db_id

            for n in nodes:
                client_id = str(n.get('id', ''))
                data = n.get('data', {})
                pos = n.get('position', {'x': 0, 'y': 0})
                name = data.get('name', 'Unknown')
                role = data.get('role', '')
                dept_name = data.get('department', '')

                parts = name.strip().split(' ', 1)
                first = parts[0]
                last = parts[1] if len(parts) > 1 else ''

                dept = Department.objects.filter(name__iexact=dept_name).first()

                emp = None
                if client_id.isdigit():
                    emp = Employee.objects.filter(id=int(client_id)).first()
                    if emp:
                        emp.first_name = first
                        emp.last_name = last
                        emp.save()
                        ji, _ = EmployeeJobInfo.objects.get_or_create(employee=emp)
                        ji.job_title = role
                        ji.department = dept
                        ji.save()
                        # Upsert org node
                        org, _ = CompanyOrgNode.objects.get_or_create(employee=emp)
                        org.in_org_chart = True
                        org.org_x = pos.get('x', 0)
                        org.org_y = pos.get('y', 0)
                        org.save()
                        uuid_map[client_id] = emp.id

                if not emp:
                    emp = Employee.objects.create(
                        first_name=first,
                        last_name=last,
                    )
                    EmployeeJobInfo.objects.create(employee=emp, job_title=role, department=dept)
                    org = CompanyOrgNode.objects.create(employee=emp, in_org_chart=True, org_x=pos.get('x', 0), org_y=pos.get('y', 0))
                    uuid_map[client_id] = emp.id

            # Remove from chart (do not delete employees)
            chart_db_ids = set(uuid_map.values())
            currently_on_chart_ids = set(CompanyOrgNode.objects.filter(in_org_chart=True).values_list('employee_id', flat=True))
            ids_to_remove = currently_on_chart_ids - chart_db_ids
            if ids_to_remove:
                CompanyOrgNode.objects.filter(employee_id__in=ids_to_remove).update(in_org_chart=False, org_x=0, org_y=0)

            # Edges
            edge_map = {str(e['target']): str(e['source']) for e in edges}
            for client_id, db_id in uuid_map.items():
                emp = Employee.objects.filter(id=db_id).first()
                if not emp:
                    continue
                source_client_id = edge_map.get(client_id)
                if source_client_id:
                    manager_db_id = uuid_map.get(source_client_id)
                    ji, _ = EmployeeJobInfo.objects.get_or_create(employee=emp)
                    ji.line_manager_id = manager_db_id if (manager_db_id and manager_db_id != db_id) else None
                    ji.save()
                else:
                    ji, _ = EmployeeJobInfo.objects.get_or_create(employee=emp)
                    ji.line_manager = None
                    ji.save()

            # Return updated nodes
            updated_org_nodes = CompanyOrgNode.objects.filter(employee_id__in=chart_db_ids, in_org_chart=True).select_related('employee__job_info__department')
            new_nodes = []
            new_edges = []
            for org in updated_org_nodes:
                emp = org.employee
                ji = getattr(emp, 'job_info', None)
                manager_id = getattr(ji, 'line_manager_id', None)
                is_root = manager_id is None or not CompanyOrgNode.objects.filter(employee_id=manager_id, in_org_chart=True).exists()
                image_url = ''
                if emp.photo:
                    try:
                        image_url = request.build_absolute_uri(emp.photo.url)
                    except Exception:
                        image_url = emp.photo.url
                dept_name = getattr(getattr(ji, 'department', None), 'name', None) or 'General'
                role = getattr(ji, 'job_title', None) or 'Employee'
                node = {
                    'id': str(emp.id),
                    'type': 'orgCard',
                    'data': {
                        'name': f"{emp.first_name} {emp.last_name}",
                        'role': role,
                        'department': dept_name,
                        'image': image_url,
                        'isRoot': is_root
                    },
                    'position': {'x': org.org_x, 'y': org.org_y}
                }
                new_nodes.append(node)
                if manager_id and CompanyOrgNode.objects.filter(employee_id=manager_id, in_org_chart=True).exists():
                    new_edges.append({
                        'id': f"e{manager_id}-{emp.id}",
                        'source': str(manager_id),
                        'target': str(emp.id),
                        'type': 'smoothstep'
                    })

            return Response({'nodes': new_nodes, 'edges': new_edges}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='attendances/today')
    def today(self, request, pk=None):
        """
        Get today's punches for the employee.
        GET /employees/{id}/attendances/today/
        """
        from apps.attendance.models import Attendance
        from datetime import date
        
        from django.utils import timezone
        employee = self.get_object()
        today = timezone.localdate()
        punches = []
        status_text = 'ABSENT'
        try:
            from django.utils import timezone
            attendance = Attendance.objects.get(employee=employee, date=today)
            status_text = attendance.status.upper()
            if attendance.clock_in:
                punches.append({
                    'type': 'check_in',
                    'time': timezone.localtime(attendance.clock_in).isoformat(),
                })
            if attendance.clock_out:
                punches.append({
                    'type': 'check_out',
                    'time': timezone.localtime(attendance.clock_out).isoformat(),
                })
        except Attendance.DoesNotExist:
            pass # No punches today yet
            
        return Response({
            'punches': punches,
            'status': status_text
        }, status=status.HTTP_200_OK)


class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing employee documents directly."""
    queryset = EmployeeDocument.objects.all()
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='serve-document')
    def serve_document(self, request, pk=None):
        """
        Serve a document securely.
        GET /employees/documents/{id}/serve-document/
        """
        from django.http import FileResponse
        from django.shortcuts import get_object_or_404
        
        doc = get_object_or_404(EmployeeDocument, id=pk)
        
        # Security: Check if user has permission
        if not IsHRManager().has_permission(request, self):
            if not (hasattr(request.user, 'employee') and doc.employee == request.user.employee):
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            return FileResponse(doc.file.open('rb'), content_type='application/pdf')
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    def get_queryset(self):
        # Allow HR Managers to see all, others only their own or their managed employees?
        # For now, keep it simple but secure.
        user = self.request.user
        if not user.is_authenticated:
            return EmployeeDocument.objects.none()
            
        if IsHRManager().has_permission(self.request, self):
            return EmployeeDocument.objects.all()
            
        # Regular users can only see their own documents
        if hasattr(user, 'employee'):
            return EmployeeDocument.objects.filter(employee=user.employee)
            
        return EmployeeDocument.objects.none()
