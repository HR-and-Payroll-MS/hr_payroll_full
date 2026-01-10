import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  Save, 
  RefreshCw, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Users, 
  X,
  FileText
} from 'lucide-react';


const TAX_BRACKETS = [
  { threshold: 5000, rate: 0.2 }, // 20% tax for salary > 5000
  { threshold: 0, rate: 0.1 }     // 10% tax for everyone else
];

const INITIAL_EMPLOYEES = [
  { id: 1, name: "Sarah Jenkins", role: "Senior Dev", baseSalary: 6000, attendedDays: 22, lopDays: 0, bonus: 0 },
  { id: 2, name: "Michael Chen", role: "UX Designer", baseSalary: 4500, attendedDays: 21, lopDays: 1, bonus: 0 },
  { id: 3, name: "Amara Osei", role: "Product Manager", baseSalary: 7000, attendedDays: 22, lopDays: 0, bonus: 500 },
  { id: 4, name: "David Kim", role: "Junior Dev", baseSalary: 3000, attendedDays: 20, lopDays: 2, bonus: 0 },
  { id: 5, name: "Elena Rodriguez", role: "QA Engineer", baseSalary: 4000, attendedDays: 22, lopDays: 0, bonus: 200 },
];

// Helper to format currency
const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// --- Components ---

const MetricCard = ({ title, amount, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{formatMoney(amount)}</h3>
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

const EditAdjustmentModal = ({ employee, onClose, onSave }) => {
  const [bonus, setBonus] = useState(employee.bonus);
  const [lopDays, setLopDays] = useState(employee.lopDays);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Adjust Payroll</h3>
            <p className="text-sm text-slate-500">{employee.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">One-Time Bonus ($)</label>
            <input 
              type="number" 
              value={bonus}
              onChange={(e) => setBonus(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Loss of Pay Days (Absent)
            </label>
            <input 
              type="number" 
              value={lopDays}
              onChange={(e) => setLopDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
            <p className="text-xs text-amber-600 mt-1">
              * This will deduct approx {formatMoney((employee.baseSalary / 30) * lopDays)}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => onSave(employee.id, bonus, lopDays)}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function PolicyPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('draft'); // 'draft' | 'finalized'
  const [employees, setEmployees] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Header State
  const [month, setMonth] = useState('December');
  const [year, setYear] = useState('2025');

  // 1. Logic: Calculate Net Pay dynamically
  const calculatePayroll = (emp) => {
    // Logic: Daily Rate = Salary / 30
    const dailyRate = emp.baseSalary / 30;
    const lopDeduction = dailyRate * emp.lopDays;
    
    const taxableIncome = emp.baseSalary + emp.bonus - lopDeduction;
    
    // Logic: Simple Progressive Tax
    let taxRate = 0.10;
    if (taxableIncome > 5000) taxRate = 0.20;
    
    const taxAmount = taxableIncome * taxRate;
    const netPay = taxableIncome - taxAmount;

    return {
      ...emp,
      lopDeduction,
      taxAmount,
      netPay
    };
  };

  // 2. Initial Data Load
  useEffect(() => {
    // Simulate API Fetch
    setLoading(true);
    setTimeout(() => {
      const processed = INITIAL_EMPLOYEES.map(calculatePayroll);
      setEmployees(processed);
      setLoading(false);
    }, 1200);
  }, [month, year]);

  // 3. Actions
  const handleSyncAttendance = () => {
    setSyncing(true);
    // Simulate checking biometric logs
    setTimeout(() => {
      // Randomly update LOP days to simulate new data
      const updated = employees.map(emp => ({
        ...emp,
        attendedDays: emp.attendedDays === 22 ? 22 : 22, // Reset or change
        lopDays: Math.floor(Math.random() * 2) // Random 0 or 1 LOP
      })).map(calculatePayroll);
      
      setEmployees(updated);
      setSyncing(false);
    }, 1500);
  };

  const handleUpdateEmployee = (id, newBonus, newLop) => {
    const updated = employees.map(emp => {
      if (emp.id === id) {
        return calculatePayroll({
          ...emp,
          bonus: newBonus,
          lopDays: newLop
        });
      }
      return emp;
    });
    setEmployees(updated);
    setSelectedEmployee(null);
  };

  const handleFinalize = () => {
    if (window.confirm("Are you sure you want to finalize? This will lock all edits and generate payslips.")) {
      setStatus('finalized');
    }
  };

  // 4. Computed Metrics
  const totals = useMemo(() => {
    return employees.reduce((acc, curr) => ({
      gross: acc.gross + curr.baseSalary + curr.bonus - curr.lopDeduction,
      tax: acc.tax + curr.taxAmount,
      net: acc.net + curr.netPay
    }), { gross: 0, tax: 0, net: 0 });
  }, [employees]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col gap-6">
        <div className="h-20 bg-slate-200 animate-pulse rounded-xl w-full"></div>
        <div className="grid grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 animate-pulse rounded-xl"></div>
          <div className="h-32 bg-slate-200 animate-pulse rounded-xl"></div>
          <div className="h-32 bg-slate-200 animate-pulse rounded-xl"></div>
        </div>
        <div className="h-96 bg-slate-200 animate-pulse rounded-xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* --- Top Header Bar --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Calculator size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Payroll Processor</h1>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <select 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)}
                  className="bg-transparent hover:text-indigo-600 focus:outline-none cursor-pointer"
                  disabled={status === 'finalized'}
                >
                  {['January','February','November','December'].map(m => <option key={m}>{m}</option>)}
                </select>
                <span>/</span>
                <select 
                   value={year}
                   onChange={(e) => setYear(e.target.value)}
                   className="bg-transparent hover:text-indigo-600 focus:outline-none cursor-pointer"
                   disabled={status === 'finalized'}
                >
                  <option>2025</option>
                  <option>2024</option>
                </select>
                {status === 'finalized' && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <Lock size={10} /> LOCKED
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {status === 'draft' ? (
              <>
                <button 
                  onClick={handleSyncAttendance}
                  disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
                  {syncing ? 'Syncing...' : 'Sync Attendance'}
                </button>
                <button 
                  onClick={handleFinalize}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                >
                  <CheckCircle size={18} />
                  Finalize & Lock
                </button>
              </>
            ) : (
               <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-medium rounded-lg">
                  <FileText size={18} /> Download Bank File
               </button>
            )}
          </div>
        </div>
      </header>

      {/* --- Main Workspace --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          />
          <MetricCard 
            title="Total Net Payout" 
            amount={totals.net} 
            icon={CheckCircle} 
            colorClass="bg-emerald-50 text-emerald-600" 
          />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">Employee Payroll Sheet</h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {employees.length} Active Records
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Employee</th>
                  <th className="px-6 py-4 font-semibold text-right">Base Salary</th>
                  <th className="px-6 py-4 font-semibold text-center">Attendance</th>
                  <th className="px-6 py-4 font-semibold text-right text-red-600">Deductions (LOP)</th>
                  <th className="px-6 py-4 font-semibold text-right text-emerald-600">Adjustments</th>
                  <th className="px-6 py-4 font-semibold text-right">Tax</th>
                  <th className="px-6 py-4 font-semibold text-right">Net Pay</th>
                  <th className="px-6 py-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {emp.name.charAt(0)}{emp.name.split(' ')[1]?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{emp.name}</p>
                          <p className="text-xs text-slate-500">{emp.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 font-medium">
                      {formatMoney(emp.baseSalary)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        emp.attendedDays < 22 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {emp.attendedDays}/22
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       {emp.lopDays > 0 ? (
                         <div className="flex flex-col items-end">
                           <span className="text-red-600 font-medium">-{formatMoney(emp.lopDeduction)}</span>
                           <span className="text-xs text-red-400">({emp.lopDays} days)</span>
                         </div>
                       ) : (
                         <span className="text-slate-300">-</span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       {emp.bonus > 0 ? (
                         <span className="text-emerald-600 font-medium">+{formatMoney(emp.bonus)}</span>
                       ) : (
                         <span className="text-slate-300">-</span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {formatMoney(emp.taxAmount)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800 bg-slate-50/50 group-hover:bg-slate-100/50">
                      {formatMoney(emp.netPay)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {status === 'draft' ? (
                        <button 
                          onClick={() => setSelectedEmployee(emp)}
                          className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold uppercase border border-green-200 bg-green-50 px-2 py-1 rounded">
                           <CheckCircle size={10} /> Paid
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Footer Summary in Table */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-8 text-sm">
            <div className="text-slate-500">Gross: <span className="font-semibold text-slate-700">{formatMoney(totals.gross)}</span></div>
            <div className="text-slate-500">Tax: <span className="font-semibold text-slate-700">{formatMoney(totals.tax)}</span></div>
            <div className="text-indigo-600 font-bold text-lg">Net Pay: {formatMoney(totals.net)}</div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {selectedEmployee && (
        <EditAdjustmentModal 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
          onSave={handleUpdateEmployee}
        />
      )}
    </div>
  );
}








































































































// import React, { useState } from 'react';
// import { Plus, Trash2, Save, FileText, ChevronRight, ChevronDown, ArrowLeft, LayoutGrid, Eye, CheckCircle, AlertCircle, Lock } from 'lucide-react';

// const PolicyPage = () => {
//   const [view, setView] = useState('DASHBOARD');
//   const [selectedCodeId, setSelectedCodeId] = useState(null);
//   const [expandedVersionIndex, setExpandedVersionIndex] = useState(null);
  
//   // Real-world Mock Data with updated Status Object and Date ranges
//   const [allTaxCodes, setAllTaxCodes] = useState([
//     {
//       id: 'TX_ETH_STD_2025',
//       name: 'Ethiopian Federal Income Tax',
//       isEnabled: true,
//       versions: [
//         {
//           version: 'v1',
//           validFrom: '2024-07-07',
//           validTo: null,
//           status: { active: true, locked: false },
//           incomeTax: { 
//             type: 'progressive', 
//             flatRate: 0,
//             brackets: [
//               { min: 0, max: 600, rate: 0 },
//               { min: 601, max: 1650, rate: 10 },
//               { min: 1651, max: 3200, rate: 15 },
//               { min: 3201, max: 5250, rate: 20 },
//               { min: 5251, max: 7800, rate: 25 },
//               { min: 7801, max: 10900, rate: 30 },
//               { min: 10901, max: null, rate: 35 }
//             ] 
//           },
//           pension: { employeePercent: 7, employerPercent: 11 },
//           statutoryDeductions: [
//             { name: 'Cost Sharing', percent: 10 },
//             { name: 'Community Health Ins.', percent: 2 }
//           ],
//           exemptions: [
//             { name: 'Transport Allowance', limit: 600, overtimeTaxable: false },
//             { name: 'Housing Allowance', limit: 0, overtimeTaxable: true }
//           ],
//           rounding: { method: 'nearest', precision: 2 },
//           compliance: [
//             { label: 'Authority', value: 'Federal Ministry of Revenue' },
//             { label: 'Proclamation', value: '979/2016' },
//             { label: 'Country Code', value: 'ET' }
//           ]
//         }
//       ]
//     }
//   ]);

//   const [taxData, setTaxData] = useState(null);

//   // --- CORE LOGIC ---
//   const handleChange = (path, value) => {
//     const keys = path.split('.');
//     setTaxData(prev => {
//       let newData = { ...prev };
//       let current = newData;
//       for (let i = 0; i < keys.length - 1; i++) { current = current[keys[i]]; }
//       current[keys[keys.length - 1]] = value;
//       return { ...newData };
//     });
//   };

//   const addItem = (path, template) => {
//     const keys = path.split('.');
//     setTaxData(prev => {
//       let newData = { ...prev };
//       let current = newData;
//       for (let i = 0; i < keys.length - 1; i++) { current = current[keys[i]]; }
//       current[keys[keys.length - 1]] = [...current[keys[keys.length - 1]], template];
//       return { ...newData };
//     });
//   };

//   const removeItem = (path, index) => {
//     const keys = path.split('.');
//     setTaxData(prev => {
//       let newData = { ...prev };
//       let current = newData;
//       for (let i = 0; i < keys.length - 1; i++) { current = current[keys[i]]; }
//       current[keys[keys.length - 1]] = current[keys[keys.length - 1]].filter((_, i) => i !== index);
//       return { ...newData };
//     });
//   };

//   const updateItem = (path, index, field, value) => {
//     const keys = path.split('.');
//     setTaxData(prev => {
//       let newData = { ...prev };
//       let current = newData;
//       for (let i = 0; i < keys.length - 1; i++) { current = current[keys[i]]; }
//       current[keys[keys.length - 1]][index][field] = value;
//       return { ...newData };
//     });
//   };

//   const saveConfiguration = () => {
//     // LOGGING THE JSON RESULT
//     console.log("Saving Tax Configuration JSON:", JSON.stringify(taxData, null, 2));

//     if (selectedCodeId) {
//       setAllTaxCodes(prev => prev.map(code => 
//         code.id === selectedCodeId ? { ...code, versions: [...code.versions, { ...taxData, status: { active: false, locked: false } }] } : code
//       ));
//     } else {
//       const newId = `TX_${taxData.name.toUpperCase().replace(/\s+/g, '_')}`;
//       setAllTaxCodes([...allTaxCodes, { id: newId, name: taxData.name, isEnabled: true, versions: [{ ...taxData }] }]);
//     }
//     setView('DASHBOARD');
//   };

//   // --- UI VIEWS ---

//   if (view === 'DASHBOARD') {
//     return (
//       <div className="max-w-6xl mx-auto p-8">
//         <div className="flex justify-between items-center mb-10">
//           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tax Configurations</h1>
//           <button 
//             onClick={() => {
//               setTaxData({ 
//                 name: '', version: 'v1', validFrom: '', validTo: null,
//                 status: { active: true, locked: false },
//                 incomeTax: { type: 'progressive', flatRate: 0, brackets: [{ min: 0, max: '', rate: 0 }] }, 
//                 pension: { employeePercent: 0, employerPercent: 0 },
//                 statutoryDeductions: [{ name: '', percent: 0 }], 
//                 exemptions: [{ name: '', limit: 0, overtimeTaxable: true }],
//                 rounding: { method: 'nearest', precision: 2 },
//                 compliance: [{ label: 'Authority', value: 'Ministry of Revenue' }]
//               });
//               setSelectedCodeId(null);
//               setView('EDITOR');
//             }}
//             className="bg-slate-900 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
//             <Plus size={20} /> Add New Tax Code
//           </button>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {allTaxCodes.map(code => (
//             <div key={code.id} onClick={() => { setSelectedCodeId(code.id); setView('VERSION_LIST'); }}
//                  className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer group">
//               <div className="flex justify-between items-start mb-6">
//                 <div className={`p-3 rounded-xl transition-colors ${code.isEnabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
//                   <LayoutGrid size={24} />
//                 </div>
//                 <button onClick={(e) => { e.stopPropagation(); setAllTaxCodes(prev => prev.map(c => c.id === code.id ? {...c, isEnabled: !c.isEnabled} : c)); }} className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${code.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
//                   <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${code.isEnabled ? 'translate-x-6' : ''}`} />
//                 </button>
//               </div>
//               <h2 className="text-xl font-bold text-slate-800 group-hover:text-blue-600">{code.name}</h2>
//               <p className="text-xs text-slate-400 mt-1 font-mono">{code.id}</p>
//               <div className="mt-8 flex items-center justify-between text-slate-400 font-semibold text-sm">
//                 <span>{code.versions.length} Versions</span>
//                 <ChevronRight size={18} />
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   if (view === 'VERSION_LIST') {
//     const code = allTaxCodes.find(c => c.id === selectedCodeId);
//     return (
//       <div className="max-w-4xl mx-auto p-8">
//         <button onClick={() => setView('DASHBOARD')} className="flex items-center gap-2 text-slate-500 mb-8 hover:text-slate-900 font-bold transition-colors">
//           <ArrowLeft size={18} /> Back to Dashboard
//         </button>
        
//         <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl border shadow-sm">
//           <div>
//             <h1 className="text-2xl font-black text-slate-900">{code.name}</h1>
//             <p className="text-slate-400 text-sm">Deployment & Configuration History</p>
//           </div>
//           <button 
//             onClick={() => {
//               const last = code.versions[code.versions.length-1];
//               setTaxData({ ...JSON.parse(JSON.stringify(last)), version: `v${code.versions.length + 1}`, validFrom: '', validTo: null });
//               setView('EDITOR');
//             }}
//             className="bg-blue-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-blue-100">
//             <Plus size={18} /> New Version
//           </button>
//         </div>

//         <div className="space-y-4">
//           {code.versions.map((v, i) => (
//             <div key={i} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:border-blue-200 transition-all">
//               <div className="p-5 flex justify-between items-center">
//                 <div className="flex items-center gap-6">
//                   <div className="font-black text-slate-300 text-2xl tracking-tighter">{v.version}</div>
//                   <div>
//                     <div className="flex items-center gap-2">
//                        <span className="text-sm font-bold text-slate-700">{v.validFrom} {v.validTo ? `to ${v.validTo}` : '(Open)'}</span>
//                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${v.status.active && code.isEnabled ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
//                          {v.status.active && code.isEnabled ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
//                          {v.status.active && code.isEnabled ? 'Active' : 'Inactive'}
//                        </div>
//                     </div>
//                     <button onClick={() => setExpandedVersionIndex(expandedVersionIndex === i ? null : i)} className="text-blue-600 text-[11px] font-black uppercase mt-1 flex items-center gap-1 hover:underline">
//                       <Eye size={14} /> Full Breakdown <ChevronDown size={14} className={`transform transition-transform ${expandedVersionIndex === i ? 'rotate-180' : ''}`} />
//                     </button>
//                   </div>
//                 </div>
                
//                 <button 
//                   disabled={!code.isEnabled}
//                   onClick={(e) => { e.stopPropagation(); setAllTaxCodes(prev => prev.map(c => c.id === code.id ? {...c, versions: c.versions.map((ver, idx) => idx === i ? {...ver, status: {...ver.status, active: !ver.status.active}} : ver)} : c)); }}
//                   className={`w-11 h-6 flex items-center rounded-full p-1 transition-all ${!code.isEnabled ? 'opacity-20 bg-slate-400' : v.status.active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
//                   <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${v.status.active && code.isEnabled ? 'translate-x-5' : ''}`} />
//                 </button>
//               </div>

//               {expandedVersionIndex === i && (
//                 <div className="bg-slate-50 p-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//                   <div className="space-y-3">
//                     <p className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">Tax Rule: {v.incomeTax.type}</p>
//                     <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
//                        {v.incomeTax.type === 'flat' ? (
//                          <div className="p-3 text-center font-bold text-blue-600">{v.incomeTax.flatRate}% Flat Rate</div>
//                        ) : (
//                          v.incomeTax.brackets.map((b, bi) => (
//                            <div key={bi} className="flex justify-between p-2 text-xs border-b last:border-0 border-slate-50">
//                              <span className="text-slate-500 font-medium">{b.min.toLocaleString()} - {b.max ? b.max.toLocaleString() : '∞'}</span>
//                              <span className="font-bold text-blue-600">{b.rate}%</span>
//                            </div>
//                          ))
//                        )}
//                     </div>
//                   </div>
//                   <div className="space-y-6">
//                     <div>
//                       <p className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-2">Social Contribution</p>
//                       <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg shadow-blue-100">
//                         <div className="flex justify-between border-b border-blue-400 pb-2 mb-2">
//                            <span className="text-xs opacity-80">Employee</span>
//                            <span className="font-black">{v.pension.employeePercent}%</span>
//                         </div>
//                         <div className="flex justify-between">
//                            <span className="text-xs opacity-80">Employer</span>
//                            <span className="font-black">{v.pension.employerPercent}%</span>
//                         </div>
//                       </div>
//                     </div>
//                     <div>
//                       <p className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-2">Rounding</p>
//                       <div className="bg-white p-3 rounded-xl border text-xs flex justify-between">
//                         <span className="capitalize">{v.rounding.method}</span>
//                         <span className="font-bold">{v.rounding.precision} Decimals</span>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="space-y-6">
//                     <div>
//                       <p className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-2">Exemptions</p>
//                       <div className="space-y-2">
//                         {v.exemptions.map((ex, exi) => (
//                           <div key={exi} className="bg-white p-3 rounded-xl border text-[11px]">
//                             <p className="font-bold text-slate-700">{ex.name}</p>
//                             <p className="text-slate-400 mt-0.5">Limit: {ex.limit} | {ex.overtimeTaxable ? 'OT Taxable' : 'OT Exempt'}</p>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                     <div>
//                       <p className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-2">Deductions & Compliance</p>
//                       <div className="space-y-1">
//                         {v.statutoryDeductions.map((d, di) => (
//                           <div key={di} className="text-xs flex justify-between font-bold text-slate-600"><span>{d.name}</span><span>{d.percent}%</span></div>
//                         ))}
//                         {v.compliance.map((c, ci) => (
//                           <div key={ci} className="text-[11px] flex justify-between text-slate-400 pt-1"><span>{c.label}</span><span>{c.value}</span></div>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   // --- EDITOR VIEW ---
//   return (
//     <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
//       <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
//         <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
//           <div>
//             <h1 className="text-2xl font-black flex items-center gap-3">
//               <FileText className="w-6 h-6 text-blue-500" /> {selectedCodeId ? `Adding Version: ${taxData.version}` : 'Configure New Tax Code'}
//             </h1>
//           </div>
//           <div className="flex gap-4">
//              <button onClick={() => setView(selectedCodeId ? 'VERSION_LIST' : 'DASHBOARD')} className="text-slate-400 font-bold hover:text-white transition-colors">Cancel</button>
//              <button onClick={saveConfiguration} className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-xl flex items-center gap-2 font-black text-sm shadow-xl transition-all">
//                <Save className="w-4 h-4" /> Save & Commit
//              </button>
//           </div>
//         </div>

//         <div className="p-10 space-y-10">
//           {/* Header Data */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//             {!selectedCodeId && (
//               <div>
//                 <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Tax Code Name</label>
//                 <input type="text" value={taxData.name} className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 outline-none" 
//                   onChange={(e) => handleChange('name', e.target.value)} />
//               </div>
//             )}
//             <div className={selectedCodeId ? 'col-span-2' : ''}>
//               <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Version</label>
//               <input type="text" value={taxData.version} className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 font-black text-blue-600" readOnly />
//             </div>
//             <div>
//               <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">From</label>
//               <input type="date" value={taxData.validFrom} className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 outline-none" 
//                 onChange={(e) => handleChange('validFrom', e.target.value)} />
//             </div>
//             <div>
//               <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">To (Optional)</label>
//               <input type="date" value={taxData.validTo || ''} className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 outline-none" 
//                 onChange={(e) => handleChange('validTo', e.target.value || null)} />
//             </div>
//           </div>

//           {/* Income Tax Rule Selection */}
//           <div className="space-y-4">
//             <div className="flex items-center justify-between border-b-2 border-slate-50 pb-4">
//               <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Income Tax Calculation</h2>
//               <div className="flex bg-slate-100 p-1 rounded-xl">
//                  <button onClick={() => handleChange('incomeTax.type', 'progressive')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${taxData.incomeTax.type === 'progressive' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Progressive</button>
//                  <button onClick={() => handleChange('incomeTax.type', 'flat')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${taxData.incomeTax.type === 'flat' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Flat Rate</button>
//               </div>
//             </div>

//             {taxData.incomeTax.type === 'flat' ? (
//               <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100 flex items-center gap-4">
//                 <label className="font-bold text-blue-800">Flat Rate Percentage:</label>
//                 <input type="number" value={taxData.incomeTax.flatRate} className="w-24 p-2 rounded-lg border-2 border-blue-200 font-black text-blue-600" onChange={(e) => handleChange('incomeTax.flatRate', parseInt(e.target.value))} />
//                 <span className="font-black text-blue-800">%</span>
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 <SectionHeader title="Income Tax Brackets" onAdd={() => {
//                   const last = taxData.incomeTax.brackets[taxData.incomeTax.brackets.length-1];
//                   addItem('incomeTax.brackets', { min: last.max ? parseInt(last.max) + 1 : 0, max: '', rate: 0 });
//                 }} />
//                 {taxData.incomeTax.brackets.map((bracket, index) => (
//                   <div key={index} className="flex gap-4 items-end bg-slate-50 p-5 rounded-2xl border-2 border-white shadow-sm">
//                     <div className="flex-1"><label className="text-[10px] text-slate-400 font-black uppercase">Min</label><input type="number" value={bracket.min} className="w-full bg-white border p-2 rounded-lg mt-1 font-bold" readOnly /></div>
//                     <div className="flex-1"><label className="text-[10px] text-slate-400 font-black uppercase">Max (Blank for ∞)</label><input type="number" value={bracket.max || ''} className="w-full bg-white border p-2 rounded-lg mt-1" onChange={(e) => {
//                           const newBrackets = [...taxData.incomeTax.brackets];
//                           newBrackets[index].max = e.target.value === '' ? null : parseInt(e.target.value);
//                           handleChange('incomeTax.brackets', newBrackets);
//                         }} /></div>
//                     <div className="w-24"><label className="text-[10px] text-slate-400 font-black uppercase">Rate %</label><input type="number" value={bracket.rate} className="w-full bg-white border p-2 rounded-lg mt-1 font-black text-blue-600" onChange={(e) => {
//                           const newBrackets = [...taxData.incomeTax.brackets];
//                           newBrackets[index].rate = parseInt(e.target.value);
//                           handleChange('incomeTax.brackets', newBrackets);
//                         }} /></div>
//                     {index > 0 && <button onClick={() => removeItem('incomeTax.brackets', index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={20} /></button>}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
//             <div className="space-y-4">
//               <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Pension Contribution</h2>
//               <div className="grid grid-cols-2 gap-4 bg-blue-50 p-6 rounded-2xl border border-blue-100">
//                 <div><label className="text-xs font-bold text-blue-800 mb-1 block">Employee %</label><input type="number" value={taxData.pension.employeePercent} className="w-full p-2 rounded-lg border focus:ring-2 ring-blue-500 outline-none font-bold" onChange={(e) => handleChange('pension.employeePercent', parseInt(e.target.value))} /></div>
//                 <div><label className="text-xs font-bold text-blue-800 mb-1 block">Employer %</label><input type="number" value={taxData.pension.employerPercent} className="w-full p-2 rounded-lg border focus:ring-2 ring-blue-500 outline-none font-bold" onChange={(e) => handleChange('pension.employerPercent', parseInt(e.target.value))} /></div>
//               </div>
//             </div>
//             <div className="space-y-4">
//                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Rounding Rules</h2>
//                <div className="flex gap-4 bg-slate-50 p-6 rounded-2xl border">
//                   <select value={taxData.rounding.method} className="flex-1 p-2 rounded-lg border" onChange={(e) => handleChange('rounding.method', e.target.value)}>
//                     <option value="nearest">Nearest</option><option value="up">Round Up</option><option value="down">Round Down</option>
//                   </select>
//                   <input type="number" value={taxData.rounding.precision} className="w-20 p-2 rounded-lg border text-center font-bold" onChange={(e) => handleChange('rounding.precision', parseInt(e.target.value))} />
//                </div>
//             </div>
//           </div>

//           <div className="space-y-4">
//             <SectionHeader title="Statutory Deductions" onAdd={() => addItem('statutoryDeductions', { name: '', percent: 0 })} />
//             {taxData.statutoryDeductions.map((d, idx) => (
//               <div key={idx} className="flex gap-4 bg-white border-2 border-slate-50 p-4 rounded-xl shadow-sm">
//                 <input placeholder="Item Name" value={d.name} className="flex-1 border-b-2 outline-none p-1 focus:border-blue-500" onChange={(e) => updateItem('statutoryDeductions', idx, 'name', e.target.value)} />
//                 <input type="number" placeholder="%" value={d.percent} className="w-20 border p-2 rounded-lg font-bold" onChange={(e) => updateItem('statutoryDeductions', idx, 'percent', parseInt(e.target.value))} />
//                 <button onClick={() => removeItem('statutoryDeductions', idx)} className="text-red-400"><Trash2 size={18} /></button>
//               </div>
//             ))}
//           </div>

//           <div className="space-y-4">
//             <SectionHeader title="Allowances & Exemptions" onAdd={() => addItem('exemptions', { name: '', limit: 0, overtimeTaxable: true })} />
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {taxData.exemptions.map((ex, idx) => (
//                 <div key={idx} className="bg-slate-50 p-4 rounded-2xl border flex flex-col gap-3">
//                   <input placeholder="Exemption Label" value={ex.name} className="bg-transparent border-b font-bold p-1 outline-none focus:border-blue-500" onChange={(e) => updateItem('exemptions', idx, 'name', e.target.value)} />
//                   <div className="flex justify-between items-center">
//                     <input type="number" value={ex.limit} className="w-24 border p-1 rounded bg-white text-sm" onChange={(e) => updateItem('exemptions', idx, 'limit', parseInt(e.target.value))} />
//                     <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
//                       <input type="checkbox" checked={ex.overtimeTaxable} onChange={(e) => updateItem('exemptions', idx, 'overtimeTaxable', e.target.checked)} />
//                       OT Taxable
//                     </label>
//                   </div>
//                   <button onClick={() => removeItem('exemptions', idx)} className="text-[10px] text-red-500 font-bold self-end uppercase hover:underline">Remove</button>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="space-y-4">
//              <SectionHeader title="Compliance & Local Authority" onAdd={() => addItem('compliance', { label: '', value: '' })} />
//              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
//                {taxData.compliance.map((c, idx) => (
//                  <div key={idx} className="flex flex-col gap-1 p-3 bg-white border rounded-xl shadow-sm">
//                    <input placeholder="Label" value={c.label} className="text-[10px] uppercase font-black text-slate-400 bg-transparent outline-none" onChange={(e) => updateItem('compliance', idx, 'label', e.target.value)} />
//                    <div className="flex items-center gap-2">
//                      <input placeholder="Value" value={c.value} className="flex-1 text-sm font-bold bg-transparent outline-none focus:text-blue-600" onChange={(e) => updateItem('compliance', idx, 'value', e.target.value)} />
//                      <button onClick={() => removeItem('compliance', idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
//                    </div>
//                  </div>
//                ))}
//              </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const SectionHeader = ({ title, onAdd }) => (
//   <div className="flex justify-between items-center border-b-2 border-slate-50 pb-4">
//     <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h2>
//     <button onClick={onAdd} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 hover:bg-slate-200 transition-all">
//       <Plus size={14} /> Add New
//     </button>
//   </div>
// );

// export default PolicyPage
// // // import React, { useState } from 'react';
// // // import PolicyStepSidebar from '../policy/PolicyStepSidebar';

// // // // Import your Section Views
// // // import TaxPolicyView from '../policy/TaxPolicyView';
// // // // import GeneralPolicyView from '../components/policy/GeneralPolicyView'; 
// // // // import AttendancePolicyView from '../components/policy/AttendancePolicyView';

// // // const PolicyPage = () => {
// // //   const [activeStep, setActiveStep] = useState('tax'); // Default to Tax for demo

// // //   // Simple factory to render the correct component
// // //   const renderSection = () => {
// // //     switch (activeStep) {
// // //       case 'general':
// // //         return <div className="p-10 text-gray-400">General Policy Component Here</div>; // Placeholder
// // //       case 'attendance':
// // //         return <div className="p-10 text-gray-400">Attendance Policy Component Here</div>; // Placeholder
// // //       case 'tax':
// // //         return <TaxPolicyView />;
// // //       default:
// // //         return <div>Select a section</div>;
// // //     }
// // //   };

// // //   return (
// // //     <div className="min-h-screen bg-gray-100 p-8 font-sans">
// // //       <header className="mb-8">
// // //         <h1 className="text-2xl font-bold text-gray-900">Policy Management</h1>
// // //         <p className="text-gray-500">Configure HR rules, tax codes, and leave entitlements.</p>
// // //       </header>

// // //       <div className="flex gap-8 items-start max-w-7xl mx-auto">
// // //         {/* Left Sidebar */}
// // //         <PolicyStepSidebar 
// // //           activeStep={activeStep} 
// // //           onStepChange={setActiveStep} 
// // //         />

// // //         {/* Right Content Area */}
// // //         <main className="flex-1">
// // //           {renderSection()}
// // //         </main>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default PolicyPage;



















// // // import React, { useState } from 'react';
// // // import { Plus, Trash2, Save, FileText, ChevronRight, ArrowLeft, History, LayoutGrid } from 'lucide-react';

// // // const PolicyPage = () => {
// // //   // --- APP STATE ---
// // //   const [view, setView] = useState('DASHBOARD'); // DASHBOARD | VERSION_LIST | EDITOR
// // //   const [selectedCodeId, setSelectedCodeId] = useState(null);
  
// // //   // Storage for all tax codes and their versions
// // //   const [allTaxCodes, setAllTaxCodes] = useState([
// // //     {
// // //       id: 'TX_STD',
// // //       name: 'Standard Employee Tax',
// // //       versions: [
// // //         {
// // //           version: 'v1',
// // //           validFrom: '2025-01-01',
// // //           validTo: null,
// // //           incomeTax: { type: 'progressive', brackets: [{ min: 0, max: 10000, rate: 5 }] },
// // //           pension: { employeePercent: 7, employerPercent: 11 },
// // //           statutoryDeductions: { healthInsurancePercent: 3 },
// // //           exemptions: { allowanceTaxFreeLimit: 3000, overtimeTaxable: true },
// // //           rounding: { method: 'nearest', precision: 2 },
// // //           compliance: { country: 'ET', authority: 'Ministry of Revenue' },
// // //           status: { active: true, locked: true }
// // //         }
// // //       ]
// // //     }
// // //   ]);

// // //   // Temporary state for the editor (Your exact structure)
// // //   const [taxData, setTaxData] = useState(null);

// // //   // --- NAVIGATION & LOGIC ---

// // //   const enterCreateNewCode = () => {
// // //     setTaxData({
// // //       name: '',
// // //       version: 'v1',
// // //       validFrom: '',
// // //       validTo: null,
// // //       incomeTax: { type: 'progressive', brackets: [{ min: 0, max: '', rate: 0 }] },
// // //       pension: { employeePercent: 0, employerPercent: 0 },
// // //       statutoryDeductions: { healthInsurancePercent: 0 },
// // //       exemptions: { allowanceTaxFreeLimit: 0, overtimeTaxable: true },
// // //       rounding: { method: 'nearest', precision: 2 },
// // //       compliance: { country: 'ET', authority: 'Ministry of Revenue' },
// // //       status: { active: true, locked: false }
// // //     });
// // //     setSelectedCodeId(null);
// // //     setView('EDITOR');
// // //   };

// // //   const enterAddNewVersion = (parentCode) => {
// // //     const lastVer = parentCode.versions[parentCode.versions.length - 1];
// // //     // Auto-increment logic: v1 -> v2
// // //     const nextVerNumber = `v${parseInt(lastVer.version.replace('v', '')) + 1}`;
    
// // //     // Copy everything from last version but increment tag
// // //     setTaxData({
// // //       ...JSON.parse(JSON.stringify(lastVer)), // Deep clone
// // //       version: nextVerNumber,
// // //       validFrom: '', // New version needs new date
// // //       status: { active: true, locked: false }
// // //     });
// // //     setSelectedCodeId(parentCode.id);
// // //     setView('EDITOR');
// // //   };

// // //   const saveConfiguration = () => {
// // //     if (selectedCodeId) {
// // //       // Logic: Add new version to existing code
// // //       setAllTaxCodes(prev => prev.map(code => 
// // //         code.id === selectedCodeId 
// // //         ? { ...code, versions: [...code.versions, taxData] } 
// // //         : code
// // //       ));
// // //     } else {
// // //       // Logic: Create brand new Tax Code with its first version
// // //       const newId = `TX_${taxData.name.toUpperCase().replace(/\s+/g, '_')}`;
// // //       setAllTaxCodes([...allTaxCodes, {
// // //         id: newId,
// // //         name: taxData.name,
// // //         versions: [taxData]
// // //       }]);
// // //     }
// // //     setView('DASHBOARD');
// // //   };

// // //   // Your exact original change handler
// // //   const handleChange = (path, value) => {
// // //     const keys = path.split('.');
// // //     setTaxData(prev => {
// // //       let newData = { ...prev };
// // //       let current = newData;
// // //       for (let i = 0; i < keys.length - 1; i++) {
// // //         current = current[keys[i]];
// // //       }
// // //       current[keys[keys.length - 1]] = value;
// // //       return { ...newData };
// // //     });
// // //   };

// // //   // Your exact original bracket logic
// // //   const addBracket = () => {
// // //     const lastBracket = taxData.incomeTax.brackets[taxData.incomeTax.brackets.length - 1];
// // //     const newMin = lastBracket.max ? parseInt(lastBracket.max) + 1 : 0;
// // //     setTaxData({
// // //       ...taxData,
// // //       incomeTax: {
// // //         ...taxData.incomeTax,
// // //         brackets: [...taxData.incomeTax.brackets, { min: newMin, max: '', rate: 0 }]
// // //       }
// // //     });
// // //   };

// // //   const removeBracket = (index) => {
// // //     const newBrackets = taxData.incomeTax.brackets.filter((_, i) => i !== index);
// // //     setTaxData({ ...taxData, incomeTax: { ...taxData.incomeTax, brackets: newBrackets } });
// // //   };

// // //   // --- UI COMPONENTS ---

// // //   if (view === 'DASHBOARD') {
// // //     return (
// // //       <div className="max-w-6xl mx-auto p-8">
// // //         <div className="flex justify-between items-center mb-8">
// // //           <h1 className="text-3xl font-bold text-slate-900">Tax Management</h1>
// // //           <button onClick={enterCreateNewCode} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold">
// // //             <Plus size={20} /> Add New Tax Code
// // //           </button>
// // //         </div>
// // //         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// // //           {allTaxCodes.map(code => (
// // //             <div key={code.id} onClick={() => { setSelectedCodeId(code.id); setView('VERSION_LIST'); }}
// // //                  className="bg-white border p-6 rounded-xl shadow-sm hover:border-blue-400 cursor-pointer transition-all">
// // //               <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
// // //                 <LayoutGrid size={24} />
// // //               </div>
// // //               <h2 className="text-xl font-bold text-slate-800">{code.name}</h2>
// // //               <p className="text-slate-500 text-sm mt-1">{code.versions.length} versions defined</p>
// // //               <div className="mt-4 flex items-center text-blue-600 font-medium text-sm">
// // //                 View History <ChevronRight size={16} />
// // //               </div>
// // //             </div>
// // //           ))}
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   if (view === 'VERSION_LIST') {
// // //     const currentCode = allTaxCodes.find(c => c.id === selectedCodeId);
// // //     return (
// // //       <div className="max-w-4xl mx-auto p-8">
// // //         <button onClick={() => setView('DASHBOARD')} className="flex items-center gap-2 text-slate-500 mb-6 hover:text-slate-800">
// // //           <ArrowLeft size={18} /> Back to Dashboard
// // //         </button>
// // //         <div className="flex justify-between items-end mb-8">
// // //           <div>
// // //             <h1 className="text-3xl font-bold text-slate-900">{currentCode.name}</h1>
// // //             <p className="text-slate-500">ID: {currentCode.id}</p>
// // //           </div>
// // //           <button onClick={() => enterAddNewVersion(currentCode)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
// // //             <Plus size={18} /> New Version
// // //           </button>
// // //         </div>
// // //         <div className="space-y-4">
// // //           {currentCode.versions.map((v, i) => (
// // //             <div key={i} className="bg-white border p-4 rounded-xl flex justify-between items-center">
// // //               <div className="flex items-center gap-4">
// // //                 <div className="bg-slate-100 p-2 rounded text-slate-600 font-mono font-bold">{v.version}</div>
// // //                 <div>
// // //                   <p className="font-semibold">Valid From: {v.validFrom || 'Not Set'}</p>
// // //                   <p className="text-xs text-slate-400">Status: {v.status.active ? 'Active' : 'Draft'}</p>
// // //                 </div>
// // //               </div>
// // //               <button onClick={() => { setTaxData(v); setView('EDITOR'); }} className="text-slate-400 hover:text-blue-600">
// // //                 <ChevronRight size={20} />
// // //               </button>
// // //             </div>
// // //           ))}
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   // --- EDITOR VIEW (Your Exact Component Logic) ---
// // //   return (
// // //     <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
// // //        <button onClick={() => setView(selectedCodeId ? 'VERSION_LIST' : 'DASHBOARD')} className="flex items-center gap-2 text-slate-500 mb-6 hover:text-slate-800">
// // //           <ArrowLeft size={18} /> Discard Changes
// // //         </button>

// // //       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
// // //         <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
// // //           <div>
// // //             <h1 className="text-xl font-bold flex items-center gap-2">
// // //               <FileText className="w-5 h-5" /> 
// // //               {selectedCodeId ? `Adding Version to ${selectedCodeId}` : 'Creating New Tax Code'}
// // //             </h1>
// // //             <p className="text-slate-400 text-sm">Define tax brackets, pensions, and compliance rules.</p>
// // //           </div>
// // //           <button onClick={saveConfiguration} className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
// // //             <Save className="w-4 h-4" /> {selectedCodeId ? 'Save Version' : 'Save New Code'}
// // //           </button>
// // //         </div>

// // //         <div className="p-8 space-y-8">
// // //           {/* Section 1: Basic Info */}
// // //           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// // //             {!selectedCodeId && (
// // //               <div>
// // //                 <label className="block text-sm font-semibold text-gray-700 mb-1">Tax Code Name</label>
// // //                 <input type="text" placeholder="e.g. Standard Employee Tax" className="w-full border p-2 rounded-md" 
// // //                   value={taxData.name} onChange={(e) => handleChange('name', e.target.value)} />
// // //               </div>
// // //             )}
// // //             <div className={selectedCodeId ? 'col-span-2' : ''}>
// // //               <label className="block text-sm font-semibold text-gray-700 mb-1">Version Tag</label>
// // //               <input type="text" value={taxData.version} className="w-full border p-2 rounded-md bg-gray-50 font-bold text-blue-600" readOnly />
// // //             </div>
// // //             <div>
// // //               <label className="block text-sm font-semibold text-gray-700 mb-1">Valid From</label>
// // //               <input type="date" value={taxData.validFrom} className="w-full border p-2 rounded-md" 
// // //                 onChange={(e) => handleChange('validFrom', e.target.value)} />
// // //             </div>
// // //           </div>

// // //           <hr />

// // //           {/* Section 2: Progressive Brackets */}
// // //           <div>
// // //             <div className="flex justify-between items-center mb-4">
// // //               <h2 className="text-lg font-bold text-gray-800">Income Tax Brackets</h2>
// // //               <button onClick={addBracket} className="text-blue-600 flex items-center gap-1 text-sm font-medium hover:underline">
// // //                 <Plus className="w-4 h-4" /> Add Bracket
// // //               </button>
// // //             </div>
// // //             <div className="space-y-3">
// // //               {taxData.incomeTax.brackets.map((bracket, index) => (
// // //                 <div key={index} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
// // //                   <div className="flex-1">
// // //                     <label className="text-xs text-gray-500 uppercase font-bold">Min Amount</label>
// // //                     <input type="number" value={bracket.min} className="w-full border p-2 rounded-md mt-1" readOnly />
// // //                   </div>
// // //                   <div className="flex-1">
// // //                     <label className="text-xs text-gray-500 uppercase font-bold">Max Amount (Null for Infinity)</label>
// // //                     <input type="number" value={bracket.max || ''} placeholder="Leave empty for Max" className="w-full border p-2 rounded-md mt-1"
// // //                       onChange={(e) => {
// // //                         const newBrackets = [...taxData.incomeTax.brackets];
// // //                         newBrackets[index].max = e.target.value === '' ? null : parseInt(e.target.value);
// // //                         setTaxData({...taxData, incomeTax: {...taxData.incomeTax, brackets: newBrackets}});
// // //                       }} />
// // //                   </div>
// // //                   <div className="w-32">
// // //                     <label className="text-xs text-gray-500 uppercase font-bold">Rate (%)</label>
// // //                     <input type="number" value={bracket.rate} className="w-full border p-2 rounded-md mt-1" 
// // //                        onChange={(e) => {
// // //                         const newBrackets = [...taxData.incomeTax.brackets];
// // //                         newBrackets[index].rate = parseInt(e.target.value);
// // //                         setTaxData({...taxData, incomeTax: {...taxData.incomeTax, brackets: newBrackets}});
// // //                       }} />
// // //                   </div>
// // //                   {index > 0 && (
// // //                     <button onClick={() => removeBracket(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
// // //                       <Trash2 className="w-5 h-5" />
// // //                     </button>
// // //                   )}
// // //                 </div>
// // //               ))}
// // //             </div>
// // //           </div>

// // //           {/* Section 3: Pension & Statutory */}
// // //           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
// // //             <div className="p-4 border rounded-lg bg-blue-50/50">
// // //               <h3 className="font-bold text-blue-900 mb-4">Pension Settings</h3>
// // //               <div className="grid grid-cols-2 gap-4">
// // //                 <div>
// // //                   <label className="text-sm text-gray-600">Employee (%)</label>
// // //                   <input type="number" value={taxData.pension.employeePercent} className="w-full border p-2 rounded-md" onChange={(e) => handleChange('pension.employeePercent', parseInt(e.target.value))} />
// // //                 </div>
// // //                 <div>
// // //                   <label className="text-sm text-gray-600">Employer (%)</label>
// // //                   <input type="number" value={taxData.pension.employerPercent} className="w-full border p-2 rounded-md" onChange={(e) => handleChange('pension.employerPercent', parseInt(e.target.value))} />
// // //                 </div>
// // //               </div>
// // //             </div>
// // //             <div className="p-4 border rounded-lg bg-orange-50/50">
// // //               <h3 className="font-bold text-orange-900 mb-4">Statutory Deductions</h3>
// // //               <div>
// // //                 <label className="text-sm text-gray-600">Health Insurance (%)</label>
// // //                 <input type="number" value={taxData.statutoryDeductions.healthInsurancePercent} className="w-full border p-2 rounded-md" onChange={(e) => handleChange('statutoryDeductions.healthInsurancePercent', parseInt(e.target.value))} />
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {/* Section 4: Exemptions & Compliance */}
// // //           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
// // //              <div>
// // //                <h3 className="font-bold text-gray-800 mb-2">Exemptions</h3>
// // //                <label className="text-sm text-gray-600">Tax-Free Limit</label>
// // //                <input type="number" value={taxData.exemptions.allowanceTaxFreeLimit} className="w-full border p-2 rounded-md mb-4" onChange={(e) => handleChange('exemptions.allowanceTaxFreeLimit', parseInt(e.target.value))} />
// // //                <div className="flex items-center gap-2">
// // //                  <input type="checkbox" checked={taxData.exemptions.overtimeTaxable} onChange={(e) => handleChange('exemptions.overtimeTaxable', e.target.checked)} />
// // //                  <span className="text-sm">Overtime is taxable</span>
// // //                </div>
// // //              </div>
// // //              <div>
// // //                <h3 className="font-bold text-gray-800 mb-2">Compliance</h3>
// // //                <label className="text-sm text-gray-600">Authority</label>
// // //                <input type="text" value={taxData.compliance.authority} className="w-full border p-2 rounded-md" onChange={(e) => handleChange('compliance.authority', e.target.value)} />
// // //              </div>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // };
// // // export default PolicyPage;