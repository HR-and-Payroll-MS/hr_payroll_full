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
            # Holiday detection: if today's date matches holidayPolicy fixedHolidays,
            # mark attendance as 'holiday' and skip present/late logic.
            try:
                from apps.policies.utils import get_policy
                # Use organization_id=0 so get_policy will try org 0 then fallback to org 1
                holiday_policy = get_policy('holidayPolicy', organization_id=0) or {}
                fixed = holiday_policy.get('fixedHolidays') or []
                # fixedHolidays is expected as list of { 'date': 'YYYY-MM-DD', 'name': '...' }
                for h in fixed:
                    try:
                        dstr = h.get('date')
                        if dstr:
                            parts = dstr.split('-')
                            if len(parts) == 3:
                                y, m, d = map(int, parts)
                                if self.date == date(y, m, d):
                                    self.status = 'holiday'
                                    break
                    except Exception:
                        continue
            except Exception:
                # If policy lookup fails, continue without holiday behavior
                holiday_policy = {}

            # Auto-calculate status based on attendance policy (absent/late/present/half-day)
            try:
                # Resolve which Policy object is actually used (prefer org 1, then org 0)
                from django.apps import apps
                PolicyModel = apps.get_model('policies', 'Policy')
                pol_obj = PolicyModel.objects.filter(section='attendancePolicy', is_active=True, organization_id__in=[1, 0]).order_by('-organization_id').first()
                if pol_obj:
                    policy = pol_obj.content or {}
                    policy_org_used = pol_obj.organization_id
                else:
                    policy = {}
                    policy_org_used = None

                # Debug: append a small log so we can see which org and policy were used
                try:
                    with open('attendance_policy_debug.log', 'a', encoding='utf-8') as dbg:
                        from django.utils import timezone as djtz
                        dbg.write(f"{djtz.now().isoformat()} - Employee:{getattr(self.employee, 'id', None)} Date:{self.date} PolicyOrg:{policy_org_used} PolicyKeys:{list(policy.keys())}\n")
                except Exception:
                    pass

                # Default shift start/end
                shift_start_str = "09:00"
                shift_end_str = None
                if policy and 'shiftTimes' in policy and len(policy['shiftTimes']) > 0:
                    shift_start_str = policy['shiftTimes'][0].get('start', "09:00")
                    shift_end_str = policy['shiftTimes'][0].get('end')

                # Grace period
                grace_minutes = 0
                if policy and 'gracePeriod' in policy:
                    try:
                        grace_minutes = int(policy['gracePeriod'].get('minutesAllowed', 0))
                    except (ValueError, TypeError):
                        grace_minutes = 0

                # Absent rules
                absent_after = None
                no_clock_in_absent = False
                if policy and 'absentRules' in policy:
                    try:
                        absent_after = int(policy['absentRules'].get('absentAfterMinutes'))
                    except Exception:
                        absent_after = None
                    no_clock_in_absent = bool(policy['absentRules'].get('noClockInAbsent', False))

                # Late / Early rules
                early_leave_minutes = None
                acceptable_late = None
                if policy and 'lateEarlyRules' in policy:
                    try:
                        early_leave_minutes = int(policy['lateEarlyRules'].get('earlyLeaveMinutes', 0))
                    except Exception:
                        early_leave_minutes = None
                    try:
                        acceptable_late = int(policy['lateEarlyRules'].get('acceptableLateMinutes', 0))
                    except Exception:
                        acceptable_late = None

                # Determine shift duration in minutes
                shift_duration_minutes = None
                try:
                    if shift_end_str:
                        sh, sm = map(int, shift_start_str.split(':'))
                        eh, em = map(int, shift_end_str.split(':'))
                        start_min = sh * 60 + sm
                        end_min = eh * 60 + em
                        if end_min <= start_min:
                            end_min += 24 * 60
                        shift_duration_minutes = end_min - start_min
                    elif self.employee and getattr(self.employee, 'work_schedule', None):
                        ws = self.employee.work_schedule
                        start_min = ws.start_time.hour * 60 + ws.start_time.minute
                        end_min = ws.end_time.hour * 60 + ws.end_time.minute
                        if end_min <= start_min:
                            end_min += 24 * 60
                        shift_duration_minutes = end_min - start_min
                    else:
                        shift_duration_minutes = 8 * 60
                except Exception:
                    shift_duration_minutes = 8 * 60

                # If no clock-in recorded
                if not self.clock_in:
                    if no_clock_in_absent:
                        self.status = 'ABSENT'

                else:
                    # Use local time for comparison with shift start (which is local)
                    clock_in_local = timezone.localtime(self.clock_in)
                    clock_in_time = clock_in_local.time()

                    # Combine self.date and shift_start_str to get thresholds
                    h, m = map(int, shift_start_str.split(':'))

                    # Absent threshold
                    absent_threshold_time = None
                    if absent_after is not None:
                        total_absent = h * 60 + m + absent_after
                        absent_threshold_time = time(total_absent // 60 % 24, total_absent % 60)

                    # Grace threshold
                    total_minutes = h * 60 + m + grace_minutes
                    grace_threshold_time = time(total_minutes // 60 % 24, total_minutes % 60)

                    # Acceptable late threshold
                    acceptable_threshold_time = None
                    if acceptable_late is not None:
                        total_acc = h * 60 + m + acceptable_late
                        acceptable_threshold_time = time(total_acc // 60 % 24, total_acc % 60)

                    # Decide status priority: absent -> late -> present
                    if absent_threshold_time and clock_in_time > absent_threshold_time:
                        self.status = 'ABSENT'
                    elif grace_threshold_time and clock_in_time > grace_threshold_time:
                        if acceptable_threshold_time and clock_in_time <= acceptable_threshold_time:
                            self.status = 'PRESENT'
                        else:
                            self.status = 'LATE'
                    else:
                        self.status = 'PRESENT'

                    # Compute worked minutes if clock_out exists
                    worked_minutes = None
                    if self.clock_out:
                        try:
                            worked_delta = self.clock_out - self.clock_in
                            worked_minutes = max(0, int(worked_delta.total_seconds() // 60))
                        except Exception:
                            worked_minutes = None

                    # Half-day detection: if worked less than half of scheduled shift -> HALF-DAY
                    if worked_minutes is not None and shift_duration_minutes is not None:
                        if worked_minutes < (shift_duration_minutes / 2):
                            self.status = 'HALF-DAY'

                    # Early-leave: if clock_out before shift_end - early_leave_minutes => HALF-DAY
                    if early_leave_minutes is not None and self.clock_out and shift_end_str:
                        try:
                            eh, em = map(int, shift_end_str.split(':'))
                            leave_thresh_min = (eh * 60 + em) - early_leave_minutes
                            leave_thresh_time = time((leave_thresh_min // 60) % 24, leave_thresh_min % 60)
                            clock_out_local = timezone.localtime(self.clock_out).time()
                            if clock_out_local < leave_thresh_time:
                                self.status = 'HALF-DAY'
                        except Exception:
                            pass
            except Exception as e:
                print(f"Policy status calculation error: {e}")
                if not self.status or self.status.upper() == 'ABSENT':
                    self.status = 'PRESENT'
            
            # --- Calculate Worked Hours ---
            if self.clock_in and self.clock_out:
                # Get Scheduled Hours & Shift Start/End
                scheduled_hours = 8.0 # Default fallback
                shift_start_time = None
                
                if self.employee.work_schedule:
                    ws = self.employee.work_schedule
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
