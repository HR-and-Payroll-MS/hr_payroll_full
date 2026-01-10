import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from '../../Context/AuthContext';
import StepHeader from '../../Components/forms/StepHeader';
import { RenderStepContent } from '../../utils/RenderStepContent';
import ThreeDots from '../../animations/ThreeDots';
import ProfileHeader from './ProfileHeader';
import MyPayrollPage from '../HR_Manager/payroll_management/MyPayrollPage';
import { getLocalData } from '../../Hooks/useLocalStorage';
import { useTableContext } from '../../Context/TableContext';
import { useProfile } from '../../Context/ProfileContext';
import MyProfileSkeleton from '../../animations/Skeleton/MyProfileSkeleton';

function MyProfile({ currStep = 0 }) {
  const { state } = useLocation();
  const { position } = state || {};
  
  // 1. Get global profile state and actions
  const { profile, getProfile, refreshProfile, loading: profileLoading } = useProfile();
  const { refreshTableSilently } = useTableContext();
  const { axiosPrivate } = useAuth();

  const employeeId = getLocalData("user_id");
  const steps = ['General', 'Job', 'Payroll', 'Documents'];

  // 2. Local states for editing and form handling
  const [currentStep, setCurrentStep] = useState(position ?? currStep);
  const [employeeData, setEmployeeData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState({
    general: false,
    job: false,
    payroll: false,
    documents: false,
  });

  // 3. Trigger global fetch on mount
  useEffect(() => {
    getProfile();
  }, [getProfile]);

  // 4. Sync global profile to local state when it arrives
  useEffect(() => {
    if (profile) {
      setEmployeeData(profile);
      setOriginalData(profile);
    }
  }, [profile]);

  // 5. Handle step changes from navigation state
  useEffect(() => {
    if (position !== undefined) {
      setCurrentStep(position);
    }
  }, [position]);

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
    setEditMode((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (section, field, value) => {
    setEmployeeData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSave = async (section) => {
    try {
      const dataToSave = {
        ...employeeData,
        [section]: employeeData[section],
      };
      const res = await axiosPrivate.put(`/employees/${employeeId}/`, dataToSave);
      setOriginalData(dataToSave);
      setEditMode((prev) => ({ ...prev, [section]: false }));
      refreshTableSilently('users');
      refreshProfile();
      
      console.log('Saved successfully:', res.data);
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save. Try again.');
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

  // 7. Loading state handling
  if (profileLoading && !employeeData) {
    return <MyProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg m-6">
        {error}
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="p-4 text-center text-gray-500">
        No employee data available.
      </div>
    );
  }

  return (
  <div className="h-full bg-slate-50 dark:bg-slate-900 w-full flex flex-col gap-4 scrollbar-hidden overflow-y-auto ">
    <div className="bg-gray-50 dark:bg-slate-700  rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-colors">
      <ProfileHeader 
        employeeData={employeeData} 
        setEmployeeData={setEmployeeData} 
      />
    </div>

    <div className="flex flex-col flex-1 gap-4">
      <div className="bg-white dark:bg-slate-700 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-colors">
        <StepHeader
          classname="flex justify-start items-center px-6 h-14 gap-6 border-b border-gray-200 dark:border-slate-600 bg-transparent text-sm font-medium"
          notcurrentstyle="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />

        {/* STEP CONTENT WRAPPER */}
        <div className="p-6 shadow">
          <RenderStepContent
            style=''
            myDocument={true}
            currentStep={currentStep}
            editMode={editMode}
            employeeData={employeeData}
            handleInputChange={handleInputChange}
            handleSave={handleSave}
            handleCancel={handleCancel}
            handleEditToggle={handleEditToggle}
            handleDocumentUpdate={handleDocumentUpdate}
            editable={{
              general: true,
              job: false,
              payroll: false,
              documents: true,
            }}
          />
        </div>
      </div>

      {/* PAYROLL SECTION - Conditional Rendering */}
      {currentStep === 2 && (
        <div className="bg-white  dark:bg-slate-700 p-6 border-b border-gray-300 shadow-slate-400 rounded shadow-sm dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-colors">
          <MyPayrollPage
            headerfont="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight"
            background={'bg-transparent'}
          />
        </div>
      )}
    </div>
  </div>
);
}

export default MyProfile;















































// import React, { useEffect, useState } from 'react';
// import { useLocation, useParams } from 'react-router-dom';
// import useAuth from '../../Context/AuthContext';
// import Header from '../../Components/Header';
// import StepHeader from '../../Components/forms/StepHeader';
// import { RenderStepContent } from '../../utils/RenderStepContent';
// import Icon from '../../Components/Icon';
// import ThreeDots from '../../animations/ThreeDots';
// import ProfileHeader from './ProfileHeader';
// import MyPayrollPage from '../HR_Manager/payroll_management/MyPayrollPage';
// import { getLocalData } from '../../Hooks/useLocalStorage';
// import { useTableContext } from '../../Context/TableContext';
// import { useProfile } from '../../Context/ProfileContext';

// function MyProfile({ currStep = 0 }) {
//   const { state } = useLocation();
//   const { position } = state || {};
  
// const { profile } = useProfile();
//   const activeStep = position ?? currStep;
//   const { refreshTableSilently } = useTableContext();
//   const { refreshProfile } = useProfile();
//   const { axiosPrivate } = useAuth(); // must supply axiosPrivate configured with baseURL + auth
//   const steps = ['General', 'Job', 'Payroll', 'Documents'];
//   const [currentStep, setCurrentStep] = useState(activeStep);
//   const [employeeData, setEmployeeData] = useState(profile||[]);
//   const [originalData, setOriginalData] = useState(profile||[]); // keep backend snapshot
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [editMode, setEditMode] = useState({
//     general: false,
//     job: false,
//     payroll: false,
//     documents: false,
//   });
//   // const employeeId = 0;
//     const employeeId = getLocalData("user_id");;
//   useEffect(() => {
//     if (position !== undefined) {
//       setCurrentStep(position);
//     } else {
//       setCurrentStep(0);
//     }
//   }, [position]);

//   // useEffect(() => {
//   //   const fetchEmployee = async () => {
//   //     try {
//   //        const daattaa = await axiosPrivate.get(`/employees/${employeeId}`);
//   //        console.log(daattaa.data);

//   //       setEmployeeData(daattaa.data);
//   //       setOriginalData(daattaa.data);
//   //     } catch (err) {
//   //       console.error(err);
//   //       setError('Failed to fetch employee details.');
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };

//   //   fetchEmployee();
//   // }, [axiosPrivate, employeeId]);

//   const handleDocumentUpdate = (updatedFiles) => {
//     setEmployeeData((prev) => ({
//       ...prev,
//       documents: {
//         ...prev.documents,
//         files: updatedFiles,
//       },
//     }));
//   };

//   const handleEditToggle = (section) => {
//     setEditMode((prev) => ({ ...prev, [section]: !prev[section] }));
//   };

//   const handleInputChange = (section, field, value) => {
//     setEmployeeData((prev) => ({
//       ...prev,
//       [section]: { ...prev[section], [field]: value },
//     }));
//   };
//   const handleSave = async (section) => {
//     try {
//       const payload = { [section]: employeeData[section] };
//       console.log('Sending payload:', payload);
//       const data = {
//         ...employeeData,
//         [section]: employeeData[section],
//       };

//       setEmployeeData(data);
//       setOriginalData(data);
//       setEditMode((prev) => ({ ...prev, [section]: false }));
//       const res = await axiosPrivate.put(`/employees/${employeeId}/`, data);
//       refreshTableSilently('users');
//       refreshProfile();
//       console.log(
//         'Saved successfully (simulated):',
//         data,
//         ' Response:',
//         res.data
//       );



// // const photos = formData.documents?.files;
// // console.log(photos)
// // if (photos) {
// // const photosArray = photos instanceof File ? [photos] : Array.from(photos);
// // photosArray.forEach(photo => {
// // uploadData.append("photo", photo);
// // });
// // }







//     } catch (err) {
//       console.error('Save failed:', err);
//       setError('Failed to save. Try again.');
//     }
//   };

//   const handleCancel = (section) => {
//     if (!originalData) return;
//     setEmployeeData((prev) => ({
//       ...prev,
//       [section]: originalData[section],
//     }));
//     setEditMode((prev) => ({ ...prev, [section]: false }));
//   };

//   if (loading)
//     return (
//       <div className="flex justify-center items-center h-64">
//         <ThreeDots />
//       </div>
//     );
//   if (error)
//     return (
//       <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">
//         {error}
//       </div>
//     );

//   if (!employeeData)
//     return (
//       <div className="p-4 text-center text-gray-500">
//         No employee data available.
//       </div>
//     );

//   return (
//     <div className="flex flex-col w-full h-full justify-start overflow-y-auto scrollbar-hidden bg-slate-50 dark:bg-slate-900">
//       {/* <Header Title={"Employee Detail"} Breadcrumb={"Employee detail"} /> */}

//       {/* <div className="flex flex-col flex-1  overflow-y-scroll rounded-md h-full"> */}
//       <div className="h-fit  rounded-xl">
//         {/* <EmployeeProfile employeeData={employeeData}/> */}
//         {/* <ProfileHeader employeeData={employeeData} setEmployeeData={setEmployeeData} /> */}
      
//  {console.log(employeeData,"employeeData")}
//   <ProfileHeader 
//     employeeData={employeeData} 
//     setEmployeeData={setEmployeeData} 
//   />
//       </div>

//       <div className="flex flex-col rounded-md h-full flex-1 gap-4 ">
//         <StepHeader
//           classname="flex justify-start items-start  px-4 my-2 m-0 *:h-12 min-h-fit max-h-fit  gap-5 border-b border-gray-200 bg-transparent "
//           notcurrentsytle="border-gray-50"
//           steps={steps}
//           currentStep={currentStep}
//           onStepClick={setCurrentStep}
//         />

//         <div className="flex-1 flex  flex-col gap-3.5 pb-1 ">
//           <RenderStepContent
//           style=''
//           myDocument={true}
//             currentStep={currentStep}
//             editMode={editMode}
//             employeeData={employeeData}
//             handleInputChange={handleInputChange}
//             handleSave={handleSave}
//             handleCancel={handleCancel}
//             handleEditToggle={handleEditToggle}
//             handleDocumentUpdate={handleDocumentUpdate}
//             editable={{
//               general: true,
//               job: false,
//               payroll: false,
//               documents: true,
//             }}
//           />
//           {currentStep === 2 && (
//             <MyPayrollPage
//               headerfont="text-xl"
//               background={'   rounded bg-white'}
//             />
//           )}
//         </div>
//         {/* </div> */}
//       </div>
//     </div>
//   );
// }

// export default MyProfile;
