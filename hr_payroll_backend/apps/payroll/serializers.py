"""Serializers for Payroll app including TaxCode, Allowance, Deduction."""
from django.db import transaction
from rest_framework import serializers
from .models import (
    PayrollPeriod, Payslip, PayrollApprovalLog, TaxCode, TaxCodeVersion,
    Allowance, Deduction, TaxBracket, EmployeeAllowance, EmployeeDeduction
)


class PayrollApprovalLogSerializer(serializers.ModelSerializer):
    """Serializer for payroll approval logs."""
    performed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PayrollApprovalLog
        fields = [
            'id', 'action', 'performed_by', 'performed_by_name',
            'performed_at', 'notes', 'previous_status', 'new_status'
        ]
    
    def get_performed_by_name(self, obj):
        return obj.performed_by.fullname if obj.performed_by else None


class PayslipSerializer(serializers.ModelSerializer):
    """Serializer for individual payslips."""
    employee_name = serializers.SerializerMethodField()
    employee_id_display = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()
    bank_account = serializers.SerializerMethodField()
    tax_code_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Payslip
        fields = [
            'id', 'employee', 'employee_name', 'employee_id_display',
            'department', 'job_title', 'bank_account',
            'base_salary', 'total_allowances', 'bonus',
            'overtime_hours', 'overtime_rate', 'overtime_pay',
            'total_deductions', 'tax_amount', 'gross_pay', 'net_pay',
            'tax_code', 'tax_code_version', 'tax_code_display',
            'worked_days', 'absent_days', 'leave_days',
            'has_issues', 'issue_notes', 'details'
        ]
    
    def get_employee_name(self, obj):
        return obj.employee.fullname
    
    def get_employee_id_display(self, obj):
        return obj.employee.employee_id
    
    def get_department(self, obj):
        return obj.employee.department.name if obj.employee.department else None
    
    def get_job_title(self, obj):
        return obj.employee.job_title
    
    def get_bank_account(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') else None
        bank = obj.employee.bank_name or ''
        account = obj.employee.bank_account or ''
        full = f"{bank} {account}".strip()

        # Determine access: only HR Managers or the employee themselves (or superuser) may see full account
        can_view_full = False
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            user = request.user
            if user.is_superuser:
                can_view_full = True
            # HR Manager group
            if user.groups.filter(name__iexact='HR Manager').exists():
                can_view_full = True
            # Employee owner
            if hasattr(user, 'employee') and user.employee and user.employee == obj.employee:
                can_view_full = True

        if not account:
            return bank or None

        if can_view_full:
            return full

        # Fallback: masked account
        if len(account) >= 4:
            return f"{bank} ****{account[-4:]}" if bank else f"****{account[-4:]}"
        return f"{bank} {account}".strip()
    
    def get_tax_code_display(self, obj):
        if obj.tax_code and obj.tax_code_version:
            return f"{obj.tax_code.name} ({obj.tax_code_version.version})"
        elif obj.tax_code:
            return obj.tax_code.name
        return None


class PayslipUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating individual payslips (Payroll Officer edits)."""
    class Meta:
        model = Payslip
        fields = [
            'bonus', 'total_allowances', 'total_deductions',
            'has_issues', 'issue_notes', 'details'
        ]


class PayrollPeriodListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for payroll period lists."""
    created_by_name = serializers.SerializerMethodField()
    payslips_count = serializers.SerializerMethodField()
    total_net_pay = serializers.SerializerMethodField()
    
    class Meta:
        model = PayrollPeriod
        fields = [
            'id', 'month', 'year', 'status', 'created_by', 'created_by_name',
            'created_at', 'submitted_at', 'approved_at', 'finalized_at',
            'payslips_count', 'total_net_pay'
        ]
    
    def get_created_by_name(self, obj):
        return obj.created_by.fullname if obj.created_by else None
    
    def get_payslips_count(self, obj):
        return obj.payslips.count()
    
    def get_total_net_pay(self, obj):
        return sum(float(p.net_pay) for p in obj.payslips.all())


class PayrollPeriodSerializer(serializers.ModelSerializer):
    """Full serializer for payroll periods with nested payslips and logs."""
    payslips = PayslipSerializer(many=True, read_only=True)
    approval_logs = PayrollApprovalLogSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    submitted_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PayrollPeriod
        fields = [
            'id', 'month', 'year', 'status', 'notes',
            'created_by', 'created_by_name', 'created_at',
            'submitted_by', 'submitted_by_name', 'submitted_at',
            'approved_by', 'approved_by_name', 'approved_at',
            'finalized_at', 'payslips', 'approval_logs'
        ]
    
    def get_created_by_name(self, obj):
        return obj.created_by.fullname if obj.created_by else None
    
    def get_submitted_by_name(self, obj):
        return obj.submitted_by.fullname if obj.submitted_by else None
    
    def get_approved_by_name(self, obj):
        return obj.approved_by.fullname if obj.approved_by else None


class PayrollPeriodCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new payroll period."""
    class Meta:
        model = PayrollPeriod
        fields = ['month', 'year']
    
    def validate(self, data):
        # Check if period already exists
        if PayrollPeriod.objects.filter(month=data['month'], year=data['year']).exists():
            raise serializers.ValidationError(
                f"Payroll period for {data['month']} {data['year']} already exists."
            )
        return data




# ============== TAX CODE SERIALIZERS ==============

class TaxBracketSerializer(serializers.ModelSerializer):
    """Serializer for tax brackets."""

    class Meta:
        model = TaxBracket
        fields = ['id', 'tax_code_version', 'min_income', 'max_income', 'rate', 'applies_to', 'created_at']
        read_only_fields = ['created_at']
        extra_kwargs = {
            # When nested, parent sets this; keep optional to avoid validation failure
            'tax_code_version': {'required': False},
        }


class TaxCodeVersionSerializer(serializers.ModelSerializer):
    """Serializer for tax code versions with nested brackets."""

    tax_brackets = TaxBracketSerializer(many=True, required=False)
    allowances = serializers.SerializerMethodField()

    class Meta:
        model = TaxCodeVersion
        fields = [
            'id', 'tax_code', 'version', 'valid_from', 'valid_to',
            'is_active', 'is_locked', 'income_tax_config', 'pension_config',
            'rounding_rules', 'compliance_notes', 'statutory_deductions_config',
            'exemptions_config', 'tax_brackets', 'allowances', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_allowances(self, obj):
        qs = obj.allowances.filter(is_active=True)
        return AllowanceListSerializer(qs, many=True).data

    def _write_brackets(self, version, brackets_data):
        if not brackets_data:
            return
        objs = []
        for bracket in brackets_data:
            data = {
                'tax_code_version': version,
                'min_income': bracket.get('min_income'),
                'max_income': bracket.get('max_income'),
                'rate': bracket.get('rate'),
                'applies_to': bracket.get('applies_to', []),
            }
            objs.append(TaxBracket(**data))
        TaxBracket.objects.bulk_create(objs)

    @transaction.atomic
    def create(self, validated_data):
        brackets_data = validated_data.pop('tax_brackets', [])
        version = super().create(validated_data)
        self._write_brackets(version, brackets_data)
        return version

    @transaction.atomic
    def update(self, instance, validated_data):
        brackets_data = validated_data.pop('tax_brackets', None)
        instance = super().update(instance, validated_data)
        if brackets_data is not None:
            instance.tax_brackets.all().delete()
            self._write_brackets(instance, brackets_data)
        return instance


class TaxCodeSerializer(serializers.ModelSerializer):
    """Serializer for tax codes with nested versions, allowances, and deductions."""
    versions = TaxCodeVersionSerializer(many=True, read_only=True)
    allowances = serializers.SerializerMethodField()
    deductions = serializers.SerializerMethodField()
    
    class Meta:
        model = TaxCode
        fields = ['id', 'code', 'name', 'description', 'is_active', 
                  'versions', 'allowances', 'deductions', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_allowances(self, obj):
        # Legacy/top-level allowances without version binding
        qs = obj.allowances.filter(is_active=True, tax_code_version__isnull=True)
        return AllowanceListSerializer(qs, many=True).data
    
    def get_deductions(self, obj):
        return DeductionListSerializer(obj.deductions.filter(is_active=True), many=True).data


class TaxCodeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for tax code lists."""
    versions = TaxCodeVersionSerializer(many=True, read_only=True)
    
    class Meta:
        model = TaxCode
        fields = ['id', 'code', 'name', 'is_active', 'versions']


# ============== ALLOWANCE SERIALIZERS ==============

class AllowanceSerializer(serializers.ModelSerializer):
    """Full serializer for allowances with CRUD."""
    tax_code_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Allowance
        fields = [
            'id', 'code', 'name', 'description', 'calculation_type',
            'default_value', 'percentage_value', 'formula', 'is_taxable',
            'is_active', 'applies_to', 'tax_code', 'tax_code_version', 'tax_code_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_tax_code_name(self, obj):
        return obj.tax_code.name if obj.tax_code else None


class AllowanceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for allowance lists."""
    class Meta:
        model = Allowance
        fields = ['id', 'code', 'name', 'calculation_type', 'default_value', 'is_taxable', 'is_active']


# ============== DEDUCTION SERIALIZERS ==============

class DeductionSerializer(serializers.ModelSerializer):
    """Full serializer for deductions with CRUD."""
    tax_code_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Deduction
        fields = [
            'id', 'code', 'name', 'description', 'calculation_type',
            'default_value', 'percentage_value', 'formula', 'is_mandatory',
            'is_pre_tax', 'is_active', 'applies_to', 'tax_code', 'tax_code_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_tax_code_name(self, obj):
        return obj.tax_code.name if obj.tax_code else None


class DeductionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for deduction lists."""
    class Meta:
        model = Deduction
        fields = ['id', 'code', 'name', 'calculation_type', 'default_value', 'is_mandatory', 'is_active']


# ============== EMPLOYEE ASSIGNMENT SERIALIZERS ==============

class EmployeeAllowanceSerializer(serializers.ModelSerializer):
    """Serializer for employee allowance assignments."""
    allowance_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeAllowance
        fields = ['id', 'employee', 'allowance', 'allowance_name', 'custom_value', 
                  'is_active', 'start_date', 'end_date', 'created_at']
        read_only_fields = ['created_at']
    
    def get_allowance_name(self, obj):
        return obj.allowance.name


class EmployeeDeductionSerializer(serializers.ModelSerializer):
    """Serializer for employee deduction assignments."""
    deduction_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeDeduction
        fields = ['id', 'employee', 'deduction', 'deduction_name', 'custom_value',
                  'is_active', 'start_date', 'end_date', 'created_at']
        read_only_fields = ['created_at']
    
    def get_deduction_name(self, obj):
        return obj.deduction.name
