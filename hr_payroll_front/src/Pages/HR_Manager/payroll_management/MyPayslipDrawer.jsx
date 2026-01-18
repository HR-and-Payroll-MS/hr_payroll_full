import React, { useEffect, useState } from 'react';
import useAuth from '../../../Context/AuthContext';
import PayslipTemplate from '../../../Components/PayslipTemplate';

function MyPayslipDrawer({ data }) {
  const { axiosPrivate } = useAuth();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(false);

  // If caller passes full payslip data, prefer that. If an id is passed, fetch it.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!data) return;
      // If data already contains `details` or `earnings`, use it directly
      if (data.details || data.earnings) {
        setPayroll(data.details ? { ...data.details, ...data } : data);
        return;
      }

      // If data is an object with payslipId or id, fetch the payslip record
      const payslipId =
        data.payslipId || data.id || (typeof data === 'number' ? data : null);
      if (!payslipId) return;

      setLoading(true);
      try {
        const res = await axiosPrivate.get(`/payroll/payslips/${payslipId}/`);
        const ps = res.data;
        // Build payroll shape expected by PayslipTemplate
        const details = ps.details || {};
        const payrollObj = {
          ...details,
          employee: {
            name: ps.employee_name,
            id: ps.employee_id_display,
            department: ps.department,
            jobTitle: ps.job_title,
            bankAccount: ps.bank_account,
          },
          gross: ps.gross_pay,
          totalDeductions: ps.total_deductions,
          net: ps.net_pay,
          overtime_pay: ps.overtime_pay,
          overtime_hours: ps.overtime_hours,
          overtime_rate: ps.overtime_rate,
          has_issues: ps.has_issues,
          issue_notes: ps.issue_notes,
        };
        if (mounted) setPayroll(payrollObj);
      } catch (e) {
        console.error('Failed to load payslip', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => (mounted = false);
  }, [data, axiosPrivate]);

  // Fallback mock if nothing available
  const mockdata = {
    company: {
      name: 'ACME Corp',
      address: '1 Example Street',
      phone: '+251 555 123',
      email: 'hr@acme.test',
      logoUrl: '',
    },
    employee: {
      name: 'John Doe',
      id: 'EMP001',
      department: 'Finance',
      jobTitle: 'Accountant',
      bankAccount: '0011223344',
    },
    month: '2025-12',
    paymentMethod: 'Bank Transfer',
    paymentDate: '12/15/2025',
    earnings: [
      { label: 'Basic Salary', amount: 15000 },
      { label: 'Housing Allowance', amount: 5000 },
    ],
    deductions: [{ label: 'Tax', amount: 2000 }],
    gross: 25000,
    totalDeductions: 2000,
    net: 23000,
  };

  const toRender = payroll || mockdata;

  return (
    <div>
      <PayslipTemplate payroll={toRender} isEditable={false} />
    </div>
  );
}

export default MyPayslipDrawer;
