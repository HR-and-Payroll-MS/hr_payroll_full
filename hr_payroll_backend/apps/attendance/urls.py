from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, AttendanceStatsView, DepartmentAttendanceView, DepartmentAttendanceDetailView, MyAttendanceView, ManagerDepartmentAttendanceView, OvertimeRequestViewSet, WorkScheduleViewSet

router = DefaultRouter()
router.register(r'requests/overtime', OvertimeRequestViewSet, basename='overtime-requests') # Specific path first
router.register(r'schedules', WorkScheduleViewSet, basename='work-schedules')
router.register(r'', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('departments/', DepartmentAttendanceView.as_view(), name='department-attendance'),
    path('departments/<int:pk>/', DepartmentAttendanceDetailView.as_view(), name='department-attendance-detail'),
    path('employees/<int:employee_id>/attendances/stats/', AttendanceStatsView.as_view(), name='attendance-stats'),
    path('manager/department/', ManagerDepartmentAttendanceView.as_view(), name='manager-department-attendance'),
    path('my/', MyAttendanceView.as_view(), name='my-attendance'),
    path('', include(router.urls)),
]
