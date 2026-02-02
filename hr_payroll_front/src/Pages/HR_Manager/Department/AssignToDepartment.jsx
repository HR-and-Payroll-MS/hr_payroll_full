import React, { useState, useEffect } from 'react';
import {
  Building,
  UserPlus,
  CheckCircle,
  XCircle,
  Users,
  ArrowRight,
  UserCog,
} from 'lucide-react';
import useAuth from '../../../Context/AuthContext';
import useData from '../../../Context/DataContextProvider';
import Dropdown from '../../../Components/Dropdown';
import InputField from '../../../Components/InputField';
import ThreeDots from '../../../animations/ThreeDots';

const AssignToDepartment = () => {
  const { axiosPrivate } = useAuth();
  const { departments, employees } = useData();

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Trigger lazy fetch on mount to Populate Dropdowns
  useEffect(() => {
    if (departments.get) departments.get();
    if (employees.get) employees.get();
  }, []);

  // Departments options
  const deptOptions =
    departments.data?.map((d) => ({
      id: d.id,
      name: d.name,
      managerId: d.manager,
    })) || [];

  // Auto-set Line Manager when Department changes
  useEffect(() => {
    if (!employees.data) return;

    // Case 1: department.manager is set (FK id) — try to find that employee
    if (selectedDept && selectedDept.managerId) {
      const mgr = employees.data.find(
        (e) => Number(e.id) === Number(selectedDept.managerId),
      );
      if (mgr) {
        if (selectedEmployee && selectedEmployee.id === mgr.id) {
          setSelectedManager(null);
        } else {
          setSelectedManager({
            id: mgr.id,
            label:
              mgr.fullname ||
              `${mgr.general?.firstname} ${mgr.general?.lastname}`,
          });
        }
        return;
      }
    }

    // Fallbacks when department.manager is missing or not found in employees list
    if (selectedDept) {
      // 1) Try to find an employee in this department whose jobtitle/position indicates Department Manager
      const deptName = selectedDept.name;
      const candidate = employees.data.find((e) => {
        const deptMatch = (e.department || e.job?.department) === deptName;
        const title = (
          e.jobtitle ||
          e.job?.jobtitle ||
          e.position ||
          ''
        ).toLowerCase();
        return (
          deptMatch &&
          (title.includes('department manager') ||
            title.includes('department-manager') ||
            title.includes('manager'))
        );
      });
      if (candidate) {
        if (selectedEmployee && selectedEmployee.id === candidate.id) {
          setSelectedManager(null);
        } else {
          setSelectedManager({
            id: candidate.id,
            label:
              candidate.fullname ||
              `${candidate.general?.firstname} ${candidate.general?.lastname}`,
          });
        }
        return;
      }

      // 2) Aggregate line manager ids referenced by employees in the department and pick the most referenced one
      const lmCount = {};
      employees.data.forEach((emp) => {
        const deptMatch =
          (emp.department || emp.job?.department) === selectedDept.name;
        if (!deptMatch) return;
        const lm = emp.job?.linemanager || emp.linemanager || null;
        const lmId = lm && (lm.id || lm);
        if (lmId) lmCount[lmId] = (lmCount[lmId] || 0) + 1;
      });
      const lmIds = Object.keys(lmCount).sort(
        (a, b) => lmCount[b] - lmCount[a],
      );
      if (lmIds.length > 0) {
        const lmId = Number(lmIds[0]);
        const mgr = employees.data.find((e) => Number(e.id) === lmId);
        if (mgr) {
          if (selectedEmployee && selectedEmployee.id === mgr.id) {
            setSelectedManager(null);
          } else {
            setSelectedManager({
              id: mgr.id,
              label:
                mgr.fullname ||
                `${mgr.general?.firstname} ${mgr.general?.lastname}`,
            });
          }
          return;
        }
      }

      // 3) No candidate found — clear selection
      setSelectedManager(null);
    } else {
      setSelectedManager(null);
    }
  }, [selectedDept, employees.data, selectedEmployee]);

  const handleEmployeeSelect = (emp) => {
    if (!emp) {
      setSelectedEmployee(null);
      return;
    }
    setSelectedEmployee({
      id: emp.id,
      label:
        emp.fullname ||
        `${emp.general?.firstname || ''} ${emp.general?.lastname || ''}`.trim(),
      department: emp.department || emp.job?.department || '',
      jobtitle: emp.jobtitle || emp.job?.jobtitle,
    });
    setMessage({ type: '', text: '' });
  };

  const handleDeptSelect = (deptName) => {
    const dept = deptOptions.find((d) => d.name === deptName);
    setSelectedDept(dept);
    setMessage({ type: '', text: '' });
  };

  const handleManagerSelect = (mgr) => {
    if (!mgr) {
      setSelectedManager(null);
      return;
    }
    setSelectedManager({
      id: mgr.id,
      label:
        mgr.fullname ||
        `${mgr.general?.firstname || ''} ${mgr.general?.lastname || ''}`.trim(),
    });
  };

  const handleAssign = async () => {
    if (!selectedEmployee || !selectedDept) {
      setMessage({
        type: 'error',
        text: 'Please select both an employee and a department',
      });
      return;
    }

    // Prevent assigning to same department
    // (Optional check, maybe they just want to change Line Manager? But this page is AssignToDepartment)
    if (selectedEmployee.department === selectedDept.name) {
      // Allow update if just changing line manager?
      // But let's warn for now.
      // setMessage({ type: 'warning', text: 'Employee is already in this department. Line Manager will be updated.' });
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        department: selectedDept.id,
        line_manager: selectedManager ? selectedManager.id : null,
      };

      await axiosPrivate.patch(`/employees/${selectedEmployee.id}/`, payload);

      setMessage({
        type: 'success',
        text: `Successfully assigned ${selectedEmployee.label} to ${selectedDept.name}`,
      });

      // Clear selection
      setSelectedEmployee(null);
      setSelectedDept(null);
      setSelectedManager(null);

      // Allow data to refresh
      if (employees.refresh) employees.refresh();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update department',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Assign to Department
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Move employees to departments and update reporting lines
        </p>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
              : message.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selection Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 p-6 space-y-6 h-fit">
          {/* 1. Select Employee */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-blue-500" size={20} />
              <h2 className="font-semibold text-slate-700 dark:text-slate-200">
                1. Select Employee
              </h2>
            </div>
            <div className="relative z-30">
              <InputField
                maxWidth="w-full"
                icon={true}
                searchMode="api"
                apiEndpoint="/employees/"
                displayKey="fullname"
                onSelect={handleEmployeeSelect}
              />
            </div>
            {selectedEmployee && (
              <div className="mt-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Current Dept:{' '}
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {selectedEmployee.department || 'None'}
                </span>
              </div>
            )}
          </div>

          {/* 2. Select Department */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building className="text-purple-500" size={20} />
              <h2 className="font-semibold text-slate-700 dark:text-slate-200">
                2. Select Target Department
              </h2>
            </div>
            <Dropdown
              options={deptOptions.map((d) => d.name)}
              placeholder="Select Department"
              onChange={handleDeptSelect}
              value={selectedDept?.name}
            />
          </div>

          {/* 3. Line Manager (Auto + Override) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UserCog className="text-amber-500" size={20} />
              <h2 className="font-semibold text-slate-700 dark:text-slate-200">
                3. Line Manager
              </h2>
            </div>
            <div className="relative z-20">
              <p className="text-xs text-slate-500 mb-2">
                Defaults to Department Manager. Search to override.
              </p>
              <InputField
                maxWidth="w-full"
                icon={true}
                searchMode="api"
                apiEndpoint="/employees/"
                displayKey="fullname"
                onSelect={handleManagerSelect}
              />
              {selectedManager ? (
                <div className="mt-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 p-3 rounded text-sm flex items-center gap-2">
                  <CheckCircle
                    size={16}
                    className="text-green-600 dark:text-green-400"
                  />
                  <span className="font-semibold text-green-800 dark:text-green-300">
                    Assigned to: {selectedManager.label}
                  </span>
                </div>
              ) : (
                <div className="mt-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded text-sm italic text-slate-400">
                  No Line Manager assigned (Report directly to Head of Dept or
                  None)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Review Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 p-6 flex flex-col h-full">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-6">
            Review & Confirm
          </h2>

          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
            {!selectedEmployee || !selectedDept ? (
              <div className="text-slate-400 flex flex-col items-center">
                <UserPlus size={48} className="mb-4 opacity-50" />
                <p>Select an employee and department to proceed</p>
              </div>
            ) : (
              <div className="w-full space-y-6">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl">
                  <div className="text-left">
                    <p className="text-xs text-slate-500 uppercase font-bold">
                      Employee
                    </p>
                    <p className="font-semibold text-lg">
                      {selectedEmployee.label}
                    </p>
                  </div>
                  <ArrowRight className="text-slate-400" />
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold">
                      New Department
                    </p>
                    <p className="font-semibold text-lg text-purple-600 dark:text-purple-400">
                      {selectedDept.name}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-left">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    Changes that will apply:
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                    <li>
                      Department will update to <b>{selectedDept.name}</b>
                    </li>
                    <li>
                      Line Manager will be set to:{' '}
                      <b>{selectedManager ? selectedManager.label : 'None'}</b>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleAssign}
                  disabled={loading}
                  className="w-full py-4 bg-slate-800 dark:bg-white text-white dark:text-slate-800 rounded-xl font-bold text-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? <ThreeDots /> : 'Confirm Assignment'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignToDepartment;
