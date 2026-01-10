import { useState } from "react";
import DocumentList from "../Components/DocumentList";
import Icon from "../Components/Icon";
import UploadDrawer from "../Example/UploadDrawer";
import AddEmployee from "../Pages/HR_Manager/Employee Management/AddEmployee";
import { RenderFields } from "./RenderFields";
import useAuth from "../Context/AuthContext";

export const RenderStepContent = ({
  style = "", // Removed default border to let the design system handle it
  currentStep,
  editMode,
  employeeData,
  handleInputChange,
  handleSave,
  handleCancel,
  handleEditToggle,
  myDocument = false,
  handleDocumentUpdate,
  editable = { general: true, job: true, payroll: true, documents: true },
  departmentsData,
  employeesData,
  schedulesData
}) => {


  const [uploading, setUploading] = useState(false);
  const { axiosPrivate } = useAuth()
const handleUpload = async ({ files, type, notes, onProgress }) => {
  if (!employeeData?.id) {
    console.error("No employee selected");
    return;
  }

  try {
    const formData = new FormData();

    // Backend fields (adjust names if backend differs)
    formData.append("type", type || "");
    formData.append("notes", notes || "");

    // Normalize files
    const docs =
      files instanceof File
        ? [files]
        : files?.files
        ? Array.from(files.files)
        : Array.isArray(files)
        ? files
        : [];

    if (!docs.length) {
      console.error("No files to upload");
      return;
    }

    docs.forEach((file) => {
      formData.append("documents", file); // backend expects "documents"
    });

    // Debug (FormData can't be console.logged directly)
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    const response = await axiosPrivate.post(
      `/employees/${employeeData.id}/upload-document/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            const percent = Math.round((event.loaded * 100) / event.total);
            onProgress(percent);
          }
        },
      }
    );

    console.log("Upload successful:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error uploading documents:",
      error.response?.data || error.message
    );
    throw error;
  }
};











  
  const isEditable = (section) => editable[section];
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Design System Classes
  const sunkenCardClass = "bg-gray-50 dark:bg-slate-700 shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 rounded-lg p-6 transition-all flex-1 flex-col flex";
  const headerTextClass = "font-bold text-slate-700 dark:text-slate-100 text-lg tracking-tight";
  const saveBtnClass = "px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-all shadow-sm active:scale-95";
  const cancelBtnClass = "px-4 py-1.5 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider rounded-md transition-all active:scale-95";
  const editBtnClass = "p-2 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all shadow-none hover:shadow-sm";

  const renderHeader = (title, section) => (
    <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-600 pb-4">
      <h2 className={headerTextClass}>{title}</h2>
      {isEditable(section) && (
        editMode?.[section] ? (
          <div className="flex gap-2">
            <button onClick={() => handleSave(section)} className={saveBtnClass}>
              Save
            </button>
            <button onClick={() => handleCancel(section)} className={cancelBtnClass}>
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => handleEditToggle(section)} className={editBtnClass}>
            <Icon className="w-4 h-4" name={"Pen"} />
          </button>
        )
      )}
    </div>
  );

  switch (currentStep) {
    case 0:
      return (
        <div className={`${sunkenCardClass} ${style}`}>
          {renderHeader("General Information", "general")}
          <div className="flex gap-5 justify-start items-start flex-wrap">
            <RenderFields
              sectionKey="general"
              sectionData={employeeData?.general}
              handleInputChange={handleInputChange}
              editMode={isEditable("general") ? editMode : {}}
            />
          </div>
        </div>
      );

    case 1:
      return (
        <div className={`${sunkenCardClass} ${style}`}>
          {renderHeader("Job Information", "job")}
          <div className="flex gap-5 justify-start items-start flex-wrap">
            <RenderFields
              sectionKey="job"
              sectionData={employeeData?.job}
              handleInputChange={handleInputChange}
              editMode={isEditable("job") ? editMode : {}}
              departmentsData={departmentsData}
              employeesData={employeesData}
              schedulesData={schedulesData}
            />
          </div>
        </div>
      );

    case 2:
      return (
        <div className={`${sunkenCardClass} ${style}`}>
          {renderHeader("Payroll Information", "payroll")}
          <div className="flex gap-5 justify-start items-start flex-wrap">
            <RenderFields
              sectionKey="payroll"
              sectionData={employeeData?.payroll}
              handleInputChange={handleInputChange}
              editMode={isEditable("payroll") ? editMode : {}}
            />
          </div>
        </div>
      );

    case 3:
      return (
        <div className={`${sunkenCardClass} ${style}`}>
          <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-600 pb-4">
            <h2 className={headerTextClass}>Documents</h2>
            <div className="flex gap-3 items-center">
              {isEditable("documents") && (
                <button onClick={() => handleEditToggle("documents")} className={editBtnClass}>
                  <Icon className="w-4 h-4" name={"Pen"} />
                </button>
              )}

              {myDocument && (
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md shadow-sm text-xs font-bold uppercase tracking-wider bg-green-600 text-white hover:bg-green-700 transition-all active:scale-95"
                >
                  <Icon name={"Plus"} className="h-3 w-3" />
                  Add PDF
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <DocumentList
              files={employeeData?.documents?.files || []}
              isEditing={isEditable("documents") && !!editMode?.documents}
              onChange={handleDocumentUpdate}
            />
          </div>

          <UploadDrawer onUpload={async (payload) => { 
            const newDocs = await handleUpload(payload); 
            if (newDocs) {
              const currentFiles = employeeData?.documents?.files || [];
              const addedFiles = Array.isArray(newDocs) ? newDocs : [newDocs];
              handleDocumentUpdate([...currentFiles, ...addedFiles]);
            }
            setDrawerOpen(false);
          }} uploading={uploading} employee={employeeData} open={drawerOpen} onClose={setDrawerOpen} />
        </div>
      );

    default:
      return null;
  }
};



















































// import { useState } from "react";
// import DocumentList from "../Components/DocumentList";
// import Icon from "../Components/Icon";
// import UploadDrawer from "../Example/UploadDrawer";
// import { RenderFields } from "./renderFields";
// export const RenderStepContent = ({
//   style='border border-slate-300',
//   currentStep,
//   editMode,
//   employeeData,
//   handleInputChange,
//   handleSave,
//   handleCancel,
//   handleEditToggle,
//   myDocument=false,
//   handleDocumentUpdate,
//   editable = {general: true, job: true, payroll: true, documents: true } // new prop: object like { general: true, job: false, payroll: true, documents: true }
// }) => {
//   const isEditable = (section) => editable[section];
//   const [drawerOpen, setDrawerOpen] = useState(false);

//   switch (currentStep) {
//     case 0:
//       return (
//         <div className={` ${style} flex-1 flex-col  rounded bg-white p-4 flex`}>
//           <div className="flex justify-between items-center mb-2 ">
//             <h2 className="font-semibold text-lg">General Information</h2>
//             {isEditable("general") && (editMode?.general ? (
//               <div className="flex gap-2">
//                 <button onClick={() => handleSave("general")} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
//                   Save
//                 </button>
//                 <button onClick={() => handleCancel("general")} className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
//                   Cancel
//                 </button>
//               </div>
//             ) : (
//               <button onClick={() => handleEditToggle("general")} className="px-3 py-1 rounded hover:bg-slate-100">
//                 <Icon className="w-4 h-4" name={"Pen"} />
//               </button>
//             ))}
//           </div>

//           <div className="flex  gap-5 p-2 justify-start items-start flex-wrap">
//             <RenderFields
//               sectionKey="general"
//               sectionData={employeeData?.general}
//               handleInputChange={handleInputChange}
//               editMode={isEditable("general") ? editMode : {}}
//             />
//           </div>
//         </div>
//       );

//     case 1:
//       return (
//         <div className={` ${style} flex-1  rounded bg-white  flex-col p-4 flex`}>
//           <div className="flex justify-between items-center mb-2 ">
//             <h2 className="font-semibold text-lg">Job Information</h2>
//             {isEditable("job") && (editMode?.job ? (
//               <div className="flex gap-2">
//                 <button onClick={() => handleSave("job")} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
//                   Save
//                 </button>
//                 <button onClick={() => handleCancel("job")} className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
//                   Cancel
//                 </button>
//               </div>
//             ) : (
//               <button onClick={() => handleEditToggle("job")} className="px-3 py-1 text-gray-700 rounded hover:bg-slate-100">
//                 <Icon className="w-4 h-4" name={"Pen"} />
//               </button>
//             ))}
//           </div>

//           <div className="flex gap-5 p-2 justify-start items-start flex-wrap">
//             <RenderFields
//               sectionKey="job"
//               sectionData={employeeData?.job}
//               handleInputChange={handleInputChange}
//               editMode={isEditable("job") ? editMode : {}}
//             />
//           </div>
//         </div>
//       );

//     case 2:
//       return (
//         <div className={` ${style} flex-1  rounded bg-white flex-col p-4 flex`}>
//           <div className="flex justify-between items-center mb-2 ">
//             <h2 className="font-semibold text-lg">Payroll Information</h2>
//             {isEditable("payroll") && (editMode?.payroll ? (
//               <div className="flex gap-2">
//                 <button onClick={() => handleSave("payroll")} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
//                   Save
//                 </button>
//                 <button onClick={() => handleCancel("payroll")} className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
//                   Cancel
//                 </button>
//               </div>
//             ) : (
//               <button onClick={() => handleEditToggle("payroll")} className="px-3 py-1 text-gray-700 rounded hover:bg-slate-100">
//                 <Icon className="w-4 h-4" name={"Pen"} />
//               </button>
//             ))}
//           </div>
//           <div className="flex gap-5 p-2 justify-start items-start flex-wrap">
//             <RenderFields
//               sectionKey="payroll"
//               sectionData={employeeData?.payroll}
//               handleInputChange={handleInputChange}
//               editMode={isEditable("payroll") ? editMode : {}}
//             />
//           </div>
//         </div>
//       );
//    case 3:
//   return (
//     <div className={` ${style} flex-1 flex-col p-4 flex rounded bg-white `}>
//       <div className="flex justify-between items-center mb-2 ">
//         <h2 className="font-semibold text-lg">Documents</h2>

//         <div className="flex gap-2 items-center">
//           {/* Edit / Save / Cancel */}
//           {isEditable("documents") &&
//             (editMode?.documents ? (
//               <>
//                 <button
//                   onClick={() => handleSave("documents")}
//                   className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
//                 >
//                   Save
//                 </button>
//                 <button
//                   onClick={() => handleCancel("documents")}
//                   className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
//                 >
//                   Cancel
//                 </button>
//               </>
//             ) : (
//               <button
//                 onClick={() => handleEditToggle("documents")}
//                 className="px-3 py-1 text-gray-700 rounded hover:bg-slate-100"
//               >
//                 <Icon className="w-4 h-4" name={"Pen"} />
//               </button>
//             ))}

//           {/* Add button shown only if myDocument is true */}
//           {myDocument && (
//             <button
//               onClick={() => setDrawerOpen(true)}
//               className="inline-flex items-center gap-2 px-3 py-1 rounded shadow-sm text-sm bg-blue-600 text-white hover:bg-blue-700"
//             >
//               <Icon name={"Plus"} className="h-4 w-4" />
//               Add PDF
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="space-y-2 ">
//         <DocumentList
//           files={employeeData?.documents?.files || []}
//           isEditing={isEditable("documents") && !!editMode?.documents}
//           onChange={handleDocumentUpdate}
//         />
//       </div>

//       {/* Upload Drawer */}
//       <UploadDrawer
//         open={drawerOpen}
//         onClose={setDrawerOpen}
//       />
//     </div>
//   );


//     default:
//       return null;
//   }
// };




























// import DocumentList from "../Components/DocumentList";
// import Icon from "../Components/Icon";
// import { RenderFields } from "./renderFields";

// export const RenderStepContent = ({
//   currentStep,
//   editMode,
//   employeeData,
//   handleInputChange,
//   handleSave,
//   handleCancel,
//   handleEditToggle,
//   handleDocumentUpdate,
// }) => {
//   switch (currentStep) {
//     case 0:
//       return (
//         <div className="flex-1 flex-col p-4 flex">
//           <div className="flex justify-between items-center mb-2 ">
//             <h2 className="font-semibold text-lg">General Information</h2>
//             {editMode?.general ? (
//               <div className="flex gap-2">
//                 <button onClick={() => handleSave("general")} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
//                   Save
//                 </button>
//                 <button onClick={() => handleCancel("general")} className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
//                   Cancel
//                 </button>
//               </div>
//             ) : (
//               <button onClick={() => handleEditToggle("general")} className="px-3 py-1 rounded hover:bg-slate-100">
//                 <Icon className="w-4 h-4" name={"Pen"} />
//               </button>
//             )}
//           </div>

//           <div className="flex flex-1 gap-5 p-4 justify-start items-start flex-wrap">
//             <RenderFields sectionKey="general" sectionData={employeeData?.general} handleInputChange={handleInputChange} editMode={editMode} />
//           </div>
//         </div>
//       );

//     case 1:
//       return (
//         <div className="flex-1 flex-col p-4 flex">
//           <div className="flex justify-between items-center mb-2 ">
//             <h2 className="font-semibold text-lg">Job Information</h2>
//             {editMode?.job ? (
//               <div className="flex gap-2">
//                 <button onClick={() => handleSave("job")} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
//                   Save
//                 </button>
//                 <button onClick={() => handleCancel("job")} className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
//                   Cancel
//                 </button>
//               </div>
//             ) : (
//               <button onClick={() => handleEditToggle("job")} className="px-3 py-1 text-gray-700 rounded hover:bg-slate-100">
//                 <Icon className="w-4 h-4" name={"Pen"} />
//               </button>
//             )}
//           </div>

//           <div className="flex gap-5 p-4 justify-start items-start flex-wrap">
//             <RenderFields handleInputChange={handleInputChange} sectionKey={"job"} sectionData={employeeData?.job} editMode={editMode} />
//           </div>
//         </div>
//       );
// case 2:
//       return (
//         <div className="flex-1 flex-col p-4 flex">
//           <div className="flex justify-between items-center mb-2 ">
//             <h2 className="font-semibold text-lg">Payroll Information</h2>
//             {editMode?.payroll ? (
//               <div className="flex gap-2">
//                 <button onClick={() => handleSave("payroll")} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
//                   Save
//                 </button>
//                 <button onClick={() => handleCancel("payroll")} className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
//                   Cancel
//                 </button>
//               </div>
//             ) : (
//               <button onClick={() => handleEditToggle("payroll")} className="px-3 py-1 text-gray-700 rounded hover:bg-slate-100">
//                 <Icon className="w-4 h-4" name={"Pen"} />
//               </button>
//             )}
//           </div>
//           <div className="flex gap-5 p-4 justify-start items-start flex-wrap">
//             <RenderFields handleInputChange={handleInputChange} sectionKey={"payroll"} sectionData={employeeData?.payroll} editMode={editMode} />
//           </div>
//         </div>
//       );

//     case 3:
//       return (
//         <div className="flex-1 flex-col p-4 flex">
//           <div className="flex justify-between items-center mb-2 ">
//             <h2 className="font-semibold text-lg">Documents</h2>
//             {editMode?.documents ? (
//               <div className="flex gap-2">
//                 <button onClick={() => handleSave("documents")} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
//                   Save
//                 </button>
//                 <button onClick={() => handleCancel("documents")} className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
//                   Cancel
//                 </button>
//               </div>
//             ) : (
//               <button onClick={() => handleEditToggle("documents")} className="px-3 py-1 text-gray-700 rounded hover:bg-slate-100">
//                 <Icon className="w-4 h-4" name={"Pen"} />
//               </button>
//             )}
//           </div>

//           <div className="space-y-2 ">
//             {console.log("documents", employeeData?.documents?.files || [])}
//            <DocumentList 
//   files={employeeData?.documents?.files || []} 
//   isEditing={!!editMode?.documents} 
//   onChange={handleDocumentUpdate} 
// />
// </div>
//         </div>
//       );

//     default:
//       return null;
//   }
// };






















































// import DocumentList from "../Components/DocumentList";
// import Icon from "../Components/Icon";
// import { RenderFields } from "./RenderFields";

//   export const RenderStepContent = ({
//     handleInputChange,
//     handleSave,
//     handleCancel,
//     handleEditToggle,
//     editMode=[],
//     employeeData=[],
//     currentStep,
//     fileDelete,
//     handleDocumentUpdate}) => {
    
//     switch (currentStep) {
//       case 0:
//         return (
//           <div className="flex-1 flex-col p-2 flex">
//                     <div className="flex justify-between items-center mb-2 ">
//                         <h2 className="font-semibold text-lg">General Information</h2>
//                         {editMode?.general ? (
//                             <div className="flex gap-2">
//                                 <button onClick={() => handleSave("general")} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600" >
//                                     Save
//                                 </button>
//                                 <button onClick={() => handleCancel("general")} className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400" >
//                                     Cancel
//                                 </button>
//                             </div>
//                         ) : (
//                                 <button onClick={() => handleEditToggle("general")} className="px-3 py-1  rounded hover:bg-slate-100 hover:cursor-pointer">
//                                     <Icon className='w-4 h-4' name={'Pen'}/>
//                                 </button>
//                         )}
//                     </div>
//                     <div className="flex flex-1 gap-5 p-4 justify-start items-start flex-wrap  ">
//                       {/* {console.log("hi",employeeData?.general, "there",editMode)} */}
//                     <RenderFields  sectionKey="general" sectionData={employeeData?.general} handleInputChange={handleInputChange} editMode={editMode}/>
//                     </div>
//           </div>
//         );
//       case 1:
//         return (
//           <div className="space-y-4">
//             <div className="flex justify-between items-center mb-2 ">
//               <h2 className="font-semibold text-lg">Job Information</h2>
//               {editMode?.job ? (
//                 <div className="flex gap-2">
//                   <button onClick={() => handleSave("job")} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600" >
//                     Save
//                   </button>
//                   <button onClick={() => handleCancel("job")} className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
//                     Cancel
//                   </button>
//                 </div>
//               ) : (<button onClick={() => handleEditToggle("job")} className="px-3 py-1 text-gray-700 rounded hover:bg-slate-100">
//                   <Icon className='w-4 h-4' name={'Pen'}/>
//                 </button>
//               )}
//             </div>
//             <div className="flex gap-5 p-4 justify-start items-start flex-wrap">
//               <RenderFields handleInputChange={handleInputChange} sectionKey={ "job"} sectionData={ employeeData?.job} editMode={editMode}/>
//             </div>
//           </div>
//         );
//       case 2:
//         return (
//           <div className="space-y-4">
//             <div className="flex justify-between items-center mb-2 ">
//               <h2 className="font-semibold text-lg">Payroll Information</h2>
//               {editMode?.payroll ? (
//                 <div className="flex gap-2">
//                   <button onClick={() => handleSave("payroll")} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600" >
//                     Save
//                   </button>
//                   <button onClick={() => handleCancel("payroll")} className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
//                     Cancel
//                   </button>
//                 </div>
//               ) : (
//                 <button onClick={() => handleEditToggle("payroll")} className="px-3 py-1 text-gray-700 rounded hover:bg-slate-100">
//                   <Icon className='w-4 h-4' name={'Pen'}/>
//                 </button>
//               )}
//             </div>
//             <div className="flex gap-5 p-4 justify-start items-start flex-wrap">
//               <RenderFields handleInputChange={handleInputChange} sectionKey={ "payroll"} sectionData={ employeeData?.payroll} editMode={editMode}/>
//             </div>
//           </div>
//         );
//       case 3:
//         return (
//           <div className="space-y-4">
//             <div className="flex justify-between items-center mb-2 ">
//               <h2 className="font-semibold text-lg">Documents</h2>
              
//             </div>
//             {/* <div className="space-y-2">{renderDocuments()}</div> */}
//             <div className="space-y-2"><DocumentList files={employeeData.documents.files} isEditing={editMode} fileDelete={fileDelete} onChange={handleDocumentUpdate} /></div>
//           </div>
//         );
//       default:
//         return null;
//     }
// };