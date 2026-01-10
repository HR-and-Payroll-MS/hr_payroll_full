// src/config/shortcuts.js

const ROLE_SHORTCUTS = {
  Manager: [
    { keys: 'ctrl+d', path: '/hr_dashboard', description: 'Dashboard' },
    { keys: 'ctrl+e', path: '/hr_dashboard/Employee_Directory', description: 'Employee Directory' },
    { keys: 'ctrl+shift+a', path: '/hr_dashboard/Addemployee', description: 'Add Employee' },
    { keys: 'ctrl+u', path: '/hr_dashboard/org-chart', description: 'Upload Documents' },
    { keys: 'ctrl+a', path: '/hr_dashboard/myattendance', description: 'My Attendance' },
    { keys: 'ctrl+shift+d', path: '/hr_dashboard/Department_Attendance', description: 'Department Attendance' },
    { keys: 'ctrl+l', path: '/hr_dashboard/Approve_Reject', description: 'Approve/Reject Requests' },
    { keys: 'ctrl+b', path: '/hr_dashboard/Announcement', description: 'Announcements' },
    { keys: 'ctrl+r', path: '/hr_dashboard/Payroll_report', description: 'Payroll Reports' },
    { keys: 'ctrl+shift+r', path: '/hr_dashboard/efficiency_report', description: 'Efficiency Reports' },
    { keys: 'ctrl+o', path: '/hr_dashboard/policies', description: 'Company Policy' },
    { keys: 'ctrl+n', path: '/hr_dashboard/view_notification', description: 'View Notifications' },
    { keys: 'ctrl+shift+n', path: '/hr_dashboard/send_notification', description: 'Send Notification' },
    { keys: 'ctrl+p', path: '/hr_dashboard/profile', description: 'My Profile' },
    { keys: 'ctrl+s', path: '/hr_dashboard/setting', description: 'Settings' },
    { keys: 'ctrl+m', path: '/hr_dashboard/message', description: 'Messages' },
  ],

  Payroll: [
    { keys: 'ctrl+d', path: '/Payroll', description: 'Dashboard' },
    { keys: 'ctrl+g', path: '/Payroll/generate_payroll', description: 'Generate Payroll' },
    { keys: 'ctrl+v', path: '/Payroll/view_generated_payslips', description: 'View Payslips' },
    { keys: 'ctrl+r', path: '/Payroll/payroll_reports', description: 'Payroll Reports' },
    { keys: 'ctrl+t', path: '/Payroll/tax_reports', description: 'Tax Reports' },
    { keys: 'ctrl+p', path: '/Payroll/profile', description: 'My Profile' },
    { keys: 'ctrl+n', path: '/Payroll/view_notification', description: 'View Notifications' },
    { keys: 'ctrl+shift+n', path: '/Payroll/send_notification', description: 'Send Notification' },
    { keys: 'ctrl+s', path: '/Payroll/setting', description: 'Settings' },
    { keys: 'ctrl+m', path: '/Payroll/message', description: 'Messages' },
  ],

  Employee: [
    { keys: 'ctrl+d', path: '/Employee', description: 'Dashboard' },
    { keys: 'ctrl+l', path: '/Employee/Request', description: 'Submit Leave Request' },
    { keys: 'ctrl+v', path: '/Employee/my-payslips', description: 'My Payslips' },
    { keys: 'ctrl+a', path: '/Employee/myattendance', description: 'My Attendance' },
    { keys: 'ctrl+p', path: '/Employee/profile', description: 'My Profile' },
    { keys: 'ctrl+o', path: '/Employee/policies', description: 'Company Policy' },
    { keys: 'ctrl+n', path: '/Employee/view_notification', description: 'View Notifications' },
    { keys: 'ctrl+s', path: '/Employee/setting', description: 'Settings' },
    { keys: 'ctrl+m', path: '/Employee/message', description: 'Messages' },
  ],

  "Line Manager": [
    { keys: 'ctrl+d', path: '/department_manager', description: 'Dashboard' },
    { keys: 'ctrl+l', path: '/department_manager/Approve_Reject', description: 'Approve/Reject Requests' },
    { keys: 'ctrl+a', path: '/department_manager/Employee_Attendance', description: 'Employee Attendance' },
    { keys: 'ctrl+e', path: '/department_manager/Employee_Directory', description: 'Employee Directory' },
    { keys: 'ctrl+r', path: '/department_manager/Efficiency_Report', description: 'Efficiency Report' },
    { keys: 'ctrl+p', path: '/department_manager/profile', description: 'My Profile' },
    { keys: 'ctrl+n', path: '/department_manager/view_notification', description: 'View Notifications' },
    { keys: 'ctrl+shift+n', path: '/department_manager/send_notification', description: 'Send Notification' },
    { keys: 'ctrl+o', path: '/department_manager/policies', description: 'Company Policy' },
    { keys: 'ctrl+s', path: '/department_manager/setting', description: 'Settings' },
    { keys: 'ctrl+m', path: '/department_manager/message', description: 'Messages' },
  ],
};

export default ROLE_SHORTCUTS;