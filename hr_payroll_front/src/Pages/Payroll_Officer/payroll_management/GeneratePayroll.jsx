import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Generatepayroll } from '../../../Components/Level2Hearder';
import Header from '../../../Components/Header';
import Table from '../../../Components/Table';
import ExportTable from '../../../Components/ExportTable';
import { RefreshCw, Lock, CheckCircle, DollarSign, Users, Settings, AlertCircle, AlertTriangle, FileText, ChevronDown, ArrowLeft, Send, RotateCcw, MessageCircle, X } from 'lucide-react';
import Dropdown from '../../../Components/Dropdown';
import dayjs from 'dayjs';
import Icon from '../../../Components/Icon';
import ViewerLoader from './ViewerLoader';
import PayslipTemplate2 from '../../../Components/PayslipTemplate2'; 
import ClockoutModal from '../../../Components/Modals/ClockoutModal';
import useAuth from '../../../Context/AuthContext';


const allMonths = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMMM'));
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 20 }, (_, i) => (currentYear - i).toString());
const formatMoney = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);


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
  
  // Early generation warning check
 
  const [payslips, setPayslips] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [month, setMonth] = useState(dayjs().format('MMMM'));
  const [year, setYear] = useState(currentYear.toString());

  // Early generation warning check
  const isEarlyGeneration = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = today.getMonth() === dayjs().month(month).month() && today.getFullYear() === parseInt(year);
    // Warning if generating for current month before the 25th
    return isCurrentMonth && today.getDate() < 25;
  }, [month, year]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [taxCodes, setTaxCodes] = useState([]);
  const [taxConfig, setTaxConfig] = useState({ scope: 'All Employees', regime: '', version: '' });
  const [contactModal, setContactModal] = useState({ isOpen: false, payslip: null });
  const [contactMessage, setContactMessage] = useState('');
  const [rollbackReason, setRollbackReason] = useState('');
  const [showRollbackModal, setShowRollbackModal] = useState(false);

  const departments = useMemo(() => ['All Employees', 'Finance', 'IT', 'HR', 'Operations'], []);

  // Fetch payroll period data
  const fetchPayrollPeriod = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get existing period for this month/year
      const periodsRes = await axiosPrivate.get(`/payroll/periods/`, {
        params: { month, year }
      });
      
      const periods = periodsRes.data.results || periodsRes.data || [];
      const existingPeriod = periods.find(p => p.month === month && p.year === parseInt(year));
      
      if (existingPeriod) {
        setPeriodId(existingPeriod.id);
        setStatus(existingPeriod.status);
        
        // Fetch full period details with payslips
        const periodDetail = await axiosPrivate.get(`/payroll/periods/${existingPeriod.id}/`);
        const periodData = periodDetail.data;
        
        // Transform payslips to match table format
        const formattedPayslips = (periodData.payslips || []).map(p => ({
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
          taxVersion: p.tax_code_display?.split(' (')[1]?.replace(')', '') || '',
          taxDisplay: p.tax_code_display || 'Not Assigned',
          taxAmount: parseFloat(p.tax_amount) || 0,
          netPay: parseFloat(p.net_pay) || 0,
          grossPay: parseFloat(p.gross_pay) || 0,
          hasIssues: p.has_issues,
          issueNotes: p.issue_notes,
          details: p.details || {}
        }));
        
        setPayslips(formattedPayslips);
      } else {
        // No existing period
        setPeriodId(null);
        setStatus('draft');
        setPayslips([]);
      }
    } catch (err) {
      console.error('Error fetching payroll:', err);
      setError('Failed to load payroll data');
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate, month, year]);

  // Fetch tax codes for configuration
  const fetchTaxCodes = useCallback(async () => {
    try {
      const res = await axiosPrivate.get('/payroll/tax-codes/');
      const codes = res.data.results || res.data || [];
      // Filter out inactive tax codes so they cannot be selected for payroll
      const activeCodes = codes.filter(c => c.is_active || c.isEnabled); 
      setTaxCodes(activeCodes);
    } catch (err) {
      console.error('Error fetching tax codes:', err);
    }
  }, [axiosPrivate]);

  useEffect(() => {
    fetchPayrollPeriod();
    fetchTaxCodes();
  }, [fetchPayrollPeriod, fetchTaxCodes]);

  // Create period if not exists
  const createPeriod = async () => {
    try {
      const res = await axiosPrivate.post('/payroll/periods/', { month, year: parseInt(year) });
      setPeriodId(res.data.id);
      setStatus(res.data.status);
      return res.data.id;
    } catch (err) {
      if (err.response?.status === 400) {
        // Period might already exist, try to fetch it
        await fetchPayrollPeriod();
        return periodId;
      }
      throw err;
    }
  };

  // Generate payroll
  // Open Generate Modal
  const handleGenerate = () => {
    if (taxCodes.length > 0) {
        // Pre-select first active code
        const activeCode = taxCodes.find(c => c.is_active);
        if (activeCode) setSelectedTaxCode(activeCode.id);
    }
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
      
      const res = await axiosPrivate.post(`/payroll/periods/${currentPeriodId}/generate/`, {
        tax_code_id: selectedTaxCode
      });
      setStatus(res.data.period?.status || 'generated');
      
      // Refresh to get new payslips
      await fetchPayrollPeriod();
    } catch (err) {
      console.error('Error generating payroll:', err);
      setError(err.response?.data?.error || 'Failed to generate payroll');
      // Re-open modal if failed? Maybe not.
    } finally {
      setSyncing(false);
    }
  };

  // Submit for approval
  const handleSubmit = async () => {
    setSyncing(true);
    setError(null);
    
    try {
      const res = await axiosPrivate.post(`/payroll/periods/${periodId}/submit/`, {
        notes: ''
      });
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
      const res = await axiosPrivate.post(`/payroll/periods/${periodId}/approve/`, {
        notes: ''
      });
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
      const res = await axiosPrivate.post(`/payroll/periods/${periodId}/finalize/`);
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
    
    setSyncing(true);
    setError(null);
    
    try {
      const res = await axiosPrivate.post(`/payroll/periods/${periodId}/rollback/`, {
        reason: rollbackReason
      });
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
      await axiosPrivate.post(`/payroll/payslips/${contactModal.payslip.payslipId}/contact/`, {
        message: contactMessage
      });
      
      // Update local state
      setPayslips(prev => prev.map(p => 
        p.payslipId === contactModal.payslip.payslipId 
          ? { ...p, hasIssues: true, issueNotes: contactMessage }
          : p
      ));
      
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
    return payslips.reduce((acc, curr) => ({
      gross: acc.gross + (curr.grossPay || curr.baseSalary + curr.bonus + curr.overtimePay || 0),
      tax: acc.tax + (curr.taxAmount || 0),
      net: acc.net + (curr.netPay || 0)
    }), { gross: 0, tax: 0, net: 0 });
  }, [payslips]);

  // Transform for table
  const tableData = useMemo(() => {
    return payslips.map(p => ({
      ...p,
      name: p.hasIssues ? `⚠️ ${p.name}` : p.name,
      // For table display
    }));
  }, [payslips]);

  const key1 = [["name", "role"],['baseSalary'],['bankAccount'],['attendedDays'],['overtimeHours'],['lopDays'],['bonus'],['taxDisplay'],['taxAmount'],['netPay']];
  const structure = [71, 72, 1, 73, 1, 74, 75, 1, 77, 77, 78]; 
  const titleStructure = [771, 772, 772, 772, 772, 773, 774, 775, 776, 777, 11];
  const title = ['EMPLOYEE', 'BASE SALARY', 'BANK ACCOUNT', 'ATTENDANCE', 'OVERTIME', 'DEDUCTIONS', 'ADJ', 'TAX CODE', 'TAX AMT', 'NETPAY', 'ACTION'];

  if (loading) return <ViewerLoader />;

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
      <span className={`ml-2 px-2 py-0.5 rounded uppercase text-[10px] font-bold ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="h-full dark:bg-slate-900 flex flex-col w-full text-slate-900 font-sans">
      <Header 
        className={"bg-white dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 dark:bg-slate-800 px-6"} 
        Title={"Payroll Processor"}
        subTitle={
          <div className="flex items-center text-sm text-slate-500">
            <Dropdown padding='py-1' border='' onChange={setMonth} placeholder={month} options={allMonths} /> 
            <span>/</span>
            <Dropdown padding='py-1' onChange={setYear} placeholder={year} border='' options={yearOptions} />
            <StatusBadge status={status} />
          </div>
        }>
        <div className="flex gap-3">
          {/* Error display */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 px-3 py-1 rounded">
              <AlertCircle size={14} /> {error}
              <button onClick={() => setError(null)}><X size={14} /></button>
            </div>
          )}
          
          {/* PAYROLL OFFICER BUTTONS */}
          {userRole === 'payroll_officer' && (
            <>
              {(status === 'draft' || status === 'rolled_back' || !periodId) && (
                <button 
                  onClick={handleGenerate} 
                  disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 shadow text-xs active:scale-95 transition-all disabled:opacity-50"
                >
                  {syncing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {periodId ? 'Regenerate' : 'Generate'} Payroll
                </button>
              )}
              {status === 'generated' && (
                <>
                  <button 
                    onClick={() => { setStatus('draft'); handleGenerate(); }} 
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-all"
                  >
                    <ArrowLeft size={14} /> Edit Draft
                  </button>
                  <button 
                    onClick={handleSubmit} 
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow text-xs active:scale-95 transition-all disabled:opacity-50"
                  >
                    {syncing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    Submit to HR
                  </button>
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
                {syncing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Approve
              </button>
            </>
          )}
          
          {userRole === 'hr_manager' && status === 'approved' && (
            <button 
              onClick={handleFinalize} 
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 shadow text-xs active:scale-95 transition-all disabled:opacity-50"
            >
              {syncing ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
              Finalize Payroll
            </button>
          )}

          {status === 'finalized' && (
            <ExportTable fileName={`Payroll_${month}_${year}`} keys={key1} bodyStructure={structure} title={title} data={tableData} />
          )}
        </div>
      </Header>

      <main className="h-screen relative overflow-y-scroll hover-bar dark:bg-slate-950 bg-slate-100 flex flex-col p-2 gap-2">
        
        {/* COLLAPSIBLE METRICS */}
        <div className="flex flex-col shrink-0">
          {!isMetricsExpanded && (
            <div 
              onClick={() => setIsMetricsExpanded(true)}
              className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all mb-1"
            >
              <div className="flex gap-8 items-center">
                <div className="flex items-center gap-2"><Users size={14} className="text-blue-600" /><span className="text-[10px] font-bold text-slate-400 uppercase">Gross:</span><span className="text-xs font-black dark:text-slate-200">{formatMoney(totals.gross)}</span></div>
                <div className="flex items-center gap-2"><DollarSign size={14} className="text-amber-600" /><span className="text-[10px] font-bold text-slate-400 uppercase">Tax:</span><span className="text-xs font-black dark:text-slate-200">{formatMoney(totals.tax)}</span></div>
                <div className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-600" /><span className="text-[10px] font-bold text-slate-400 uppercase">Net:</span><span className="text-xs font-black dark:text-slate-200">{formatMoney(totals.net)}</span></div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase">Analysis <ChevronDown size={12} /></div>
            </div>
          )}
          <div className={`grid transition-all duration-300 ease-in-out overflow-hidden ${isMetricsExpanded ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="min-h-0 relative">
              <button onClick={() => setIsMetricsExpanded(false)} className="absolute top-2 right-2 z-10 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400"><ChevronDown size={16} className="rotate-180" /></button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard title="Total Gross Payout" amount={totals.gross} icon={Users} colorClass="bg-blue-50 text-blue-600" />
                <MetricCard title="Total Taxes (Statutory)" amount={totals.tax} icon={DollarSign} colorClass="bg-amber-50 text-amber-600" warning={totals.tax === 0 && totals.gross > 0} />
                <MetricCard title="Total Net Payout" amount={totals.net} icon={CheckCircle} colorClass="bg-emerald-50 text-emerald-600" />
              </div>
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
                D2={currentYear + "/" + yearOptions} 
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
                <p className="text-sm">Click "Generate Payroll" to create payslips for {month} {year}</p>
              </div>
            )}
          </div>
          <ClockoutModal isOpen={isOpen} close={() => setIsOpen(false)}/>  
          <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 px-6 py-4 shadow border-t dark:border-slate-800 border-slate-200 flex justify-end gap-8 text-xs">
            <div className='flex-1'>
               <span className="text-slate-400 italic">
                 {status === 'pending_approval' ? "Pending HR Approval (Read-Only)" : 
                  status === 'approved' ? "Approved - Ready to Finalize" :
                  status === 'finalized' ? "Payroll Completed" : 
                  status === 'rolled_back' ? "Rolled Back - Needs Correction" :
                  "Drafting..."}
               </span>
            </div>
            <div onClick={() => setIsOpen(true)} className="cursor-pointer hover:underline text-indigo-500">View Logs</div>
            <div>Gross: <span className="font-semibold">{formatMoney(totals.gross)}</span></div>
            <div>Tax: <span className="font-semibold">{formatMoney(totals.tax)}</span></div>
            <div className="text-indigo-600 dark:text-indigo-300 font-bold">Net Pay: {formatMoney(totals.net)}</div>
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
                onClick={() => { setContactModal({ isOpen: false, payslip: null }); setContactMessage(''); }}
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
              This will send the payroll back to the Payroll Officer for corrections. Please provide a reason.
            </p>
            <textarea 
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="Reason for rollback..."
              className="w-full h-24 border rounded-lg p-3 text-sm dark:bg-slate-700 dark:border-slate-600"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button 
                onClick={() => { setShowRollbackModal(false); setRollbackReason(''); }}
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
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-[450px] shadow-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RefreshCw size={20} className="text-blue-600" /> Generate Payroll
            </h3>
            
            {/* Early Warning */}
            {isEarlyGeneration && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg flex gap-3">
                <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">Early Generation Warning</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Today is {dayjs().format('MMM D')}. Usually payroll is generated after the 25th to capture full attendance.
                    Are you sure you want to proceed?
                  </p>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Select Tax Code Application
              </label>
              <div className="space-y-2">
                {taxCodes.filter(tc => tc.is_active).length === 0 ? (
                  <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                    No active tax codes found. Please enable a tax code in Policy settings.
                  </div>
                ) : (
                  taxCodes.filter(tc => tc.is_active).map(tc => (
                    <label key={tc.id} className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${selectedTaxCode === tc.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                      <input 
                        type="radio" 
                        name="taxCode" 
                        value={tc.id} 
                        checked={selectedTaxCode === tc.id}
                        onChange={(e) => setSelectedTaxCode(tc.id)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <div className="flex-1">
                         <div className="flex items-center justify-between">
                           <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{tc.name}</span>
                           <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
                         </div>
                         <div className="text-xs text-slate-500 mt-0.5">{tc.code}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
            
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


const MetricCard = ({ title, amount, icon: Icon, colorClass, warning }) => (
  <div className={`bg-white dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 dark:bg-slate-800 p-6 rounded shadow flex items-start justify-between relative overflow-hidden ${warning ? 'ring-2 ring-red-500' : ''}`}>
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl dark:text-slate-100 font-bold text-slate-800">{formatMoney(amount)}</h3>
      {warning && <p className="text-[10px] text-red-500 font-bold mt-1 animate-pulse">⚠ CONFIG MISSING</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);