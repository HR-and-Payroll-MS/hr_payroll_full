"""URL configuration for Payroll app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PayrollPeriodViewSet, PayrollReportsView, PayslipViewSet, MyPayslipsView,
    TaxCodeViewSet, TaxCodeVersionViewSet, TaxBracketViewSet,
    AllowanceViewSet, DeductionViewSet,
    EmployeeAllowanceViewSet, EmployeeDeductionViewSet
)

router = DefaultRouter()
router.register('periods', PayrollPeriodViewSet, basename='payroll-period')
router.register('payslips', PayslipViewSet, basename='payslip')
router.register('tax-codes', TaxCodeViewSet, basename='tax-code')
router.register('tax-code-versions', TaxCodeVersionViewSet, basename='tax-code-version')
router.register('tax-brackets', TaxBracketViewSet, basename='tax-bracket')
router.register('allowances', AllowanceViewSet, basename='allowance')
router.register('deductions', DeductionViewSet, basename='deduction')
router.register('employee-allowances', EmployeeAllowanceViewSet, basename='employee-allowance')
router.register('employee-deductions', EmployeeDeductionViewSet, basename='employee-deduction')

urlpatterns = [
    path('reports/', PayrollReportsView.as_view(), name='payroll-reports'),
    path('my-payslips/', MyPayslipsView.as_view(), name='my-payslips'),
    path('', include(router.urls)),
]

