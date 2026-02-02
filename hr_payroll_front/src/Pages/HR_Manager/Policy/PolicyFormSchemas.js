// field types: text|number|time|date|dropdown|textarea|boolean
export const policyFormSchemas = {
  attendancePolicy: {
    shiftTimes: {
      name: { type: "text", label: "Shift Name", placeholder: "e.g. Day Shift" },
      start: { type: "time", label: "Start Time" },
      end: { type: "time", label: "End Time" },
    },
    gracePeriod: {
      lateAfter: { type: "number", label: "Late After (min)" },
      penaltyRule: { type: "text", label: "Penalty Rule", placeholder: "e.g. 3 lates = 1 warning" },
    },
    lateEarlyRules: {
      earlyLeaveMinutes: { type: "number", label: "Early Leave Threshold (min)" },
    },
    absentRules: {
      absentAfterMinutes: { type: "number", label: "Absent After (min)" },
      noClockInAbsent: { type: "boolean", label: "Mark Absent if no Clock-in?" },
    },
    attendanceCorrection: {
      approvalFlow: { type: "text", label: "Approval Step", placeholder: "e.g. manager" },
    },
  },

  leavePolicy: {
    leaveTypes: {
      id: { type: "text", label: "ID (slug)", placeholder: "annual" },
      name: { type: "text", label: "Leave Name", placeholder: "Annual Leave" },
      paid: { type: "boolean", label: "Paid?" },
      daysPerYear: { type: "number", label: "Days per Year", default: 0 },
    },
    approvalWorkflow: {
      annualLeave: { type: "text", label: "Approval Step", placeholder: "e.g. manager" },
      sickLeave: { type: "text", label: "Approval Step", placeholder: "e.g. hr" },
      maternityLeave: { type: "text", label: "Approval Step", placeholder: "e.g. hr" },
    },
  },

  holidayPolicy: {
    fixedHolidays: {
      date: { type: "date", label: "Date" },
      name: { type: "text", label: "Holiday Name" },
    },
    floatingHolidays: {
      name: { type: "text", label: "Holiday Name" },
      rule: { type: "text", label: "Rule" },
    },
    companyHolidays: {
      date: { type: "date", label: "Date" },
      name: { type: "text", label: "Holiday Name" },
    },
  },

  shiftPolicy: {
    shiftPatterns: {
      id: { type: "number", label: "ID" },
      name: { type: "text", label: "Pattern Name" },
      type: { type: "dropdown", label: "Pattern Type", options: ["fixed", "rotational"] },
    },
  },

  disciplinaryPolicy: {
    escalation: {
      steps: { type: "text", label: "Escalation Step", placeholder: "e.g. manager" },
    },
  },

salaryStructurePolicy: {
  allowances: {
    name: { type: "text", label: "Allowance Name" },
    value: { type: "number", label: "Amount" },
  },
  deductions: {
    taxBracket: {
      min: { type: "number", label: "Min" },
      max: { type: "number", label: "Max" },
      rate: { type: "number", label: "Rate (%)" },
      appliedfor: {
        type: "dropdown",
        label: "Applied For",
        options: [
          "All",
          "Department 1",
          "Department 2",
          "HR manager",
          "Department managers",
          "Payroll officers",
        ],
      },
    },
  },
},

};






































// // field types: text|number|time|date|dropdown|textarea|boolean
// export const policyFormSchemas = {
//   attendancePolicy: {
//     shiftTimes: {
//       name: { type: "text", label: "Shift Name", placeholder: "e.g. Day Shift" },
//       start: { type: "time", label: "Start Time" },
//       end: { type: "time", label: "End Time" },
//     },
//     // if you want to allow adding approvalFlow steps, you could create schema for objects inside attendanceCorrection.approvalFlow etc.
//   },

//   leavePolicy: {
//     leaveTypes: {
//       id: { type: "text", label: "ID (slug)", placeholder: "annual" },
//       name: { type: "text", label: "Leave Name", placeholder: "Annual Leave" },
//       paid: { type: "boolean", label: "Paid?" },
//       daysPerYear: { type: "number", label: "Days per Year", default: 0 },
//     },
//     approvalWorkflow:{
//       annualLeave: { type: "text", label: "ID", placeholder: "annual" },
//     }
//   },

//   holidayPolicy: {
//     fixedHolidays: {
//       date: { type: "date", label: "Date" },
//       name: { type: "text", label: "Holiday Name" },
//     },
//     floatingHolidays: {
//       name: { type: "text", label: "Name" },
//       rule: { type: "text", label: "Rule" },
//     },
//     companyHolidays: {
//       date: { type: "date", label: "Date" },
//       name: { type: "text", label: "Holiday Name" },
//     },
//   },

//   shiftPolicy: {
//     shiftPatterns: {
//       id: { type: "number", label: "ID" },
//       name: { type: "text", label: "Pattern Name" },
//       type: { type: "dropdown", label: "Pattern Type", options: ["fixed", "rotational"] },
//     },
//   },

//   salaryStructurePolicy: {
//   deductions: {
//     taxBracket: {  // <-- MUST match the array name
//       min: { type: "number", label: "Min" },
//       max: { type: "number", label: "Max" },
//       rate: { type: "number", label: "Rate (%)" },
//     },
//   },
// },
//   // Add more schemas per your needs...
// };
