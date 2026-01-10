from django.urls import path
from .views import CompanyInfoView, CheckNetworkView, DashboardStatsView

urlpatterns = [
    path('', CompanyInfoView.as_view(), name='company-info'),
    path('check-network/', CheckNetworkView.as_view(), name='check-network'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
