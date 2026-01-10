export const POLICY_SCHEMAS = {
  GENERAL: [
    { name: 'companyName', label: 'Company Name', type: 'text' },
    { name: 'version', label: 'Policy Version', type: 'text' },
    { name: 'effectiveDate', label: 'Effective Date', type: 'date' },
    { name: 'adminContact', label: 'Admin Contact Email', type: 'text' }
  ],
  ATTENDANCE: [
    { name: 'shiftStart', label: 'Shift Start Time', type: 'time' },
    { name: 'shiftEnd', label: 'Shift End Time', type: 'time' },
    { name: 'gracePeriod', label: 'Grace Period (Mins)', type: 'number' },
    { name: 'lateThreshold', label: 'Late Threshold (Mins)', type: 'number' },
    { name: 'correctionWorkflow', label: 'Correction Workflow', type: 'dropdown', options: ['Auto-Approve', 'Manager Approval', 'HR Review'] }
  ],
  LEAVE: [
    { name: 'leaveName', label: 'Leave Type Name', type: 'text' },
    { name: 'entitlement', label: 'Annual Days', type: 'number' },
    { name: 'accrualRule', label: 'Accrual Frequency', type: 'dropdown', options: ['Monthly', 'Quarterly', 'Yearly'] },
    { name: 'carryoverLimit', label: 'Carryover Limit (Days)', type: 'number' },
    { name: 'requiresDoc', label: 'Requires Documentation', type: 'toggle' }
  ],
  HOLIDAY: [
    { name: 'holidayName', label: 'Holiday Name', type: 'text' },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'type', label: 'Holiday Type', type: 'dropdown', options: ['Fixed', 'Floating', 'Company-Specific'] },
    { name: 'isPaid', label: 'Eligibility for Pay', type: 'toggle' }
  ],
  SHIFT: [
    { name: 'patternName', label: 'Pattern Name', type: 'text' },
    { name: 'workWeek', label: 'Work Days', type: 'multiselect', options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    { name: 'rotationFrequency', label: 'Rotation (Weeks)', type: 'number' },
    { name: 'allowance', label: 'Shift Allowance ($)', type: 'number' }
  ],
  OVERTIME: [
    { name: 'otRate', label: 'Standard OT Multiplier', type: 'number' },
    { name: 'weekendRate', label: 'Weekend Multiplier', type: 'number' },
    { name: 'minMinutes', label: 'Min Minutes to Qualify', type: 'number' },
    { name: 'approvalRequired', label: 'Requires Approval', type: 'toggle' }
  ],
  DISCIPLINARY: [
    { name: 'violationType', label: 'Violation Type', type: 'text' },
    { name: 'threshold', label: 'Threshold Count', type: 'number' },
    { name: 'action', label: 'Resulting Action', type: 'dropdown', options: ['Verbal Warning', 'Written Warning', 'Suspension', 'Termination'] }
  ],
  JOB_STRUCTURE: [
    { name: 'levelName', label: 'Job Level / Grade', type: 'text' },
    { name: 'department', label: 'Department', type: 'dropdown', options: ['Engineering', 'Sales', 'HR', 'Finance'] },
    { name: 'minTenure', label: 'Min Tenure for Promotion (Months)', type: 'number' }
  ],
  SALARY_STRUCTURE: [
    { name: 'grade', label: 'Salary Grade', type: 'text' },
    { name: 'baseMin', label: 'Minimum Base', type: 'number' },
    { name: 'baseMax', label: 'Maximum Base', type: 'number' },
    { name: 'allowanceType', label: 'Allowance Category', type: 'dropdown', options: ['Housing', 'Transport', 'Medical'] }
  ],
  TAX_STATUTORY: [
    { name: 'code', label: 'Tax Code', type: 'text' },
    { name: 'version', label: 'Version Number', type: 'text' },
    { name: 'effectiveFrom', label: 'Effective From', type: 'date' },
    { 
      name: 'brackets', 
      label: 'Tax Brackets', 
      type: 'nested_array', 
      fields: [
        { name: 'min', label: 'Min Income', type: 'number' },
        { name: 'max', label: 'Max Income', type: 'number' },
        { name: 'rate', label: 'Rate (%)', type: 'number' }
      ]
    },
    { name: 'pensionEmployee', label: 'Employee Pension (%)', type: 'number' },
    { name: 'pensionEmployer', label: 'Employer Pension (%)', type: 'number' }
  ]
};