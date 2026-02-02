"""
Serializers for Employees app.
Structured to match frontend expectations with nested general/job/payroll format.
"""
from rest_framework import serializers
from apps.attendance.serializers import WorkScheduleSerializer
from .models import Employee, EmployeeDocument
from apps.attendance.models import WorkSchedule
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
        if obj.uploaded_by and obj.uploaded_by.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.uploaded_by.photo.url)
            return obj.uploaded_by.photo.url
        return None

    def get_uploaded_by_job_title(self, obj):
        return obj.uploaded_by.job_title if obj.uploaded_by else None


class EmployeeGeneralSerializer(serializers.Serializer):
    """Nested serializer for general information - READ ONLY for output."""
    firstname = serializers.CharField(source='first_name')
    lastname = serializers.CharField(source='last_name')
    fullname = serializers.CharField(read_only=True)
    gender = serializers.CharField()
    dateofbirth = serializers.DateField(source='date_of_birth')
    maritalstatus = serializers.CharField(source='marital_status')
    nationality = serializers.CharField()
    personaltaxid = serializers.CharField(source='personal_tax_id')
    socialinsurance = serializers.CharField(source='social_insurance')
    healthinsurance = serializers.CharField(source='health_care')
    phonenumber = serializers.CharField(source='phone')
    # Email is authoritative on the linked User account. Prefer User.email, fallback to Employee.email.
    emailaddress = serializers.SerializerMethodField()
    photo = serializers.ImageField()
    profilepicture = serializers.ImageField(source='photo')
    
    # Address
    primaryaddress = serializers.CharField(source='primary_address')
    country = serializers.CharField()
    state = serializers.CharField()
    city = serializers.CharField()
    postcode = serializers.CharField()
    
    # Emergency contact
    emefullname = serializers.CharField(source='emergency_fullname')
    emephonenumber = serializers.CharField(source='emergency_phone')
    emestate = serializers.CharField(source='emergency_state')
    emecity = serializers.CharField(source='emergency_city')
    emepostcode = serializers.CharField(source='emergency_postcode')

    def get_emailaddress(self, obj):
        # Try linked user first
        try:
            if hasattr(obj, 'user_account') and obj.user_account and obj.user_account.email:
                return obj.user_account.email
        except Exception:
            pass
        # No Employee.email field exists anymore; return None if not present on User
        return getattr(obj, 'email', None)


class EmployeeJobSerializer(serializers.Serializer):
    """Nested serializer for job information - READ ONLY for output."""
    employeeid = serializers.CharField(source='employee_id')
    jobtitle = serializers.CharField(source='job_title')
    positiontype = serializers.CharField(source='position')
    department = serializers.SerializerMethodField()
    linemanager = serializers.SerializerMethodField()
    employmenttype = serializers.CharField(source='employment_type')
    joindate = serializers.DateField(source='join_date')
    joindate = serializers.DateField(source='join_date')
    serviceyear = serializers.IntegerField(source='service_years')
    workschedule = serializers.SerializerMethodField()
    workschedule_id = serializers.IntegerField(source='work_schedule_id', read_only=True)
    contractnumber = serializers.CharField(source='contract_number')
    contractname = serializers.CharField(source='contract_name')
    contracttype = serializers.CharField(source='contract_type')
    startdate = serializers.DateField(source='contract_start_date')
    enddate = serializers.DateField(source='contract_end_date')
    
    def get_department(self, obj):
        return obj.department.name if obj.department else None
    
    def get_linemanager(self, obj):
        data = {
            "name": None,
            "photo": None,
            "id": None
        }

        request = self.context.get('request')

        # Use department manager as the single source for line manager display
        if obj.department and obj.department.manager:
            mgr = obj.department.manager
            data["name"] = (
                f"{mgr.fullname} (Self)" if mgr.id == obj.id else mgr.fullname
            )
            data["id"] = mgr.id
            if mgr.photo:
                if request:
                    data["photo"] = request.build_absolute_uri(mgr.photo.url)
                else:
                    data["photo"] = mgr.photo.url
            return data

        return None

    def get_workschedule(self, obj):
        if obj.work_schedule:
             return WorkScheduleSerializer(obj.work_schedule).data
        return None


class EmployeePayrollSerializer(serializers.Serializer):
    """Nested serializer for payroll information - READ ONLY for output."""
    employeestatus = serializers.CharField(source='status')
    salary = serializers.DecimalField(max_digits=12, decimal_places=2)
    lastworkingdate = serializers.DateField(source='last_working_date')
    offset = serializers.DecimalField(max_digits=12, decimal_places=2)
    oneoff = serializers.DecimalField(source='one_off', max_digits=12, decimal_places=2)
    bankname = serializers.CharField(source='bank_name')
    bankaccount = serializers.CharField(source='bank_account')


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
    # Allow passing the desired User.email when creating/updating an employee
    user_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    # Write-only fields for nested updates
    general = serializers.DictField(required=False, write_only=True)
    job = serializers.DictField(required=False, write_only=True)
    payroll = serializers.DictField(required=False, write_only=True)
    
    class Meta:
        model = Employee
        fields = [
            # General in flat format (for flexibility)
            'first_name', 'last_name', 'gender', 'date_of_birth', 'marital_status',
            'nationality', 'personal_tax_id', 'social_insurance', 'health_care',
            'phone', 'photo',
            'user_email',
            'primary_address', 'country', 'state', 'city', 'postcode',
            'emergency_fullname', 'emergency_phone', 'emergency_state', 
            'emergency_city', 'emergency_postcode',
            # Job
            'employee_id', 'job_title', 'position', 'department', 'line_manager',
            'employment_type', 'join_date', 'service_years', 'work_schedule',
            'contract_number', 'contract_name', 'contract_type',
            'contract_start_date', 'contract_end_date',
            # Payroll
            'status', 'salary', 'last_working_date', 'offset', 'one_off',
            'bank_name', 'bank_account',
            # Documents
            'documents',
            # Nested update fields
            'general', 'job', 'payroll'
        ]
    
    def to_internal_value(self, data):
        """
        Pre-process data to flatten nested structures (general, job, payroll)
        into model fields before validation.
        """
        # IMPORTANT: Preserve files BEFORE converting QueryDict to dict
        # QueryDict.dict() loses multi-value keys (like multiple files)
        original_files = None
        if hasattr(data, 'getlist'):
            # This is a QueryDict - get files properly
            original_files = data.getlist('documents')
        
        # Ensure data is a mutable dictionary (handle QueryDict)
        if hasattr(data, 'dict'):
            data = data.dict()
        elif not isinstance(data, dict):
            # If not a dict, let super handle or error
            return super().to_internal_value(data)
        else:
            data = data.copy()
        
        # Restore files if they were in the original QueryDict
        if original_files:
            data['documents'] = original_files

        # Fields that should be None instead of empty string
        date_fields = ['date_of_birth', 'join_date', 'last_working_date', 
                       'contract_start_date', 'contract_end_date']
        numeric_fields = ['service_years', 'salary', 'offset', 'one_off', 
                          'line_manager', 'department', 'work_schedule']
        # Text fields that can be empty strings but should be None in DB
        optional_text_fields = ['phone', 'gender', 'marital_status', 
                                'nationality', 'personal_tax_id', 'social_insurance',
                                'health_care', 'primary_address', 'country', 'state',
                                'city', 'postcode', 'emergency_fullname', 'emergency_phone',
                                'emergency_state', 'emergency_city', 'emergency_postcode',
                                'job_title', 'position', 'employment_type', 'contract_number',
                                'contract_name', 'contract_type', 'status', 'bank_name', 'bank_account']
        
        # Helper to clean empty strings to None for specific field types
        def clean_empty(value):
            if value == '' or value is None:
                return None
            return value
        
        # Handle documents: If it's the read-format dict, remove it.
        # We only want list of files for uploads.
        if 'documents' in data and isinstance(data['documents'], dict):
             data.pop('documents')
        # Remove empty documents list to avoid validation errors
        if 'documents' in data and data['documents'] in [None, '', []]:
             data.pop('documents')

        # General
        general = data.get('general', {})
        if isinstance(general, dict):
             if 'firstname' in general: data['first_name'] = general['firstname']
             if 'lastname' in general: data['last_name'] = general['lastname']
             if 'gender' in general: data['gender'] = general['gender']
             if 'dateofbirth' in general: data['date_of_birth'] = general['dateofbirth']
             if 'maritalstatus' in general: data['marital_status'] = general['maritalstatus']
             if 'nationality' in general: data['nationality'] = general['nationality']
             if 'personaltaxid' in general: data['personal_tax_id'] = general['personaltaxid']
             if 'socialinsurance' in general: data['social_insurance'] = general['socialinsurance']
             if 'healthinsurance' in general: data['health_care'] = general['healthinsurance']
             if 'phonenumber' in general: data['phone'] = general['phonenumber']
             # Capture email for the linked User account (write-only field `user_email`)
             if 'emailaddress' in general: data['user_email'] = general['emailaddress']
             if 'primaryaddress' in general: data['primary_address'] = general['primaryaddress']
             if 'country' in general: data['country'] = general['country']
             if 'state' in general: data['state'] = general['state']
             if 'city' in general: data['city'] = general['city']
             if 'postcode' in general: data['postcode'] = general['postcode']
             if 'emefullname' in general: data['emergency_fullname'] = general['emefullname']
             if 'emephonenumber' in general: data['emergency_phone'] = general['emephonenumber']
        
        # Job
        job = data.get('job', {})
        if isinstance(job, dict):
             if 'employeeid' in job: data['employee_id'] = job['employeeid']
             if 'jobtitle' in job: data['job_title'] = job['jobtitle']
             if 'positiontype' in job: data['position'] = job['positiontype']
             elif 'position' in job: data['position'] = job['position']
             
             if 'employmenttype' in job: data['employment_type'] = job['employmenttype']
             if 'joindate' in job: data['join_date'] = job['joindate']
             if 'serviceyear' in job: data['service_years'] = job['serviceyear']
             elif 'service_years' in job: data['service_years'] = job['service_years']

             if 'contractnumber' in job: data['contract_number'] = job['contractnumber']
             if 'contractname' in job: data['contract_name'] = job['contractname']
             if 'contracttype' in job: data['contract_type'] = job['contracttype']
             if 'startdate' in job: data['contract_start_date'] = job['startdate']
             if 'enddate' in job: data['contract_end_date'] = job['enddate']
             
             # Handle Department
             if 'department' in job: 
                 dept_val = job['department']
                 if isinstance(dept_val, str) and not dept_val.isdigit():
                     from apps.departments.models import Department
                     try:
                         dept_obj = Department.objects.get(name=dept_val)
                         data['department'] = dept_obj.id
                     except (Department.DoesNotExist, Department.MultipleObjectsReturned):
                         pass
                 elif dept_val:
                     data['department'] = dept_val

             # Handle Line Manager
             if 'linemanager' in job:
                 lm_val = job['linemanager']
                 if isinstance(lm_val, (int, str)) and str(lm_val).isdigit():
                     data['line_manager'] = lm_val
                 # Else ignore string names for now to prevent 400

             # Handle Work Schedule
             if 'workschedule' in job:
                 ws_val = job['workschedule']
                 if isinstance(ws_val, (int, str)) and str(ws_val).isdigit():
                      data['work_schedule'] = ws_val
                 elif isinstance(ws_val, dict) and 'id' in ws_val:
                      data['work_schedule'] = ws_val['id']
             elif 'work_schedule' in job:
                 data['work_schedule'] = job['work_schedule']
        
        # Payroll
        payroll = data.get('payroll', {})
        print(f"DEBUG: Processing payroll dict: {payroll}")
        if isinstance(payroll, dict):
             if 'employeestatus' in payroll: data['status'] = payroll['employeestatus']
             if 'salary' in payroll: data['salary'] = payroll['salary']
             if 'lastworkingdate' in payroll: data['last_working_date'] = payroll['lastworkingdate']
             if 'bankname' in payroll: data['bank_name'] = payroll['bankname']
             if 'bankaccount' in payroll: data['bank_account'] = payroll['bankaccount']
             if 'offset' in payroll: data['offset'] = payroll['offset']
             if 'oneoff' in payroll: data['one_off'] = payroll['oneoff']
        
        # Clean date fields - convert empty strings to None
        for field in date_fields:
            if field in data:
                data[field] = clean_empty(data[field])
        
        # Clean numeric fields - convert empty strings to None or default
        for field in numeric_fields:
            if field in data:
                val = clean_empty(data[field])
                if val is None:
                    # Remove from data so serializer uses model default
                    data.pop(field, None)
                else:
                    data[field] = val
        
        # Clean optional text fields - convert empty strings to None
        for field in optional_text_fields:
            if field in data:
                val = clean_empty(data[field])
                if val is None:
                    data.pop(field, None)
                else:
                    data[field] = val
        
        print(f"DEBUG: to_internal_value returning data keys: {list(data.keys())}")
        return super().to_internal_value(data)

    def create(self, validated_data):
        documents_data = validated_data.pop('documents', [])
        # Pop user_email if provided (write-only). We'll attach it to the instance
        user_email = validated_data.pop('user_email', None)
        # Clean up any nested dicts that might have passed through
        validated_data.pop('general', None)
        validated_data.pop('job', None)
        validated_data.pop('payroll', None)
        
        # Create the employee instance without using objects.create so we can
        # attach a temporary `_user_email` attribute that the creation signal
        # will pick up and use for the linked User account.
        employee = Employee(**validated_data)
        if user_email:
            setattr(employee, '_user_email', user_email)
        employee.save()
        
        # Handle documents
        # Handle documents
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
        print(f"DEBUG: update called. validated_data: {list(validated_data.keys())}")
        # Remove write-only dict fields if they exist to avoid errors in super().update()
        validated_data.pop('general', None)
        validated_data.pop('job', None)
        validated_data.pop('payroll', None)
        
        # Extract user_email if present and handle separately
        user_email = validated_data.pop('user_email', None)

        documents_data = validated_data.pop('documents', None)

        # Apply remaining fields to Employee
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update linked User email if requested
        if user_email is not None:
            try:
                user = instance.user_account
            except Exception:
                user = None

            if user:
                # Check uniqueness
                existing = User.objects.filter(email=user_email).exclude(pk=user.pk).exists()
                if existing:
                    raise serializers.ValidationError({
                        'user_email': 'This email is already in use by another account.'
                    })
                user.email = user_email or None
                user.save()
            else:
                # No linked user - attempt to create one
                username_base = (instance.employee_id or instance.fullname or f"employee{instance.id}")
                username = username_base
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{username_base}{counter}"
                    counter += 1
                user = User.objects.create(username=username, email=user_email or None)
                instance.user_account = user
                instance.save()

        # Handle documents upload
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
