/**
 * @deprecated This function is for LEGACY PREVIEW only.
 * 
 * ACTUAL PAYROLL CALCULATION NOW HAPPENS VIA BACKEND API:
 * - POST /payroll/periods/{id}/generate/
 * - Uses PayrollCalculationService which reads from:
 *   - TaxCode/TaxBracket models (Ethiopian progressive tax 0-35%)
 *   - Policy models (overtimePolicy, shiftPolicy, etc.)
 *   - CompanyInfo for company details
 * 
 * This local function has hardcoded values and should NOT be used for
 * production payroll generation. It only exists for ViewerLoader.jsx
 * and OnPayrollGenerate.jsx legacy preview functionality.
 */
export default function calcPayrollForEmployee(emp, month) {
  // LEGACY: Hardcoded values - not accurate!
  // Real calculations use Ethiopian tax brackets from TaxCode model
  const baseMap = { Finance: 20000, HR: 15000, IT: 18000 };
  const base = baseMap[emp.department] || 12000;
  const allowance = Math.round(base * 0.2);
  const bonus = Math.round(base * 0.05);
  const overtime = 0;
  const gross = base + allowance + bonus + overtime;
  const tax = Math.round(gross * 0.1);
  const pension = Math.round(gross * 0.03);
  const other = 0;
  const totalDeductions = tax + pension + other;
  const net = gross - totalDeductions;
  return {
    employee: emp,
    month,
    company: {
      name: "ACME Corp",
      address: "1 Example Street",
      phone: "+251 555 123",
      email: "hr@acme.test",
      logoUrl: "",
    },
    earnings: [
      { label: "Basic Salary", amount: base },
      { label: "Allowance", amount: allowance },
      { label: "Bonus", amount: bonus },
    ],
    deductions: [
      { label: "Income Tax (10%)", amount: tax },
      { label: "Pension (3%)", amount: pension },
    ],
    gross,
    totalDeductions,
    net,
    paymentMethod: "Bank Transfer",
    paymentDate: new Date().toLocaleDateString(),
  };
}