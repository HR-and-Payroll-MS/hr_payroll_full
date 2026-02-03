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
        # Determine email: prefer temporary `_user_email` set by the creator,
        # otherwise fall back to any existing attribute (kept for compatibility),
        # then finally use a generated local address.
        provided_email = getattr(instance, '_user_email', None) or getattr(instance, 'email', None)
        user = User(
            username=username,
            email=provided_email or f"{username}@company.local",
            first_name=instance.first_name,
            last_name=instance.last_name,
            employee=instance # Link strictly here
        )
        user.set_password(password)
        user.save()
        
        # Assign 'Employee' group
        group, _ = Group.objects.get_or_create(name='Employee')
        user.groups.add(group)
        
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
        employee = Employee.objects.create(
            first_name=instance.first_name or instance.username,
            last_name=instance.last_name or "User",
            job_title="New User",
            status="Active"
        )
        
        # Link back to user
        instance.employee = employee
        instance.save()
        
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
    - Manager -> 'Manager' group
    - Line Manager -> 'Line Manager' group
    - Payroll Officer -> 'Payroll' group
    - Employee (default) -> 'Employee' group
    """
    if not hasattr(instance, 'user_account') or not instance.user_account:
        return

    user = instance.user_account
    job_title = (instance.job_title or "").upper()
    
    # Define group mappings
    group_names = set()
    
    if 'HR MANAGER' in job_title or 'HUMAN RESOURCES MANAGER' in job_title or job_title == 'MANAGER':
        # Canonicalize HR role to 'Manager'
        group_names.add('Manager')
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

    # Prevent accidental demotion of privileged users when job_title is blank
    # or doesn't explicitly map to a privileged role.
    privileged_groups = {'Manager', 'Line Manager', 'Payroll', 'Admin'}
    has_privileged = bool(current_group_names.intersection(privileged_groups))
    job_title_maps_to_privileged = any(
        name in privileged_groups for name in group_names
    )
    
    # If it's an admin, don't strip their admin groups
    if user.is_staff or user.is_superuser or 'Admin' in current_group_names:
        # Just ensure they have the new groups too
        for group in target_groups:
           user.groups.add(group)
    else:
        # For regular users, enforce the specific groups for the title.
        # If the user already has a privileged role and the job_title doesn't
        # explicitly map to a privileged role, avoid overwriting their groups.
        if has_privileged and not job_title_maps_to_privileged:
            # Do not overwrite privileged roles just because job_title is blank
            # or a non-privileged value. Also avoid adding 'Employee' in this case.
            for group in target_groups:
                if group.name != 'Employee':
                    user.groups.add(group)
        else:
            user.groups.set(target_groups)
    
    print(f"SIGNAL: Synced groups for {user.username} based on job title '{instance.job_title}': {list(group_names)}")


@receiver(post_save, sender=Employee)
def backfill_attendance_on_create(sender, instance, created, **kwargs):
    """
    When an employee is created with a past join date, fill past days as 'Absent'.
    """
    if not created or not instance.join_date:
        return

    from apps.attendance.models import Attendance
    from datetime import date, timedelta
    
    today = date.today()
    start_date = instance.join_date
    
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
            old_instance = Employee.objects.get(pk=instance.pk)
            instance._old_department = old_instance.department
            instance._old_position = old_instance.position
            instance._old_job_title = old_instance.job_title
            instance._old_line_manager = old_instance.line_manager
            instance._old_join_date = old_instance.join_date
        except Employee.DoesNotExist:
            pass


@receiver(post_save, sender=Employee)
def notify_employee_changes(sender, instance, created, **kwargs):
    """
    Notify employee when their Department or Position changes.
    """
    if created:
        return

    # Check Department Change
    if hasattr(instance, '_old_department') and instance._old_department != instance.department:
        new_dept = instance.department
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
    if hasattr(instance, '_old_position') and instance._old_position != instance.position:
        Notification.objects.create(
            recipient=instance,
            sender=None,
            title="Position Update",
            message=f"Your position has been updated to {instance.position}.",
            notification_type='promotion',
            link=f"/my-profile"
        )

    # Check Job Title Change (log for auditing and debugging)
    if hasattr(instance, '_old_job_title') and instance._old_job_title != instance.job_title:
        try:
            import datetime, traceback
            entry = f"{datetime.datetime.utcnow().isoformat()} - Employee {getattr(instance,'employee_id', instance.id)} job_title changed from '{instance._old_job_title}' to '{instance.job_title}'\n"
            entry += ''.join(traceback.format_stack(limit=10))
            with open('job_title_changes.log', 'a', encoding='utf-8') as fh:
                fh.write(entry + "\n")
        except Exception:
            pass

    # Check Line Manager Change
    if hasattr(instance, '_old_line_manager') and instance._old_line_manager != instance.line_manager:
        new_manager = instance.line_manager
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
    if hasattr(instance, '_old_join_date') and instance._old_join_date != instance.join_date:
        from apps.attendance.models import Attendance
        from datetime import timedelta, date
        
        old_date = instance._old_join_date
        new_date = instance.join_date
        
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


@receiver(post_save, sender=Employee)
def sync_employee_email_to_user(sender, instance, created, **kwargs):
    """
    Ensure the linked User.email matches Employee.email when Employee is saved.
    This keeps a single authoritative email value across both models.
    """
    # Email is now authoritative on the User model. Employee no longer stores
    # an `email` field, so we intentionally don't sync Employee->User here.

