# Payroll System Deep Dive (Backend + Frontend)

This document analyzes the payroll implementation across backend (Django/DRF) and frontend (React/Vite), focusing on data sources, calculation logic, tax/policy integration, workflows, API surface, UI flows, and practical gaps or mismatches. It highlights both strengths and problems to help you confirm exactly how payroll operates today and where it needs refinement.

---

## Backend

### Architecture & Scope

- App: `apps.payroll` with models, serializers, views, services, signals.
- Endpoints: Mounted under `/api/v1/payroll/`:
  - `periods` (CRUD + actions `generate`, `submit`, `approve`, `rollback`, `finalize`)
  - `payslips` (CRUD + `contact` action)
  - `tax-codes`, `tax-code-versions`, `tax-brackets`, `allowances`, `deductions`, `employee-allowances`, `employee-deductions`
- Workflow: Draft → Generated → Pending Approval → Approved → Finalized (with rollback path). Approval logs track transitions.

### Data Sources Used During Calculation

- Employees: `apps.employees.models.Employee` (fields: `salary`, `status=Active`, `department`, `join_date`, bank info, etc.).
- Attendance: `apps.attendance.models.Attendance` (worked/absent status), `OvertimeRequest` (approved OT hours per employee).
- Leaves: `apps.leaves.models.LeaveRequest` (approved leaves; unpaid leaves impact pay).
- Policies: `apps.policies.models.Policy` (JSON content per section: `overtimePolicy`, `attendancePolicy`, `holidayPolicy`, `shiftPolicy`); also `salary` policy may link a `TaxCode` at org level.
- Tax: `TaxCode` with versioned `TaxCodeVersion` + `TaxBracket`; plus `statutory_deductions_config`, `exemptions_config`, `pension_config`, `rounding_rules`, `compliance_notes`.
- Company: `apps.company.models.CompanyInfo` (provides payslip header info).

### Core Calculation Flow (PayrollCalculationService)

1. Initialize period context

   - Month number from name; working days computed Mon–Fri; period-wide.
   - Load active tax code:
     - Uses `tax_code_id` if provided.
     - Else tries `Policy(section='salary').tax_code` for org; fallback to any active tax code.
   - Find applicable `TaxCodeVersion` by `valid_from/valid_to` covering period date; load brackets.
   - Load policies by sections: overtime/attendance/holiday/shift; load company info.

2. Generate payslips for all `Employee(status='Active')`:

   - Proration: If `join_date` within period, base salary prorated by working days from join date.
   - Allowances:
     - Employee-specific `EmployeeAllowance` + global/department-based `Allowance`.
     - Values use `default_value` or `custom_value`; percentage allowances apply to base salary.
     - NOTE: `Allowance.is_taxable` is ignored (see Issues).
   - Overtime:
     - Sums approved `OvertimeRequest.hours` within month.
     - Uses `overtimePolicy` rates (`overtimeRate`, `weekendRate`, `holidayRate`) but applies only a single standard rate (TODO flags weekend/holiday differentiation).
     - Hourly rate derived from prorated base and `workingHoursPerDay` (from `shiftPolicy` or default 8).
   - Attendance & leave impact:
     - Worked days = `present + late` in `Attendance` for the month.
     - Absent days = DB count of `absent` vs calculated `(payable_days - worked_count - total_leaves)`, take max.
     - Unpaid leave days from `LeaveRequest(approved, leave_type='unpaid')`.
     - Absence deduction computed from daily rate × (final_absent_days + unpaid_leave_days).
   - Deductions:
     - Employee-specific `EmployeeDeduction` + mandatory `Deduction(is_mandatory)` filtered by applicability.
     - Percentage deductions apply to `gross_pay`.
     - Pre-tax flag respected when reducing taxable income.
     - Statutory deductions sourced from `TaxCodeVersion.statutory_deductions_config` (percentage of gross) are added as pre-tax deductions unless duplicates.
   - Tax calculation:
     - Taxable income = `gross_pay - sum(pre-tax deductions) - exemptions(limit)`.
     - Progressive brackets: For each bracket, tax on portion `min(income, upper) - lower` × `rate%`.
     - Safety cap if tax > 50% of income (only logs; no hard stop).
   - Net pay: `gross_pay - total_deductions - tax_amount`.
   - Details JSON assembled with earnings/deductions line items, attendance summary, totals, and company info.

3. Persist:

   - Existing payslips for period are deleted (regenerate semantics); model instances bulk-created.
   - Period set to `generated` and logged.

4. Workflow actions:
   - `submit_payroll`: status `pending_approval`, logs; notifies HR managers.
   - `approve_payroll`: status `approved`, logs; notifies submitting payroll officer.
   - `finalize_payroll`: status `finalized`, logs; sends notifications to each payslip recipient.
   - `rollback_payroll`: status `rolled_back`, logs; notifies submitter.

### API & Serializers

- Period list includes counts and total net pay; detail provides nested payslips + approval logs.
- Payslip serializer exposes staff-facing fields (masked bank account, department/job, tax code display).
- Update serializer allows Payroll Officer to adjust `bonus`, `total_allowances`, `total_deductions`, `has_issues`, `issue_notes`, `details`.
- Tax code endpoints support list/detail; add-version action creates `TaxCodeVersion` with nested brackets; version and bracket endpoints exist.

### Strengths

- Clear, auditable workflow with logs and notifications.
- Regeneration wipes old payslips to ensure fresh calculations per period.
- Policy-aware: uses overtime, attendance, shift, holiday, and salary policies; tax code versioning with date validity.
- Attendance/leaves affect pay (pro-rata and unpaid leaves reduce pay).
- Employee, department, and global allowances/deductions supported with pre-tax flag.

### Issues & Gaps (Backend)

- Allowance taxation: `Allowance.is_taxable` is not used to exclude non-taxable allowances from taxable income. All allowances currently inflate `gross_pay` and are effectively taxable unless compensated by exemptions.
- Pension usage: `TaxCodeVersion.pension_config` present but not used to compute pension deductions automatically; relies on a `Deduction` entity or statutory config.
- Rounding rules: `rounding_rules` present but not applied to amounts.
- Overtime differentiation: Policy fields `weekendRate` and `holidayOvertimeRate` are loaded but not applied based on actual dates; the TODO acknowledges this.
- Exemptions semantics: `exemptions_config.overtimeTaxable` exists but unused; only `limit` is applied.
- Additional employee payroll fields: `offset`, `one_off` exist on `Employee` but not included in computation.
- Tax safety cap: If triggered, no corrective action (just a comment); consider warning+log entry in period or payslip.
- Period list filtering: No server-side filtering by `month`/`year`; frontend filters in memory (OK for small data; could be problematic at scale).
- Regeneration deletes all payslips unconditionally; no per-employee selective recalculation controls.

---

## Frontend

### Key Screens

- Payroll Processor: `src/Pages/Payroll_Officer/payroll_management/GeneratePayroll.jsx`

  - Loads existing `periods`, picks period matching selected month/year.
  - Generates payroll via `POST /payroll/periods/{id}/generate/` with selected `tax_code_id`.
  - Submits, approves, finalizes via respective actions; renders totals and a table of formatted payslips.
  - Allows contacting employees (`POST /payroll/payslips/{id}/contact/`), sets `hasIssues`.
  - Warns if generating before 25th of current month.
  - Fetches `tax-codes` and filters active for selection.

- My Payslips (Employee): `src/Pages/Employee/MyPayslipsPage.jsx`

  - Calls `GET /payroll/my-payslips/`; shows finalized payslips only.
  - Displays earnings/deductions from backend `details` JSON.

- Tax Code management: `src/Pages/HR_Manager/TaxCode/TaxCode.jsx`

  - Lists tax codes and versions (transforms API data).
  - Create new tax code + add version via `/payroll/tax-codes/` then `/payroll/tax-codes/{id}/add-version/`.
  - Toggle parent code `PATCH /payroll/tax-codes/{id}/`.
  - Toggle version status intended via `PATCH /payroll/tax-versions/{id}/`.

- Reports & Payslips (Officer):
  - `ViewGeneratedPayslips.jsx` currently uses static mock data (legacy).
  - `PayrollReports.jsx`/`PayrollReportsPage.jsx` are stubs; Page renders `GeneratePayroll` instead of reports.

### Strengths

- End-to-end period workflow from UI (generate→submit→approve→finalize) matches backend.
- Proper selection of active tax codes and passing `tax_code_id` to generation.
- Employee-facing payslips use backend data; exposes only finalized payslips.
- Officer UI supports contacting employees and flagging payslip issues.

### Issues & Mismatches (Frontend)

- Endpoint mismatch: Version toggling uses `/payroll/tax-versions/{id}/` but backend registers `tax-code-versions`. Correct path should be `/payroll/tax-code-versions/{id}/`.
- Scope leakage: `TaxCode.jsx` references `fetchTaxCodes()` inside functions, but in the file it appears defined within a `useEffect` scope, making those calls undefined at runtime.
- Mock/static data:
  - `ViewGeneratedPayslips.jsx` renders static "attendanceData" and does not use backend `/payroll/payslips`.
  - `PayrollReports.jsx`/`PayrollReportsPage.jsx` are placeholders; no call to `/payroll/reports/`.
- Period fetching: `GET /payroll/periods/` then client-side filter for month/year. Works but inefficient at scale; better to support query filtering.
- Totals: Some UI totals compute fallback `gross` as `baseSalary + bonus + overtimePay` which may diverge from backend `gross_pay` if allowances are present; currently they use backend `grossPay` when available.
- Active tax code display: UI transforms `tax_code_display` string for code/version; robust but brittle to format changes.

---

## Policy & Tax Integration: Is It Working and Real?

### TaxCode

- Backend: Fully modelled with versions and brackets; generation uses the selected version matching the period date.
- Realism: Progressive calculation implemented; exemptions and statutory deductions supported. Pension/rounding present but not applied.
- Working: Generation pulls tax from `TaxCodeVersion`;
  - If no active version covers the period date, tax defaults to `0` (brackets empty); UI metric warning shows tax `0` (front has visual warning).
- Frontend: Tax code CRUD mostly wired; add-version endpoint exists; version toggling route mismatch prevents enabling/disabling versions from UI.

### Policy (Salary/Overtime/Shift/Holiday)

- Backend: Policies loaded and partially applied:
  - Overtime: Standard rate only (policy weekend/holiday rates loaded but not applied by date).
  - Shift/hours: `workingHoursPerDay` used to compute hourly rate.
  - Attendance policy influences `Attendance.status` (late vs present) and indirectly `worked_days`.
  - Salary policy’s `tax_code` used as fallback when not provided.
- Frontend: Salary structure page currently simulated (`initialPolicies`) and not persisted to backend; users cannot configure org policies through UI yet.

### Data Realism

- Backend calculations are dynamic against real entities: employees, attendance, leaves, overtime, tax versions, allowances/deductions assignments.
- Non-real/static portions:
  - Frontend payslip viewing for officer (generated payslip list) still uses static mock on `ViewGeneratedPayslips` and lacks real reports.
  - Policy edit UI not integrated; overtime differentiation not implemented; rounding/pension rules unused.

---

## Hidden Problems & Non-Real-World Gaps

- Non-taxable allowances: Taxable base ignores `Allowance.is_taxable`; in many jurisdictions certain allowances are non-taxable. Implement exclusion from `taxable_income` when `is_taxable=false`.
- Pension & statutory contributions: Pension should be computed per config or local law (e.g., employee/employer percentages). Current code requires explicit `Deduction` or relies on statutory config but does not use `pension_config`.
- Rounding rules: Payroll often rounds amounts (per rules) at line-level or total-level; backend does not apply `rounding_rules`.
- Overtime classification: Weekend/holiday OT rates not applied; actual days are not checked; policy contains values but logic is marked TODO.
- One-off adjustments: `Employee.offset`/`one_off` not factored into payslip; these commonly represent manual adjustments.
- Bracket safety cap: If tax exceeds safety cap, no recorded warning; should log to `approval_logs` or set `has_issues` on affected payslips.
- Reports: Officer/Manager reports pages are not implemented; no aggregated analytics or export logic beyond the table export in `GeneratePayroll`.
- Version toggle UI bug: Wrong endpoint (`tax-versions`) breaks managing active versions; can lead to wrong version being applied server-side.
- Filtering & scale: Frontend fetches all periods then filters; large datasets will degrade performance—prefer server-side month/year filters.
- Regeneration behavior: Deletes all payslips each time; lacks diffing or partial recalculation (can be acceptable but may waste work).

---

## Recommendations

1. Taxable Income Calculation

   - Respect `Allowance.is_taxable`: include only taxable allowances in taxable income; optionally show non-taxable line items separately.
   - Consider exemption scoping (e.g., exemptions applied to allowance types or capped by category).

2. Pension & Statutory

   - Apply `pension_config` automatically if present; compute employee contributions as pre-tax deduction and reflect employer contributions separately (not in net pay).
   - Normalize `statutory_deductions_config` to explicit deduction lines; ensure precise order (pre-tax vs post-tax).

3. Overtime Logic

   - Classify OT by date (weekday/weekend/holiday) using `Attendance` or OT request date; apply rate from correct policy field.
   - Consider OT taxability if `exemptions_config.overtimeTaxable=false`.

4. Rounding & Compliance

   - Implement `rounding_rules` consistently: amounts rounded as per method/precision.
   - Log anomalies (e.g., tax > cap) to approval logs with `has_issues` and clear notes.

5. Adjustments

   - Include `Employee.offset` and `one_off` in earnings/deductions line items with appropriate tax treatment.

6. API & UI Alignment

   - Fix tax version endpoint path in frontend: use `/payroll/tax-code-versions/{id}/`.
   - Move `fetchTaxCodes()` out of `useEffect` scope; ensure it’s callable from handlers.
   - Replace static `ViewGeneratedPayslips.jsx` with real `/payroll/payslips?period=...` and add filters.
   - Implement `GET /payroll/reports/` consumption in UI with month/year filters and summaries.
   - Add server-side filters for `/payroll/periods/?month=&year=` to reduce client-side scanning.

7. Performance & Safety
   - Consider per-employee regeneration (diff) or batch recalculation instead of delete-all each time.
   - Add validation that a period has an applicable active tax version; fail early with actionable error.

---

## Conclusion

The backend payroll engine is reasonably feature-complete and policy-aware, calculating real pay components from attendance, leaves, overtime, and tax code versions. Key missing pieces are the handling of non-taxable allowances, pension/rounding rules, and OT date-based rates, plus some employee adjustments. The frontend provides an operational generation workflow and employee payslip views but still contains legacy/static pages and endpoint mismatches for tax version management. Addressing these gaps will bring the system closer to real-world payroll expectations, improve correctness, and strengthen administrator UX.
