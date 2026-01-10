from rest_framework import permissions

class IsHRManager(permissions.BasePermission):
    """
    Allows access only to HR Managers, Admins, or Payroll officers.
    In this system, the primary HR role group is often named 'Manager'.
    """
    def has_permission(self, request, view):
        try:
            if not request.user or not request.user.is_authenticated:
                return False
                
            if request.user.is_superuser:
                return True
                
            user_groups = [g.name.upper() for g in request.user.groups.all()]
            # Primary HR Roles
            hr_role_groups = ['HR', 'HR MANAGER', 'ADMIN', 'HR-MANAGER', 'PAYROLL', 'MANAGER', 'HUMAN RESOURCES']
            is_hr = any(role in user_groups for role in hr_role_groups)
            
            # If they are in Line Manager group, they are NOT HR unless explicitly in HR group
            if 'LINE MANAGER' in user_groups and not any(r in user_groups for r in ['HR', 'HR MANAGER', 'ADMIN', 'MANAGER']):
                return False
                
            # Fallback to job title ONLY for clear HR roles
            if not is_hr and hasattr(request.user, 'employee') and request.user.employee and request.user.employee.job_title:
                title = request.user.employee.job_title.upper()
                if 'HR' in title or 'HUMAN RESOURCES' in title or 'ADMINISTRATOR' in title:
                    is_hr = True
                    
            return is_hr
        except Exception as e:
            import traceback
            with open(r'f:\E\SeniorX\hr_payroll_backend\permission_error.log', 'a') as f:
                f.write(f"\n--- PERMISSION ERROR ---\n")
                f.write(traceback.format_exc())
            return False


class IsHRManagerOrReadOnly(IsHRManager):
    """
    Allows write access to HR Managers, but read-only access to others.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return super().has_permission(request, view)


class IsPayrollOfficer(permissions.BasePermission):
    """
    Allows access only to Payroll Officers, HR Managers, and Admins.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.user.is_superuser:
            return True
            
        user_groups = [g.name.upper() for g in request.user.groups.all()]
        payroll_roles = ['PAYROLL', 'PAYROLL OFFICER', 'PAYROLL-OFFICER', 'HR', 'HR MANAGER', 'ADMIN']
        return any(role in user_groups for role in payroll_roles)

