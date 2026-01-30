import React, { useState, useEffect } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Users,
  Building,
  Briefcase,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import useAuth from '../../../Context/AuthContext';
import useData from '../../../Context/DataContextProvider';
import Dropdown from '../../../Components/Dropdown';
import InputField from '../../../Components/InputField';
import ThreeDots from '../../../animations/ThreeDots';

const PromoteEmployee = () => {
  const { axiosPrivate } = useAuth();
  const { employees, departments } = useData();

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [actionType, setActionType] = useState(null); // 'promote' or 'demote' or promote-hr/payroll
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Format employee options for dropdown
  const employeeOptions =
    employees.data?.map((emp) => ({
      id: emp.id,
      label:
        emp.fullname ||
        `${emp.general?.firstname || ''} ${emp.general?.lastname || ''}`.trim(),
      department: emp.department || emp.job?.department,
      jobtitle: emp.jobtitle || emp.job?.jobtitle,
    })) || [];

  // Format department options
  const departmentOptions =
    departments.data?.map((d) => ({
      id: d.id,
      name: d.name,
    })) || [];

  const handleEmployeeSelect = (emp) => {
    if (!emp) {
      setSelectedEmployee(null);
      return;
    }

    // Map API response to local state structure
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

  const handleDepartmentSelect = (deptName) => {
    const dept = departmentOptions.find((d) => d.name === deptName);
    setSelectedDepartment(dept);
  };

  const handlePromote = async () => {
    if (!selectedEmployee) {
      setMessage({
        type: 'error',
        text: 'Please select an employee to promote',
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {};
      if (selectedDepartment) {
        payload.department_id = selectedDepartment.id;
      }

      const response = await axiosPrivate.post(
        `/employees/${selectedEmployee.id}/promote-manager/`,
        payload,
      );

      setMessage({
        type: 'success',
        text: response.data.message || 'Employee promoted successfully!',
      });
      setActionType(null);
      setSelectedEmployee(null);
      setSelectedDepartment(null);

      // Refresh employee data
      if (employees.refresh) employees.refresh();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to promote employee',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemote = async () => {
    if (!selectedEmployee) {
      setMessage({
        type: 'error',
        text: 'Please select an employee to demote',
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axiosPrivate.post(
        `/employees/${selectedEmployee.id}/demote-manager/`,
      );

      setMessage({
        type: 'success',
        text: response.data.message || 'Employee demoted successfully!',
      });
      setActionType(null);
      setSelectedEmployee(null);

      // Refresh employee data
      if (employees.refresh) employees.refresh();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to demote employee',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedEmployee) {
      setMessage({ type: 'error', text: 'Please select an employee first' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let res;
      if (actionType === 'promote') {
        // existing promote-manager endpoint
        const payload = {};
        if (selectedDepartment) payload.department_id = selectedDepartment.id;
        res = await axiosPrivate.post(
          `/employees/${selectedEmployee.id}/promote-manager/`,
          payload,
        );
      } else if (actionType === 'demote') {
        res = await axiosPrivate.post(
          `/employees/${selectedEmployee.id}/demote-manager/`,
        );
      } else if (actionType === 'promote-hr') {
        res = await axiosPrivate.post(
          `/employees/${selectedEmployee.id}/promote-hr/`,
        );
      } else if (actionType === 'promote-payroll') {
        res = await axiosPrivate.post(
          `/employees/${selectedEmployee.id}/promote-payroll/`,
        );
      } else if (
        actionType === 'demote-hr' ||
        actionType === 'demote-payroll'
      ) {
        // Generic demote -> reset to Employee
        res = await axiosPrivate.post(
          `/employees/${selectedEmployee.id}/demote-role/`,
        );
      } else {
        throw new Error('Unknown action');
      }

      setMessage({
        type: 'success',
        text: res.data?.message || 'Action completed successfully',
      });
      setActionType(null);
      setSelectedEmployee(null);
      setSelectedDepartment(null);
      if (employees.refresh) employees.refresh();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Action failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-6 overflow-y-auto hover-bar">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Promote / Demote Employee
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Manage employee positions and department manager assignments
        </p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
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

      {/* Employee Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow  dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="text-green-500" size={24} />
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            Select Employee
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative z-20">
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Search Employee
            </label>
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
            <div className="bg-slate-50 shadow dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 dark:bg-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                Current Details
              </p>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {selectedEmployee.label}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedEmployee.jobtitle || 'No title'} •{' '}
                {selectedEmployee.department || 'No department'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Selection */}
      {selectedEmployee && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="text-blue-500" size={24} />
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              Select Action
            </h2>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setActionType('promote')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
                actionType === 'promote'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'border-slate-200 dark:border-slate-600 hover:border-green-300 dark:hover:border-green-700'
              }`}
            >
              <ArrowUp
                size={24}
                className={
                  actionType === 'promote' ? 'text-green-500' : 'text-slate-400'
                }
              />
              <div className="text-left">
                <p className="font-semibold">Promote to Manager</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assign as Department Manager
                </p>
              </div>
            </button>

            <button
              onClick={() => setActionType('demote')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
                actionType === 'demote'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-600 hover:border-amber-300 dark:hover:border-amber-700'
              }`}
            >
              <ArrowDown
                size={24}
                className={
                  actionType === 'demote' ? 'text-amber-500' : 'text-slate-400'
                }
              />
              <div className="text-left">
                <p className="font-semibold">Demote from Manager</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Remove Department Manager role
                </p>
              </div>
            </button>
            <button
              onClick={() => setActionType('promote-hr')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
                actionType === 'promote-hr'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                  : 'border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <Users
                size={24}
                className={
                  actionType === 'promote-hr'
                    ? 'text-purple-500'
                    : 'text-slate-400'
                }
              />
              <div className="text-left">
                <p className="font-semibold">Promote to HR</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Give HR Manager privileges
                </p>
              </div>
            </button>

            <button
              onClick={() => setActionType('promote-payroll')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
                actionType === 'promote-payroll'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <Briefcase
                size={24}
                className={
                  actionType === 'promote-payroll'
                    ? 'text-indigo-500'
                    : 'text-slate-400'
                }
              />
              <div className="text-left">
                <p className="font-semibold">Promote to Payroll</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Give Payroll Officer privileges
                </p>
              </div>
            </button>

            <button
              onClick={() => setActionType('demote-hr')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
                actionType === 'demote-hr'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  : 'border-slate-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-700'
              }`}
            >
              <XCircle
                size={24}
                className={
                  actionType === 'demote-hr' ? 'text-red-500' : 'text-slate-400'
                }
              />
              <div className="text-left">
                <p className="font-semibold">Remove HR/Payroll Role</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Revoke HR or Payroll privileges (sets to Employee)
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Promotion Details */}
      {actionType === 'promote' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-black/20 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Building className="text-purple-500" size={24} />
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              Promotion Details
            </h2>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Target Department (optional - defaults to current department)
            </label>
            <Dropdown
              options={departmentOptions.map((d) => d.name)}
              placeholder="Select department"
              onChange={handleDepartmentSelect}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-400">
            <p className="font-medium mb-1">This action will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Add "Department Manager" role to the employee's user account
              </li>
              <li>
                Set the employee as the manager of the selected department
              </li>
              <li>
                Update the employee's department if a different one is selected
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Demotion Details */}
      {actionType === 'demote' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-black/20 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Building className="text-amber-500" size={24} />
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              Demotion Details
            </h2>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400">
            <p className="font-medium mb-1">This action will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Remove "Department Manager" role from the employee's user
                account
              </li>
              <li>
                Remove the employee as manager from any departments they manage
              </li>
              <li>The employee will remain in their current department</li>
            </ul>
          </div>
        </div>
      )}

      {/* Action Button */}
      {actionType && (
        <div className="flex justify-end">
          <button
            onClick={handleAction}
            disabled={loading}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition-all flex items-center gap-2 ${
              actionType && actionType.startsWith('promote')
                ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none'
                : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none'
            } disabled:opacity-50`}
          >
            {loading ? (
              <ThreeDots />
            ) : (
              <>
                {actionType && actionType.startsWith('promote') ? (
                  <ArrowUp size={18} />
                ) : (
                  <ArrowDown size={18} />
                )}
                {actionType === 'promote' && 'Promote Employee'}
                {actionType === 'demote' && 'Demote Employee'}
                {actionType === 'promote-hr' && 'Promote to HR'}
                {actionType === 'promote-payroll' && 'Promote to Payroll'}
                {(actionType === 'demote-hr' ||
                  actionType === 'demote-payroll') &&
                  'Remove Roles'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PromoteEmployee;
