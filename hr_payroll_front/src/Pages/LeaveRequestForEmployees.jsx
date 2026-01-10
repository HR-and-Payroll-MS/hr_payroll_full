import React, { useState } from 'react';
import ViewRequestForEmployees from './ViewRequestForEmployees';
import SendRequestForEmployee from './SendRequestForEmployee';
import StepHeader from '../Components/forms/StepHeader';
import Header from '../Components/Header';
import { AnnouncementSearch, LeaveRequest } from '../Components/Level2Hearder';

function LeaveRequestForEmployees() {
  // const [formData, setFormData] = useState({
  //   general: {
  //     firstname: '',
  //     lastname: '',
  //     gender: '',
  //     dateofbirth: '',
  //     maritalstatus: '',
  //     nationality: '',
  //     personaltaxid: '',
  //     emailaddress: '',
  //     socialinsurance: '',
  //     healthinsurance: '',
  //     phonenumber: '',
  //     primaryaddress: '',
  //     country: '',
  //     state: '',
  //     city: '',
  //     postcode: '',
  //     emefullname: '',
  //     emephonenumber: '',
  //     emestate: '',
  //     emecity: '',
  //     emepostcode: '',
  //   },
  //   job: {
  //     employeeid: '',
  //     serviceyear: '',
  //     joindate: '',
  //     jobtitle: '',
  //     positiontype: '',
  //     employmenttype: '',
  //     linemanager: '',
  //     contractnumber: '',
  //     contractname: '',
  //     contracttype: '',
  //     startDate: '',
  //     enddate: '',
  //   },
  //   payroll: {
  //     employeestatus: '',
  //     employmenttype: '',
  //     jobdate: '',
  //     lastworkingdate: '',
  //     salary: '',
  //     offset: '',
  //     oneoff: '',
  //   },
  //   documents: { files: null },
  // });
  const [currentStep, setCurrentStep] = useState(0);
  const [date, setdate] = useState('all');
  const [status, setstatus] = useState('all');
  const [q, setQ] = useState('');

  const steps = ['View Requests', 'Send Request'];
  // const handleDataChange = (section, newData) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     [section]: { ...prev[section], ...newData },
  //   }));
  // };

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
  };
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const goToStep = (index) => setCurrentStep(index);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <ViewRequestForEmployees date={date} status={status} q={q} />;
      case 1:
        return (
          <SendRequestForEmployee
          // data={formData.job}
          // onChange={(newData) => handleDataChange("job", newData)}
          />
        );
    }
  };
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 px-6 dark:bg-slate-700 bg-slate-50 shadow">
        <Header className={''} Title={'Leave Request Page'} />
      </div>
      <div className="w-full relative flex-1 flex flex-col mx-auto p-4  overflow-y-auto hover-bar ">
        <StepHeader
          style="float  top-0"
          steps={steps}
          currentStep={currentStep}
          onStepClick={goToStep}
        />
        <div className="p-2 flex flex-col flex-1">
          {currentStep === 0 && (
            <LeaveRequest setQ={setQ} setdate={setdate} setstatus={setstatus} />
          )}
          <div className="  dark:border-slate-600 border-slate-200 hover-bar overflow-y-auto flex-1 ">
            {' '}
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeaveRequestForEmployees;
