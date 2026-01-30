import React, { useEffect, useState, useMemo } from 'react';
import Dropdown from '../Dropdown';
import { Briefcase, Clock, FileText, Calendar } from 'lucide-react';
import useAuth from '../../Context/AuthContext';
import useData from '../../Context/DataContextProvider';

const PositionTypes = ['Full-Time', 'Part-Time', 'Contract'];
const JobTitles = [
  'HR Manager',
  'Department Manager',
  'Payroll Officer',
  'Employee',
];
const EmploymentTypes = ['Permanent', 'Temporary', 'Casual'];

const StepJob = ({ data, onChange }) => {
  // Access centralized departments and employees data
  const { departments, employees } = useData();

  // Trigger lazy fetch on mount
  useEffect(() => {
    departments.get();
    employees.get();
  }, []);

  // State for line manager options based on department
  const [lineManagerOptions, setLineManagerOptions] = useState([]);
  const [autoAssignedManager, setAutoAssignedManager] = useState(null);

  // Get managers for a specific department
  const getManagersForDepartment = useMemo(() => {
    return (deptId) => {
      if (!deptId || !departments.data) return [];

      const dept = departments.data.find((d) => d.id === deptId);
      if (!dept) return [];

      // Get the department manager(s)
      // Check if department has a manager field
      const managers = [];
      if (dept.manager) {
        // Find the manager employee details
        const managerEmployee = employees.data?.find(
          (e) => e.id === dept.manager,
        );
        if (managerEmployee) {
          managers.push({
            id: managerEmployee.id,
            fullname:
              managerEmployee.fullname ||
              `${managerEmployee.general?.firstname} ${managerEmployee.general?.lastname}`,
          });
        }
      }

      // Also check employees who are Department Managers in this department
      const deptEmployees =
        employees.data?.filter(
          (e) =>
            e.department === dept.name &&
            (e.jobtitle === 'Department Manager' ||
              e.job?.jobtitle === 'Department Manager'),
        ) || [];

      deptEmployees.forEach((emp) => {
        if (!managers.find((m) => m.id === emp.id)) {
          managers.push({
            id: emp.id,
            fullname:
              emp.fullname ||
              `${emp.general?.firstname} ${emp.general?.lastname}`,
          });
        }
      });

      return managers;
    };
  }, [departments.data, employees.data]);

  // Effect to update line manager options when department changes
  useEffect(() => {
    if (data.department) {
      const managers = getManagersForDepartment(data.department);

      if (managers.length === 1) {
        // Auto-assign the single manager
        setAutoAssignedManager(managers[0]);
        setLineManagerOptions([]);
        onChange({
          linemanager: managers[0].id,
          linemanagerName: managers[0].fullname,
        });
      } else if (managers.length > 1) {
        // Show dropdown with multiple managers
        setAutoAssignedManager(null);
        setLineManagerOptions(managers);
      } else {
        // No managers found
        setAutoAssignedManager(null);
        setLineManagerOptions([]);
      }
    }
  }, [data.department, getManagersForDepartment]);

  const handleDeptChange = (deptName) => {
    // Safe access to data array
    const list = departments.data || [];
    const selected = list.find((d) => d.name === deptName);
    if (selected) {
      onChange({
        department: selected.id,
        departmentName: selected.name,
        linemanager: '', // Reset line manager when department changes
        linemanagerName: '',
      });
    } else {
      onChange({
        department: '',
        departmentName: '',
        linemanager: '',
        linemanagerName: '',
      });
    }
  };

  const handleLineManagerChange = (managerName) => {
    const selected = lineManagerOptions.find((m) => m.fullname === managerName);
    if (selected) {
      onChange({
        linemanager: selected.id,
        linemanagerName: selected.fullname,
      });
    }
  };

  const deptOptions = departments.data
    ? departments.data.map((d) => d.name)
    : [];

  const employmentInfo = (
    <div className="bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-all mb-8 border border-slate-100 dark:border-transparent">
      <div className="flex mx-4 py-4 border-b dark:border-slate-700 items-center">
        <p className="flex-1 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          Employment Information
        </p>
        <Briefcase
          size={18}
          className="opacity-40 text-green-500 dark:text-green-400"
        />
      </div>
      <div
        id="left"
        className="flex gap-5 p-4 justify-start items-start flex-wrap"
      >
        <div className="w-96 flex gap-2 text-nowrap items-center">
          <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            Department
          </p>
          <div className="w-full">
            <Dropdown
              padding="p-1.5"
              options={deptOptions}
              placeholder={data.departmentName || 'Select Department'}
              onChange={handleDeptChange}
            />
          </div>
        </div>
        <div className="w-96 flex gap-2 text-nowrap items-center">
          <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            Service Year
          </p>
          <input
            type="text"
            value={data.serviceyear}
            onChange={(e) => onChange({ serviceyear: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm"
          />
        </div>
        <div className="w-96 flex gap-2 text-nowrap items-center">
          <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            Join Date
          </p>
          <input
            type="date"
            value={data.joindate}
            onChange={(e) => onChange({ joindate: e.target.value })}
            min={new Date().toISOString().slice(0, 10)}
            className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm"
          />
        </div>
      </div>
    </div>
  );

  const jobTimeLine = (
    <div className="bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-all mb-8 border border-slate-100 dark:border-transparent">
      <div className="flex mx-4 py-4 border-b dark:border-slate-700 items-center">
        <p className="flex-1 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          Job TimeLine
        </p>
        <Clock
          size={18}
          className="opacity-40 text-green-500 dark:text-green-400"
        />
      </div>
      <div
        id="left"
        className="flex gap-5 p-4 justify-start items-start flex-wrap"
      >
        <div className="w-96 flex gap-2 text-nowrap items-center">
          <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            Position Type
          </p>
          <div className="w-full">
            <Dropdown
              padding="p-1.5"
              options={PositionTypes}
              onChange={(e) => onChange({ positiontype: e })}
            />
          </div>
        </div>
        <div className="w-96 flex gap-2 text-nowrap items-center">
          <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            Employment Type
          </p>
          <div className="w-full">
            <Dropdown
              padding="p-1.5"
              options={EmploymentTypes}
              onChange={(e) => onChange({ EmploymentTypes: e })}
            />
          </div>
        </div>
        <div className="w-96 flex gap-2 text-nowrap items-center">
          <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            Line Manager
          </p>
          <div className="w-full">
            {!data.department ? (
              <p className="text-sm text-slate-400 italic px-3 py-1.5">
                Select a department first
              </p>
            ) : autoAssignedManager ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded px-3 py-1.5 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                <span>✓</span>
                <span>{autoAssignedManager.fullname}</span>
                <span className="text-xs text-green-500">(Auto-assigned)</span>
              </div>
            ) : lineManagerOptions.length > 0 ? (
              <Dropdown
                padding="p-1.5"
                options={lineManagerOptions.map((m) => m.fullname)}
                placeholder={data.linemanagerName || 'Select Line Manager'}
                onChange={handleLineManagerChange}
              />
            ) : (
              <p className="text-sm text-amber-500 italic px-3 py-1.5">
                No managers in this department
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const contractTimeLine = (
    <div className="bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-all mb-8 border border-slate-100 dark:border-transparent">
      <div className="flex mx-4 py-4 border-b dark:border-slate-700 items-center">
        <p className="flex-1 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          Contract Timeline
        </p>
        <FileText
          size={18}
          className="opacity-40 text-green-500 dark:text-green-400"
        />
      </div>
      <div
        id="left"
        className="flex gap-5 p-4 justify-start items-start flex-wrap"
      >
        <div className="w-96 flex gap-2 text-nowrap items-center">
          <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            Contract Number
          </p>
          <input
            type="text"
            value={data.contractnumber}
            onChange={(e) => onChange({ contractnumber: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm"
          />
        </div>
        <div className="w-96 flex gap-2 text-nowrap items-center">
          <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            Contract Name
          </p>
          <input
            type="text"
            value={data.contractname}
            onChange={(e) => onChange({ contractname: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm"
          />
        </div>
        <div className="w-96 flex gap-2 text-nowrap items-center">
          <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            Contract Type
          </p>
          <input
            type="text"
            value={data.contracttype}
            onChange={(e) => onChange({ contracttype: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm"
          />
        </div>
        <div className="w-96 flex gap-2 text-nowrap items-center">
          <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            Start Date
          </p>
          <input
            type="date"
            value={data.startdate}
            onChange={(e) => onChange({ startdate: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm"
          />
        </div>
        <div className="w-96 flex gap-2 text-nowrap items-center">
          <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            End Date
          </p>
          <input
            type="date"
            value={data.enddate}
            onChange={(e) => onChange({ enddate: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm"
          />
        </div>
      </div>
    </div>
  );

  // Work Schedules
  const [schedules, setSchedules] = useState([]);
  const { axiosPrivate } = useAuth();

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await axiosPrivate.get('/attendances/schedules/');
        setSchedules(res.data.results || res.data);
      } catch (err) {
        console.error('Failed to fetch schedules', err);
      }
    };
    fetchSchedules();
  }, [axiosPrivate]);

  const handleScheduleChange = (scheduleTitle) => {
    const selected = schedules.find((s) => s.title === scheduleTitle);
    if (selected) {
      onChange({
        workschedule: selected.id,
        workscheduleTitle: selected.title,
      });
    }
  };

  const workSchedule = (
    <div className="bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-all border border-slate-100 dark:border-transparent">
      <div className="flex mx-4 py-4 border-b dark:border-slate-700 items-center">
        <p className="flex-1 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          Work Schedule
        </p>
        <Calendar
          size={18}
          className="opacity-40 text-green-500 dark:text-green-400"
        />
      </div>
      <div className="p-4 flex justify-start items-start">
        <div className="w-96 flex gap-2 text-nowrap items-center">
          <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            Schedule
          </p>
          <div className="w-full">
            <Dropdown
              padding="p-1.5"
              options={schedules.map((s) => s.title)}
              placeholder={data.workscheduleTitle || 'Select Schedule'}
              onChange={handleScheduleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const General = (
    <div className="flex flex-col gap-4 scrollbar-hidden overflow-y-scroll pb-10">
      {employmentInfo}
      {jobTimeLine}
      {contractTimeLine}
      {workSchedule}
    </div>
  );

  return General;
};

export default StepJob;
