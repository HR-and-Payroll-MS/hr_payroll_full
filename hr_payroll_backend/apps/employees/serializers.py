"""
Serializers for Employees app.
Structured to match frontend expectations with nested general/job/payroll format.
"""
from decimal import Decimal
from rest_framework import serializers
from apps.attendance.serializers import WorkScheduleSerializer
from .models import Employee, EmployeeDocument
from apps.users.models import (
    EmployeeGeneralInfo,
    EmployeeAddressInfo,
    EmployeeEmergencyInfo,
)
from apps.company.models import (
    EmployeeJobInfo,
    EmployeeContractInfo,
)
from apps.payroll.models import EmployeePayrollInfo
from apps.attendance.models import WorkSchedule, EmployeeWorkScheduleLink
from apps.departments.models import Department
from apps.users.models import User


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    """Serializer for employee documents."""
    
    class Meta:
        model = EmployeeDocument
        fields = [
            'id', 'name', 'file', 'document_type', 'uploaded_at', 
            'uploaded_by', 'uploaded_by_name', 'uploaded_by_photo', 
            'uploaded_by_job_title', 'notes'
        ]
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by']

    uploaded_by_name = serializers.SerializerMethodField()
    uploaded_by_photo = serializers.SerializerMethodField()
    uploaded_by_job_title = serializers.SerializerMethodField()

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.fullname if obj.uploaded_by else None

    def get_uploaded_by_photo(self, obj):
        if obj.uploaded_by and obj.uploaded_by.photo and getattr(obj.uploaded_by.photo, 'name', None):
            request = self.context.get('request')
            try:
                return request.build_absolute_uri(obj.uploaded_by.photo.url) if request else obj.uploaded_by.photo.url
            except Exception:
                return None
        return None

    def get_uploaded_by_job_title(self, obj):
        if not obj.uploaded_by:
            return None
        ji = getattr(obj.uploaded_by, 'job_info', None)
        return getattr(ji, 'job_title', None)


class EmployeeGeneralSerializer(serializers.Serializer):
    """Read-only general + address + emergency info built from partition tables."""
    firstname = serializers.CharField()
    lastname = serializers.CharField()
    fullname = serializers.CharField()
    gender = serializers.CharField(required=False)
    dateofbirth = serializers.DateField(required=False)
    maritalstatus = serializers.CharField(required=False)
    nationality = serializers.CharField(required=False)
    personaltaxid = serializers.CharField(required=False)
    socialinsurance = serializers.CharField(required=False)
    healthinsurance = serializers.CharField(required=False)
    phonenumber = serializers.CharField(required=False)
    emailaddress = serializers.CharField(required=False)
    photo = serializers.ImageField(required=False)
    profilepicture = serializers.ImageField(required=False)
    # Address
    primaryaddress = serializers.CharField(required=False)
    country = serializers.CharField(required=False)
    state = serializers.CharField(required=False)
    city = serializers.CharField(required=False)
    postcode = serializers.CharField(required=False)
    # Emergency
    emefullname = serializers.CharField(required=False)
    emephonenumber = serializers.CharField(required=False)
    emestate = serializers.CharField(required=False)
    emecity = serializers.CharField(required=False)
    emepostcode = serializers.CharField(required=False)

    def to_representation(self, obj: Employee):
        request = self.context.get('request') if hasattr(self, 'context') else None
        g = getattr(obj, 'general_info', None)
        a = getattr(obj, 'address_info', None)
        e = getattr(obj, 'emergency_info', None)
        # Safe photo URL builder
        photo_url = None
        if obj.photo and getattr(obj.photo, 'name', None):
            try:
                photo_url = request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
            except Exception:
                photo_url = None
        return {
            'firstname': obj.first_name,
            'lastname': obj.last_name,
            'fullname': obj.fullname,
            'gender': getattr(g, 'gender', None),
            'dateofbirth': getattr(g, 'date_of_birth', None),
            'maritalstatus': getattr(g, 'marital_status', None),
            'nationality': getattr(g, 'nationality', None),
            'personaltaxid': getattr(g, 'personal_tax_id', None),
            'socialinsurance': getattr(g, 'social_insurance', None),
            'healthinsurance': getattr(g, 'health_care', None),
            'phonenumber': getattr(g, 'phone', None),
            'emailaddress': getattr(g, 'email', None),
            'photo': photo_url,
            'profilepicture': photo_url,
            'primaryaddress': getattr(a, 'primary_address', None),
            'country': getattr(a, 'country', None),
            'state': getattr(a, 'state', None),
            'city': getattr(a, 'city', None),
            'postcode': getattr(a, 'postcode', None),
            'emefullname': getattr(e, 'fullname', None),
            'emephonenumber': getattr(e, 'phone', None),
            'emestate': getattr(e, 'state', None),
            'emecity': getattr(e, 'city', None),
            'emepostcode': getattr(e, 'postcode', None),
        }


class EmployeeJobSerializer(serializers.Serializer):
    """Read-only job + contract + workschedule using company/attendance partitions."""
    employeeid = serializers.CharField(required=False)
    jobtitle = serializers.CharField(required=False)
    positiontype = serializers.CharField(required=False)
    department = serializers.CharField(required=False)
    linemanager = serializers.DictField(required=False)
    employmenttype = serializers.CharField(required=False)
    joindate = serializers.DateField(required=False)
    serviceyear = serializers.IntegerField(required=False)
    workschedule = serializers.DictField(required=False)
    workschedule_id = serializers.IntegerField(required=False)
    contractnumber = serializers.CharField(required=False)
    contractname = serializers.CharField(required=False)
    contracttype = serializers.CharField(required=False)
    startdate = serializers.DateField(required=False)
    enddate = serializers.DateField(required=False)

    def to_representation(self, obj: Employee):
        request = self.context.get('request')
        job = getattr(obj, 'job_info', None)
        contract = getattr(obj, 'contract_info', None)

        # Department and line manager
        dep = getattr(job, 'department', None)
        lm = getattr(job, 'line_manager', None)

        department_name = dep.name if dep else None
        line_manager_block = None
        if lm:
            lm_photo = None
            if lm.photo and getattr(lm.photo, 'name', None):
                try:
                    lm_photo = request.build_absolute_uri(lm.photo.url) if request else lm.photo.url
                except Exception:
                    lm_photo = None
            line_manager_block = {"name": lm.fullname, "photo": lm_photo, "id": lm.id}
        elif dep and dep.manager == obj:
            lm_photo = None
            if obj.photo and getattr(obj.photo, 'name', None):
                try:
                    lm_photo = request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
                except Exception:
                    lm_photo = None
            line_manager_block = {"name": f"{obj.fullname} (Self)", "photo": lm_photo, "id": obj.id}

        # Work schedule
        workschedule_data = None
        workschedule_id = None
        link = getattr(obj, 'work_schedule_link', None)
        ws = getattr(link, 'work_schedule', None)
        if ws:
            workschedule_data = WorkScheduleSerializer(ws).data
            workschedule_id = ws.id

        return {
            'employeeid': (job.employee_code if job else '') or '',
            'jobtitle': (job.job_title if job else '') or '',
            'positiontype': (job.position if job else '') or '',
            'department': department_name,
            'linemanager': line_manager_block,
            'employmenttype': (job.employment_type if job else '') or '',
            'joindate': getattr(job, 'join_date', None),
            'serviceyear': (job.service_years if job else 0) or 0,
            'workschedule': workschedule_data,
            'workschedule_id': workschedule_id,
            'contractnumber': (contract.contract_number if contract else '') or '',
            'contractname': (contract.contract_name if contract else '') or '',
            'contracttype': (contract.contract_type if contract else '') or '',
            'startdate': getattr(contract, 'contract_start_date', None),
            'enddate': getattr(contract, 'contract_end_date', None),
        }


class EmployeePayrollSerializer(serializers.Serializer):
    """Read-only payroll using payroll partition."""
    employeestatus = serializers.CharField()
    salary = serializers.DecimalField(max_digits=12, decimal_places=2)
    lastworkingdate = serializers.DateField(required=False)
    offset = serializers.DecimalField(max_digits=12, decimal_places=2)
    oneoff = serializers.DecimalField(max_digits=12, decimal_places=2)
    bankname = serializers.CharField(required=False)
    bankaccount = serializers.CharField(required=False)

    def to_representation(self, obj: Employee):
        p = getattr(obj, 'payroll_info', None)
        return {
            'employeestatus': (p.status if p else None),
            'salary': (p.salary if p else Decimal('0')),
            'lastworkingdate': getattr(p, 'last_working_date', None),
            'offset': (p.offset if p else Decimal('0')),
            'oneoff': (p.one_off if p else Decimal('0')),
            'bankname': getattr(p, 'bank_name', None),
            'bankaccount': getattr(p, 'bank_account', None),
        }


class EmployeeListSerializer(serializers.ModelSerializer):
    """
    Serializer for employee list with nested structure.
    Matches frontend's expected format with general/job/payroll objects.
    """
    general = serializers.SerializerMethodField()
    job = serializers.SerializerMethodField()
    payroll = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = ['id', 'general', 'job', 'payroll']
    
    def get_general(self, obj):
        return EmployeeGeneralSerializer(obj).data
    
    def get_job(self, obj):
        return EmployeeJobSerializer(obj, context=self.context).data
    
    def get_payroll(self, obj):
        return EmployeePayrollSerializer(obj).data


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for single employee view.
    Includes nested structure and documents.
    """
    general = serializers.SerializerMethodField()
    job = serializers.SerializerMethodField()
    payroll = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = ['id', 'general', 'job', 'payroll', 'documents', 'created_at', 'updated_at']
    
    def get_general(self, obj):
        return EmployeeGeneralSerializer(obj).data
    
    def get_job(self, obj):
        return EmployeeJobSerializer(obj, context=self.context).data
    
    def get_payroll(self, obj):
        return EmployeePayrollSerializer(obj).data

    def get_documents(self, obj):
        docs = EmployeeDocumentSerializer(
            obj.documents.all(), 
            many=True, 
            context={'request': self.context.get('request')}
        ).data
        return {"files": docs}


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating employees.
    Accepts flat structure matching frontend form submission.
    """
    documents = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    # Write-only fields for nested updates
    general = serializers.DictField(required=False, write_only=True)
    job = serializers.DictField(required=False, write_only=True)
    payroll = serializers.DictField(required=False, write_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'first_name', 'last_name', 'photo',
            # Documents
            'documents',
            # Nested update fields
            'general', 'job', 'payroll'
        ]
    
    def to_internal_value(self, data):
        """Preserve files while letting DRF parse nested dicts as-is."""
        original_files = None
        if hasattr(data, 'getlist'):
            original_files = data.getlist('documents')
        if hasattr(data, 'dict'):
            data = data.dict()
        elif isinstance(data, dict):
            data = data.copy()
        if original_files:
            data['documents'] = original_files
        # Remove read-format documents dict
        if 'documents' in data and isinstance(data['documents'], dict):
            data.pop('documents')
        if 'documents' in data and data['documents'] in [None, '', []]:
            data.pop('documents')
        return super().to_internal_value(data)

    def create(self, validated_data):
        from django.db import transaction
        documents_data = validated_data.pop('documents', [])
        general_dict = validated_data.pop('general', None)
        job_dict = validated_data.pop('job', None)
        payroll_dict = validated_data.pop('payroll', None)
        request = self.context.get('request')
        raw = getattr(request, 'data', {}) if request else {}

        def _get_raw(key, default=None):
            if hasattr(raw, 'getlist'):
                vals = raw.getlist(key)
                if vals:
                    return vals[0]
            v = raw.get(key, default)
            if isinstance(v, list):
                return v[0] if v else default
            return v

        with transaction.atomic():
            employee = Employee.objects.create(**validated_data)

            # Users partitions: general, address, emergency
            EmployeeGeneralInfo.objects.create(
                employee=employee,
                gender=(general_dict or {}).get('gender') or _get_raw('gender'),
                date_of_birth=(general_dict or {}).get('date_of_birth') or _get_raw('date_of_birth'),
                marital_status=(general_dict or {}).get('marital_status') or _get_raw('marital_status'),
                nationality=(general_dict or {}).get('nationality') or _get_raw('nationality'),
                personal_tax_id=(general_dict or {}).get('personal_tax_id') or _get_raw('personal_tax_id'),
                social_insurance=(general_dict or {}).get('social_insurance') or _get_raw('social_insurance'),
                health_care=(general_dict or {}).get('health_care') or _get_raw('health_care'),
                phone=(general_dict or {}).get('phone') or _get_raw('phone'),
                email=(general_dict or {}).get('email') or _get_raw('email'),
            )
            EmployeeAddressInfo.objects.create(
                employee=employee,
                primary_address=(general_dict or {}).get('primary_address') or _get_raw('primary_address'),
                country=(general_dict or {}).get('country') or _get_raw('country'),
                state=(general_dict or {}).get('state') or _get_raw('state'),
                city=(general_dict or {}).get('city') or _get_raw('city'),
                postcode=(general_dict or {}).get('postcode') or _get_raw('postcode'),
            )
            EmployeeEmergencyInfo.objects.create(
                employee=employee,
                fullname=(general_dict or {}).get('emergency_fullname') or _get_raw('emergency_fullname'),
                phone=(general_dict or {}).get('emergency_phone') or _get_raw('emergency_phone'),
                relationship=(general_dict or {}).get('emergency_relationship') or _get_raw('emergency_relationship'),
                state=(general_dict or {}).get('emergency_state') or _get_raw('emergency_state'),
                city=(general_dict or {}).get('emergency_city') or _get_raw('emergency_city'),
                postcode=(general_dict or {}).get('emergency_postcode') or _get_raw('emergency_postcode'),
            )

            # Company partitions: job + contract
            # Generate employee code if missing
            emp_code = (job_dict or {}).get('employee_code') or _get_raw('employee_code')
            if not emp_code:
                last = EmployeeJobInfo.objects.order_by('-id').first()
                next_num = (last.id + 1) if last else 1
                emp_code = f"EMP{next_num:04d}"
            # Resolve department (optional)
            from apps.departments.models import Department
            dept_id = (job_dict or {}).get('department') or _get_raw('department')
            department = None
            try:
                if dept_id:
                    department = Department.objects.filter(id=dept_id).first()
            except Exception:
                department = None

            EmployeeJobInfo.objects.create(
                employee=employee,
                employee_code=emp_code,
                job_title=(job_dict or {}).get('job_title') or _get_raw('job_title'),
                position=(job_dict or {}).get('position') or _get_raw('position'),
                employment_type=(job_dict or {}).get('employment_type') or _get_raw('employment_type'),
                join_date=(job_dict or {}).get('join_date') or _get_raw('join_date'),
                service_years=(job_dict or {}).get('service_years', _get_raw('service_years', 0)) or 0,
                department=department,
            )
            EmployeeContractInfo.objects.create(
                employee=employee,
                contract_number=(job_dict or {}).get('contract_number') or _get_raw('contract_number'),
                contract_name=(job_dict or {}).get('contract_name') or _get_raw('contract_name'),
                contract_type=(job_dict or {}).get('contract_type') or _get_raw('contract_type'),
                contract_start_date=(job_dict or {}).get('contract_start_date') or _get_raw('contract_start_date'),
                contract_end_date=(job_dict or {}).get('contract_end_date') or _get_raw('contract_end_date'),
            )

            # Payroll partition
            EmployeePayrollInfo.objects.create(
                employee=employee,
                status=(payroll_dict or {}).get('status') or _get_raw('status', 'Active'),
                salary=(payroll_dict or {}).get('salary') or _get_raw('salary', 0),
                last_working_date=(payroll_dict or {}).get('last_working_date') or _get_raw('last_working_date'),
                offset=(payroll_dict or {}).get('offset') or _get_raw('offset', 0),
                one_off=(payroll_dict or {}).get('one_off') or _get_raw('one_off', 0),
                bank_name=(payroll_dict or {}).get('bank_name') or _get_raw('bank_name'),
                bank_account=(payroll_dict or {}).get('bank_account') or _get_raw('bank_account'),
            )

            # Work schedule link (optional)
            from apps.attendance.models import EmployeeWorkScheduleLink, WorkSchedule
            ws_id = (job_dict or {}).get('work_schedule') or _get_raw('work_schedule')
            try:
                if ws_id:
                    link, _ = EmployeeWorkScheduleLink.objects.get_or_create(employee=employee)
                    link.work_schedule = WorkSchedule.objects.filter(id=ws_id).first()
                    link.save()
            except Exception:
                pass

            # Documents
            uploader = None
            request = self.context.get('request')
            if request and hasattr(request.user, 'employee'):
                uploader = request.user.employee
            for doc_file in documents_data:
                EmployeeDocument.objects.create(
                    employee=employee,
                    file=doc_file,
                    name=doc_file.name,
                    document_type='General',
                    uploaded_by=uploader
                )

        return employee

    def update(self, instance, validated_data):
        from django.db import transaction
        print(f"DEBUG: update called. validated_data: {list(validated_data.keys())}")
        general_dict = validated_data.pop('general', None)
        job_dict = validated_data.pop('job', None)
        payroll_dict = validated_data.pop('payroll', None)
        documents_data = validated_data.pop('documents', None)

        with transaction.atomic():
            # Update base Employee legacy fields for compatibility
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            # Ensure partition records exist
            g = getattr(instance, 'general_info', None) or EmployeeGeneralInfo.objects.create(employee=instance)
            a = getattr(instance, 'address_info', None) or EmployeeAddressInfo.objects.create(employee=instance)
            e = getattr(instance, 'emergency_info', None) or EmployeeEmergencyInfo.objects.create(employee=instance)
            j = getattr(instance, 'job_info', None) or EmployeeJobInfo.objects.create(employee=instance)
            c = getattr(instance, 'contract_info', None) or EmployeeContractInfo.objects.create(employee=instance)
            p = getattr(instance, 'payroll_info', None) or EmployeePayrollInfo.objects.create(employee=instance)

            if isinstance(general_dict, dict):
                g.gender = general_dict.get('gender', g.gender)
                g.date_of_birth = general_dict.get('dateofbirth', g.date_of_birth)
                g.marital_status = general_dict.get('maritalstatus', g.marital_status)
                g.nationality = general_dict.get('nationality', g.nationality)
                g.personal_tax_id = general_dict.get('personaltaxid', g.personal_tax_id)
                g.social_insurance = general_dict.get('socialinsurance', g.social_insurance)
                g.health_care = general_dict.get('healthinsurance', g.health_care)
                g.phone = general_dict.get('phonenumber', g.phone)
                g.email = general_dict.get('emailaddress', g.email)
                g.save()
                a.primary_address = general_dict.get('primaryaddress', a.primary_address)
                a.country = general_dict.get('country', a.country)
                a.state = general_dict.get('state', a.state)
                a.city = general_dict.get('city', a.city)
                a.postcode = general_dict.get('postcode', a.postcode)
                a.save()
                e.fullname = general_dict.get('emefullname', e.fullname)
                e.phone = general_dict.get('emephonenumber', e.phone)
                e.save()

            if isinstance(job_dict, dict):
                j.employee_code = job_dict.get('employeeid', j.employee_code)
                j.job_title = job_dict.get('jobtitle', j.job_title)
                j.position = job_dict.get('positiontype', j.position)
                j.employment_type = job_dict.get('employmenttype', j.employment_type)
                j.join_date = job_dict.get('joindate', j.join_date)
                j.service_years = job_dict.get('serviceyear', j.service_years)
                j.save()
                c.contract_number = job_dict.get('contractnumber', c.contract_number)
                c.contract_name = job_dict.get('contractname', c.contract_name)
                c.contract_type = job_dict.get('contracttype', c.contract_type)
                c.contract_start_date = job_dict.get('startdate', c.contract_start_date)
                c.contract_end_date = job_dict.get('enddate', c.contract_end_date)
                c.save()

            if isinstance(payroll_dict, dict):
                p.status = payroll_dict.get('employeestatus', p.status)
                p.salary = payroll_dict.get('salary', p.salary)
                p.last_working_date = payroll_dict.get('lastworkingdate', p.last_working_date)
                p.offset = payroll_dict.get('offset', p.offset)
                p.one_off = payroll_dict.get('oneoff', p.one_off)
                p.bank_name = payroll_dict.get('bankname', p.bank_name)
                p.bank_account = payroll_dict.get('bankaccount', p.bank_account)
                p.save()

            if documents_data:
                uploader = None
                request = self.context.get('request')
                if request and hasattr(request.user, 'employee'):
                    uploader = request.user.employee
                for doc_file in documents_data:
                    EmployeeDocument.objects.create(
                        employee=instance,
                        name=doc_file.name,
                        file=doc_file,
                        document_type='General',
                        uploaded_by=uploader
                    )
        return instance
