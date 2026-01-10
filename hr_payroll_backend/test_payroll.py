"""
Test script for Payroll Generation System.
Tests the full workflow: create period -> generate payslips -> submit -> approve -> finalize
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from apps.payroll.models import PayrollPeriod, Payslip, PayrollApprovalLog, TaxCode, TaxCodeVersion
from apps.payroll.services import PayrollCalculationService, submit_payroll, approve_payroll, finalize_payroll
from apps.employees.models import Employee
from apps.notifications.models import Notification
from apps.attendance.models import OvertimeRequest

User = get_user_model()


def print_section(title):
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)


def test_payroll_system():
    """Test the complete payroll generation workflow."""
    
    print_section("PAYROLL SYSTEM TEST")
    
    # 1. Check prerequisites
    print_section("1. Checking Prerequisites")
    
    employees = Employee.objects.filter(status='Active')
    print(f"   Active employees: {employees.count()}")
    
    if employees.count() == 0:
        print("   ⚠️  No active employees found. Creating test data...")
        # Check if we need to create test employees
        
    users = User.objects.all()
    print(f"   Users: {users.count()}")
    
    # Get or create a user for testing
    hr_user = User.objects.filter(groups__name='HR Manager').first()
    if not hr_user:
        hr_user = User.objects.filter(is_superuser=True).first()
    print(f"   HR User: {hr_user}")
    
    hr_employee = hr_user.employee if hr_user and hasattr(hr_user, 'employee') else None
    print(f"   HR Employee: {hr_employee}")
    
    # 2. Check tax codes
    print_section("2. Checking Tax Configuration")
    
    tax_codes = TaxCode.objects.filter(is_active=True)
    print(f"   Active tax codes: {tax_codes.count()}")
    for tc in tax_codes:
        versions = tc.versions.filter(is_active=True).count()
        print(f"      - {tc.name} ({versions} versions)")
    
    # 3. Create payroll period for January 2026
    print_section("3. Creating Payroll Period")
    
    period, created = PayrollPeriod.objects.get_or_create(
        month='January',
        year=2026,
        defaults={'status': 'draft', 'created_by': hr_employee}
    )
    
    if created:
        print(f"   ✅ Created new period: {period}")
    else:
        print(f"   ℹ️  Using existing period: {period}")
        # Reset status for testing
        if period.status == 'finalized':
            print(f"   ⚠️  Period is finalized, changing to draft for testing...")
            period.status = 'draft'
            period.save()
            Payslip.objects.filter(period=period).delete()
    
    # 4. Generate payroll
    print_section("4. Generating Payroll")
    
    try:
        service = PayrollCalculationService(period, performed_by=hr_employee)
        
        print(f"   Working days in period: {service.working_days}")
        print(f"   Tax code: {service.tax_code}")
        print(f"   Tax version: {service.tax_version}")
        
        payslips = service.generate_payroll()
        print(f"   ✅ Generated {len(payslips)} payslips")
        
        # Reload period to get updated status
        period.refresh_from_db()
        print(f"   Period status: {period.status}")
        
    except Exception as e:
        print(f"   ❌ Error generating payroll: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 5. Show sample payslips
    print_section("5. Sample Payslips")
    
    for payslip in Payslip.objects.filter(period=period)[:3]:
        print(f"\n   {payslip.employee.fullname if payslip.employee else 'Unknown'}:")
        print(f"      Base Salary: ${payslip.base_salary}")
        print(f"      Allowances:  ${payslip.total_allowances}")
        print(f"      Overtime:    ${payslip.overtime_pay} ({payslip.overtime_hours}h)")
        print(f"      Deductions:  ${payslip.total_deductions}")
        print(f"      Tax:         ${payslip.tax_amount}")
        print(f"      Gross Pay:   ${payslip.gross_pay}")
        print(f"      Net Pay:     ${payslip.net_pay}")
        print(f"      Issues:      {payslip.has_issues}")
    
    # 6. Test workflow
    print_section("6. Testing Workflow")
    
    if period.status == 'generated':
        print("   Submitting for approval...")
        try:
            period = submit_payroll(period, submitted_by=hr_employee, notes='Test submission')
            print(f"   ✅ Submitted. Status: {period.status}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    if period.status == 'pending_approval':
        print("   Approving payroll...")
        try:
            period = approve_payroll(period, approved_by=hr_employee, notes='Test approval')
            print(f"   ✅ Approved. Status: {period.status}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    if period.status == 'approved':
        print("   Finalizing payroll...")
        try:
            period = finalize_payroll(period, finalized_by=hr_employee)
            print(f"   ✅ Finalized. Status: {period.status}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    # 7. Check approval logs
    print_section("7. Approval Log")
    
    for log in PayrollApprovalLog.objects.filter(period=period).order_by('performed_at'):
        print(f"   {log.performed_at.strftime('%H:%M:%S')} - {log.action}: {log.previous_status} → {log.new_status}")
    
    # 8. Check notifications
    print_section("8. Notifications Sent")
    
    notifications = Notification.objects.filter(notification_type='payroll').order_by('-created_at')[:5]
    print(f"   Recent payroll notifications: {notifications.count()}")
    for notif in notifications:
        print(f"      → {notif.recipient.fullname if notif.recipient else 'N/A'}: {notif.title}")
    
    # 9. Summary
    print_section("9. TEST SUMMARY")
    
    total_net = sum(float(p.net_pay) for p in Payslip.objects.filter(period=period))
    total_tax = sum(float(p.tax_amount) for p in Payslip.objects.filter(period=period))
    
    print(f"   Period: {period}")
    print(f"   Final Status: {period.status}")
    print(f"   Total Employees: {Payslip.objects.filter(period=period).count()}")
    print(f"   Total Net Pay: ${total_net:,.2f}")
    print(f"   Total Tax: ${total_tax:,.2f}")
    print(f"   Payslips with issues: {Payslip.objects.filter(period=period, has_issues=True).count()}")
    
    print("\n" + "=" * 60)
    print(" TEST COMPLETE")
    print("=" * 60 + "\n")


if __name__ == '__main__':
    test_payroll_system()
