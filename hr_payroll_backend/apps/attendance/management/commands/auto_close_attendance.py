from django.core.management.base import BaseCommand
from apps.attendance.models import Attendance, WorkSchedule
from apps.notifications.models import Notification
from datetime import date, datetime, timedelta
from django.utils import timezone

class Command(BaseCommand):
    help = 'Auto-closes attendance records with missing clock-out and applies penalty.'

    def handle(self, *args, **options):
        # Find pending attendances from previous days
        # logic: clock_in is set, clock_out is NULL, date < today
        today = timezone.localtime(timezone.now()).date()
        
        pending_records = Attendance.objects.filter(
            clock_in__isnull=False,
            clock_out__isnull=True,
            date__lt=today
        )
        
        count = 0
        for att in pending_records:
            self.stdout.write(f"Processing missing clock-out for {att.employee.fullname} on {att.date}")
            
            # Get Schedule Hours (Default 8 if missing)
            schedule_hours = 8.0
            ws = att.employee.work_schedule
            if ws:
                dummy_date = date(2000, 1, 1)
                start_dt = datetime.combine(dummy_date, ws.start_time)
                end_dt = datetime.combine(dummy_date, ws.end_time)
                if end_dt < start_dt:
                    end_dt += timedelta(days=1)
                
                diff = end_dt - start_dt
                schedule_hours = diff.total_seconds() / 3600.0
            
            # Apply Policy: Subtract 1 hour
            # (In future, fetch "missing_clock_out_deduction" from Policy app)
            DEDUCTION_HOURS = 1.0
            final_hours = max(0, schedule_hours - DEDUCTION_HOURS)
            
            # Update Record
            att.worked_hours = round(final_hours, 2)
            att.status = 'present' # Or specific status if needed
            att.notes = (att.notes or "") + f"\n[System]: Auto-closed due to missing clock-out. {DEDUCTION_HOURS}h penalty applied."
            att.save() # This triggers save() logic, but worked_hours is manually set above. 
                       # Wait! save() recalculates worked_hours if clock_in/out present.
                       # But clock_out is still None.
                       # We should NOT set clock_out? Or set it to end of shift?
                       # If we don't set clock_out, diff calc in save() is skipped.
                       # So worked_hours set here is preserved?
                       # Let's check save(): "if self.clock_in and self.clock_out:" -> calc logic.
                       # So if clock_out is None, it won't overwrite our manual set. Correct.
            
            # Create Notification
            Notification.objects.create(
                recipient=att.employee,
                title="Missing Clock Out Deduction",
                message=f"You forgot to clock out on {att.date}. A penalty of {DEDUCTION_HOURS} hour(s) has been applied to your working hours.",
                notification_type="alert"
            )
            
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f'Successfully processed {count} pending attendance records.'))
