"""Admin configuration for Payroll app."""
from django.contrib import admin
from .models import (
    PayrollPeriod, Payslip, TaxCode, TaxCodeVersion,
    Allowance, Deduction, TaxBracket, EmployeeAllowance, EmployeeDeduction
)


class PayslipInline(admin.TabularInline):
    model = Payslip
    extra = 0


@admin.register(PayrollPeriod)
class PayrollPeriodAdmin(admin.ModelAdmin):
    list_display = ['month', 'year', 'status', 'created_at']
    list_filter = ['status', 'year']
    inlines = [PayslipInline]


class TaxCodeVersionInline(admin.TabularInline):
    model = TaxCodeVersion
    extra = 0


class TaxBracketInline(admin.TabularInline):
    model = TaxBracket
    extra = 0


@admin.register(TaxCode)
class TaxCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['code', 'name']
    inlines = [TaxCodeVersionInline]


@admin.register(TaxCodeVersion)
class TaxCodeVersionAdmin(admin.ModelAdmin):
    list_display = ['tax_code', 'version', 'valid_from', 'valid_to', 'is_active', 'is_locked']
    list_filter = ['is_active', 'is_locked']
    inlines = [TaxBracketInline]


@admin.register(Allowance)
class AllowanceAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'calculation_type', 'default_value', 'is_taxable', 'is_active']
    list_filter = ['is_taxable', 'is_active', 'calculation_type']
    search_fields = ['code', 'name']


@admin.register(Deduction)
class DeductionAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'calculation_type', 'default_value', 'is_mandatory', 'is_active']
    list_filter = ['is_mandatory', 'is_active', 'calculation_type']
    search_fields = ['code', 'name']


@admin.register(TaxBracket)
class TaxBracketAdmin(admin.ModelAdmin):
    list_display = ['tax_code_version', 'min_income', 'max_income', 'rate']
    list_filter = ['tax_code_version']


@admin.register(EmployeeAllowance)
class EmployeeAllowanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'allowance', 'custom_value', 'is_active']
    list_filter = ['is_active']


@admin.register(EmployeeDeduction)
class EmployeeDeductionAdmin(admin.ModelAdmin):
    list_display = ['employee', 'deduction', 'custom_value', 'is_active']
    list_filter = ['is_active']
