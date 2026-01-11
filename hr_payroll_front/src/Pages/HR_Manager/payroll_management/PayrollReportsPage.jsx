import React, { useMemo, useState, useEffect } from 'react';
import useAuth from '../../../Context/AuthContext';
import Header from '../../../Components/Header';

function PayrollReportsPage() {
  const { axiosPrivate } = useAuth();
  const months = useMemo(
    () => [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    []
  );
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return [now - 1, now, now + 1];
  }, []);

  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totals = useMemo(() => {
    const gross = rows.reduce((acc, r) => acc + (Number(r.gross) || 0), 0);
    const tax = rows.reduce((acc, r) => acc + (Number(r.tax) || 0), 0);
    const net = rows.reduce((acc, r) => acc + (Number(r.net) || 0), 0);
    return { gross, tax, net, employees: rows.length };
  }, [rows]);

  const taxVersionInactive = useMemo(() => {
    const zeroTaxButGross =
      totals.tax === 0 && totals.gross > 0 && rows.length > 0;
    const hasIssueText = rows.some((r) =>
      String(r.issues || '')
        .toLowerCase()
        .includes('no active tax version')
    );
    return zeroTaxButGross || hasIssueText;
  }, [rows, totals]);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosPrivate.get(
          `/payroll/reports/?month=${encodeURIComponent(
            month
          )}&year=${encodeURIComponent(year)}`
        );
        const data = res.data.results || res.data || [];
        const mapped = data.map((p) => ({
          id: p.id,
          employee: p.employee_name,
          employeeId: p.employee_id_display,
          department: p.department,
          jobTitle: p.job_title,
          gross:
            typeof p.gross_pay === 'string'
              ? parseFloat(p.gross_pay)
              : p.gross_pay,
          tax:
            typeof p.tax_amount === 'string'
              ? parseFloat(p.tax_amount)
              : p.tax_amount,
          net:
            typeof p.net_pay === 'string' ? parseFloat(p.net_pay) : p.net_pay,
          issues: p.has_issues ? p.issue_notes || 'Has issues' : '',
        }));
        setRows(mapped);
      } catch (err) {
        console.error('Error loading payroll reports:', err);
        setError('Failed to load payroll reports');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [axiosPrivate, month, year]);

  return (
    <div className="p-5 flex flex-col gap-4 h-full">
      <Header
        Title={'Payroll Reports'}
        subTitle={`Overview for ${month} ${year}`}
      />

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="border px-2 py-1 rounded"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-3 bg-white rounded shadow">
          <div className="text-xs text-slate-500">Employees</div>
          <div className="text-lg font-bold">{totals.employees}</div>
        </div>
        <div className="p-3 bg-white rounded shadow">
          <div className="text-xs text-slate-500">Gross</div>
          <div className="text-lg font-bold">
            {totals.gross.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="p-3 bg-white rounded shadow">
          <div className="text-xs text-slate-500">Tax</div>
          <div className="text-lg font-bold">
            {totals.tax.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="p-3 bg-white rounded shadow">
          <div className="text-xs text-slate-500">Net</div>
          <div className="text-lg font-bold">
            {totals.net.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
      {taxVersionInactive && (
        <div className="mt-2 flex items-center gap-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded">
          Taxes appear to be zero. Verify an active tax code version is enabled
          for this period.
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading…</div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No payslips for selected period.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">Employee</th>
                <th className="p-3">Employee ID</th>
                <th className="p-3">Department</th>
                <th className="p-3">Job Title</th>
                <th className="p-3">Gross</th>
                <th className="p-3">Tax</th>
                <th className="p-3">Net</th>
                <th className="p-3">Issues</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{r.employee}</td>
                  <td className="p-3">{r.employeeId}</td>
                  <td className="p-3">{r.department || '-'}</td>
                  <td className="p-3">{r.jobTitle || '-'}</td>
                  <td className="p-3">
                    {Number(r.gross).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="p-3">
                    {Number(r.tax).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="p-3 font-semibold">
                    {Number(r.net).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="p-3">{r.issues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PayrollReportsPage;
