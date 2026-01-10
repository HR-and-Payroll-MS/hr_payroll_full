"""
URL configuration for HR & Payroll Management System.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Authentication - Djoser JWT endpoints
    path('api/v1/auth/', include('djoser.urls')),
    path('api/v1/auth/djoser/', include('djoser.urls.jwt')),
    
    # Users
    path('api/v1/users/', include('apps.users.urls')),
    
    # Employees
    path('api/v1/employees/', include('apps.employees.urls')),
    
    # Departments
    path('api/v1/departments/', include('apps.departments.urls')),
    
    # Attendance
    path('api/v1/attendances/', include('apps.attendance.urls')),
    
    # Leave Requests
    path('api/v1/leaves/', include('apps.leaves.urls')),
    
    # Notifications
    path('api/v1/notifications/', include('apps.notifications.urls')),
    
    # Announcements
    path('api/v1/announcements/', include('apps.announcements.urls')),
    
    # Policies (organization-based)
    path('api/v1/orgs/', include('apps.policies.urls')),
    
    # Payroll
    path('api/v1/payroll/', include('apps.payroll.urls')),
    
    # Efficiency / Performance
    path('api/v1/efficiency/', include('apps.efficiency.urls')),
    
    # Company Info
    path('api/v1/company-info/', include('apps.company.urls')),
    path('api/v1/support/', include('apps.support.urls')),
    
    # Chat
    path('api/v1/chat/', include('apps.chat.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
