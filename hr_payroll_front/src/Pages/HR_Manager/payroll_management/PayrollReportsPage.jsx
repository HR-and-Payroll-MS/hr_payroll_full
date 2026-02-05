import React, { useMemo, useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import ExportTable from '../../../Components/ExportTable';
import Dropdown from '../../../Components/Dropdown';
import useAuth from '../../../Context/AuthContext';
import EmployeePayslipTemplate from '../../../Components/EmployeePayslipTemplate';
import Header from '../../../Components/Header';
import Table from '../../../Components/Table';
import { RotateCcw, Lock, Info, CheckCircle } from 'lucide-react';

function PayrollReportsPage() {
  const { axiosPrivate } = useAuth();
  const allMonths = useMemo(
    () => Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMMM')),
    []
  );
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: 20 }, (_, i) => (currentYear - i).toString()),
    [currentYear]
  );

  const [month, setMonth] = useState(dayjs().format('MMMM'));
  const [year, setYear] = useState(currentYear.toString());
  const [rows, setRows] = useState([]);
  const tableContainerRef = useRef(null);
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
          raw: p,
          profile_photo:
            p.profile_photo ||
            p.photo ||
            p.employee_pic ||
            p.employee_photo ||
            (p.employee && p.employee.photo) ||
            null,
          employee_pic:
            p.profile_photo ||
            p.photo ||
            p.employee_pic ||
            p.employee_photo ||
            (p.employee && p.employee.photo) ||
            null,
          employee: p.employee_name,
          employeeId: p.employee_id_display,
          department: p.department,
          jobTitle: p.job_title,
          // payroll fields
          baseSalary:
            typeof p.base_salary === 'string'
              ? parseFloat(p.base_salary)
              : p.base_salary,
          bankAccount: p.bank_account,
          attendance: p.worked_days || p.attended_days || 0,
          overtime:
            typeof p.overtime_pay === 'string'
              ? parseFloat(p.overtime_pay)
              : p.overtime_pay || 0,
          // deductions excluding tax: prefer details.deductions when available
          deductionsExclTax: (() => {
            try {
              const details = p.details || {};
              const deductionItems = Array.isArray(details.deductions)
                ? details.deductions
                : [];
              const nonTaxDeductions = deductionItems
                .filter(
                  (d) =>
                    !String(d.label || '')
                      .toLowerCase()
                      .includes('tax')
                )
                .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
              const fallbackNonTax = parseFloat(p.total_deductions) || 0;
              return deductionItems.length > 0
                ? nonTaxDeductions
                : fallbackNonTax;
            } catch (e) {
              return parseFloat(p.total_deductions) || 0;
            }
          })(),
          adjustment: (() => {
            const details = p.details || {};
            return parseFloat(details.adjustmentApplied) || 0;
          })(),
          taxCode: p.tax_code_display || '',
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
          view: 'View',
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

  // Page-specific DOM tweaks: enable horizontal scrolling only on the table wrapper
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    // find the rendered <table> inside the Table component
    const tbl = container.querySelector('table');
    if (!tbl) return;

    // ensure the container stays constrained and becomes the scrolling viewport
    container.style.maxWidth = container.style.maxWidth || '100%';
    container.style.overflowX = 'auto';
    // preserve vertical flow so page doesn't become the horizontal scroller
    container.style.overflowY = container.style.overflowY || 'visible';

    // allow the table to be wider than the container so the container alone scrolls
    tbl.style.minWidth = tbl.style.minWidth || '1200px';
  }, [rows]);

  const handleRollback = async () => {
    if (!periodId || !rollbackReason.trim()) return;
    setActionLoading(true);
    try {
      await axiosPrivate.post(`/payroll/periods/${periodId}/rollback/`, {
        reason: rollbackReason,
      });
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
            <span className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Overview for</span>
              <div className="flex items-center gap-2">
                <div className="w-36">
                  <Dropdown
                    options={allMonths}
                    selectedLabel={month}
                    onChange={(val) => setMonth(val)}
                    placeholder={month}
                    padding={'py-2'}
                    text={'text-xs font-semibold'}
                  />
                </div>
                <div className="w-24">
                  <Dropdown
                    options={yearOptions}
                    selectedLabel={year}
                    onChange={(val) => setYear(val)}
                    placeholder={year}
                    padding={'py-2'}
                    text={'text-xs font-semibold'}
                  />
                </div>
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
              </div>
            </span>
          }
        />

        {/* ACTION BUTTONS FOR MANAGER */}
        {(periodStatus === 'pending_approval' ||
          periodStatus === 'approved') && (
          <div className="flex gap-2">
            {periodStatus === 'pending_approval' && (
              <>
                <button
                  onClick={() => setShowRollbackModal(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <RotateCcw size={16} /> Rollback
                </button>

                <button
                  onClick={async () => {
                    if (!periodId) return;
                    if (!window.confirm('Approve this payroll?')) return;
                    setActionLoading(true);
                    try {
                      await axiosPrivate.post(
                        `/payroll/periods/${periodId}/approve/`,
                        { notes: '' }
                      );
                      setPeriodStatus('approved');
                    } catch (e) {
                      alert(
                        'Approve failed: ' +
                          (e.response?.data?.error || e.message)
                      );
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow disabled:opacity-50"
                >
                  <CheckCircle size={16} /> Approve
                </button>
              </>
            )}

            {periodStatus === 'approved' && (
              <>
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
              </>
            )}
          </div>
        )}
        {periodStatus === 'finalized' && (
          <div className="flex items-center gap-2">
            <ExportTable
              fileName={`Payroll_${month}_${year}`}
              keys={[
                ['employee_pic', 'employee', 'employeeId'],
                ['employeeId'],
                ['department'],
                ['jobTitle'],
                ['baseSalary'],
                ['bankAccount'],
                ['attendance'],
                ['overtime'],
                ['deductionsExclTax'],
                ['adjustment'],
                ['taxCode'],
                ['tax'],
                ['gross'],
                ['net'],
                ['issues'],
              ]}
              bodyStructure={[
                3, 1, 1, 1, 72, 1, 73, 72, 74, 75, 1, 77, 77, 77, 1,
              ]}
              title={[
                'Employee',
                'Employee ID',
                'Department',
                'Job Title',
                'Base Salary',
                'Bank Account',
                'Attendance',
                'Overtime',
                'Deductions (excl tax)',
                'Adj (Carryover)',
                'Tax Code',
                'Tax Amt',
                'Gross',
                'Net',
                'Issues',
              ]}
              data={rows}
            />
          </div>
        )}
      </div>

      {/* Filters are in header now */}

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

      {/* Table (shared component) */}
      <div
        ref={tableContainerRef}
        className="bg-white rounded shadow max-w-full overflow-x-auto"
      >
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading…</div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No payslips for selected period.
          </div>
        ) : (
          <Table
            D1={periodStatus}
            Data={rows}
            Structure={[
              3, 1, 1, 1, 72, 1, 73, 72, 74, 75, 1, 77, 77, 77, 1, 63,
            ]}
            titleStructure={Array(16).fill(11)}
            ke={[
              ['employee_pic', 'employee', 'employeeId'],
              ['employeeId'],
              ['department'],
              ['jobTitle'],
              ['baseSalary'],
              ['bankAccount'],
              ['attendance'],
              ['overtime'],
              ['deductionsExclTax'],
              ['adjustment'],
              ['taxCode'],
              ['tax'],
              ['gross'],
              ['net'],
              ['issues'],
              ['view'],
            ]}
            title={[
              'Employee',
              'Employee ID',
              'Department',
              'Job Title',
              'Base Salary',
              'Bank Account',
              'Attendance',
              'Overtime',
              'Deductions (excl tax)',
              'Adj (Carryover)',
              'Tax Code',
              'Tax Amt',
              'Gross',
              'Net',
              'Issues',
              'Action',
            ]}
            pages={10}
            nickname={'View Payslip'}
            components={EmployeePayslipTemplate}
          />
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
              Send back to Payroll for corrections.
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
