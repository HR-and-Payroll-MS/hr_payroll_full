import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../../Context/AuthContext";
import StepHeader from "../../../Components/forms/StepHeader";
import ThreeDots from "../../../animations/ThreeDots";
import Icon from "../../../Components/Icon";
import Header from "../../../Components/Header";
import Modal from "../../../Components/Modal"; // Ensure you have this component

import useData from "../../../Context/DataContextProvider";

const ViewEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosPrivate } = useAuth();
  const { departments } = useData(); // Use Context
  const steps = ["General", "Job", "Payroll", "Documents"];
  const [currentStep, setCurrentStep] = useState(0);
  const [employeeData, setEmployeeData] = useState(null);
  // Remove local departments state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Promotion State
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteDeptId, setPromoteDeptId] = useState("");

  const [editMode, setEditMode] = useState({
    general: false,
    job: false,
    payroll: false,
    documents: false,
  });

  const [documentsToDelete, setDocumentsToDelete] = useState([]);

  // FETCH DEPARTMENTS REMOVED (Handled by Context)

  // Fetch Employee
  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      try {
        const res = await axiosPrivate.get(`/employees/${id}/`);
        setEmployeeData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch employee details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEmployee();
  }, [axiosPrivate, id]);

  // ... (Keep existing handlers)

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
        const payload = { ...employeeData };
        await axiosPrivate.put(`/employees/${id}/`, payload);
        alert("Updated successfully!");
        setEditMode((prev) => ({ ...prev, [section]: false }));
        // Refresh data
        const res = await axiosPrivate.get(`/employees/${id}/`);
        setEmployeeData(res.data);
    } catch (err) {
        console.error(err);
        alert("Failed to update: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  const handleCancel = (section) => {
    setEditMode((prev) => ({ ...prev, [section]: false }));
    window.location.reload(); 
  };

  const handlePromote = async () => {
      if (!promoteDeptId) {
          alert("Please select a department to manage.");
          return;
      }
      try {
          await axiosPrivate.post(`/employees/${id}/promote-manager/`, {
              department_id: promoteDeptId
          });
          alert("Employee promoted to Department Manager successfully!");
          setIsPromoteModalOpen(false);
          const res = await axiosPrivate.get(`/employees/${id}/`);
          setEmployeeData(res.data);
      } catch (err) {
          console.error(err);
          alert("Failed to promote: " + (err.response?.data?.error || err.message));
      }
  };


  const renderFields = (sectionKey, sectionData) => {
    const isEditing = editMode[sectionKey];

    return Object.entries(sectionData).map(([key, value]) => {
      let label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
      if (key === 'linemanager') label = 'Line Manager';
      if (key === 'jobtitle') label = 'Job Title';

      if (key === 'department' && sectionKey === 'job') {
          return (
            <div key={key} className="w-96 flex gap-2 justify-between text-nowrap">
              <p className="flex w-full items-center">
                <span className="min-w-40 text-gray-400">{label}</span>
                {isEditing ? (
                  <select
                    value={value || ""}
                    onChange={(e) => handleInputChange(sectionKey, key, e.target.value)}
                    className="w-full border outline-none border-slate-300 rounded px-3 mt-1 py-1 focus:ring-1 focus:ring-green-500 bg-white"
                  >
                    <option value="">Select Department</option>
                    {departments.data?.map(dept => (
                        <option key={dept.id} value={dept.id}>
                            {dept.name}
                        </option> 
                    ))}
                  </select>
                ) : (
                  <span className="text-gray-700 font-semibold">{value || <span className="text-gray-400 italic">Not provided</span>}</span>
                )}
              </p>
              <span className="text-slate-100">|</span>
            </div>
          );
      }

      return (
        <div key={key} className="w-96 flex gap-2 justify-between text-nowrap">
          <p className="flex w-full items-center">
            <span className="min-w-40 text-gray-400">{label}</span>
            {isEditing ? (
              <input
                type={key.toLowerCase().includes("date") ? "date" : "text"}
                value={value || ""}
                onChange={(e) => handleInputChange(sectionKey, key, e.target.value)}
                className="w-full border outline-none border-slate-300 rounded px-3 mt-1 py-1 focus:ring-1 focus:ring-green-500"
              />
            ) : (
              <span className="text-gray-700 font-semibold">{value || <span className="text-gray-400 italic">Not provided</span>}</span>
            )}
          </p>
          <span className="text-slate-100">|</span>
        </div>
      );
    });
  };

  
  const renderDocuments = () => {
    if (!employeeData?.documents?.files) return null;
    const isEditing = editMode.documents;
    return employeeData.documents.files.map((file, index) => {
      const markedForDelete = documentsToDelete.includes(index);
      return (
        <div key={index} className="flex justify-between items-center gap-2 p-2 border rounded">
          <a href={file.url} target="_blank" rel="noopener noreferrer" className={`text-blue-600 hover:underline ${markedForDelete ? "line-through" : ""}`}>{file.name}</a>
          {isEditing && (
             <button className="text-red-500">Delete</button>
          )}
        </div>
      );
    });
  };

  const renderStepContent = () => {
      if (!employeeData) return null;
      
      const sectionMap = ["general", "job", "payroll", "documents"];
      const sectionKey = sectionMap[currentStep];
      
      if (sectionKey === "documents") {
           return (
             <div className="space-y-4">
               <div className="flex justify-between items-center mb-2">
                 <h2 className="font-semibold text-lg">Documents</h2>
               </div>
               {renderDocuments()}
             </div>
           )
      }

      return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-lg capitalize">{sectionKey} Information</h2>
              {editMode[sectionKey] ? (
                 <div className="flex gap-2">
                    <button onClick={() => handleSave(sectionKey)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Save</button>
                    <button onClick={() => handleCancel(sectionKey)} className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancel</button>
                 </div>
              ) : (
                 <button onClick={() => handleEditToggle(sectionKey)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                    <Icon className='w-4 h-4' name={'Pen'}/> Edit
                 </button>
              )}
            </div>
            <div className="flex gap-5 p-4 justify-start items-start flex-wrap">
               {employeeData[sectionKey] && renderFields(sectionKey, employeeData[sectionKey])}
            </div>
          </div>
      );
  };

  if (loading) return <div className="flex justify-center items-center h-64"><ThreeDots /></div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="flex flex-col w-full h-full justify-start bg-gray-50 dark:bg-slate-900">
        
       {/* Promote Modal */}
       <Modal isOpen={isPromoteModalOpen} onClose={() => setIsPromoteModalOpen(false)} title="Promote to Department Manager">
           <div className="p-4 flex flex-col gap-4">
               <p>Select the department this employee will manage:</p>
               <select 
                  className="border p-2 rounded w-full"
                  value={promoteDeptId}
                  onChange={(e) => setPromoteDeptId(e.target.value)}
                >
                   <option value="">-- Select Department --</option>
                   {departments.data?.map(d => (
                       <option key={d.id} value={d.id}>{d.name}</option>
                   ))}
               </select>
               <div className="flex justify-end gap-2 mt-4">
                   <button onClick={() => setIsPromoteModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                   <button onClick={handlePromote} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirm Promotion</button>
               </div>
           </div>
       </Modal>
        
      <Header Title={"Employee Details"} Breadcrumb={"HR Manager / Employee Management / View"} />
      
      <div className="flex flex-1 gap-5 overflow-y-scroll rounded-md h-full p-4">
        {/* Left Sidebar */}
        <div className="h-fit shadow rounded-xl overflow-clip w-1/4 bg-white">
           <div className="flex flex-col items-center p-6 gap-2">
               <img src={employeeData?.general?.profilepicture || "\\pic\\download (48).png"} className="w-24 h-24 rounded-full object-cover" alt="" />
               <h3 className="font-bold text-lg">{employeeData?.general?.fullname}</h3>
               <p className="text-gray-500">{employeeData?.job?.jobtitle}</p>
               <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{employeeData?.payroll?.employeestatus}</span>
           </div>
           <hr />
           <div className="p-4 flex flex-col gap-3">
               <div className="flex gap-2 items-center text-gray-600 text-sm">
                   <Icon name="Mail" className="w-4 h-4" /> {employeeData?.general?.emailaddress}
               </div>
               <div className="flex gap-2 items-center text-gray-600 text-sm">
                   <Icon name="Phone" className="w-4 h-4" /> {employeeData?.general?.phonenumber}
               </div>
               <div className="flex gap-2 items-center text-gray-600 text-sm">
                   <Icon name="Briefcase" className="w-4 h-4" /> {employeeData?.job?.department}
               </div>
           </div>
           <div className="p-4">
               <button 
                  onClick={() => setIsPromoteModalOpen(true)}
                  className="w-full py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition"
                >
                   Promote to Manager
               </button>
           </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col rounded-md shadow h-full flex-1 gap-4 p-4 bg-white">
          <StepHeader steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
          <div className="flex-1 overflow-y-auto">
              {renderStepContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEmployee;






































































































































// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import useAuth from "../../../Context/AuthContext";
// import Icon from "../../../Components/Icon";
// import ThreeDots from "../../../animations/ThreeDots";

// const ViewEmployee = () => {
//   const { id } = useParams();
//   const { axiosPrivate } = useAuth();

//   const [employeeData, setEmployeeData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [editSection, setEditSection] = useState(null); // track which section is being edited

//   useEffect(() => {
//     const fetchEmployee = async () => {
//       try {
//         // Simulated data
//         const response = {
//           id: 1,
//           general: {
//             fullname: "Eyob Taye",
//             gender: "Male",
//             dateofbirth: "1997-04-15",
//             maritalstatus: "Single",
//             nationality: "Ethiopian",
//             personaltaxid: "TX-9584732",
//             emailaddress: "eyob.taye@example.com",
//             socialinsurance: "SI-558932",
//             healthinsurance: "HI-229584",
//             phonenumber: "+251911223344",
//             primaryaddress: "123 Sunshine Avenue",
//             country: "Ethiopia",
//             state: "Addis Ababa",
//             city: "Addis Ababa",
//             postcode: "1000",
//             emefullname: "Marta Taye",
//             emephonenumber: "+251944556677",
//             emestate: "Addis Ababa",
//             emecity: "Addis Ababa",
//             emepostcode: "1000",
//           },
//           job: {
//             employeeid: "EMP-001",
//             serviceyear: "3",
//             joindate: "2022-03-10",
//             jobtitle: "Frontend Developer",
//             positiontype: "Full-Time",
//             employmenttype: "Permanent",
//             linemanager: "Samuel Bekele",
//             contractnumber: "CN-8942",
//             contractname: "Frontend Developer Contract",
//             contracttype: "Indefinite",
//             startdate: "2022-03-10",
//             enddate: "",
//           },
//           payroll: {
//             employeestatus: "Active",
//             employmenttype: "Permanent",
//             jobdate: "2022-03-10",
//             lastworkingdate: "",
//             salary: 25000,
//             offset: 200,
//             onset: 100,
//           },
//           documents: {
//             files: [
//               {
//                 name: "Employment Contract.pdf",
//                 url: "https://example.com/files/contract.pdf",
//               },
//               {
//                 name: "ID Card.png",
//                 url: "https://example.com/files/idcard.png",
//               },
//             ],
//           },
//         };

//         setEmployeeData(response);
//       } catch (err) {
//         setError("Failed to fetch employee details.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     // if (id) 
//         fetchEmployee();
//   }, [axiosPrivate, id]);

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

//   const { general, job, payroll, documents } = employeeData;

//   // reusable section wrapper
//   const Section = ({ title, sectionKey, children }) => {
//     const isEditing = editSection === sectionKey;

//     return (
//       <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100 relative">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-3">
//           <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
//             <Icon name="User" className="text-green-600 h-4 w-4" />
//             {title}
//           </h3>

//           {isEditing ? (
//             <div className="flex gap-2">
//               <button
//                 onClick={() => handleSave(sectionKey)}
//                 className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
//               >
//                 Save
//               </button>
//               <button
//                 onClick={() => handleCancel(sectionKey)}
//                 className="text-sm px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
//               >
//                 Cancel
//               </button>
//             </div>
//           ) : (
//             <button
//               onClick={() => setEditSection(sectionKey)}
//               className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               Edit
//             </button>
//           )}
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
//           {children(isEditing)}
//         </div>
//       </div>
//     );
//   };

//   const renderItem = (label, value, name, onChange, isEditing) => (
//     <p className="flex flex-col">
//       <span className="font-medium text-gray-800">{label}</span>
//       {isEditing ? (
//         <input type="text" name={name} value={value || ""} onChange={onChange} className="mt-1 border border-gray-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-green-500"/>
//       ) : ( <span>{value || <span className="text-gray-400 italic">Not provided</span>}</span>
//       )}
//     </p>
//   );

//   // handle save + cancel
//   const handleSave = (sectionKey) => {
//     setEditSection(null);
//     console.log("Saved Data:", employeeData[sectionKey]);
//     // later: call API PUT /employees/:id with updated data
//   };

//   const handleCancel = (sectionKey) => {
//     setEditSection(null);
//     // optional: revert changes if using temp state
//   };

//   // handle input change
//   const handleChange = (sectionKey, field, value) => {
//     setEmployeeData((prev) => ({
//       ...prev,
//       [sectionKey]: {
//         ...prev[sectionKey],
//         [field]: value,
//       },
//     }));
//   };

//   return (
//     <div className="w-full h-full flex flex-col mx-auto p-6 bg-gray-50 rounded-2xl overflow-y-auto space-y-5">
//       <h1 className="text-xl font-semibold text-slate-800 mb-4">
//         Employee Details
//       </h1>
//       {/* General Section */}
//       <Section title="General Information" sectionKey="general">
//         {(isEditing) =>
//           Object.entries(general).map(([key, value]) =>
//             renderItem(
//               key.replace(/([A-Z])/g, " $1"),
//               value,
//               key,
//               (e) => handleChange("general", key, e.target.value),
//               isEditing
//             )
//           )
//         }
//       </Section>

//       {/* Job Section */}
//       <Section title="Job Information" sectionKey="job">
//         {(isEditing) =>
//           Object.entries(job).map(([key, value]) =>
//             renderItem(
//               key.replace(/([A-Z])/g, " $1"),
//               value,
//               key,
//               (e) => handleChange("job", key, e.target.value),
//               isEditing
//             )
//           )
//         }
//       </Section>

//       {/* Payroll Section */}
//       <Section title="Payroll Information" sectionKey="payroll">
//         {(isEditing) =>
//           Object.entries(payroll).map(([key, value]) =>
//             renderItem(
//               key.replace(/([A-Z])/g, " $1"),
//               value,
//               key,
//               (e) => handleChange("payroll", key, e.target.value),
//               isEditing
//             )
//           )
//         }
//       </Section>
//       {/* Documents Section */}
//       <Section title="Documents" sectionKey="documents">
//         {(isEditing) =>
//           isEditing ? (
//             <p className="col-span-full text-gray-500 italic">
//               Document editing coming soon...
//             </p>
//           ) : documents?.files?.length > 0 ? (
//             <ul className="col-span-full list-disc ml-5 space-y-1">
//               {documents.files.map((file, index) => (
//                 <li key={index} className="flex items-center gap-2">
//                   <Icon name="FileText" className="text-blue-600 h-4 w-4" />
//                   <a
//                     href={file.url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-blue-600 hover:underline"
//                   >
//                     {file.name || `File ${index + 1}`}
//                   </a>
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <p className="col-span-full text-gray-400 italic">
//               No documents uploaded
//             </p>
//           )
//         }
//       </Section>
//     </div>
//   );
// };

// export default ViewEmployee;