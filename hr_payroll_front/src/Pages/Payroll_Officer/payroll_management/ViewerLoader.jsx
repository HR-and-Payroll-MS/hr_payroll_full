import PayslipTemplate from '../../../Components/PayslipTemplate';

// ViewerLoader: renders a payslip payload from backend
export default function ViewerLoader({ payslip, month }) {
  if (!payslip) return null;

  const payroll = {
    employee: {
      id: payslip.employee,
      name: payslip.employee_name || payslip.employee_id_display,
      department: payslip.department,
      jobTitle: payslip.job_title,
      bankAccount: payslip.bank_account,
    },
    month,
    earnings: payslip.details?.earnings || [],
    deductions: payslip.details?.deductions || [],
    taxSummary: payslip.details?.taxSummary,
    contributions: payslip.details?.contributions,
    gross: Number(payslip.gross_pay || 0),
    net: Number(payslip.net_pay || 0),
    company: payslip.details?.company,
    taxCode: payslip.tax_code_display,
  };

  return (
    <div className="p-4 border dark:border-slate-400 dark:bg-slate-700 overflow-y-auto h-full rounded hover-bar bg-white">
      <p className="text-2xl dark:text-slate-200 mb-7 font-bold">
        Preview: {payroll?.employee?.name}
      </p>
      <PayslipTemplate payroll={payroll} />
    </div>
  );
}
