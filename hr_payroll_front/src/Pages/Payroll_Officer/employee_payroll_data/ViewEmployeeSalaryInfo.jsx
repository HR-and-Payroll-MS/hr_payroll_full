import React, { useState, useEffect } from 'react';
import Header from '../../../Components/Header';
import { SearchStatus } from '../../../Components/Level2Hearder';
import Table from '../../../Components/Table';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../Context/AuthContext';
const employeeAttendanceMock = [
  {
    id: 1,
    general: {
      photo: '',
      fullname: 'John Doe',
      emailaddress: 'john.doe@example.com',
      phonenumber: '+1 (555) 111-2222',
      gender: 'Male',
      maritalstatus: 'Single',
    },
    job: {
      joindate: '2020-02-15',
    },
    payroll: {
      employeestatus: 'Active',
    },
    attendance: {
      date: '2025-11-23',
      clockIn: '08:59 AM',
      clockInLocation: 'HQ Office - Main Gate',
      clockOut: '05:02 PM',
      clockOutLocation: 'HQ Office - Side Exit',
      workSchedules: '9:00 AM - 5:00 PM',
      paidTime: '8h 03m',
      notes: 'On time',
    },
  },
  {
    id: 2,
    general: {
      photo: '',
      fullname: 'Sarah Johnson',
      emailaddress: 'sarah.johnson@example.com',
      phonenumber: '+1 (555) 333-4444',
      gender: 'Female',
      maritalstatus: 'Married',
    },
    job: { joindate: '2021-06-01' },
    payroll: { employeestatus: 'Active' },
    attendance: {
      date: '2025-11-23',
      clockIn: '09:17 AM',
      clockInLocation: 'Remote - Addis Ababa',
      clockOut: '06:00 PM',
      clockOutLocation: 'Remote - Addis Ababa',
      workSchedules: '9:00 AM - 5:00 PM',
      paidTime: '7h 43m',
      notes: 'Late arrival explained',
    },
  },
  {
    id: 3,
    general: {
      photo: '',
      fullname: 'Daniel Mekonnen',
      emailaddress: 'daniel.mekonnen@example.com',
      phonenumber: '+251 911 000000',
      gender: 'Male',
      maritalstatus: 'Married',
    },
    job: { joindate: '2019-09-10' },
    payroll: { employeestatus: 'On Leave' },
    attendance: {
      date: '2025-11-23',
      clockIn: '07:55 AM',
      clockInLocation: 'Warehouse Entry Point 2',
      clockOut: '04:10 PM',
      clockOutLocation: 'Warehouse Exit Point 1',
      workSchedules: '8:00 AM - 4:00 PM',
      paidTime: '8h 15m',
      notes: 'Overtime 15 minutes',
    },
  },
];
function ViewEmployeeSalaryInfo({ employeeData }) {
  const navigate = useNavigate();

  const onRowClick = (id) => {
    navigate(`/payroll/users/${id}`, { state: { Role: 'payroll' } });
  };

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
    Object.entries(filters).filter(([k, v]) => v && v !== ''),
  ).toString();

  const pageSize = 50; // fetch in chunks, then aggregate all pages
  const endpoint = `/employees/`;
  const { axiosPrivate } = useAuth();
  const [realData, setRealData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function mapEmployee(emp) {
    // If backend already returns nested general/job/payroll, pass through
    if (emp.general && emp.job && emp.payroll) {
      return emp;
    }
    // Fallback mapping for flat shapes
    return {
      id: emp.id || emp.pk || emp.user_id,
      general: {
        photo: emp.profile?.photo || emp.photo || '',
        fullname:
          emp.profile?.full_name ||
          [emp.first_name, emp.last_name].filter(Boolean).join(' ') ||
          emp.name ||
          emp.username ||
          '',
        emailaddress: emp.email || emp.profile?.email || emp.work_email || '',
        phonenumber: emp.phone || emp.profile?.phone || emp.mobile || '',
        gender: emp.profile?.gender || emp.gender || '',
        maritalstatus:
          emp.profile?.marital_status ||
          emp.marital_status ||
          emp.maritalstatus ||
          '',
      },
      job: {
        joindate:
          emp.profile?.join_date ||
          emp.join_date ||
          emp.hire_date ||
          emp.created_at ||
          '',
      },
      payroll: {
        employeestatus:
          emp.status || emp.employment_status || emp.payroll?.status || '',
      },
      attendance: emp.attendance || {},
    };
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams(queryString);
        params.set('page_size', pageSize);
        let url = params.toString()
          ? `${endpoint}?${params.toString()}`
          : `${endpoint}?page_size=${pageSize}`;
        let aggregated = [];

        while (url) {
          const res = await axiosPrivate.get(url);
          const data = res.data;
          const chunk = Array.isArray(data) ? data : data.results || [];
          aggregated = aggregated.concat(chunk);
          url = data && data.next ? data.next : null;
        }

        const mapped = aggregated.map(mapEmployee);
        if (!cancelled) setRealData(mapped);
        console.log('Fetched employees total:', aggregated.length, mapped[0]);
      } catch (err) {
        console.error('Employees fetch error', err);
        if (!cancelled)
          setError(err?.message || `Fetch failed (url=${endpoint})`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [queryString, axiosPrivate]);
  const structure = [3, 1, 1, 1, 1, 1];
  const ke2 = [
    ['general_photo', 'general_fullname', 'general_emailaddress'],
    ['general_phonenumber'],
    ['job_joindate'],
    ['general_gender'],
    ['payroll_employeestatus'],
    ['general_maritalstatus'],
  ];
  const title = [
    'USER',
    'PHONE',
    'JOIN DATE',
    'GENDER',
    'STATUS',
    'MARITAL STATUS',
  ];

  return (
    <div className="p-4 flex flex-col h-full">
      <Header
        Title="Employee Directory"
        subTitle="view all employees and click to view detail"
      />
      <SearchStatus onFiltersChange={updateFilter} />
      {loading && (
        <div className="text-sm text-gray-500">Loading employees...</div>
      )}
      {error && <div className="text-sm text-red-500">Error: {error}</div>}
      <Table
        Data={realData.length ? realData : []}
        pages={9}
        title={title}
        Structure={structure}
        ke={ke2}
        onRowClick={onRowClick}
        totPage={10}
      />
    </div>
  );
}

export default ViewEmployeeSalaryInfo;
