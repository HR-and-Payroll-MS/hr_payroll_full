import React, { useEffect, useState, useMemo } from 'react';
import Table from '../../../Components/Table';
import Header from '../../../Components/Header';
import {
  SearchStatus,
  ViewEditPayslips,
} from '../../../Components/Level2Hearder';
import { useNavigate } from 'react-router-dom';
import PayslipTemplate from '../../../Components/PayslipTemplate';
import useAuth from '../../../Context/AuthContext';
function ViewGeneratedPayslips() {
  const { axiosPrivate } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const onRowClick = (id) => {
    navigate(`/hr_dashboard/Employee_Attendance/${id}`, { state: id });
    console.log(id);
  };
  const structure = [3, 1, 1, 1, 1, 1, 1, 65];
  const ke2 = [
    ['employee_pic', 'employee_name', 'employee_id'],
    ['employee_jobTitle'],
    ['employee_bankAccount'],
    ['gross'],
    ['totalDeductions'],
    ['paymentDate'],
    ['paymentMethod'],
    ['view'],
  ];
  const title = [
    'EMPLOYEE',
    'JOB TITLE',
    'BANK ACCOUNT',
    'GROSS',
    'TOTAL DEDUCTIONS',
    'PAYMENT DATE',
    'PAYMENT METHOD',
    'ACTION',
  ];

  // Fetch latest period payslips on mount
  useEffect(() => {
    const monthOrder = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
    };

    const loadPayslips = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get periods and pick the most recent by year/month
        const resPeriods = await axiosPrivate.get('/payroll/periods/');
        const periods = resPeriods.data.results || resPeriods.data || [];
        const sorted = [...periods].sort((a, b) => {
          const ay = a.year || 0;
          const by = b.year || 0;
          const am = monthOrder[a.month] || 0;
          const bm = monthOrder[b.month] || 0;
          if (ay !== by) return by - ay;
          return bm - am;
        });
        const latest = sorted[0];
        if (!latest) {
          setData([]);
          setLoading(false);
          return;
        }

        // Fetch payslips for the latest period
        const resPayslips = await axiosPrivate.get(
          `/payroll/payslips/?period=${latest.id}`
        );
        const payslips = resPayslips.data.results || resPayslips.data || [];

        const rows = payslips.map((p) => {
          const d = p.details || {};
          return {
            company: d.company || {},
            deductions: d.deductions || [],
            earnings: d.earnings || [],
            employee: {
              name: p.employee_name,
              id: p.employee_id_display,
              department: p.department,
              jobTitle: p.job_title,
              bankAccount: p.bank_account,
            },
            gross:
              d.gross ??
              (typeof p.gross_pay === 'string'
                ? parseFloat(p.gross_pay)
                : p.gross_pay),
            totalDeductions:
              d.totalDeductions ??
              (typeof p.total_deductions === 'string'
                ? parseFloat(p.total_deductions)
                : p.total_deductions),
            net:
              d.net ??
              (typeof p.net_pay === 'string'
                ? parseFloat(p.net_pay)
                : p.net_pay),
            month: d.month || `${latest.month} ${latest.year}`,
            paymentDate: d.paymentDate || '',
            paymentMethod: d.paymentMethod || 'Bank Transfer',
            warnings: Array.isArray(d.warnings) ? d.warnings : [],
            issues: p.has_issues ? p.issue_notes || 'Has issues' : '',
            employee_pic: null,
            employee_name: p.employee_name,
            employee_id: p.employee_id_display,
            employee_jobTitle: p.job_title,
            employee_bankAccount: p.bank_account,
            view: 'View',
          };
        });
        setData(rows);
      } catch (err) {
        console.error('Error loading payslips:', err);
        setError('Failed to load payslips');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    loadPayslips();
  }, [axiosPrivate]);
  const [filters, setFilters] = useState({});
  function updateFilter(obj) {
    const key = Object.keys(obj)[0];
    const value = obj[key];
    setFilters((prev) => {
      if (value == null || value === '') {
        const { [key]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  }
  const queryString = new URLSearchParams(
    Object.entries(filters).filter(([k, v]) => v && v !== '')
  ).toString();
  const dynamicURL = queryString
    ? `/payroll/payslips/?${queryString}`
    : '/payroll/payslips/';
  // console.log("Dynamic URL:", dynamicURL);

  const taxVersionInactive = useMemo(() => {
    const hasWarning = data.some(
      (r) =>
        Array.isArray(r.warnings) &&
        r.warnings.some((w) =>
          String(w).toLowerCase().includes('no active tax version')
        )
    );
    const hasIssueText = data.some((r) =>
      String(r.issues || '')
        .toLowerCase()
        .includes('no active tax version')
    );
    return hasWarning || hasIssueText;
  }, [data]);
  return (
    <div className="p-4 flex flex-col  overflow-hidden h-full">
      <Header Title={'View/Edit Payslips'} />
      <ViewEditPayslips setQ={() => {}} setPriority={() => {}} />
      {taxVersionInactive && (
        <div className="mt-2 mb-2 flex items-center gap-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded">
          Some payslips indicate no active tax version. Taxes may be zero for
          this period.
        </div>
      )}
      {/* <Table URL={"/attendances/"} Data={[]}  title={title} Structure={structure} ke={ke2} onRowClick={onRowClick} totPage={10}/> */}

      {/* <Table Data={attendanceData} URL={dynamicURL} title={title} Structure={structure} ke={ke2} onRowClick={onRowClick} totPage={10} /> */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          Loading payslips...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-red-500">
          {error}
        </div>
      ) : (
        <Table
          components={PayslipTemplate}
          clickable={false}
          Data={data}
          title={title}
          Structure={structure}
          ke={ke2}
          onRowClick={onRowClick}
          totPage={10}
        />
      )}
    </div>
  );
}

export default ViewGeneratedPayslips;
