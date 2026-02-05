export const sidebarList = {
  Payroll: [
    {
      Icons: 'Users', // already good for managing multiple employees
      path: null,
      label: 'Payroll Management',
      Visible: false,
      sub: [
        { subPath: 'generate_payroll', label: 'Generate Payroll' },
        { subPath: 'salary_structure', label: 'Salary Structure' },
        // { subPath: 'allowances', label: 'Allowances/Bonuses' },
      ],
    },
    {
      Icons: 'CalendarCheck2', // better than BookA → clearly means attendance/marking
      path: null,
      label: 'Attendance',
      Visible: false,
      sub: [{ subPath: 'myattendance', label: 'My Attendance' }],
    },
    // {
    //   Icons: 'CalendarClock',
    //   path: null,
    //   label: 'Leave Management',
    //   Visible: false,
    //   sub: [
    //     { subPath: 'Approve_Reject', label: 'Approve/Reject Leave Requests' },
    //     { subPath: 'Request', label: 'View Requests' },
    //   ],
    // },
    {
      Icons: 'Receipt', // industry standard for payslips
      path: null,
      label: 'Payslips',
      Visible: false,
      sub: [
        {
          subPath: 'view_generated_payslips',
          label: 'View/Edit Generated Payslips',
        },
        { subPath: 'my-payslips', label: 'My Payslips' },
      ],
    },
    {
      Icons: 'IndianRupee', // perfect for salary data (or use Wallet if you prefer)
      path: null,
      label: 'Employee Payroll Data',
      Visible: false,
      sub: [
        {
          subPath: 'view_employee_salary_info',
          label: 'view/Edit employee salary info',
        },
      ],
    },
    {
      Icons: 'FileBarChart2', // best modern icon for reports & analytics
      path: null,
      label: 'Reports',
      Visible: false,
      sub: [
        { subPath: 'payroll_reports', label: 'Payroll Reports' },
        { subPath: 'tax_reports', label: 'Tax Reports' },
        {
          subPath: 'department_wise_paryoll',
          label: 'Department-Wise Payroll',
        },
      ],
    },
    {
      Icons: 'BellRing', // more appropriate than ShieldAlert for notifications
      path: null,
      label: 'Notification',
      Visible: false,
      sub: [
        { subPath: 'send_notification', label: 'Send Notification' },
        { subPath: 'view_notification', label: 'View Notification' },
      ],
    },
    {
      Icons: 'UserCog', // perfect combo: profile + settings/logout
      path: null,
      label: 'Profile',
      Visible: false,
      sub: [
        { subPath: 'view_profile', label: 'View Profile' },
        { subPath: '/logout', label: 'Logout' },
      ],
    },
    // {
    //   Icons: 'Calendar',
    //   path: null,
    //   label: 'Payroll Management',
    //   Visible: false,
    //   sub: [
    //     { subPath: 'Payroll_report', label: 'View Payroll Reports' },
    //     { subPath: 'MyPayroll', label: 'My Payroll' },
    //   ],
    // },
    {
      Icons: 'FlagTriangleRight',
      path: null,
      label: 'Reports',
      Visible: false,
      sub: [
        { subPath: 'Payroll_report', label: 'Payroll Reports' },
        // { subPath: '/', label: 'Attendance Reports' },
        // { subPath: 'Request', label: 'Leave Reports' },
        // { subPath: '/', label: 'Overtime Reports' },
        { subPath: 'efficiency_report', label: 'employee efficiency Reports' },
        { subPath: '/', label: 'Employee Compliant Report' },
      ],
    },
    {
      Icons: 'ShieldAlert',
      path: null,
      label: 'Efficiency & Policy',
      Visible: false,
      sub: [
        { subPath: 'efficiencyhr', label: 'Create Efficiency Form' },
        { subPath: 'policies', label: 'Policy' },
        { subPath: 'tax_code', label: 'Tax Code' },
      ],
    },
    // {
    //   Icons: 'ShieldAlert',
    //   path: 'policies',
    //   label: 'Policy',
    //   Visible: false,
    //   sub: null
    // },
    // {
    //   Icons: 'ShieldAlert',
    //   path: null,
    //   label: 'System Manager',
    //   Visible: false,
    //   sub: [
    //     { subPath: '/', label: 'Assign Roles & Permissions' },
    //     { subPath: '/', label: 'Manage Departments' },
    //   ],
    // },
    {
      Icons: 'Megaphone',
      path: null,
      label: 'Notifications',
      Visible: false,
      sub: [
        { subPath: 'send_notification', label: 'Send Notification' },
        { subPath: 'view_notification', label: 'View Notification' },
      ],
    },
    // {
    //   Icons: 'CircleUser',
    //   path: null,
    //   label: 'Profile',
    //   Visible: false,
    //   sub: [
    //     { subPath: '/', label: 'Manage Profile' },
    //     { subPath: 'logout', label: 'logout' },
    //   ],
    // },
  ],

  Employee: [
    {
      path: null,
      Icons: 'Bell',
      label: 'Notification',
      Visible: true,
      sub: [
        { subPath: 'send_notification', label: 'Send Notification' },
        { subPath: 'view_notification', label: 'View Notification' },
      ],
    },
    {
      path: 'Request',
      Icons: 'CalendarX',
      label: 'View/Send Requests',
      Visible: false,
      sub: null,
    },
    {
      path: null,
      Icons: 'Clock',
      label: 'Attendance',
      Visible: false,
      sub: [
        { subPath: 'myattendance', label: 'My Attendance' },
        { subPath: 'myovertime', label: 'My Overtime' },
      ],
    },
    {
      path: 'my-payslips',
      Icons: 'Receipt',
      label: 'View Payslips',
      Visible: false,
      sub: null,
    },
    {
      path: null,
      Icons: 'User',
      label: 'Profile',
      Visible: false,
      sub: [
        { subPath: 'Setting/ChangePassword', label: 'Change Password' },
        { subPath: 'profile', label: 'My Profile' },
      ],
    },
    {
      path: 'my-department',
      Icons: 'Briefcase',
      label: 'My Department',
      Visible: false,
      sub: null,
    },
    {
      path: 'policies',
      Icons: 'ShieldAlert',
      label: 'Company Policies',
      Visible: false,
      sub: null,
    },
  ],

  'Line Manager': [
    {
      Icons: 'Users',
      path: 'Employee_Directory',
      label: 'Employees',
      Visible: false,
      sub: null,
    },
    {
      Icons: 'CalendarClock',
      path: null,
      label: 'Attendance',
      Visible: false,
      sub: [
        { subPath: 'myAttendance', label: 'View Attendance' },
        { subPath: 'Employee_Attendance', label: 'Track Employee Attendance' },
      ],
    },
    {
      Icons: 'CalendarX',
      path: null,
      label: 'Leave Management',
      Visible: false,
      sub: [
        { subPath: 'Approve_Reject', label: 'Approve/Reject Leave Requests' },
        { subPath: 'Request', label: 'view/Send Requests' },
      ],
    },
    {
      Icons: 'Bell',
      path: null,
      label: 'Notifications',
      Visible: false,
      sub: [
        { subPath: 'send_notification', label: 'Send Notification' },
        { subPath: 'view_notification', label: 'View Notification' },
      ],
    },
    {
      Icons: 'Bell',
      path: 'Efficiency_Report',
      label: 'Employee Efficienct',
      Visible: false,
      sub: null,
    },
    {
      Icons: 'Bell',
      path: 'OverTimeInitiation',
      label: 'Initiate OverTime',
      Visible: false,
      sub: null,
    },
    {
      Icons: 'Receipt',
      path: 'my-payslips',
      label: 'My Payslips',
      Visible: false,
      sub: null,
    },
  ],
};
