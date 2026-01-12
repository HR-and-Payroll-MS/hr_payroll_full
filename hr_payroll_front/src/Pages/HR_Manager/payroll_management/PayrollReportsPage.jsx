import React, { useMemo, useState, useEffect } from 'react';
import useAuth from '../../../Context/AuthContext';
import Header from '../../../Components/Header';
import { RotateCcw, Lock, Info } from 'lucide-react';

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

  // Period Actions State
  const [periodId, setPeriodId] = useState(null);
  const [periodStatus, setPeriodStatus] = useState(null);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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
      setPeriodId(null);
      setPeriodStatus(null);
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

        // Fetch Period Status
        try {
          const periodRes = await axiosPrivate.get(
            `/payroll/periods/?month=${month}&year=${year}`
          );
          const periods = periodRes.data.results || periodRes.data || [];
          if (periods.length > 0) {
            setPeriodId(periods[0].id);
            setPeriodStatus(periods[0].status);
          }
        } catch (e) {
          console.error('Failed to fetch period status', e);
        }
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

  const handleRollback = async () => {
    if (!periodId || !rollbackReason.trim()) return;
    setActionLoading(true);
    try {
      await axiosPrivate.post(
        `/payroll/periods/${periodId}/rollback/`,
        { reason: rollbackReason }
      );
      setPeriodStatus('rolled_back');
      setShowRollbackModal(false);
      setRollbackReason('');
    } catch (e) {
      alert('Rollback failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!periodId) return;
    // Confirm intent
    if (
      !window.confirm(
        'Are you sure you want to finalize this payroll? This action cannot be undone.'
      )
    )
      return;

    setActionLoading(true);
    try {
      // If pending approval, we can try to approve first to be safe, or just finalize if backend permits.
      // Assuming 'finalize' handles the transition or requires approval status.
      // We will try finalize directly as requested.
      await axiosPrivate.post(`/payroll/periods/${periodId}/finalize/`);
      setPeriodStatus('finalized');
    } catch (e) {
      alert('Finalize failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-5 flex flex-col gap-4 h-full relative">
      <div className="flex justify-between items-start">
        <Header
          Title={'Payroll Reports'}
          subTitle={
            <span className="flex items-center gap-2">
              Overview for {month} {year}
              {periodStatus && (
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    periodStatus === 'pending_approval'
                      ? 'bg-amber-100 text-amber-700'
                      : periodStatus === 'finalized'
                      ? 'bg-green-100 text-green-700'
                      : periodStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {periodStatus.replace('_', ' ')}
                </span>
              )}
            </span>
          }
        />

        {/* ACTION BUTTONS FOR HR MANAGER */}
        {(periodStatus === 'pending_approval' || periodStatus === 'approved') && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowRollbackModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              <RotateCcw size={16} /> Rollback
            </button>
            <button
              onClick={handleFinalize}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 shadow disabled:opacity-50"
            >
              <Lock size={16} /> Finalize
            </button>
          </div>
        )}
      </div>

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

      {/* Rollback Modal */}
      {showRollbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-96 rounded-lg shadow-xl p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
              <RotateCcw size={20} /> Rollback Payroll
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Send back to Payroll Officer for corrections.
            </p>
            <textarea
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="Enter reason for rollback..."
              className="w-full border rounded-lg p-3 text-sm h-24 mb-4 focus:ring-2 focus:ring-red-500 outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRollbackModal(false);
                  setRollbackReason('');
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRollback}
                disabled={!rollbackReason.trim() || actionLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Rollback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayrollReportsPage;
