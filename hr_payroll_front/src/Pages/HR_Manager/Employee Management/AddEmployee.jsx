import React, { useState } from 'react';
import useAuth from '../../../Context/AuthContext';
import StepHeader from '../../../Components/forms/StepHeader';
import StepDocument from '../../../Components/forms/StepDocument';
import StepPayroll from '../../../Components/forms/StepPayroll';
import StepJob from '../../../Components/forms/StepJob';
import StepGeneral from '../../../Components/forms/StepGeneral';
import StepReview from '../../../Components/forms/StepReview';
import Modal from '../../../Components/Modal';
import AlertModal from '../../../Components/Modals/AlertModal';
import ThreeDots from '../../../animations/ThreeDots';
import { useTable } from '../../../Context/useTable';
import { useTableContext } from '../../../Context/TableContext';

const AddEmployee = () => {
  const { refreshTableSilently } = useTableContext();

  const [loading, setLoading] = useState(false);
  const { axiosPrivate } = useAuth();
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'error',
    message: '',
  });
  const [formData, setFormData] = useState({
    general: {
      firstname: '',
      lastname: '',
      gender: '',
      dateofbirth: '',
      maritalstatus: '',
      nationality: '',
      personaltaxid: '',
      emailaddress: '',
      socialinsurance: '',
      healthinsurance: '',
      phonenumber: '',
      primaryaddress: '',
      country: '',
      state: '',
      city: '',
      postcode: '',
      emefullname: '',
      emephonenumber: '',
      emestate: '',
      emecity: '',
      emepostcode: '',
    },
    job: {
      employeeid: '',
      serviceyear: '',
      joindate: new Date().toISOString().slice(0, 10),
      jobtitle: '',
      positiontype: '',
      employmenttype: '',
      linemanager: '',
      contractnumber: '',
      contractname: '',
      contracttype: '',
      startDate: '',
      enddate: '',
      workschedule: '',
    },
    payroll: {
      employeestatus: '',
      employmenttype: '',
      jobdate: '',
      lastworkingdate: '',
      salary: '',
      offset: '',
      oneoff: '',
    },
    documents: { files: null },
  });
  const [currentStep, setCurrentStep] = useState(0);

  const steps = ['General', 'Job', 'Payroll', 'Documents', 'Review'];
  const handleDataChange = (section, newData) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...newData },
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
  };
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const goToStep = (index) => setCurrentStep(index);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    const uploadData = new FormData();

    // Helper to only append non-empty, non-undefined values
    const appendIfValid = (key, value) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        value !== 'undefined'
      ) {
        uploadData.append(key, value);
      }
    };

    // General (required)
    appendIfValid('first_name', formData.general.firstname);
    appendIfValid('last_name', formData.general.lastname);
    appendIfValid('gender', formData.general.gender);
    appendIfValid('date_of_birth', formData.general.dateofbirth);
    appendIfValid('marital_status', formData.general.maritalstatus);
    appendIfValid('nationality', formData.general.nationality);
    appendIfValid('personal_tax_id', formData.general.personaltaxid);
    appendIfValid('social_insurance', formData.general.socialinsurance);
    appendIfValid('health_care', formData.general.healthinsurance);
    appendIfValid('phone', formData.general.phonenumber);
    // Email (User email) - send as `user_email` to backend
    appendIfValid('user_email', formData.general.emailaddress);

    // Job - only append if valid (department and line_manager need to be numbers)
    appendIfValid('line_manager', formData.job.linemanager);
    appendIfValid('department', formData.job.department);
    appendIfValid('position', formData.job.positiontype);
    appendIfValid('employment_type', formData.job.employmenttype);
    appendIfValid('job_title', formData.job.jobtitle);
    appendIfValid('join_date', formData.job.joindate);
    appendIfValid('service_years', formData.job.serviceyear);
    appendIfValid('work_schedule', formData.job.workschedule);

    // Payroll
    appendIfValid('status', formData.payroll.employeestatus);
    appendIfValid('last_working_date', formData.payroll.lastworkingdate);
    appendIfValid('offset', formData.payroll.offset);
    appendIfValid('one_off', formData.payroll.oneoff);
    appendIfValid('salary', formData.payroll.salary);

    const docs = formData.documents?.files;

    if (docs) {
      const files = docs instanceof File ? [docs] : Array.from(docs);
      files.forEach((file) => uploadData.append('documents', file));
    }

    try {
      console.log('going');
      const response = await axiosPrivate.post('/employees/', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      refreshTableSilently('users');
      setAlertConfig({
        isOpen: true,
        type: 'success',
        message: 'Employee Created Successfully',
      });

      console.log('done');
      return response.data;
    } catch (error) {
      console.error('Error submitting profile:', error.response?.data || error);
      const errorMessage =
        error.response?.data?.detail ||
        (typeof error.response?.data === 'string' ? error.response.data : '') ||
        (error.response?.data &&
          Object.entries(error.response.data)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')) ||
        'Failed to create employee';

      setAlertConfig({ isOpen: true, type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Decide which step to render
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepGeneral
            data={formData.general}
            onChange={(newData) => handleDataChange('general', newData)}
          />
        );
      case 1:
        return (
          <StepJob
            data={formData.job}
            onChange={(newData) => handleDataChange('job', newData)}
          />
        );
      case 2:
        return (
          <StepPayroll
            data={formData.payroll}
            onChange={(newData) => handleDataChange('payroll', newData)}
          />
        );
      case 3:
        return (
          <StepDocument
            data={formData.documents}
            onChange={(newData) => handleDataChange('documents', newData)}
          />
        );
      case 4:
        return <StepReview data={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col mx-auto p-4 md:p-6 bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-all overflow-hidden">
      {/* Step Header remains at the top */}
      <div className="shrink-0 border-b border-slate-400 dark:border-slate-700 pb-4">
        <StepHeader
          steps={steps}
          currentStep={currentStep}
          onStepClick={goToStep}
        />
      </div>

      {/* Render Step - Now scrollable with your custom scrollbar style */}
      <div className="mt-6 overflow-y-auto flex-1 scrollbar-hidden pr-2">
        {renderStep()}
      </div>

      {/* Footer Navigation - Fixed at bottom */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-400 dark:border-slate-700 shrink-0">
        {currentStep > 0 ? (
          <button
            onClick={prevStep}
            className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded font-bold text-xs uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
          >
            Previous
          </button>
        ) : (
          <div /> // Spacer to keep Next button on the right
        )}

        {currentStep < steps.length - 1 ? (
          <button
            onClick={nextStep}
            className="px-8 py-2 bg-green-600 text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2 bg-emerald-600 text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <ThreeDots /> : 'Submit Record'}
          </button>
        )}
      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        close={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        type={alertConfig.type}
        message={alertConfig.message}
      />
    </div>
    // <div className="w-full h-full flex flex-col mx-auto p-6 bg-white rounded-2xl">
    //   <StepHeader steps={steps} currentStep={currentStep} onStepClick={goToStep} />

    //   <div className="mt-6 hover-bar overflow-y-auto flex-1 ">{renderStep()}</div>

    //   <div className="flex justify-between mt-8">
    //     {currentStep > 0 && (
    //       <button
    //         onClick={prevStep}
    //         className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
    //       >
    //         Previous
    //       </button>
    //     )}

    //     {currentStep < steps.length - 1 ? (
    //       <button
    //         onClick={nextStep}
    //         className="ml-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    //       >
    //         Next
    //       </button>
    //     ) : (
    //       <button
    //         onClick={handleSubmit}
    //         className="ml-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    //       >
    //         {loading ? <ThreeDots /> : "submit"}
    //       </button>
    //     )}
    //   </div>
    // </div>
  );
};

export default AddEmployee;
