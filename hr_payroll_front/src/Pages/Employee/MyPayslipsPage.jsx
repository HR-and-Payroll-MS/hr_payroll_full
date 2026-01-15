import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, DollarSign, Calendar, Building2, AlertCircle } from 'lucide-react';
import useAuth from '../../Context/AuthContext';
import Header from '../../Components/Header';
import MyPayslipList from '../MyPayslipList';

const formatMoney = (amount) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

function MyPayslipsPage() {
  const { axiosPrivate } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const fetchMyPayslips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosPrivate.get('/payroll/my-payslips/');
      const results = res.data.results || res.data || [];
      const mapped = results.map((p) => ({
        id: p.id,
        month: p.details?.month || `${p.period?.month || ''} ${p.period?.year || ''}`,
        net: p.net_pay || p.net || 0,
        gross: p.gross_pay || p.gross || 0,
        deductions: (p.total_deductions || 0) + (p.tax_amount || 0),
        raw: p,
      }));
      setPayslips(mapped);
    } catch (err) {
      console.error('Error fetching payslips:', err);
      setError('Failed to load your payslips');
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => {
    fetchMyPayslips();
  }, [fetchMyPayslips]);

  const PayslipDetail = ({ payslip, onClose }) => {
    const base = payslip.raw || payslip;
    const details = base.details || {};
    const company = details.company || {};
    const earnings = details.earnings || [];
    const deductions = details.deductions || [];
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  Payslip - {details.month}
                </h2>
                <p className="text-sm text-slate-500">{company.name || 'Company'}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Employee</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{base.employee_name}</p>
              </div>
              <div>
                <p className="text-slate-500">Employee ID</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{base.employee_id_display}</p>
              </div>
              <div>
                <p className="text-slate-500">Department</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{base.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500">Tax Code</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{base.tax_code_display || 'Standard'}</p>
              </div>
            </div>
            
            {/* Attendance */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Attendance</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Days Worked</p>
                  <p className="font-medium">{base.worked_days || 0}</p>
                </div>
                <div>
                  <p className="text-slate-500">Absent</p>
                  <p className="font-medium">{base.absent_days || 0}</p>
                </div>
                <div>
                  <p className="text-slate-500">Leave</p>
                  <p className="font-medium">{base.leave_days || 0}</p>
                </div>
              </div>
            </div>
            
            {/* Earnings */}
            <div>
              <h4 className="font-semibold mb-3 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-600" /> Earnings
              </h4>
              <div className="space-y-2">
                {earnings.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{formatMoney(item.amount)}</span>
                  </div>
                ))}
                {base.overtime_pay > 0 && (
                  <div className="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">
                      Overtime ({base.overtime_hours}h × {base.overtime_rate}x)
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{formatMoney(base.overtime_pay)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 text-emerald-600">
                  <span>Gross Pay</span>
                  <span>{formatMoney(base.gross_pay)}</span>
                </div>
              </div>
            </div>
            
            {/* Deductions */}
            <div>
              <h4 className="font-semibold mb-3 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <DollarSign size={16} className="text-red-600" /> Deductions
              </h4>
              <div className="space-y-2">
                {deductions.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="font-medium text-red-600">-{formatMoney(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold pt-2 text-red-600">
                  <span>Total Deductions</span>
                  <span>-{formatMoney(parseFloat(base.total_deductions) + parseFloat(base.tax_amount))}</span>
                </div>
              </div>
            </div>
            
            {/* Net Pay */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white text-center">
              <p className="text-sm opacity-80 mb-1">Net Pay</p>
              <p className="text-3xl font-bold">{formatMoney(base.net_pay)}</p>
              <p className="text-xs opacity-70 mt-2">
                Payment via {details.paymentMethod || 'Bank Transfer'} on {details.paymentDate || 'N/A'}
              </p>
            </div>
            
            {/* Issue Note */}
            {base.has_issues && base.issue_notes && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                  <AlertCircle size={16} /> Issue Note
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{base.issue_notes}</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col dark:bg-slate-900">
      <Header 
        className="bg-white dark:bg-slate-800 px-6" 
        Title="My Payslips"
        subTitle={<span className="text-sm text-slate-500">View your salary history</span>}
      />
      
      <main className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <AlertCircle size={48} className="mb-4" />
            <p>{error}</p>
          </div>
        ) : payslips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <FileText size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No Payslips Yet</p>
            <p className="text-sm">Your payslips will appear here once they are finalized.</p>
          </div>
        ) : (
          <MyPayslipList
            payslips={payslips}
            onView={(p) => setSelectedPayslip(p.raw || p)}
          />
        )}
      </main>

      {selectedPayslip && (
        <PayslipDetail 
          payslip={selectedPayslip} 
          onClose={() => setSelectedPayslip(null)} 
        />
      )}
    </div>
  );
}

export default MyPayslipsPage;
