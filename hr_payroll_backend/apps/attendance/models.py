"""
Attendance models for HR & Payroll System.
"""
from django.db import models
from django.utils import timezone
from datetime import date, datetime, time, timedelta


class Attendance(models.Model):
    """
    Attendance record for an employee.
    """
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='attendances'
    )
    date = models.DateField()
    clock_in = models.DateTimeField(null=True, blank=True)
    clock_out = models.DateTimeField(null=True, blank=True)
    clock_in_location = models.CharField(max_length=255, blank=True)
    clock_out_location = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, default='absent')  # present, absent, late, half-day, holiday, permission
    worked_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'attendance'
        unique_together = ['employee', 'date']
        ordering = ['-date', '-clock_in']
    
    def __str__(self):
        return f"{self.employee.fullname} - {self.date} ({self.status})"

    def save(self, *args, **kwargs):
        try:
            # Auto-calculate status if clock_in is provided
            if self.clock_in and self.status.upper() in ['ABSENT', 'PRESENT', 'LATE']:
                try:
                    from apps.policies.utils import get_policy
                    # Fetching for Org 1 as default for employees
                    policy = get_policy('attendancePolicy', organization_id=1)
                    
                    # Assume 9:00 AM as default start if not in policy
                    shift_start_str = "09:00"
                    if policy and 'shiftTimes' in policy and len(policy['shiftTimes']) > 0:
                        shift_start_str = policy['shiftTimes'][0].get('start', "09:00")
                    
                    # Grace period
                    grace_minutes = 0
                    if policy and 'gracePeriod' in policy:
                        try:
                            # Handle potential string or integer from JSON
                            grace_minutes = int(policy['gracePeriod'].get('minutesAllowed', 0))
                        except (ValueError, TypeError):
                            grace_minutes = 0
                    
                    # Use local time for comparison with shift start (which is local)
                    clock_in_local = timezone.localtime(self.clock_in)
                    clock_in_time = clock_in_local.time()
                    
                    # Combine self.date and shift_start_str to get threshold
                    h, m = map(int, shift_start_str.split(':'))
                    
                    # Add grace minutes to threshold
                    total_minutes = h * 60 + m + grace_minutes
                    grace_threshold_time = time(total_minutes // 60 % 24, total_minutes % 60)

                    if clock_in_time > grace_threshold_time:
                        self.status = 'LATE'
                    else:
                        self.status = 'PRESENT'
                except Exception as e:
                    print(f"Policy status calculation error: {e}")
                    if not self.status or self.status.upper() == 'ABSENT':
                        self.status = 'PRESENT'
            
            # --- Calculate Worked Hours ---
            if self.clock_in and self.clock_out:
                # Get Scheduled Hours & Shift Start/End
                scheduled_hours = 8.0 # Default fallback
                shift_start_time = None
                
                # Work schedule via link partition
                from apps.attendance.models import EmployeeWorkScheduleLink
                ws = None
                try:
                    link = EmployeeWorkScheduleLink.objects.filter(employee=self.employee).first()
                    ws = link.work_schedule if link else None
                except Exception:
                    ws = None
                if ws:
                    shift_start_time = ws.start_time
                    # Calculate duration from TimeFields
                    # Use dummy date for calculation
                    dummy_date = date(2000, 1, 1) 
                    start_dt = datetime.combine(dummy_date, ws.start_time)
                    end_dt = datetime.combine(dummy_date, ws.end_time)
                    ws_diff = end_dt - start_dt
                    scheduled_hours = ws_diff.total_seconds() / 3600.0
                
                # Determine Accountable Start Time
                # If clock_in is BEFORE shift_start, we clamp to shift_start unless OT
                accountable_clock_in = self.clock_in
                
                # Check for approved OvertimeRequest
                from django.apps import apps
                OvertimeRequest = apps.get_model('attendance', 'OvertimeRequest')
                
                has_authorized_ot = OvertimeRequest.objects.filter(
                    employees=self.employee,
                    date=self.date,
                    status='approved'
                ).exists()

                if shift_start_time and not has_authorized_ot:
                    # Create a datetime for today's shift start
                    # Careful: self.clock_in is a datetime, shift_start_time is a time
                    shift_start_dt = datetime.combine(self.clock_in.date(), shift_start_time)
                    
                    # If local vs naive issues assume standard or tz info matching self.clock_in
                    if self.clock_in.tzinfo:
                         shift_start_dt = shift_start_dt.replace(tzinfo=self.clock_in.tzinfo)

                    if self.clock_in < shift_start_dt:
                        accountable_clock_in = shift_start_dt

                # 1. Provide a clean calculation
                diff = self.clock_out - accountable_clock_in
                raw_hours = diff.total_seconds() / 3600.0
                
                if raw_hours < 0:
                    raw_hours = 0 # Handle negative duration safety (e.g. clocked out before shift started)

                final_hours = raw_hours
                
                # 3. Overtime Logic (Post-Shift)
                # If worked more than scheduled, check authorization again
                if raw_hours > scheduled_hours:
                    excess_hours = raw_hours - scheduled_hours
                    MIN_OT_THRESHOLD = 0.5 # 30 minutes minimum to count as OT
                    
                    # Decision:
                    # If NOT authorized OR excess is trivial (< 30m), CAP at scheduled hours.
                    if not has_authorized_ot or excess_hours < MIN_OT_THRESHOLD:
                        final_hours = scheduled_hours
                
                self.worked_hours = round(final_hours, 2)

            super().save(*args, **kwargs)
        except Exception as e:
            import traceback
            err_msg = traceback.format_exc()
            with open('model_save_error.log', 'w') as f:
                f.write(err_msg)
            raise e
    
    @property
    def attendance_id(self):
        """Alias for id to match frontend."""
        return self.id



class WorkSchedule(models.Model):
    """
    Defines working hours and days for employees.
    """
    title = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    # For simplicity, we can store days as JSON or just assume M-F for now as per minimal request, 
    # but let's add a days field for future proofing.
    days_of_week = models.JSONField(default=list) # e.g. [0, 1, 2, 3, 4] for M-F
    
    # New fields to support frontend
    schedule_type = models.CharField(max_length=50, default='Fixed Time')
    hours_per_day = models.CharField(max_length=10, default='08:00') # Storing as string "HH:MM" or decimal if preferred, but frontend sends string
    hours_per_week = models.CharField(max_length=10, default='40:00')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'work_schedules'

    def __str__(self):
        return f"{self.title} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"


class EmployeeWorkScheduleLink(models.Model):
    """Partition link between Employee and WorkSchedule."""
    employee = models.OneToOneField('employees.Employee', on_delete=models.CASCADE, related_name='work_schedule_link')
    work_schedule = models.ForeignKey(WorkSchedule, on_delete=models.SET_NULL, null=True, blank=True, related_name='employee_links')

    class Meta:
        db_table = 'employee_work_schedule_link'

    def __str__(self):
        return f"WSLink {self.employee_id} -> {self.work_schedule_id}"


class OvertimeRequest(models.Model):
    """
    Overtime assignment/request initiated by a manager.
    """
    date = models.DateField()
    hours = models.DecimalField(max_digits=4, decimal_places=1)
    justification = models.TextField()
    manager = models.ForeignKey(
        'employees.Employee', 
        on_delete=models.CASCADE, 
        related_name='overtime_initiations'
    )
    employees = models.ManyToManyField(
        'employees.Employee', 
        related_name='overtime_assignments'
    )
    status = models.CharField(max_length=20, default='approved') # auto-approved if manager creates it?
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'overtime_requests'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"OT {self.date} - {self.hours}h by {self.manager}"
