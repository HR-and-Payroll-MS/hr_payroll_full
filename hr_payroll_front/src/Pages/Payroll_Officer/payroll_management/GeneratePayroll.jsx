import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Generatepayroll } from '../../../Components/Level2Hearder';
import Header from '../../../Components/Header';
import Table from '../../../Components/Table';
import ExportTable from '../../../Components/ExportTable';
import {
  RefreshCw,
  Lock,
  CheckCircle,
  DollarSign,
  Users,
  Settings,
  AlertCircle,
  AlertTriangle,
  FileText,
  ChevronDown,
  ArrowLeft,
  Send,
  RotateCcw,
  MessageCircle,
  X,
} from 'lucide-react';
import Dropdown from '../../../Components/Dropdown';
import dayjs from 'dayjs';
import Icon from '../../../Components/Icon';
import ViewerLoader from './ViewerLoader';
import PayslipTemplate2 from '../../../Components/PayslipTemplate2';
import ClockoutModal from '../../../Components/Modals/ClockoutModal';
import useAuth from '../../../Context/AuthContext';

const allMonths = Array.from({ length: 12 }, (_, i) =>
  dayjs().month(i).format('MMMM'),
);
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 20 }, (_, i) =>
  (currentYear - i).toString(),
);
const formatMoney = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    amount || 0,
  );

function GeneratePayroll() {
  const { auth, axiosPrivate } = useAuth();

  // Determine user role from auth context
  const userRole = useMemo(() => {
    const groups = auth?.user?.groups || [];
    const role = auth?.user?.role || '';
    if (groups.includes('HR Manager') || role.toLowerCase().includes('hr')) {
      return 'hr_manager';
    }
    return 'payroll_officer';
  }, [auth]);

  // State
  const [periodId, setPeriodId] = useState(null);
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);

  // Tax Code handling
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTaxCode, setSelectedTaxCode] = useState('');
  const [selectedTaxVersion, setSelectedTaxVersion] = useState('');

  // Reset version selection when tax code changes
  useEffect(() => {
    setSelectedTaxVersion('');
  }, [selectedTaxCode]);

  // Early generation warning check

  const [payslips, setPayslips] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [month, setMonth] = useState(dayjs().format('MMMM'));
  const [year, setYear] = useState(currentYear.toString());

  // Early generation warning check
  const isCurrentMonth = useMemo(() => {
    try {
      const currentMonthName = dayjs().format('MMMM');
      const currentYearNum = new Date().getFullYear();
      return (
        String(month).trim().toLowerCase() ===
          String(currentMonthName).trim().toLowerCase() &&
        parseInt(year) === currentYearNum
      );
    } catch (e) {
      return false;
    }
  }, [month, year]);

  const isEarlyGeneration = useMemo(() => {
    const today = new Date();
    // Warning if generating for current month before the 25th
    return isCurrentMonth && today.getDate() < 25;
  }, [isCurrentMonth]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [taxCodes, setTaxCodes] = useState([]);
  const [taxConfig, setTaxConfig] = useState({
    scope: 'All Employees',
    regime: '',
    version: '',
  });
  const [contactModal, setContactModal] = useState({
    isOpen: false,
    payslip: null,
  });
  const [contactMessage, setContactMessage] = useState('');
  const [rollbackReason, setRollbackReason] = useState('');
  const [showRollbackModal, setShowRollbackModal] = useState(false);

  const activeTaxCodesSorted = useMemo(() => {
    const activeCodes = taxCodes.filter((c) => c.is_active || c.isEnabled);
    return [...activeCodes].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      return (b.id || 0) - (a.id || 0);
    });
  }, [taxCodes]);

  const selectedTaxCodeLabel = useMemo(() => {
    const tc = activeTaxCodesSorted.find(
      (c) =>
        c.id === selectedTaxCode ||
        c.code === selectedTaxCode ||
        String(c.id) === String(selectedTaxCode),
    );
    return tc ? `${tc.name} (${tc.code})` : '';
  }, [activeTaxCodesSorted, selectedTaxCode]);

  const departments = useMemo(
    () => ['All Employees', 'Finance', 'IT', 'HR', 'Operations'],
    [],
  );

  // Fetch payroll period data
  const fetchPayrollPeriod = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        // Try to get existing period for this month/year
        const periodsRes = await axiosPrivate.get(`/payroll/periods/`, {
          params: { month, year },
        });

        const periods = periodsRes.data.results || periodsRes.data || [];
        const existingPeriod = periods.find(
          (p) => p.month === month && p.year === parseInt(year),
        );

        if (existingPeriod) {
          setPeriodId(existingPeriod.id);
          setStatus(existingPeriod.status);

          const periodDetail = await axiosPrivate.get(
            `/payroll/periods/${existingPeriod.id}/`,
          );
          const periodData = periodDetail.data;

          // Transform payslips to match table format
          const formattedPayslips = (periodData.payslips || []).map((p) => {
            const details = p.details || {};
            const deductionItems = Array.isArray(details.deductions)
              ? details.deductions
              : [];
            const nonTaxDeductions = deductionItems
              .filter(
                (d) =>
                  !String(d.label || '')
                    .toLowerCase()
                    .includes('tax'),
              )
              .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            const fallbackNonTax = parseFloat(p.total_deductions) || 0;
            const deductionsTotal =
              deductionItems.length > 0 ? nonTaxDeductions : fallbackNonTax;

            const adjustmentApplied =
              parseFloat(details.adjustmentApplied) || 0;

            return {
              id: p.employee,
              payslipId: p.id,
              name: p.employee_name,
              role: p.job_title || '',
              department: p.department || '',
              baseSalary: parseFloat(p.base_salary) || 0,
              bonus: parseFloat(p.bonus) || 0,
              bankAccount: p.bank_account || '',
              attendedDays: p.worked_days || 0,
              lopDays: p.absent_days || 0,
              overtimeHours: parseFloat(p.overtime_hours) || 0,
              overtimePay: parseFloat(p.overtime_pay) || 0,
              taxCode: p.tax_code_display?.split(' (')[0] || '',
              taxVersion:
                p.tax_code_display?.split(' (')[1]?.replace(')', '') || '',
              taxDisplay: p.tax_code_display || 'Not Assigned',
              taxAmount: parseFloat(p.tax_amount) || 0,
              netPay: parseFloat(p.net_pay) || 0,
              grossPay: parseFloat(p.gross_pay) || 0,
              hasIssues: p.has_issues,
              issueNotes: p.issue_notes,
              details,
              deductionsTotal,
              adjustmentDisplay: adjustmentApplied,
            };
          });

          setPayslips(formattedPayslips);
        } else {
          // No existing period
          setPeriodId(null);
          setStatus('draft');
          setPayslips([]);
        }
      } catch (err) {
        console.error('Error fetching payroll:', err);
        if (!silent) {
          setError('Failed to load payroll data');
          setPayslips([]);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [axiosPrivate, month, year],
  );

  // Fetch tax codes for configuration
  const fetchTaxCodes = useCallback(async () => {
    try {
      const res = await axiosPrivate.get('/payroll/tax-codes/');
      const codes = res.data.results || res.data || [];
      // Filter out inactive tax codes so they cannot be selected for payroll
      const activeCodes = codes.filter((c) => c.is_active || c.isEnabled);

      // Sort by created_at desc, fallback to id desc, pick latest as default
      const sorted = [...activeCodes].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;
        return (b.id || 0) - (a.id || 0);
      });

      setTaxCodes(activeCodes);
      if (!selectedTaxCode && sorted.length > 0) {
        setSelectedTaxCode(sorted[0].id);
      }
    } catch (err) {
      console.error('Error fetching tax codes:', err);
    }
  }, [axiosPrivate, selectedTaxCode]);

  // Fetch a single tax code (with allowances) when opening its versions
  const fetchTaxCodeDetail = useCallback(
    async (backendId, codeIdForState) => {
      if (!backendId) return;
      try {
        const res = await axiosPrivate.get(`/payroll/tax-codes/${backendId}/`);
        const tc = res.data;
        const allowances = mapAllowances(tc.allowances);
        const transformedVersions = (tc.versions || []).map((v) => ({
          id: v.id,
          version: v.version,
          validFrom: v.valid_from,
          validTo: v.valid_to,
          status: { active: v.is_active, locked: v.is_locked },
          incomeTax: {
            ...(v.income_tax_config || { type: 'progressive' }),
            brackets:
              v.tax_brackets?.map((b) => ({
                min: parseFloat(b.min_income),
                max: b.max_income ? parseFloat(b.max_income) : '',
                rate: parseFloat(b.rate),
              })) ||
              v.income_tax_config?.brackets ||
              [],
          },
          pension: v.pension_config || {
            employeePercent: 7,
            employerPercent: 11,
          },
          statutoryDeductions: v.statutory_deductions_config || [],
          exemptions: v.exemptions_config || [],
          rounding: v.rounding_rules || { method: 'nearest', precision: 2 },
          compliance: v.compliance_notes || [],
          allowances,
        }));

        setAllTaxCodes((prev) =>
          prev.map((c) =>
            c.id === codeIdForState
              ? {
                  ...c,
                  backendId: tc.id,
                  name: tc.name,
                  isEnabled: tc.is_active,
                  allowances,
                  versions: transformedVersions,
                }
              : c,
          ),
        );
      } catch (err) {
        console.error('Failed to fetch tax code detail', err);
      }
    },
    [axiosPrivate],
  );

  useEffect(() => {
    fetchPayrollPeriod();
    fetchTaxCodes();
  }, [fetchPayrollPeriod, fetchTaxCodes]);

  // Refresh payroll period when a payslip has been updated by the Payslip modal
  useEffect(() => {
    const onPayslipUpdated = (e) => {
      try {
        console.debug(
          'payslip-updated event received, refreshing payroll period',
        );
        fetchPayrollPeriod(true);
      } catch (err) {
        console.error('Failed to refresh payroll after payslip update', err);
      }
    };
    window.addEventListener('payslip-updated', onPayslipUpdated);
    return () =>
      window.removeEventListener('payslip-updated', onPayslipUpdated);
  }, [fetchPayrollPeriod]);

  // Debug logging to help diagnose missing Generate button
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.debug('Payroll Debug:', {
        month,
        year,
        periodId,
        status,
        userRole,
        isCurrentMonth,
      });
    } catch (e) {}
  }, [month, year, periodId, status, userRole, isCurrentMonth]);

  // Real-time status polling (silent refresh to avoid flicker)
  // Keeps status in sync when admins change it (e.g., finalized -> draft).
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchPayrollPeriod(true);
      }
    }, 8000);

    const onFocus = () => fetchPayrollPeriod(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchPayrollPeriod]);

  // Create period if not exists
  const createPeriod = async () => {
    try {
      const payload = { month, year: parseInt(year) };
      console.log('createPeriod: POST /payroll/periods/ payload:', payload);
      const res = await axiosPrivate.post('/payroll/periods/', payload);
      console.log('createPeriod: response:', res?.data);
      const newId = res.data.id;
      if (newId) {
        setPeriodId(newId);
        setStatus(res.data.status);
        return newId;
      }
      // Unexpected: no id in response
      console.error(
        'createPeriod: created period response missing id',
        res?.data,
      );
      return null;
    } catch (err) {
      console.error(
        'createPeriod: error creating period',
        err?.response || err,
      );
      if (err.response?.status === 400) {
        // Period might already exist — fetch the list and return matching id
        try {
          const listRes = await axiosPrivate.get('/payroll/periods/', {
            params: { month, year },
          });
          const list = listRes.data.results || listRes.data || [];
          const existing = list.find(
            (p) => p.month === month && Number(p.year) === Number(year),
          );
          if (existing) {
            setPeriodId(existing.id);
            setStatus(existing.status || 'draft');
            return existing.id;
          }
        } catch (fetchErr) {
          console.error(
            'createPeriod: failed to fetch periods after 400',
            fetchErr,
          );
        }
        return null;
      }
      throw err;
    }
  };

  // Generate payroll
  // Open Generate Modal
  const handleGenerate = () => {
    // Default to latest active code picked in fetchTaxCodes; nothing extra needed here
    setShowGenerateModal(true);
  };

  // Confirm Generate (Actual API Call)
  const confirmGenerate = async () => {
    setSyncing(true);
    setError(null);
    setShowGenerateModal(false);

    try {
      let currentPeriodId = periodId;
      if (!currentPeriodId) {
        currentPeriodId = await createPeriod();
      }
      if (!currentPeriodId) {
        console.error(
          'GeneratePayroll: no period id available after createPeriod',
          { periodId, currentPeriodId },
        );
        throw new Error(
          'Failed to determine payroll period id before generation',
        );
      }

      const reqUrl = `/payroll/periods/${currentPeriodId}/generate/`;
      console.log('GeneratePayroll: POST', reqUrl, {
        tax_code_id: selectedTaxCode,
        tax_code_version_id: selectedTaxVersion,
      });

      const res = await axiosPrivate.post(reqUrl, {
        tax_code_id: selectedTaxCode,
        tax_code_version_id: selectedTaxVersion || undefined,
      });
      setStatus(res.data.period?.status || 'generated');

      // Refresh to get new payslips
      await fetchPayrollPeriod();
    } catch (err) {
      console.error('Error generating payroll:', err);
      // Provide clearer UI message for common cases (network, 404 when id missing)
      const serverMsg =
        err.response?.data?.error || err.response?.data || err.message;
      setError(
        serverMsg ||
          'Failed to generate payroll. Check server logs or network.',
      );
      // Re-open modal if failed? Maybe not.
    } finally {
      setSyncing(false);
    }
  };

  // Quick regenerate without prompting (used by Edit Draft button)
  const quickRegenerate = async () => {
    if (!month || !year) return;
    setSyncing(true);
    setError(null);
    try {
      let currentPeriodId = periodId;
      if (!currentPeriodId) {
        currentPeriodId = await createPeriod();
      }
      if (!currentPeriodId) {
        console.error(
          'QuickRegenerate: no period id available after createPeriod',
          { periodId, currentPeriodId },
        );
        throw new Error(
          'Failed to determine payroll period id before regeneration',
        );
      }

      const reqUrl = `/payroll/periods/${currentPeriodId}/generate/`;
      console.log('QuickRegenerate: POST', reqUrl);
      await axiosPrivate.post(reqUrl, {
        tax_code_id: selectedTaxCode || undefined,
        tax_code_version_id: selectedTaxVersion || undefined,
      });
      await fetchPayrollPeriod();
      setStatus('generated');
    } catch (err) {
      console.error('Error regenerating payroll:', err);
      setError(err.response?.data?.error || 'Failed to regenerate payroll');
    } finally {
      setSyncing(false);
    }
  };

  // Reopen to draft (Back to Draft)
  const handleReopen = async () => {
    setSyncing(true);
    setError(null);
    try {
      await axiosPrivate.post(`/payroll/periods/${periodId}/reopen/`);
      await fetchPayrollPeriod();
    } catch (err) {
      console.error('Error reopening to draft:', err);
      setError(err.response?.data?.error || 'Failed to reopen to draft');
    } finally {
      setSyncing(false);
    }
  };

  // Submit for approval
  const handleSubmit = async () => {
    setSyncing(true);
    setError(null);

    try {
      const res = await axiosPrivate.post(
        `/payroll/periods/${periodId}/submit/`,
        {
          notes: '',
        },
      );
      setStatus(res.data.period?.status || 'pending_approval');
    } catch (err) {
      console.error('Error submitting payroll:', err);
      setError(err.response?.data?.error || 'Failed to submit payroll');
    } finally {
      setSyncing(false);
    }
  };

  // Approve (HR Manager)
  const handleApprove = async () => {
    setSyncing(true);
    setError(null);

    try {
      const res = await axiosPrivate.post(
        `/payroll/periods/${periodId}/approve/`,
        {
          notes: '',
        },
      );
      setStatus(res.data.period?.status || 'approved');
    } catch (err) {
      console.error('Error approving payroll:', err);
      setError(err.response?.data?.error || 'Failed to approve payroll');
    } finally {
      setSyncing(false);
    }
  };

  // Finalize (HR Manager)
  const handleFinalize = async () => {
    setSyncing(true);
    setError(null);

    try {
      const res = await axiosPrivate.post(
        `/payroll/periods/${periodId}/finalize/`,
      );
      setStatus(res.data.period?.status || 'finalized');
    } catch (err) {
      console.error('Error finalizing payroll:', err);
      setError(err.response?.data?.error || 'Failed to finalize payroll');
    } finally {
      setSyncing(false);
    }
  };

  // Rollback (HR Manager)
  const handleRollback = async () => {
    if (!rollbackReason.trim()) {
      setError('Please provide a reason for rollback');
      return;
    }

    try {
      const res = await axiosPrivate.post(
        `/payroll/periods/${periodId}/rollback/`,
        {
          reason: rollbackReason,
        },
      );
      setStatus(res.data.period?.status || 'rolled_back');
      setShowRollbackModal(false);
      setRollbackReason('');
    } catch (err) {
      console.error('Error rolling back payroll:', err);
      setError(err.response?.data?.error || 'Failed to rollback payroll');
    } finally {
      setSyncing(false);
    }
  };

  // Contact employee about issues
  const handleContactEmployee = async () => {
    if (!contactMessage.trim() || !contactModal.payslip) return;

    setSyncing(true);
    try {
      await axiosPrivate.post(
        `/payroll/payslips/${contactModal.payslip.payslipId}/contact/`,
        {
          message: contactMessage,
        },
      );

      // Update local state
      setPayslips((prev) =>
        prev.map((p) =>
          p.payslipId === contactModal.payslip.payslipId
            ? { ...p, hasIssues: true, issueNotes: contactMessage }
            : p,
        ),
      );

      setContactModal({ isOpen: false, payslip: null });
      setContactMessage('');
    } catch (err) {
      console.error('Error contacting employee:', err);
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSyncing(false);
    }
  };

  // Totals
  const totals = useMemo(() => {
    return payslips.reduce(
      (acc, curr) => {
        const details = curr.details || {};
        const gross =
          details.gross ??
          curr.grossPay ??
          curr.baseSalary + (curr.bonus || 0) + (curr.overtimePay || 0) ??
          0;
        const tax = details.tax ?? curr.taxAmount ?? 0;
        const net = details.net ?? curr.netPay ?? 0;
        return {
          gross: acc.gross + (Number(gross) || 0),
          tax: acc.tax + (Number(tax) || 0),
          net: acc.net + (Number(net) || 0),
        };
      },
      { gross: 0, tax: 0, net: 0 },
    );
  }, [payslips]);

  // Detect missing/disabled tax version based on payslip warnings or zero-tax totals
  const taxVersionInactive = useMemo(() => {
    const hasWarning = payslips.some(
      (p) =>
        Array.isArray(p.details?.warnings) &&
        p.details.warnings.some((w) =>
          String(w).toLowerCase().includes('no active tax version'),
        ),
    );
    const zeroTaxButGross =
      totals.tax === 0 && totals.gross > 0 && payslips.length > 0;
    return hasWarning || zeroTaxButGross;
  }, [payslips, totals]);

  // Transform for table
  const tableData = useMemo(() => {
    return payslips.map((p) => ({
      ...p,
      // Keep name clean; rely on issue column/notes for warnings
      name: p.name,
      issuesDisplay: p.hasIssues
        ? `⚠ Issues: ${p.issueNotes || 'Check details'}`
        : '',
    }));
  }, [payslips]);

  const key1 = [
    ['name', 'role'],
    ['baseSalary'],
    ['bankAccount'],
    ['attendedDays'],
    ['overtimeHours'],
    ['deductionsTotal'],
    ['adjustmentDisplay'],
    ['taxDisplay'],
    ['taxAmount'],
    ['netPay'],
    ['payslipId'],
  ];
  const structure = [71, 72, 1, 73, 1, 74, 75, 1, 77, 77, 78];
  const titleStructure = [771, 772, 772, 772, 772, 773, 774, 775, 776, 777, 11];
  const title = [
    'EMPLOYEE',
    'BASE SALARY',
    'BANK ACCOUNT',
    'ATTENDANCE',
    'OVERTIME',
    'DEDUCTIONS (EXCL TAX)',
    'ADJ (CARRYOVER)',
    'TAX CODE',
    'TAX AMT',
    'NETPAY',
    'ACTION',
  ];

  const LoadingOverlay = ({ show }) => {
    if (!show) return null;
    return (
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 dark:bg-slate-900/70">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-200 text-sm font-semibold">
          <RefreshCw size={18} className="animate-spin" /> Loading...
        </div>
      </div>
    );
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      generated: 'bg-blue-100 text-blue-700',
      pending_approval: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-emerald-100 text-emerald-700',
      finalized: 'bg-green-100 text-green-700',
      rolled_back: 'bg-red-100 text-red-700',
    };
    return (
      <span
        className={`ml-2 px-2 py-0.5 rounded uppercase text-[10px] font-bold ${
          colors[status] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="h-full dark:bg-slate-900 flex flex-col w-full text-slate-900 font-sans">
      <Header
        className={
          'bg-white dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 dark:bg-slate-800 px-6'
        }
        Title={'Payroll Processor'}
        subTitle={
          <div className="flex items-center text-sm text-slate-500">
            <Dropdown
              padding="py-1"
              border=""
              onChange={setMonth}
              placeholder={month}
              options={allMonths}
            />
            <span>/</span>
            <Dropdown
              padding="py-1"
              onChange={setYear}
              placeholder={year}
              border=""
              options={yearOptions}
            />
            <StatusBadge status={status} />
          </div>
        }
      >
        <div className="flex gap-3">
          {/* Error display */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 px-3 py-1 rounded">
              <AlertCircle size={14} /> {error}
              <button onClick={() => setError(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* PAYROLL OFFICER BUTTONS */}
          {(userRole === 'payroll_officer' || userRole === 'hr_manager') && (
            <>
              {isCurrentMonth &&
                !['finalized', 'pending_approval'].includes(status) && (
                  <button
                    onClick={handleGenerate}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 shadow text-xs active:scale-95 transition-all disabled:opacity-50"
                  >
                    {syncing ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    {periodId ? 'Regenerate' : 'Generate'} Payroll
                  </button>
                )}

              {(status === 'generated' || status === 'rolled_back') && (
                <>
                  <button
                    onClick={handleReopen}
                    disabled={syncing}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-all border border-slate-200 px-3 py-2 rounded-lg bg-white hover:bg-slate-50"
                  >
                    <ArrowLeft size={14} /> Back to Draft
                  </button>

                  {status === 'generated' && (
                    <button
                      onClick={handleSubmit}
                      disabled={syncing}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow text-xs active:scale-95 transition-all disabled:opacity-50"
                    >
                      {syncing ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      Submit to HR
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {/* HR MANAGER BUTTONS */}
          {userRole === 'hr_manager' && status === 'pending_approval' && (
            <>
              <button
                onClick={() => setShowRollbackModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-xs hover:bg-red-50"
              >
                <RotateCcw size={14} /> Rollback
              </button>
              <button
                onClick={handleApprove}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow text-xs active:scale-95 transition-all disabled:opacity-50"
              >
                {syncing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CheckCircle size={14} />
                )}
                Approve
              </button>
            </>
          )}

          {(userRole === 'hr_manager' || userRole === 'payroll_officer') &&
            status === 'approved' && (
              <button
                onClick={handleFinalize}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 shadow text-xs active:scale-95 transition-all disabled:opacity-50"
              >
                {syncing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Lock size={14} />
                )}
                Finalize Payroll
              </button>
            )}

          {status === 'finalized' && (
            <ExportTable
              fileName={`Payroll_${month}_${year}`}
              keys={key1}
              bodyStructure={structure}
              title={title}
              data={tableData}
            />
          )}
        </div>
      </Header>

      <main className="h-screen relative overflow-y-scroll hover-bar dark:bg-slate-950 bg-slate-100 flex flex-col p-2 gap-2">
        <LoadingOverlay show={loading} />
        {/* COLLAPSIBLE METRICS */}
        <div className="flex flex-col shrink-0">
          {!isMetricsExpanded && (
            <div
              onClick={() => setIsMetricsExpanded(true)}
              className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all mb-1"
            >
              <div className="flex gap-8 items-center">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-blue-600" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Gross:
                  </span>
                  <span className="text-xs font-black dark:text-slate-200">
                    {formatMoney(totals.gross)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-amber-600" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Tax:
                  </span>
                  <span className="text-xs font-black dark:text-slate-200">
                    {formatMoney(totals.tax)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Net:
                  </span>
                  <span className="text-xs font-black dark:text-slate-200">
                    {formatMoney(totals.net)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase">
                Analysis <ChevronDown size={12} />
              </div>
            </div>
          )}
          <div
            className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
              isMetricsExpanded
                ? 'grid-rows-[1fr] opacity-100 mb-2'
                : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0 relative">
              <button
                onClick={() => setIsMetricsExpanded(false)}
                className="absolute top-2 right-2 z-10 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400"
              >
                <ChevronDown size={16} className="rotate-180" />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Total Gross Payout"
                  amount={totals.gross}
                  icon={Users}
                  colorClass="bg-blue-50 text-blue-600"
                />
                <MetricCard
                  title="Total Taxes (Statutory)"
                  amount={totals.tax}
                  icon={DollarSign}
                  colorClass="bg-amber-50 text-amber-600"
                  warning={taxVersionInactive}
                />
                <MetricCard
                  title="Total Net Payout"
                  amount={totals.net}
                  icon={CheckCircle}
                  colorClass="bg-emerald-50 text-emerald-600"
                />
              </div>
              {taxVersionInactive && (
                <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded">
                  <AlertCircle size={14} /> Taxes are zero for this period.
                  Ensure an active tax code version is configured in HR Manager
                  → Tax Codes.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white dark:border-slate-700 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 dark:bg-slate-800 rounded shadow border flex-1 flex flex-col border-slate-200 min-h-0">
          <Generatepayroll employees={payslips.length} />
          <div className="flex-1 overflow-y-auto">
            {payslips.length > 0 ? (
              <Table
                components={PayslipTemplate2}
                D2={currentYear + '/' + yearOptions}
                pages={9}
                D1={status}
                ke={key1}
                Data={tableData}
                titleStructure={titleStructure}
                Structure={structure}
                title={title}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Users size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No Payroll Data</p>
                <p className="text-sm">
                  Click "Generate Payroll" to create payslips for {month} {year}
                </p>
              </div>
            )}
          </div>
          <ClockoutModal isOpen={isOpen} close={() => setIsOpen(false)} />
          <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 px-6 py-4 shadow border-t dark:border-slate-800 border-slate-200 flex justify-end gap-8 text-xs">
            <div className="flex-1">
              <span className="text-slate-400 italic">
                {status === 'pending_approval'
                  ? 'Pending HR Approval (Read-Only)'
                  : status === 'approved'
                    ? 'Approved - Ready to Finalize'
                    : status === 'finalized'
                      ? 'Payroll Completed'
                      : status === 'rolled_back'
                        ? 'Rolled Back - Needs Correction'
                        : 'Drafting...'}
              </span>
            </div>
            <div
              onClick={() => setIsOpen(true)}
              className="cursor-pointer hover:underline text-indigo-500"
            >
              View Logs
            </div>
            <div>
              Gross:{' '}
              <span className="font-semibold">{formatMoney(totals.gross)}</span>
            </div>
            <div>
              Tax:{' '}
              <span className="font-semibold">{formatMoney(totals.tax)}</span>
            </div>
            <div className="text-indigo-600 dark:text-indigo-300 font-bold">
              Net Pay: {formatMoney(totals.net)}
            </div>
          </div>
        </div>
      </main>

      {/* Contact Employee Modal */}
      {contactModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageCircle size={20} /> Contact {contactModal.payslip?.name}
            </h3>
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Enter your message about the payslip issue..."
              className="w-full h-32 border rounded-lg p-3 text-sm dark:bg-slate-700 dark:border-slate-600"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => {
                  setContactModal({ isOpen: false, payslip: null });
                  setContactMessage('');
                }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleContactEmployee}
                disabled={!contactMessage.trim() || syncing}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {syncing ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Modal */}
      {showRollbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
              <RotateCcw size={20} /> Rollback Payroll
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              This will send the payroll back to the Payroll Officer for
              corrections. Please provide a reason.
            </p>
            <textarea
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="Reason for rollback..."
              className="w-full h-24 border rounded-lg p-3 text-sm dark:bg-slate-700 dark:border-slate-600"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => {
                  setShowRollbackModal(false);
                  setRollbackReason('');
                }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRollback}
                disabled={!rollbackReason.trim() || syncing}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {syncing ? 'Processing...' : 'Confirm Rollback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Payroll Modal (Tax Code Selection) */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-[520px] shadow-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RefreshCw size={20} className="text-blue-600" /> Generate Payroll
            </h3>

            {/* Early Warning */}
            {isEarlyGeneration && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg flex gap-3">
                <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">
                    Early Generation Warning
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Today is {dayjs().format('MMM D')}. Usually payroll is
                    generated after the 25th to capture full attendance. Are you
                    sure you want to proceed?
                  </p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Select Tax Code & Version
              </label>
              {activeTaxCodesSorted.length === 0 ? (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                  No active tax codes found. Please enable a tax code in Policy
                  settings.
                </div>
              ) : (
                <Dropdown
                  options={activeTaxCodesSorted.map((tc) => ({
                    content: `${tc.name} (${tc.code})`,
                    value: tc.id,
                  }))}
                  onChange={(val, option) =>
                    setSelectedTaxCode(option?.value ?? val)
                  }
                  placeholder="Select tax code"
                  selectedLabel={selectedTaxCodeLabel}
                  border="border border-slate-200 dark:border-slate-600"
                  padding="py-2"
                  text="text-sm"
                />
              )}
            </div>

            {/* Version selection for the currently selected tax code */}
            {selectedTaxCode && (
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Version
                </label>
                <TaxCodeVersionsSelect
                  axiosPrivate={axiosPrivate}
                  taxCodeId={selectedTaxCode}
                  onSelect={(verId) => setSelectedTaxVersion(verId)}
                  selectedId={selectedTaxVersion}
                />
              </div>
            )}

            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:border-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmGenerate}
                disabled={!selectedTaxCode || syncing}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {syncing ? 'Processing...' : 'Confirm Generation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GeneratePayroll;

// Inline component to fetch and select versions for a tax code
function TaxCodeVersionsSelect({
  axiosPrivate,
  taxCodeId,
  onSelect,
  selectedId,
}) {
  const [versions, setVersions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const selectedVersionLabel = React.useMemo(() => {
    const ver = versions.find((v) => v.id === selectedId);
    return ver
      ? `${ver.version || ver.name || `Version ${ver.id}`} (${
          ver.valid_from
        } → ${ver.valid_to || 'open'})`
      : '';
  }, [versions, selectedId]);

  React.useEffect(() => {
    let mounted = true;
    async function loadVersions() {
      setLoading(true);
      setError(null);
      try {
        // Fetch versions for this tax code; only keep active ones
        const res = await axiosPrivate.get('/payroll/tax-code-versions/', {
          params: { tax_code: taxCodeId },
        });
        const list = res.data.results || res.data || [];
        const filtered = list.filter(
          (v) =>
            v.tax_code === taxCodeId ||
            v.tax_code?.id === taxCodeId ||
            v.tax_code?.code === taxCodeId ||
            (typeof taxCodeId === 'string' &&
              v.tax_code?.toString() === taxCodeId),
        );
        const activeOnly = filtered.filter((v) => v.is_active);
        if (mounted) {
          // Sort by valid_from desc, fallback to id desc
          const sorted = [...activeOnly].sort((a, b) => {
            const aTime = a.valid_from ? new Date(a.valid_from).getTime() : 0;
            const bTime = b.valid_from ? new Date(b.valid_from).getTime() : 0;
            if (aTime !== bTime) return bTime - aTime;
            return (b.id || 0) - (a.id || 0);
          });
          setVersions(sorted);
          if (!selectedId && sorted.length > 0) {
            onSelect(sorted[0].id);
          }
        }
      } catch (err) {
        if (mounted) setError('Failed to load versions');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadVersions();
    return () => {
      mounted = false;
    };
  }, [axiosPrivate, taxCodeId]);

  if (loading)
    return (
      <div className="text-[11px] text-slate-400 mt-2">Loading versions…</div>
    );
  if (error)
    return <div className="text-[11px] text-red-500 mt-2">{error}</div>;
  if (versions.length === 0)
    return (
      <div className="text-[11px] text-slate-400 mt-2">No active versions</div>
    );

  return (
    <Dropdown
      options={versions.map((ver) => ({
        content: `${ver.version || ver.name || `Version ${ver.id}`} (${
          ver.valid_from
        } → ${ver.valid_to || 'open'})`,
        value: ver.id,
      }))}
      onChange={(val, option) => onSelect(option?.value ?? val)}
      placeholder="Select version"
      selectedLabel={selectedVersionLabel}
      border="border border-slate-200 dark:border-slate-600"
      padding="py-2"
      text="text-sm"
    />
  );
}

const MetricCard = ({ title, amount, icon: Icon, colorClass, warning }) => (
  <div
    className={`bg-white dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 dark:bg-slate-800 p-6 rounded shadow flex items-start justify-between relative overflow-hidden ${
      warning ? 'ring-2 ring-red-500' : ''
    }`}
  >
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl dark:text-slate-100 font-bold text-slate-800">
        {formatMoney(amount)}
      </h3>
      {warning && (
        <p className="text-[10px] text-red-500 font-bold mt-1 animate-pulse">
          ⚠ CONFIG MISSING
        </p>
      )}
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);
