import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../../Context/AuthContext';
import Table from '../../../Components/Table';
import EmployeePayslipTemplate from '../../../Components/EmployeePayslipTemplate';

function MyPayrollPage({titlez=false,pages=4, background, headerfont = 'text-2xl' }) {
  const { axiosPrivate } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyPayslips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosPrivate.get('/payroll/my-payslips/');
      const results = res.data.results || res.data || [];
      // Map to table-friendly shape
      const mapped = results.map((p) => ({
        id: p.id,
        month:
          p.details?.month ||
          `${p.period?.month || ''} ${p.period?.year || ''}`,
        net: p.net_pay || p.net || 0,
        gross: p.gross_pay || p.gross || 0,
        deductions: (p.total_deductions || 0) + (p.tax_amount || 0),
        payslipId: p.id,
        raw: p,
      }));
      setPayslips(mapped);
    } catch (e) {
      console.error('Failed to fetch my payslips', e);
      setError('Failed to load payslips');
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => {
    fetchMyPayslips();
  }, [fetchMyPayslips]);

  const structure = [1, 1, 63];
  const key = [['month'], ['net']];
  const title = ['Month', 'Net Salary', 'Action'];

  return (
    <div className={`p-5 ${background}`}>
      {!titlez && (<h1 className={` font-semibold mb-4 ${headerfont}`}>Payslips</h1>)}

      {loading ? (
        <div>Loading payslips…</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <Table
          pages={pages}
          D1="generate"
          Data={payslips}
          Structure={structure}
          ke={key}
          title={title}
          nickname="View Payslip"
          components={EmployeePayslipTemplate}
        />
      )}
    </div>
  );
}

export default MyPayrollPage;
