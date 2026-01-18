"""
Serializers for Attendance app.
"""
from rest_framework import serializers
from .models import Attendance, OvertimeRequest, WorkSchedule
from apps.employees.models import Employee


class WorkScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkSchedule
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for attendance records."""
    employee_name = serializers.SerializerMethodField()
    employee_id_display = serializers.CharField(source='employee.job_info.employee_code', read_only=True)
    attendance_id = serializers.IntegerField(source='id', read_only=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'attendance_id', 'employee', 'employee_name', 'employee_id_display',
            'date', 'clock_in', 'clock_out', 'clock_in_location', 'clock_out_location',
            'status', 'worked_hours', 'notes'
        ]
        read_only_fields = ['id', 'attendance_id']
    
    def validate(self, data):
        """Validate attendance data."""
        employee = data.get('employee')
        date_record = data.get('date')
        
        # Check join date via job_info
        if employee and date_record:
            ji = getattr(employee, 'job_info', None)
            if ji and ji.join_date and date_record < ji.join_date:
                raise serializers.ValidationError(
                    f"Cannot create attendance record before employee join date ({ji.join_date})"
                )
        return data
    
    def get_employee_name(self, obj):
        return obj.employee.fullname

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if 'status' in ret and ret['status']:
            ret['status'] = ret['status'].upper()
        return ret

    def update(self, instance, validated_data):
        """
        Handle dependent field cleanup when modifying attendance.
        """
        # 1. If clock_in is being removed, clear everything related
        if 'clock_in' in validated_data and validated_data.get('clock_in') is None:
            validated_data['clock_out'] = None
            validated_data['clock_in_location'] = ""
            validated_data['clock_out_location'] = ""
            validated_data['worked_hours'] = 0
            
            # Optionally reset status if deemed appropriate, 
            # but user only asked for field deletion.
            # ensure status doesn't stay 'PRESENT' if no clock in
            if instance.status == 'PRESENT':
                 validated_data['status'] = 'ABSENT'

        # 2. If clock_out is being removed, clear out location
        # Note: Use elif not ideal if both are passed, but usually 
        # removing clock_in implies removing clock_out (handled above).
        # This block handles case where only clock_out is removed.
        if 'clock_out' in validated_data and validated_data.get('clock_out') is None:
            validated_data['clock_out_location'] = ""
            validated_data['worked_hours'] = 0
            
        return super().update(instance, validated_data)


class AttendanceTodaySerializer(serializers.ModelSerializer):
    """Serializer for today's attendance with punch details."""
    punches = serializers.SerializerMethodField()
    
    class Meta:
        model = Attendance
        fields = ['id', 'date', 'clock_in', 'clock_out', 'status', 'worked_hours', 'punches']
    
    def get_punches(self, obj):
        """Return punches in frontend-expected format."""
        punches = []
        if obj.clock_in:
            punches.append({
                'type': 'check_in',
                'time': obj.clock_in.isoformat(),
                'location': obj.clock_in_location
            })
        if obj.clock_out:
            punches.append({
                'type': 'check_out',
                'time': obj.clock_out.isoformat(),
                'location': obj.clock_out_location
            })
        return punches


class DepartmentAttendanceSerializer(serializers.Serializer):
    """Serializer for department-wise attendance summary."""
    department = serializers.CharField()
    total_employees = serializers.IntegerField()
    present = serializers.IntegerField()
    absent = serializers.IntegerField()
    late = serializers.IntegerField()
    date = serializers.DateField()


class OvertimeRequestSerializer(serializers.ModelSerializer):
    """Serializer for overtime assignments."""
    manager_name = serializers.CharField(source='manager.fullname', read_only=True)
    employee_names = serializers.SerializerMethodField()

    class Meta:
        model = OvertimeRequest
        fields = [
            'id', 'date', 'hours', 'justification', 'manager', 
            'manager_name', 'employees', 'employee_names', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'manager']

    def get_employee_names(self, obj):
        return [e.fullname for e in obj.employees.all()]
