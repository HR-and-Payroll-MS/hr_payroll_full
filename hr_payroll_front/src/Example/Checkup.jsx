import { useFormattedTableData } from '../utils/useFormattedTableData';
import { flattenObject } from '../utils/flattenObject';
import { SearchStatus } from '../Components/Level2Hearder';
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import ThreeDots from '../animations/ThreeDots';
import Header from '../Components/Header';
import StepHeader from '../Components/forms/StepHeader';
import useAuth from '../Context/AuthContext';
import Icon from '../Components/Icon';
import DocumentList from '../Components/DocumentList';
import { useFileDelete } from '../Hooks/useFileDelete';
import { RenderFields } from '../utils/RenderFields'; 
import AttendNow from './AttendNow';
import { RenderStepContent } from '../utils/RenderStepContent';
import axios from 'axios';


//checkup for the employee detail or view employee page
export const Checkup3 = () => {
  // --- hooks at top
  const { axiosPrivate } = useAuth(); // must supply axiosPrivate configured with baseURL + auth
  const steps = ["General", "Job", "Payroll", "Documents"];
  const [currentStep, setCurrentStep] = useState(0);
  const [employeeData, setEmployeeData] = useState(null);
  const [originalData, setOriginalData] = useState(null); // keep backend snapshot
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState({
    general: false,
    job: false,
    payroll: false,
    documents: false,
  });

  // example id — in your code use useParams()
  const employeeId = 33;

  // fetch employee
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        // replace with axiosPrivate.get(`/api/employees/${employeeId}/`)
        // using stubbed response for demo:
         const response = [
          {
          id: 1,
          general: {
            fullname: "be Beso",
            gender: "e",
            dateofbirth: "7-04-15",
            maritalstatus: "gle",
            nationality: "iopian",
            personaltaxid: "9584732",
            emailaddress: "b.taye@example.com",
            socialinsurance: "558932",
            healthinsurance: "229584",
            phonenumber: "+911223344",
            primaryaddress: " Sunshine Avenue",
            country: "Eopia",
            state: "Ad Ababa",
            city: "Ad Ababa",
            postcode: "0",
            emefullname: "ta Taye",
            emephonenumber: "+254556677",
            emestate: "Ad Ababa",
            emecity: "Ad Ababa",
            emepostcode: "1",
          },
          job: {
            employeeid: "001",
            serviceyear: "3",
            joindate: "203-10",
            jobtitle: "Frnd Developer",
            positiontype: "Fuime",
            employmenttype: "Pnent",
            linemanager: "Sl Bekele",
            contractnumber: "C42",
            contractname: "Frod Developer Contract",
            contracttype: "Indite",
            startdate: "2022-0",
            enddate: "",
          },
          payroll: {
            employeestatus: "Ae",
            employmenttype: "Pnent",
            jobdate: "202-10",
            lastworkingdate: "",
            salary: 25000,
            offset: 200,
            onset: 100,
          },
          documents: {
            files: [
              {
                name: "Empent Contract.pdf",
                url: "https://example.com/files/contract.pdf",
              },
              {
                name: "ID .png",
                url: "https://example.com/files/idcard.png",
              },
            ],
          },
        }
      ];

        // if using axiosPrivate:
        // const { data } = await axiosPrivate.get(`/api/employees/${employeeId}/`);
        // setEmployeeData(data);
        // setOriginalData(data);

        setEmployeeData(response[0]);
        setOriginalData(response[0]);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch employee details.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [axiosPrivate, employeeId]);
  // document updater
  const handleDocumentUpdate = (updatedFiles) => {
    setEmployeeData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        files: updatedFiles,
      },
    }));
  };

  // editing helpers
  const handleEditToggle = (section) => {
    setEditMode((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (section, field, value) => {
    setEmployeeData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  // Save a single section (PATCH full employee endpoint with single-key payload)
  const handleSave = async (section) => {
    try {
      const payload = { [section]: employeeData[section] };
      console.log("Sending payload:", payload);

      // use axiosPrivate in real app
      // const { data } = await axiosPrivate.patch(`/api/employees/${employeeId}/`, payload);

      // Simulate backend echoing updated object:
      const data = {
        ...employeeData,
        [section]: employeeData[section],
      };

      // On success, update both employeeData and originalData
      setEmployeeData(data);
      setOriginalData(data);
      setEditMode((prev) => ({ ...prev, [section]: false }));

      console.log("Saved successfully (simulated):", data);
    } catch (err) {
      console.error("Save failed:", err);
      setError("Failed to save. Try again.");
    }
  };

  // Cancel changes in a section (revert from originalData)
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
      <div className="flex justify-center items-center h-64">
        <ThreeDots />
      </div>
    );
if (error)
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">
        {error}
      </div>
    );

  if (!employeeData)
    return (
      <div className="p-4 text-center text-gray-500">
        No employee data available.
      </div>
    );

  // Left column (profile) - can be customized

 const left = (
  <div id="left" className="flex bg-white w-full flex-col h-full p-2 px-4 gap-4">
    {/* TOP SECTION */}
    <div id="top" className="items-center justify-center flex flex-col flex-2">
      <div className="flex items-center gap-1.5 justify-start p-2 rounded hover:bg-slate-50">
        <img
          className="w-20 h-20 object-fill rounded-full"
          src={employeeData?.general?.profilepicture || "\\pic\\download (48).png"}
          alt="Profile"
        />
      </div>

      <div className="flex flex-col items-center gap-1.5 justify-start p-2 rounded hover:bg-slate-50">
        <p className="font-bold text-gray-700 text-lg">
          {employeeData?.general?.fullname || "Not Provided"}
        </p>
        <p className="font-semibold text-gray-500 text-xs">
          {employeeData?.job?.jobtitle || "Not Provided"}
        </p>
      </div>

      <div className="flex items-center gap-1.5 justify-center p-2 rounded hover:bg-slate-50">
        <p className={`font-bold px-6 py-1 text-xs rounded-md ${
          employeeData?.payroll?.employeestatus === "Active"
            ? "bg-green-50 text-green-800"
            : "bg-red-50 text-red-800"
        }`}>
          {employeeData?.payroll?.employeestatus || "unknown"}
        </p>
      </div>
    </div>

    <hr className="text-gray-200" />

    {/* MIDDLE SECTION */}
    <div id="middle" className="items-start flex flex-col flex-1">
      <div className="flex items-start gap-2 justify-start p-2 rounded hover:bg-slate-50">
        <Icon className='w-4 h-4' name={'Mail'}/>
        <p className="font-semibold text-xs text-gray-700 rounded-md">
          {employeeData?.general?.emailaddress || "No email"}
        </p>
      </div>

      <div className="flex items-start gap-2 justify-start p-2 rounded hover:bg-slate-50">
        <Icon className='w-4 h-4' name={'Phone'}/>
        <p className="font-semibold text-xs text-gray-700 rounded-md">
          {employeeData?.general?.phonenumber || "0972334145"}
        </p>
      </div>

      <div className="flex items-start gap-2 justify-start p-2 rounded hover:bg-slate-50">
        <Icon className='w-4 h-4' name={'MapPinned'}/>
        <p className="font-semibold text-xs text-gray-700 rounded-md">
          {employeeData?.general?.timezone || "GMT+07:00"}
        </p>
      </div>
    </div>

    <hr className="text-gray-200" />

    {/* BOTTOM SECTION */}
    <div id="bottom" className="flex-2">
      <div className="flex items-center gap-1.5 justify-between p-2 rounded hover:bg-slate-50">
        <div>
          <p className="font-semibold text-gray-400 text-xs">Department</p>
          <p className="font-bold text-gray-700 text-xs">
            {employeeData?.job?.department || "Designer"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 justify-between p-2 rounded hover:bg-slate-50">
        <div>
          <p className="font-semibold text-gray-400 text-xs">Office</p>
          <p className="font-bold text-gray-700 text-xs">
            {employeeData?.job?.office || "Unpixel Studio"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 justify-between p-2 rounded hover:bg-slate-50">
        <div>
          <p className="font-semibold text-gray-400 text-xs">Line Manager</p>
          <div className="flex items-center gap-1.5 my-1.5">
           <img
          className="w-6 h-6 object-fill rounded-full"
          src={employeeData?.general?.profilepicture || "\\pic\\download (48).png"}
          alt="Profile"
        />
            <p className="font-bold text-gray-700 text-xs">
              {employeeData?.job?.linemanager || "Skylar Catzoni"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex bg-red-800 text-white items-center justify-center gap-1.5 px-5 py-3 rounded-md">
        <p className="text-xs font-semibold">Delete User</p>
        <Icon className='w-4 h-4' name={'Trash'}/>
      </div>
    </div>
  </div>
);

  return (
    <div className="flex flex-col w-full h-full justify-start bg-gray-50 dark:bg-slate-900">
      <Header Title={"Employee Detail"} Breadcrumb={"Employee detail"} />

      <div className="flex flex-1 gap-5 overflow-y-scroll rounded-md h-full">
        <div className="h-fit shadow rounded-xl overflow-clip w-1/4">{left}</div>

        <div className="flex flex-col rounded-md shadow h-full flex-1 gap-4 p-4 bg-white">
          <StepHeader steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />

          <div className="flex-1 overflow-y-auto">
            <RenderStepContent
              currentStep={currentStep}
              editMode={editMode}
              employeeData={employeeData}
              handleInputChange={handleInputChange}
              handleSave={handleSave}
              handleCancel={handleCancel}
              handleEditToggle={handleEditToggle}
              handleDocumentUpdate={handleDocumentUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkup3;



















const Checkup5 = () => {
   const fileDelete = useFileDelete();
   
  // const { id } = useParams();
  const  id  = 33
  const what = useLocation();
  // console.log(what);
  const { axiosPrivate } = useAuth();
  const steps = ["General", "Job", "Payroll", "Documents"];
  const [currentStep, setCurrentStep] = useState(0);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Track which step is in edit mode
  const [editMode, setEditMode] = useState({
    general: false,
    job: false,
    payroll: false,
    documents: false,
  });
  
  const handleDocumentUpdate = (updatedFiles) => {
  setEmployeeData(prev => ({
    ...prev,
    documents: {
      ...prev.documents,
      files: updatedFiles
    }
  }));
};


  //to Track documents marked for deletion
  const [documentsToDelete, setDocumentsToDelete] = useState([]);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        // const userData= await axiosPrivate.get(`/employees/${id}`)
        // console.log(userData.data)
        const response = [
          {
          id: 1,
          general: {
            fullname: "be Beso",
            gender: "e",
            dateofbirth: "7-04-15",
            maritalstatus: "gle",
            nationality: "iopian",
            personaltaxid: "9584732",
            emailaddress: "b.taye@example.com",
            socialinsurance: "558932",
            healthinsurance: "229584",
            phonenumber: "+911223344",
            primaryaddress: " Sunshine Avenue",
            country: "Eopia",
            state: "Ad Ababa",
            city: "Ad Ababa",
            postcode: "0",
            emefullname: "ta Taye",
            emephonenumber: "+254556677",
            emestate: "Ad Ababa",
            emecity: "Ad Ababa",
            emepostcode: "1",
          },
          job: {
            employeeid: "001",
            serviceyear: "3",
            joindate: "203-10",
            jobtitle: "Frnd Developer",
            positiontype: "Fuime",
            employmenttype: "Pnent",
            linemanager: "Sl Bekele",
            contractnumber: "C42",
            contractname: "Frod Developer Contract",
            contracttype: "Indite",
            startdate: "2022-0",
            enddate: "",
          },
          payroll: {
            employeestatus: "Ae",
            employmenttype: "Pnent",
            jobdate: "202-10",
            lastworkingdate: "",
            salary: 25000,
            offset: 200,
            onset: 100,
          },
          documents: {
            files: [
              {
                name: "Empent Contract.pdf",
                url: "https://example.com/files/contract.pdf",
              },
              {
                name: "ID .png",
                url: "https://example.com/files/idcard.png",
              },
            ],
          },
        }
      ];
        setEmployeeData(response[0]);
      } catch (err) {
        setError("Failed to fetch employee details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEmployee();
  }, [axiosPrivate, id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <ThreeDots />
      </div>
    );

  if (error)
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">
        {error}
      </div>
    );

  if (!employeeData)
    return (
      <div className="p-4 text-center text-gray-500">
        No employee data available.
      </div>
    );

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
    const payload = {
      [section]: employeeData[section],
    };

    const response = await axios.patch(
      `/api/employees/${employeeId}/`,
      payload
    );

    const updatedData = response.data;

    // Update local state with backend result
    setEmployeeData(updatedData);

    // Exit edit mode
    setEditMode((prev) => ({ ...prev, [section]: false }));

    console.log("Updated successfully:", updatedData);
  } catch (error) {
    console.error("Update failed:", error);
  }
};

const handleCancel = (section) => {
  setEmployeeData((prev) => ({
    ...prev,
    [section]: originalData[section],
  }));

  setEditMode((prev) => ({ ...prev, [section]: false }));
};


  // const handleDocumentDelete = (index) => {
  //   setDocumentsToDelete((prev) => [...prev, index]);
  // };

  // const handleDocumentCancelDelete = (index) => {
  //   setDocumentsToDelete((prev) => prev.filter((i) => i !== index));
  // };


  // const renderDocuments = () => {
  //   const isEditing = editMode.documents;
  //   return employeeData.documents.files.map((file, index) => {
  //     const markedForDelete = documentsToDelete.includes(index);
  //     return (
  //       <div key={index} className="flex justify-between items-center gap-2 p-2 border rounded" >
  //         <a href={file.url} target="_blank" rel="noopener noreferrer" className={`text-blue-600 hover:underline ${ markedForDelete ? "line-through" : "" }`}
  //         >
  //           {file.name}
  //         </a>
  //         {isEditing && (
  //           <div className="flex gap-2">
  //             {markedForDelete ? (
  //               <button onClick={() => handleDocumentCancelDelete(index)} className="text-sm px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400" >
  //                 Cancel
  //               </button>
  //             ): (
  //               <button onClick={() => handleDocumentDelete(index)} className="text-sm px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600" >
  //                 <Icon className='w-4 h-4' name={'Trash'}/>
  //               </button>
  //             )}
  //           </div>
  //         )}
  //       </div>
  //     );
  //   });
  // };


 const left = (
  <div id="left" className="flex bg-white w-full flex-col h-full p-2 px-4 gap-4">
    {/* TOP SECTION */}
    <div id="top" className="items-center justify-center flex flex-col flex-2">
      <div className="flex items-center gap-1.5 justify-start p-2 rounded hover:bg-slate-50">
        <img
          className="w-20 h-20 object-fill rounded-full"
          src={employeeData?.general?.profilepicture || "\\pic\\download (48).png"}
          alt="Profile"
        />
      </div>

      <div className="flex flex-col items-center gap-1.5 justify-start p-2 rounded hover:bg-slate-50">
        <p className="font-bold text-gray-700 text-lg">
          {employeeData?.general?.fullname || "Pristia Candra"}
        </p>
        <p className="font-semibold text-gray-500 text-xs">
          {employeeData?.job?.jobtitle || "3D Designer"}
        </p>
      </div>

      <div className="flex items-center gap-1.5 justify-center p-2 rounded hover:bg-slate-50">
        <p className={`font-bold px-6 py-1 text-xs rounded-md ${
          employeeData?.payroll?.employeestatus === "Active"
            ? "bg-green-50 text-green-800"
            : "bg-red-50 text-red-800"
        }`}>
          {employeeData?.payroll?.employeestatus || "Active"}
        </p>
       <Icon className='w-4 h-4' name={'ChevronDown'}/>
      </div>
    </div>

    <hr className="text-gray-200" />

    {/* MIDDLE SECTION */}
    <div id="middle" className="items-start flex flex-col flex-1">
      <div className="flex items-start gap-2 justify-start p-2 rounded hover:bg-slate-50">
        <Icon className='w-4 h-4' name={'Mail'}/>
        <p className="font-semibold text-xs text-gray-700 rounded-md">
          {employeeData?.general?.emailaddress || "Some12email@gmail.com"}
        </p>
      </div>

      <div className="flex items-start gap-2 justify-start p-2 rounded hover:bg-slate-50">
        <Icon className='w-4 h-4' name={'Phone'}/>
        <p className="font-semibold text-xs text-gray-700 rounded-md">
          {employeeData?.general?.phonenumber || "0972334145"}
        </p>
      </div>

      <div className="flex items-start gap-2 justify-start p-2 rounded hover:bg-slate-50">
        <Icon className='w-4 h-4' name={'MapPinned'}/>
        <p className="font-semibold text-xs text-gray-700 rounded-md">
          {employeeData?.general?.timezone || "GMT+07:00"}
        </p>
      </div>
    </div>

    <hr className="text-gray-200" />

    {/* BOTTOM SECTION */}
    <div id="bottom" className="flex-2">
      <div className="flex items-center gap-1.5 justify-between p-2 rounded hover:bg-slate-50">
        <div>
          <p className="font-semibold text-gray-400 text-xs">Department</p>
          <p className="font-bold text-gray-700 text-xs">
            {employeeData?.job?.department || "Designer"}
          </p>
        </div>
        <Icon className='w-4 h-4' name={'ChevronRight'}/>
      </div>

      <div className="flex items-center gap-1.5 justify-between p-2 rounded hover:bg-slate-50">
        <div>
          <p className="font-semibold text-gray-400 text-xs">Office</p>
          <p className="font-bold text-gray-700 text-xs">
            {employeeData?.job?.office || "Unpixel Studio"}
          </p>
        </div>
        <Icon className='w-4 h-4' name={'ChevronRight'}/>
      </div>

      <div className="flex items-center gap-1.5 justify-between p-2 rounded hover:bg-slate-50">
        <div>
          <p className="font-semibold text-gray-400 text-xs">Line Manager</p>
          <div className="flex items-center gap-1.5 my-1.5">
           <img
          className="w-6 h-6 object-fill rounded-full"
          src={employeeData?.general?.profilepicture || "\\pic\\download (48).png"}
          alt="Profile"
        />
            <p className="font-bold text-gray-700 text-xs">
              {employeeData?.job?.linemanager || "Skylar Catzoni"}
            </p>
          </div>
        </div>
        <Icon className='w-4 h-4' name={'ChevronRight'}/>
      </div>

      <div className="flex bg-slate-800 text-white items-center justify-center gap-1.5 px-5 py-3 rounded-md">
        <p className="text-xs font-semibold">Action</p>
        <Icon className='w-4 h-4' name={'Pen'}/>
      </div>
    </div>
  </div>
);


  return (
    <div className="flex  flex-col  w-full h-full justify-start  bg-gray-50 dark:bg-slate-900 ">
                
                            <Header Title={"this is title"} Breadcrumb={"this is breadcrub employee detail"}/>
                
    <div className="flex  flex-1 gap-5 overflow-y-scroll rounded-md h-full">
        <div className="h-fit shadow rounded-xl overflow-clip w-1/4 "> 
                            {left}
        </div>
        <div className="flex  flex-col rounded-md shadow h-full flex-1 gap-4  p-4 bg-white">
            <StepHeader
                steps={steps}
                currentStep={currentStep}
                onStepClick={setCurrentStep}
            />
            <div className=" flex-1  overflow-y-auto"><RenderStepContent handleInputChange={handleInputChange} handleSave={handleSave} handleEditToggle={handleEditToggle} editMode={editMode} employeeData={employeeData} currentStep={currentStep} fileDelete={fileDelete} handleDocumentUpdate={handleDocumentUpdate}/></div>
            {/* <div className=" flex-1  overflow-y-auto">{renderStepContent(handleInputChange,handleSave,handleCancel,handleEditToggle,editMode,employeeData,currentStep)}</div> */}
        </div>
    </div>
    </div>
  );
};

//checkup for the table formatter
function Checkup() {
    const data = [
  {
    "id": "emp_001",
    "profile": {
      "photo": "/pic/download (48).png",
      "full_name": "Sophia Johnson",
      "gender": "Female"
    },
    "contact": {
      "email": "sophia.johnson@example.com",
      "phone": "+1 (555) 321-8472"
    },
    "employment": {
      "status": "Active",
      "department": {
        "name": "Human Resources",
        "location": "Building A"
      },
      "job": {
        "title": "HR Manager",
        "level": "Senior"
      }
    }
  }]
    const data2 = [
  {
    "id": "emp_001",
    "profile": {
      "photo": "/pic/download (48).png",
      "full_name": "Sophia Johnson",
      "gender": "Female"
    },
    "contact": {
      "email": "sophia.johnson@example.com",
      "phone": "+1 (555) 321-8472"
    },
    "employment": {
      "status": "Active",
      "department": {
        "name": "Human Resources",
        "location": "Building A"
      },
      "job": {
        "title": "HR Manager",
        "level": "Senior"
      }
    }
  },
  {
    "id": "emp_002",
    "profile": {
      "photo": "/pic/image.png",
      "full_name": "Liam Martinez",
      "gender": "Male"
    },
    "contact": {
      "email": "liam.martinez@example.com",
      "phone": "+1 (555) 289-6654"
    },
    "employment": {
      "status": "Inactive",
      "department": {
        "name": "Finance",
        "location": "Building B"
      },
      "job": {
        "title": "Financial Analyst",
        "level": "Mid"
      }
    }
  },
  {
    "id": "emp_003",
    "profile": {
      "photo": "/pic/download (48).png",
      "full_name": "Ava Williams",
      "gender": "Female"
    },
    "contact": {
      "email": "ava.williams@example.com",
      "phone": "+1 (555) 741-2938"
    },
    "employment": {
      "status": "Active",
      "department": {
        "name": "Marketing",
        "location": "Building C"
      },
      "job": {
        "title": "Marketing Specialist",
        "level": "Junior"
      }
    }
  },
  {
    "id": "emp_004",
    "profile": {
      "photo": "/pic/image.png",
      "full_name": "Noah Brown",
      "gender": "Male"
    },
    "contact": {
      "email": "noah.brown@example.com",
      "phone": "+1 (555) 482-1190"
    },
    "employment": {
      "status": "On Leave",
      "department": {
        "name": "Engineering",
        "location": "Building D"
      },
      "job": {
        "title": "Software Engineer",
        "level": "Mid"
      }
    }
  },
  {
    "id": "emp_005",
    "profile": {
      "photo": "/pic/download (48).png",
      "full_name": "Isabella Davis",
      "gender": "Female"
    },
    "contact": {
      "email": "isabella.davis@example.com",
      "phone": "+1 (555) 923-4758"
    },
    "employment": {
      "status": "Active",
      "department": {
        "name": "Design",
        "location": "Building E"
      },
      "job": {
        "title": "UI/UX Designer",
        "level": "Mid"
      }
    }
  },
  {
    "id": "emp_006",
    "profile": {
      "photo": "/pic/image.png",
      "full_name": "Ethan Wilson",
      "gender": "Male"
    },
    "contact": {
      "email": "ethan.wilson@example.com",
      "phone": "+1 (555) 657-2022"
    },
    "employment": {
      "status": "Active",
      "department": {
        "name": "Engineering",
        "location": "Building D"
      },
      "job": {
        "title": "Frontend Developer",
        "level": "Mid"
      }
    }
  },
  {
    "id": "emp_007",
    "profile": {
      "photo": "/pic/Robot Thumb Up with Artificial Intelligence.png",
      "full_name": "Mia Anderson",
      "gender": "Female"
    },
    "contact": {
      "email": "mia.anderson@example.com",
      "phone": "+1 (555) 374-9921"
    },
    "employment": {
      "status": "Pending",
      "department": {
        "name": "Support",
        "location": "Building F"
      },
      "job": {
        "title": "Customer Support Specialist",
        "level": "Junior"
      }
    }
  },
  {
    "id": "emp_008",
    "profile": {
      "photo": "/pic/download.png",
      "full_name": "James Thomas",
      "gender": "Male"
    },
    "contact": {
      "email": "james.thomas@example.com",
      "phone": "+1 (555) 813-5679"
    },
    "employment": {
      "status": "Active",
      "department": {
        "name": "Operations",
        "location": "Building G"
      },
      "job": {
        "title": "Operations Coordinator",
        "level": "Mid"
      }
    }
  },
  {
    "id": "emp_009",
    "profile": {
      "photo": "/pic/download (48).png",
      "full_name": "Charlotte Taylor",
      "gender": "Female"
    },
    "contact": {
      "email": "charlotte.taylor@example.com",
      "phone": "+1 (555) 214-3345"
    },
    "employment": {
      "status": "Inactive",
      "department": {
        "name": "Legal",
        "location": "Building H"
      },
      "job": {
        "title": "Legal Advisor",
        "level": "Senior"
      }
    }
  }
]
  const structure = [3,1,1,1,3];
  const ke2 = [
    ["profile_photo","profile_full_name","profile_gender"],
    ["contact_email","contact_phone"],
    ["employment_status"],["employment_department_name"],["employment_department_location","employment_job_title","employment_job_level"],
  ];
  const data3=[{"contact_email": "sophia.johnson@example.com",
                         "contact_phone": "+1 (555) 321-8472",
                         "employment_department_location": "Building A",
                         "employment_department_name": "Human Resources",
                         "employment_job_level": "Senior",
                         "employment_job_title": "HR Manager",
                         "employment_status":"Active",
                         "id": "emp_001",
                         "profile_full_name":"Sophia Johnson",
                         "profile_gender": "Female",
                         "profile_photo": "/pic/download (48).png",}]
  const obj = flattenObject(data[0])
  const fuck = useFormattedTableData([obj],structure,ke2)
  const beach = useFormattedTableData(data3,structure,ke2)
  
console.log("fuck",obj)
console.log("beach",beach)
  return (
    <div>checkup</div>
  )
}
//checkup for the dropdown filter in searchstatus component thing
function Checkup2(){
    const [filters, setFilters] = useState({});
    
    function updateFilter(obj){
        const key = Object.keys(obj)[0];
        const value = obj[key]
        setFilters(prev =>{
            if(value == null || value === "" ){
                const {[key]:removed, ...rest}=prev;
                return rest;
            }
            return {...prev,[key]:value};
        });
    }
    
    
      const queryString = new URLSearchParams(
        Object.entries(filters).filter(([k,v]) => v && v !== "")
      ).toString();
    
      const dynamicURL = queryString ? `/employees/?${queryString}` : "/employees/";
      console.log("Dynamic URL:", dynamicURL);
    
    return <SearchStatus onFiltersChange={updateFilter}/>
}


function Checkup4(){return <AttendNow/>}


export {Checkup ,Checkup2,Checkup5,Checkup4} 