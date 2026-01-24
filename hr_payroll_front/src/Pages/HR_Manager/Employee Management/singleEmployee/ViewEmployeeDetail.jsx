import React, { useEffect, useState } from 'react';
import useAuth from '../../../../Context/AuthContext';
import useData from '../../../../Context/DataContextProvider';
import ThreeDots from '../../../../animations/ThreeDots';
import Icon from '../../../../Components/Icon';
import Header from '../../../../Components/Header';
import StepHeader from '../../../../Components/forms/StepHeader';
import { RenderStepContent } from '../../../../utils/RenderStepContent';
import EmployeeProfile from './EmployeeProfile';
import { useLocation, useParams } from 'react-router-dom';
import { Commet, OrbitProgress } from 'react-loading-indicators';
import { getLocalData } from '../../../../Hooks/useLocalStorage';
const editableByHR = {
  general: true,
  job: true,
  payroll: true,
  documents: true,
};

const editableByPayroll = {
  general: false,
  job: false, // payroll officer cannot edit job
  payroll: true,
  documents: false,
};
const stepIndexMapByRole = {
  manager: [0, 1, 2, 3], // General, Job, Payroll, Documents
  payroll: [1, 2], // Job, Payroll (read-only job)
};

const defaultSteps = ['General', 'Job', 'Payroll', 'Documents'];
function ViewEmployeeDetail() {
  const roleRaw = getLocalData('role') || '';
  const role = roleRaw || 'Employee';
  const normalizedRole = roleRaw
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  const isPayroll = normalizedRole.includes('payroll');
  const roleKey = isPayroll ? 'payroll' : 'manager';
  const activeStep = role;
  useEffect(() => {
    const stepMap = stepIndexMapByRole[roleKey] || stepIndexMapByRole.manager;

    setSteps(stepMap?.map((i) => defaultSteps[i]));

    setUiStep(0);
    setCurrentStep(stepMap[0]);
  }, [roleKey]);

  const { axiosPrivate } = useAuth();
  const { departments, employees } = useData(); // Get shared data

  // Trigger fetch if needed
  useEffect(() => {
    if (departments.get) departments.get();
    if (employees.get) employees.get();
  }, []);

  const [currentStep, setCurrentStep] = useState(0);
  const [uiStep, setUiStep] = useState(0);
  const [employeeData, setEmployeeData] = useState(null);
  const [steps, setSteps] = useState(defaultSteps);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState({
    general: false,
    job: false,
    payroll: false,
    documents: false,
  });
  const employeeId = useParams().id;
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    axiosPrivate
      .get('/attendances/schedules/')
      .then((res) => {
        const data = res.data.results || res.data;
        setSchedules(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error(err));
  }, [axiosPrivate]);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const daattaa = await axiosPrivate.get(`/employees/${employeeId}`);
        console.log(daattaa.data.documents[0]);

        const empData = daattaa.data;
        // Flatten workschedule for display/edit compatibility
        if (empData.job) {
          const wsKey = Object.keys(empData.job).find(
            (k) =>
              k.toLowerCase() === 'workschedule' ||
              k.toLowerCase() === 'work_schedule',
          );
          if (
            wsKey &&
            typeof empData.job[wsKey] === 'object' &&
            empData.job[wsKey] !== null
          ) {
            empData.job.work_schedule =
              empData.job[wsKey].title || empData.job[wsKey].name;
            if (wsKey !== 'work_schedule') delete empData.job[wsKey];
          }
          delete empData.job.workschedule_id; // remove ID field
        }

        setEmployeeData(empData);
        setOriginalData(JSON.parse(JSON.stringify(empData))); // Deep copy for cancel
      } catch (err) {
        console.error(err);
        setError('Failed to fetch employee details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [axiosPrivate, employeeId]);

  const handleDocumentUpdate = (updatedFiles) => {
    setEmployeeData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        files: updatedFiles,
      },
    }));
  };

  const handleEditToggle = (section) => {
    // Block toggling job/general/documents for payroll role
    if (isPayroll && section !== 'payroll') return;
    setEditMode((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (section, field, value) => {
    setEmployeeData((prev) => {
      const newData = {
        ...prev,
        [section]: { ...prev[section], [field]: value },
      };

      // Auto-assign Line Manager if Department changes
      if (section === 'job' && field.toLowerCase().includes('department')) {
        const dept = departments?.data?.find((d) => d.name === value);
        if (dept && dept.manager) {
          const mgr = employees?.data?.find((e) => e.id === dept.manager);
          if (mgr) {
            const mgrName =
              mgr.fullname ||
              `${mgr.general?.firstname} ${mgr.general?.lastname}`;
            // Find the manager key in the job section
            const lmKey =
              Object.keys(prev[section]).find((k) =>
                k.toLowerCase().includes('manager'),
              ) || 'line_manager';
            newData[section][lmKey] = mgrName;
          }
        }
      }

      return newData;
    });
  };
  const handleSave = async (section) => {
    try {
      const payload = { [section]: employeeData[section] };

      // Special handling for job section (read-only for payroll role)
      if (isPayroll && section === 'job') {
        setError('You cannot edit job info.');
        return;
      }
      if (section === 'job') {
        const jobPayload = { ...payload.job };
        if (jobPayload.work_schedule) {
          const sched = schedules.find(
            (s) => s.title === jobPayload.work_schedule,
          );
          if (sched) jobPayload.work_schedule = sched.id;
          else if (jobPayload.work_schedule === '')
            jobPayload.work_schedule = null;
        } else {
          jobPayload.work_schedule = null;
        }
        payload.job = jobPayload;
      }

      // Process standard Save (deletions are now handled immediately)

      // 2. Perform the PATCH update for other sections
      if (section !== 'documents') {
        console.log('Saving section:', section, payload);
        const res = await axiosPrivate.patch(
          `/employees/${employeeId}/`,
          payload,
        );
        console.log('Save response:', res.data);
      } else {
        console.log('Documents section saved (deletions processed if any).');
      }

      // 3. ONLY update originalData and close edit mode on SUCCESS
      const data = {
        ...employeeData,
        [section]: employeeData[section],
      };
      setOriginalData(JSON.parse(JSON.stringify(data)));
      setEditMode((prev) => ({ ...prev, [section]: false }));
    } catch (err) {
      console.error('Save failed:', err);
      // Handle the error (don't close edit mode)
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to save. Try again.';
      setError(msg);
    }
  };

  const handleCancel = (section) => {
    if (!originalData) return;
    setEmployeeData((prev) => ({
      ...prev,
      [section]: originalData[section],
    }));
    setEditMode((prev) => ({ ...prev, [section]: false }));
  };

  if (loading)
    return (
      <div className="flex opacity-50 justify-center items-center h-64">
        {/* <ThreeDots /> */}
        <Commet color="#32cd32" size="medium" textColor="" text="Loading" />
      </div>
    );
  if (error)
    return (
      <div className="p-4 text-center h-full justify-center dark:bg-slate-800 items-center flex flex-col text-red-500 bg-slate-50  rounded-lg">
        <img className="w-2/6" src="/pic/F24.png" />
        {error}
      </div>
    );

  if (!employeeData)
    return (
      <div className="p-4 text-center text-gray-500">
        No employee data available.
      </div>
    );

  return (
    <div className="flex flex-col w-full  h-full justify-start bg-white dark:bg-slate-800 transition-colors duration-300">
      <Header
        className={'px-6'}
        Title={'Employee Detail'}
        Breadcrumb={'Employee detail'}
      />
      <div className="flex flex-1 gap-4 p-2.5 overflow-hidden h-full">
        <div className="w-1/4 h-full bg-gray-50 dark:bg-slate-700 shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 rounded overflow-hidden">
          <EmployeeProfile role={role} employeeData={employeeData} />
        </div>
        <div className="flex flex-col flex-1 gap-4 h-full overflow-hidden">
          <div className="bg-gray-50 dark:bg-slate-700 shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 rounded p-1">
            <StepHeader
              steps={steps}
              currentStep={uiStep}
              onStepClick={(index) => {
                const stepMap = isPayroll
                  ? stepIndexMapByRole.payroll
                  : stepIndexMapByRole.manager;

                setUiStep(index);
                setCurrentStep(stepMap[index]);
              }}
            />
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hidden bg-gray-50 dark:bg-slate-700 shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 rounded p-6">
            <div className="max-w-5xl mx-auto">
              <RenderStepContent
                currentStep={currentStep}
                editable={isPayroll ? editableByPayroll : editableByHR}
                editMode={editMode}
                employeeData={employeeData}
                handleInputChange={handleInputChange}
                handleSave={handleSave}
                handleCancel={handleCancel}
                handleEditToggle={handleEditToggle}
                handleDocumentUpdate={handleDocumentUpdate}
                departmentsData={departments?.data}
                employeesData={employees?.data}
                schedulesData={schedules}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewEmployeeDetail;
