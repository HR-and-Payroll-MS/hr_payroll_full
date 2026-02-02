/**
 * Initial policy defaults used as fallback when no policies exist in backend.
 * NOTE: 
 * - 'general' section is fetched from CompanyInfo API dynamically
 * - 'salaryStructurePolicy' is handled by TaxCode model (pension, brackets, allowances)
 */
export const initialPolicies = {
  attendancePolicy: {
    shiftTimes: [
      { name: "Day Shift", start: "08:00", end: "17:00" },
      { name: "Night Shift", start: "18:00", end: "02:00" },
    ],
    gracePeriod: {
      lateAfter: 30,
      penaltyRule: "3 late arrivals per month = 1 warning",
    },
    lateEarlyRules: {
      earlyLeaveMinutes: 20,
    },
    absentRules: {
      absentAfterMinutes: 240,
      noClockInAbsent: true,
    },
    attendanceCorrection: {
      documentationRequired: { __type: "dropdown", options: ["Yes", "No"], value: "Yes" },
      approvalFlow: ["manager", "hr"],
    },
  },

  leavePolicy: {
    leaveTypes: [
      { id: "annual", name: "Annual Leave", paid: true, daysPerYear: 21 },
      { id: "sick", name: "Sick Leave", paid: true, daysPerYear: 15 },
      { id: "maternity", name: "Maternity Leave", paid: true, daysPerYear: 90 },
      { id: "paternity", name: "Paternity Leave", paid: true, daysPerYear: 5 },
      { id: "unpaid", name: "Unpaid Leave", paid: false, daysPerYear: 30 },
    ],
    accrualRules: {
      monthlyAccrualDays: 1.75,
      carryoverLimit: 12,
      expiryMonths: 12,
    },
    eligibilityRules: {
      maternityMinServiceMonths: 3,
      sabbaticalMinYears: 5,
    },
    documentationRules: {
      sickLeaveCertificateAfterDays: 2,
      bereavementRequired: true,
      studyLeaveDocs: "Enrollment letter",
    },
  },

  holidayPolicy: {
    fixedHolidays: [
      { date: "2026-01-01", name: "New Year" },
      { date: "2026-01-07", name: "Ethiopian Christmas (Genna)" },
      { date: "2026-01-19", name: "Epiphany (Timkat)" },
      { date: "2026-03-02", name: "Victory of Adwa" },
      { date: "2026-04-18", name: "Good Friday" },
      { date: "2026-04-20", name: "Easter Sunday" },
      { date: "2026-05-01", name: "International Labour Day" },
      { date: "2026-05-05", name: "Ethiopian Patriots Victory Day" },
      { date: "2026-05-28", name: "Downfall of the Derg" },
      { date: "2026-09-11", name: "Ethiopian New Year (Enkutatash)" },
      { date: "2026-09-27", name: "Meskel (Finding of the True Cross)" },
    ],
    floatingHolidays: [
      { name: "Eid al-Fitr", rule: "Islamic calendar" },
      { name: "Eid al-Adha", rule: "Islamic calendar" },
      { name: "Mawlid", rule: "Islamic calendar" },
    ],
    companyHolidays: [],
    holidayPayRules: {
      holidayIsPaid: { __type: "dropdown", options: ["Yes", "No"], value: "Yes" },
      holidayOvertimeRate: 2.5,
    },
  },

  shiftPolicy: {
    workweek: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    weeklyOff: ["Sat", "Sun"],
    workingHoursPerDay: 8,
    shiftPatterns: [
      { id: 1, name: "Fixed Day Shift", type: "fixed", start: "09:00", end: "17:00" },
      { id: 2, name: "Night Rotation", type: "rotational", start: "18:00", end: "02:00" },
    ],
    rotationRules: {
      rotationEveryDays: 7,
      nightShiftAllowance: 300,
    },
  },

  overtimePolicy: {
    overtimeRate: 1.5,
    weekendRate: 2.0,
    holidayRate: 2.5,
    minOvertimeMinutes: 30,
    maxOvertimeHoursPerDay: 4,
    maxOvertimeHoursPerMonth: 40,
    approvalRequired: { __type: "dropdown", options: ["Yes", "No"], value: "Yes" },
  },

  disciplinaryPolicy: {
    warningRules: {
      firstWarning: "3 lateness in a month",
      secondWarning: "6 lateness in a month",
      thirdWarning: "Disciplinary meeting",
    },
    penalties: {
      repeatedLatePenalty: "Salary deduction",
      absencePenalty: "Written warning",
      noCallNoShow: "Immediate suspension pending investigation",
    },
    escalation: {
      steps: ["manager", "hr", "director"],
    },
  },

  jobStructurePolicy: {
    jobLevels: ["Intern", "Junior", "Mid", "Senior", "Lead", "Manager", "Director"],
    departments: ["HR", "Finance", "Engineering", "Operations", "Sales", "Marketing"],
    promotionRules: {
      minimumMonthsPerLevel: 12,
      requiredPerformanceRating: "B or higher",
    },
  },
};