"""
Signals for Employee app to enforce strict User-Employee consistency.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from .models import Employee
import secrets
import string
from apps.notifications.models import Notification
from apps.users.models import EmployeeGeneralInfo

User = get_user_model()

@receiver(post_save, sender=Employee)
def create_user_for_employee(sender, instance, created, **kwargs):
    """
    When an Employee is created, automatically create a linked User account
    if one doesn't exist.
    """
    if not created:
        return
        
    # Check if this employee already has a user account
    if hasattr(instance, 'user_account') and instance.user_account:
        return

    print(f"SIGNAL: Creating User for Employee {instance.fullname}")
    
    # Prevent recursion: Disconnect the OTHER signal while we create the user
    post_save.disconnect(create_employee_for_user, sender=User)
    
    try:
        # Generate username
        base_username = f"{instance.first_name.lower()}.{instance.last_name.lower()}".replace(' ', '')
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            
        # Generate random password
        password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        
        # Create User
        # We must set the employee link IMMEDIATELY to prevent the User signal 
        # from trying to create ANOTHER employee (infinite loop prevention)
        # Prefer email from partition if available; else fallback
        general = getattr(instance, 'general_info', None)
        partition_email = getattr(general, 'email', None) if general else None

        user = User(
            username=username,
            email=partition_email or f"{username}@company.local",
            first_name=instance.first_name,
            last_name=instance.last_name,
            employee=instance  # Link strictly here
        )
        user.set_password(password)
        user.save()
        
        # Assign 'Employee' group
        group, _ = Group.objects.get_or_create(name='Employee')
        user.groups.add(group)

        # Backfill general_info.email if missing
        try:
            general = getattr(instance, 'general_info', None)
            if general and not getattr(general, 'email', None):
                general.email = user.email
                general.save(update_fields=['email'])
        except Exception:
            pass
        
        print(f"SIGNAL: Created User {username} for Employee {instance.id}")
        print(f"CREDENTIALS: {username} / {password}")

    finally:
        # Reconnect
        post_save.connect(create_employee_for_user, sender=User)


@receiver(post_save, sender=User)
def create_employee_for_user(sender, instance, created, **kwargs):
    """
    When a User is created (e.g. via Admin), automatically create a linked Employee
    if one doesn't exist.
    """
    if not created:
        return
        
    # Check if user already has an employee linked
    if instance.employee:
        return
        
    print(f"SIGNAL: Creating Employee for User {instance.username}")
    
    # Prevent recursion: Disconnect the OTHER signal while we create the employee
    post_save.disconnect(create_user_for_employee, sender=Employee)
    
    try:
        # Create core employee; partition details managed in respective apps
        employee = Employee.objects.create(
            first_name=instance.first_name or instance.username,
            last_name=instance.last_name or "User",
        )
        
        # Link back to user
        instance.employee = employee
        instance.save()

        # Create minimal general info partition with email if present
        try:
            if instance.email:
                EmployeeGeneralInfo.objects.get_or_create(
                    employee=employee,
                    defaults={"email": instance.email}
                )
        except Exception:
            # Non-blocking: partition creation failures shouldn't break user creation
            pass
        
        # Assign 'Employee' group if not present
        if not instance.groups.exists():
            group, _ = Group.objects.get_or_create(name='Employee')
            instance.groups.add(group)
            
        print(f"SIGNAL: Created Employee {employee.id} for User {instance.username}")
        
    finally:
        # Reconnect the signal immediately
        post_save.connect(create_user_for_employee, sender=Employee)


@receiver(post_save, sender=Employee)
def sync_user_groups(sender, instance, created, **kwargs):
    """
    Sync Django groups with Employee job_title.
    - HR Manager -> 'Manager' group
    - Department Manager -> 'Manager' and 'Line Manager' groups
    - Payroll Officer -> 'Payroll' group
    - Employee (default) -> 'Employee' group
    """
    if not hasattr(instance, 'user_account') or not instance.user_account:
        return

    user = instance.user_account
    ji = getattr(instance, 'job_info', None)
    job_title = (getattr(ji, 'job_title', None) or "").upper()
    
    # Define group mappings
    group_names = set()
    
    if 'HR MANAGER' in job_title or 'HUMAN RESOURCES MANAGER' in job_title or job_title == 'MANAGER':
        group_names.add('HR Manager')
        group_names.add('Manager') # Primary HR group
    elif 'DEPARTMENT MANAGER' in job_title or 'DEPT MANAGER' in job_title or 'LINE MANAGER' in job_title:
        group_names.add('Line Manager')
    elif 'PAYROLL' in job_title:
        group_names.add('Payroll')
    else:
        group_names.add('Employee')

    # Get or create the Group objects
    target_groups = []
    for name in group_names:
        group, _ = Group.objects.get_or_create(name=name)
        target_groups.append(group)
    
    # Sync groups: remove old ones, add new ones (effectively)
    # Actually, we might want to preserve some groups like 'Admin', 
    # but for most employees, we reset to the title-based groups.
    
    # Get current names to check if we even need to change anything
    current_group_names = set(user.groups.values_list('name', flat=True))
    
    # If it's an admin, don't strip their admin groups
    if user.is_staff or user.is_superuser or 'Admin' in current_group_names:
        # Just ensure they have the new groups too
        for group in target_groups:
            user.groups.add(group)
    else:
        # For regular users, enforce the specific groups for the title
        user.groups.set(target_groups)
    
    print(f"SIGNAL: Synced groups for {user.username} based on job title '{job_title}': {list(group_names)}")


@receiver(post_save, sender=Employee)
def backfill_attendance_on_create(sender, instance, created, **kwargs):
    """
    When an employee is created with a past join date, fill past days as 'Absent'.
    """
    ji = getattr(instance, 'job_info', None)
    join_date = getattr(ji, 'join_date', None)
    if not created or not join_date:
        return

    from apps.attendance.models import Attendance
    from datetime import date, timedelta
    
    today = date.today()
    start_date = join_date
    
    # Only backfill if join_date is in the past
    if start_date < today:
        print(f"SIGNAL: Backfilling attendance for new employee {instance.fullname} from {start_date} to yesterday.")
        current = start_date
        while current < today:
            # Check if it's a weekend? For now, we assume standard M-F or just mark absent for all days.
            # Ideally verify against work_schedule if available, but simple backfill is safer.
            Attendance.objects.get_or_create(
                employee=instance,
                date=current,
                defaults={'status': 'absent'}
            )
            current += timedelta(days=1)


@receiver(pre_save, sender=Employee)
def track_employee_changes(sender, instance, **kwargs):
    """
    Track changes to Department and Position before saving.
    """
    if instance.pk:
        try:
            old_instance = Employee.objects.select_related('job_info', 'job_info__department').get(pk=instance.pk)
            old_ji = getattr(old_instance, 'job_info', None)
            instance._old_department = getattr(old_ji, 'department', None)
            instance._old_position = getattr(old_ji, 'position', None)
            instance._old_job_title = getattr(old_ji, 'job_title', None)
            instance._old_line_manager = getattr(old_ji, 'line_manager', None)
            instance._old_join_date = getattr(old_ji, 'join_date', None)
        except Employee.DoesNotExist:
            pass


@receiver(post_save, sender=Employee)
def notify_employee_changes(sender, instance, created, **kwargs):
    """
    Notify employee when their Department or Position changes.
    """
    if created:
        return

    ji = getattr(instance, 'job_info', None)
    current_dept = getattr(ji, 'department', None)
    current_position = getattr(ji, 'position', None)
    current_line_manager = getattr(ji, 'line_manager', None)
    current_join_date = getattr(ji, 'join_date', None)

    # Check Department Change
    if hasattr(instance, '_old_department') and instance._old_department != current_dept:
        new_dept = current_dept
        new_dept_name = new_dept.name if new_dept else "No Department"
        
        # Notify Employee
        Notification.objects.create(
            recipient=instance,
            sender=None,
            title="Department Change",
            message=f"You have been transferred to the {new_dept_name} department.",
            notification_type='promotion',
            link=f"/my-profile"
        )
        
        # Notify Department Manager
        if new_dept and new_dept.manager:
            Notification.objects.create(
                recipient=new_dept.manager,
                sender=None,
                title="New Department Member",
                message=f"{instance.fullname} has been assigned to your department ({new_dept_name}).",
                notification_type='announcement',
                link=f"/department-employees"
            )

    # Check Position Change
    if hasattr(instance, '_old_position') and instance._old_position != current_position:
        Notification.objects.create(
            recipient=instance,
            sender=None,
            title="Position Update",
            message=f"Your position has been updated to {current_position}.",
            notification_type='promotion',
            link=f"/my-profile"
        )

    # Check Line Manager Change
    if hasattr(instance, '_old_line_manager') and instance._old_line_manager != current_line_manager:
        new_manager = current_line_manager
        manager_name = f"{new_manager.first_name} {new_manager.last_name}" if new_manager else "No Manager"
        
        # 1. Notify Employee
        Notification.objects.create(
            recipient=instance,
            sender=None,
            title="New Manager Assigned",
            message=f"You have been assigned to {manager_name} as your new manager.",
            notification_type='announcement',
            link=f"/my-profile"
        )
        
        # 2. Notify the New Manager
        if new_manager:
            Notification.objects.create(
                recipient=new_manager,
                sender=None,
                title="New Direct Report",
                message=f"{instance.fullname} has been assigned as your new direct report.",
                notification_type='announcement',
                link=f"/team"
            )

    # Check Join Date Change
    if hasattr(instance, '_old_join_date') and instance._old_join_date != current_join_date:
        from apps.attendance.models import Attendance
        from datetime import timedelta, date
        
        old_date = instance._old_join_date
        new_date = current_join_date
        
        if not new_date:
            return
            
        # Case 1: Join date added for the first time (was None)
        if not old_date and new_date:
            print(f"SIGNAL: Join Date set for the first time. Backfilling from {new_date}...")
            today = date.today()
            # Only backfill if it's in the past
            if new_date < today:
                current = new_date
                while current < today:
                    Attendance.objects.get_or_create(
                        employee=instance,
                        date=current,
                        defaults={'status': 'absent'}
                    )
                    current += timedelta(days=1)
            return

        if old_date and new_date < old_date:
            # Join date moved BACK (earlier)
            # Create absent records for the gap (up to today)
            print(f"SIGNAL: Backfilling attendance for {instance.fullname} from {new_date} to {old_date - timedelta(days=1)}")
            current = new_date
            today = date.today()
            end = min(old_date - timedelta(days=1), today)
            
            while current <= end:
                Attendance.objects.get_or_create(
                    employee=instance,
                    date=current,
                    defaults={'status': 'absent'}
                )
                current += timedelta(days=1)
        
        elif old_date and new_date > old_date:
            # Join date moved FORWARD (later)
            # Delete attendance records before the new join date
            print(f"SIGNAL: Purging attendance for {instance.fullname} before {new_date}")
            Attendance.objects.filter(employee=instance, date__lt=new_date).delete()
