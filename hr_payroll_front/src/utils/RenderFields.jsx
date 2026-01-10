import CustomDatePicker from "../Components/CustomDatePicker";
import CustomTimePicker from "../Components/CustomTimePicker";
import Dropdown from "../Components/Dropdown";
import { formatDateForInput } from "./formatDateForInput";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

{/* <DateTimePicker
  value={value ? dayjs(value) : null}
  onChange={(newValue) => {
    const iso = newValue?.format() || null; // full ISO: "2025-12-21T14:30:00"
    handleInputChange(sectionKey, key, iso);
  }}
/> */}

const deletableFields = ["clockIn", "clockOut"];
const timeFields = ["clockIn", "clockOut","Offset","Onset"];

// const EMPLOYEE_STATUS_OPTIONS = [
//   { label: "Active", value: "Active" },
//   { label: "Inactive", value: "Inactive" },
//   { label: "On Leave", value: "On Leave" },
//   { label: "Terminated", value: "Terminated" },
// ];

const FIELD_DROPDOWN_OPTIONS = {
  payroll: {
    employeestatus: [
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" },
      { label: "On Leave", value: "On Leave" },
      { label: "Terminated", value: "Terminated" },
    ],
  },
  job: {
    employmenttype: [
      { label: "Full-time", value: "Full-time" },
      { label: "Part-time", value: "Part-time" },
      { label: "Contract", value: "Contract" },
      { label: "Intern", value: "Intern" },
    ],
    positiontype: [
      { label: "Permanent", value: "Permanent" },
      { label: "Temporary", value: "Temporary" },
    ],
  },
  general: {
    gender: [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" },
    ],
    maritalstatus: [
      { label: "Single", value: "Single" },
      { label: "Married", value: "Married" },
      { label: "Divorced", value: "Divorced" },
      { label: "Widowed", value: "Widowed" },
    ],
  },
  // Add more sections and fields as needed
};

/** Extract HH:mm from ISO */
const extractTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return "";
  return d.toISOString().slice(11, 16);
};

/** Merge HH:mm back into ISO datetime */
const mergeTimeIntoISO = (originalISO, timeValue) => {
  if (!originalISO || !timeValue) return null;

  const base = new Date(originalISO);
  if (isNaN(base)) return null;

  const [h, m] = timeValue.split(":");
  base.setHours(h, m, 0, 0);

  return base.toISOString();
};

export const RenderFields = ({
  handleInputChange,
  sectionKey,
  sectionData,
  editMode,
  editableFields = null,
  departmentsData,
  employeesData,
  schedulesData,
}) => {




const renderSpecialField = (sectionKey, key, value, handleInputChange) => {
  // Look up if this field has dropdown options
  let options = FIELD_DROPDOWN_OPTIONS[sectionKey]?.[key];

  // Dynamic Options for Department and Line Manager
  const lowerKey = key.toLowerCase();
  
  if (lowerKey.includes('department') && departmentsData) {
      options = departmentsData.map(d => ({ label: d.name, value: d.name }));
  }
  
  // For Line Manager field: Filter by selected department
  if (lowerKey.includes('manager') && sectionKey === 'job') {
      // Get current department from sectionData
      const currentDeptName = sectionData?.department || sectionData?.Department;
      
      if (!currentDeptName) {
          // No department selected - show message
          return (
              <span className="text-sm text-slate-400 italic px-2 py-1">
                  Select a department first
              </span>
          );
      }
      
      // Find the department
      const dept = departmentsData?.find(d => d.name === currentDeptName);
      
      if (dept && employeesData) {
          // Get managers for this department
          const managers = [];
          
          // Check if department has a designated manager
          if (dept.manager) {
              const managerEmployee = employeesData.find(e => e.id === dept.manager);
              if (managerEmployee) {
                  managers.push({
                      id: managerEmployee.id,
                      fullname: managerEmployee.fullname || `${managerEmployee.general?.firstname} ${managerEmployee.general?.lastname}`
                  });
              }
          }
          
          // Also check employees who are Department Managers in this department
          const deptManagers = employeesData.filter(e => 
              (e.department === dept.name || e.job?.department === dept.name) && 
              (e.position === 'Department Manager' || e.job?.jobtitle === 'Department Manager' || e.jobtitle === 'Department Manager')
          ) || [];
          
          deptManagers.forEach(emp => {
              if (!managers.find(m => m.id === emp.id)) {
                  managers.push({
                      id: emp.id,
                      fullname: emp.fullname || `${emp.general?.firstname} ${emp.general?.lastname}`
                  });
              }
          });
          
          if (managers.length === 0) {
              return (
                  <span className="text-sm text-amber-500 italic px-2 py-1">
                      No managers in this department
                  </span>
              );
          }
          
          if (managers.length === 1) {
              // Auto-assigned - show indicator
              return (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded px-3 py-1 text-sm text-green-700 dark:text-green-400">
                      <span>✓</span>
                      <span>{managers[0].fullname}</span>
                      <span className="text-xs text-green-500">(Auto-assigned)</span>
                  </div>
              );
          }
          
          // Multiple managers - show dropdown
          options = managers.map(m => ({ label: m.fullname, value: m.fullname }));
      }
  } else if (lowerKey.includes('manager') && employeesData) {
       // Fallback for non-job sections
       options = employeesData.map(e => ({ 
           label: e.fullname || `${e.general?.firstname} ${e.general?.lastname}`, 
           value: e.fullname || `${e.general?.firstname} ${e.general?.lastname}`
       }));
  }

  // Work Schedule Dropdown
  if (lowerKey.includes('work_schedule') || lowerKey.includes('workschedule')) {
      if (schedulesData) {
          const rawSchedules = schedulesData.results || schedulesData;
          if (Array.isArray(rawSchedules)) {
              options = rawSchedules.map(s => ({ label: s.title, value: s.title }));
          }
      }
  }

  if (options) {
    return (
      <Dropdown
        value={value || ""} padding="p-1"
        onChange={(selectedValue) => handleInputChange(sectionKey, key, selectedValue)}
        options={options.map((opt) => opt.label)} 
      />
    );
  }

  // No special dropdown → let default input render
  return null;
};
















  if (!sectionData) return null;

  const isEditing = !!editMode?.[sectionKey];

  return Object.entries(sectionData).map(([key, value]) => {
    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase());

    const isFieldEditable =
      isEditing && (!editableFields || editableFields.includes(key));

    const normalizedKey = key.toLowerCase();
    const isImageField = normalizedKey.includes("photo") || normalizedKey.includes("picture") || normalizedKey.includes("profilepicture");
    const isTimeField = ["clockin", "clockout", "offset", "onset"].includes(normalizedKey);
    const showDelete = deletableFields.includes(key);

    // Skip Photo and duplicate profilepicture if we already have one rendered
    // But user specifically asked for profilePicture to be an image.
    // If they want to delete it or show image, we show image.
    
    // We'll skip "photo" since "profilepicture" is usually the same.
    if (normalizedKey === "photo") return null;

    return (
  <div key={key} className="w-96 flex gap-2 justify-between text-nowrap">
    <div className="flex w-full items-center"> 
        <span className="min-w-40 dark:text-slate-300 text-gray-400 mr-3">{label}</span>

        {isImageField ? (
          <div className="flex items-center gap-3">
            {value ? (
              <img 
                src={typeof value === 'string' && value.startsWith('http') ? value : `${import.meta.env.VITE_BASE_URL}${value}`} 
                className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-600 shadow-sm object-cover" 
                alt={label} 
              />
            ) : (
              <span className="text-gray-400 dark:text-slate-500 italic text-xs">No image</span>
            )}
            {isFieldEditable && (
               <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tighter bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                 Edit at top
               </span>
            )}
          </div>
        ) : isFieldEditable ? (
          key === "notes" ? (
            <textarea
              rows={3}
              value={value || ""}
              onChange={(e) =>
                handleInputChange(sectionKey, key, e.target.value)
              }
              className="w-full border rounded px-3 py-1 focus:ring-1 focus:ring-green-500"
            />
          ) : (
            <div className="flex w-full items-center">
              {renderSpecialField(sectionKey, key, value, handleInputChange) || (
                key.toLowerCase().includes("date") ? (
                  <CustomDatePicker
                    value={value}
                    onChange={(newValue) => handleInputChange(sectionKey, key, newValue)}
                    className="rounded px-3 py-1 focus:ring-1 outline-0 focus:ring-green-500"
                  />
                ) : isTimeField ? (
                  <CustomTimePicker
                    value={value}
                    onChange={(newValue) => handleInputChange(sectionKey, key, newValue)}
                    className="rounded px-3 py-1 focus:ring-1 outline-0 focus:ring-green-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={value || ""}
                    onChange={(e) => handleInputChange(sectionKey, key, e.target.value)}
                    className="w-full rounded px-3 py-1 focus:ring-1 outline-0 focus:ring-green-500 border border-gray-300"
                  />
                )
              )}

              {showDelete && (
                <button
                  type="button"
                  className="ml-2 text-red-500 px-2 py-1 text-sm border border-red-300 rounded hover:bg-red-100"
                  onClick={() => handleInputChange(sectionKey, key, null)}
                >
                  Delete
                </button>
              )}
            </div>
          )
        ) : (
          <span className="text-green-800 dark:text-green-200 font-semibold">
            {typeof value === 'object' && value !== null && !value.__type ? (
              value.title || value.name || value.fullname || JSON.stringify(value)
            ) : (
              value || (
                <span className="text-gray-400 dark:text-slate-300 italic">Not provided</span>
              )
            )}
          </span>
        )}
      </div>
    <span className="text-slate-100">|</span>
  </div>
);
  });
};








{/*

// (
// <input type={ key.toLowerCase().includes("date") ? "date" : isTimeField ? "time" : "text" }
// value={ key.toLowerCase().includes("date") ? formatDateForInput(value) : isTimeField ? extractTime(value) : value || "" } onChange={(e) => { const newValue = isTimeField ? mergeTimeIntoISO(value, e.target.value) : e.target.value; 
//   handleInputChange(sectionKey, key, newValue); }} className="w-full  rounded px-3 py-1 focus:ring-1 outline-0 focus:ring-green-500" /> )
//                   ------------------------------------------- Date picker___________
//(key.toLowerCase().includes("date") ? (
//   <CustomDatePicker
//     value={value}
//     onChange={(newValue) => handleInputChange(sectionKey, key, newValue)}
//     className="rounded px-3 py-1 focus:ring-1 outline-0 focus:ring-green-500"
//   />
// ) : (
//   <input
//     type={isTimeField ? "time" : "text"}
//     value={isTimeField ? extractTime(value) : value || ""}
//     onChange={(e) => {
//       const newValue = isTimeField
//         ? mergeTimeIntoISO(value, e.target.value)
//         : e.target.value;
//       handleInputChange(sectionKey, key, newValue);
//     }}
//     className="w-full rounded px-3 py-1 focus:ring-1 outline-0 focus:ring-green-500 border border-gray-300"
//   />
// ))

//----------------------- Timepicker too___________
 */}
{/* <input
                  type={
                    key.toLowerCase().includes("date")
                      ? "date"
                      : isTimeField
                      ? "time"
                      : "text"
                  }
                  value={
                    key.toLowerCase().includes("date")
                      ? formatDateForInput(value)
                      : isTimeField
                      ? extractTime(value)
                      : value || ""
                  }
                  onChange={(e) => {
                    const newValue = isTimeField
                      ? mergeTimeIntoISO(value, e.target.value)
                      : e.target.value;

                    handleInputChange(sectionKey, key, newValue);
                  }}
                  className="w-full border rounded px-3 py-1 focus:ring-1 focus:ring-green-500"
                /> */}
//can't handle the date format plus i don't know maybe note is not editable i guess

// import { formatDateForInput } from "./formatDateForInput";

// const deletableFields = ["clockIn", "clockOut"];

// export const RenderFields = ({
//   handleInputChange,
//   sectionKey,
//   sectionData,
//   editMode,
//   editableFields = null, // 👈 OPTIONAL
// }) => {
//   if (!sectionData) return null;

//   const isEditing = !!editMode?.[sectionKey];

//   return Object.entries(sectionData).map(([key, value]) => {
//     const label = key
//       .replace(/([A-Z])/g, " $1")
//       .replace(/^./, (str) => str.toUpperCase());

//     // 👇 CORE LOGIC (does NOT affect other pages)
//     const isFieldEditable =
//       isEditing &&
//       (!editableFields || editableFields.includes(key));

//     const showDelete = deletableFields.includes(key);

//     return (
//       <div key={key} className="w-96 flex gap-2 justify-between text-nowrap">
//         <p className="flex w-full">
//           <span className="min-w-40 text-gray-400 mr-3">{label}</span>

//           {isFieldEditable ? (
//             <>
//               <input
//                 type={
//                   key.toLowerCase().includes("date")
//                     ? "date"
//                     : showDelete
//                     ? "time"
//                     : "text"
//                 }
//                 value={
//                   key.toLowerCase().includes("date")
//                     ? formatDateForInput(value)
//                     : value || ""
//                 }
//                 onChange={(e) =>
//                   handleInputChange(sectionKey, key, e.target.value)
//                 }
//                 className="w-full border outline-none border-slate-300 rounded px-3 mt-1 py-1 focus:ring-1 focus:ring-green-500"
//               />

//               {showDelete && (
//                 <button
//                   type="button"
//                   className="ml-2 text-red-500 px-2 py-1 text-sm border border-red-300 rounded hover:bg-red-100"
//                   onClick={() =>
//                     handleInputChange(sectionKey, key, "")
//                   }
//                 >
//                   Delete
//                 </button>
//               )}
//             </>
//           ) : (
//             <span className="text-gray-700 font-semibold">
//               {value || (
//                 <span className="text-gray-400 italic">
//                   Not provided
//                 </span>
//               )}
//             </span>
//           )}
//         </p>

//         <span className="text-slate-100">|</span>
//       </div>
//     );
//   });
// };
























//every thing is editable in here

// import { formatDateForInput } from "./formatDateForInput"; 
// const deletableFields = ["clockIn","clockOut"];
// export const RenderFields = ({ handleInputChange, sectionKey, sectionData, editMode }) => {
//   if (!sectionData) return null;

//   const isEditing = !!editMode?.[sectionKey];

//   return Object.entries(sectionData).map(([key, value]) => {
//     const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
//     const showDelete = deletableFields.includes(key)
//     return (
//       <div key={key} className="w-96 flex gap-2 justify-between text-nowrap">
//         <p className="flex w-full">
//           <span className="min-w-40 text-gray-400 mr-3">{label}</span>
//           {isEditing ? (
//             <>
//             <input
//               type={key.toLowerCase().includes("date") ? "date" :showDelete?"time":"text"}
//               value={key.toLowerCase().includes("date") ? formatDateForInput(value) : value || ""}
//               onChange={(e) => handleInputChange(sectionKey, key, e.target.value)}
//               className="w-full border outline-none border-slate-300 rounded px-3 mt-1 py-1 focus:ring-1 focus:ring-green-500"
//             />

//             { showDelete && (<button 
//                 type="button"
//                 className="ml-2 text-red-500 px-2 py-1 text-sm border border-red-300 rounded hover:bg-red-100"
//                 onClick={()=>handleInputChange(sectionKey,key,"")}
//               >
//               Delete</button>
//               )
//             }
// </>

//           ) : (
//             <span className="text-gray-700 font-semibold">
//               {value || <span className="text-gray-400 italic">Not provided</span>}
//             </span>
//           )}
//         </p>
//         <span className="text-slate-100">|</span>
//       </div>
//     );
//   });
// };























// import { formatDateForInput } from "./formatDateForInput"; 
// // Render fields dynamically
// export const RenderFields = ({handleInputChange,sectionKey, sectionData, editMode}) => {
//   console.log("section key: ",sectionKey);
//   console.log("edit Mode: ",editMode);
//   console.log("section data: ",sectionData);
//   console.log("handleInputChange : ",handleInputChange);

//   if (!sectionData) return null;

//   const isEditing = editMode[sectionKey];
//   return Object.entries(sectionData).map(([key, value]) => {
//     const label = key
//       .replace(/([A-Z])/g, " $1")
//       .replace(/^./, (str) => str.toUpperCase());

//     return (
//       <div key={key} className="w-96 flex gap-2 justify-between text-nowrap">
//         <p className="flex">
//           <span className="min-w-40 text-gray-400">{label} </span>
//           {isEditing ? (
//             <input
//   type={key.toLowerCase().includes("date") ? "date" : "text"}
//   value={
//     key.toLowerCase().includes("date")
//       ? formatDateForInput(value)
//       : value || ""
//   }
//   onChange={(e) => handleInputChange(sectionKey, key, e.target.value) } className="w-full border outline-none border-slate-300 rounded px-3 mt-1 py-1 focus:ring-1 focus:ring-green-500" />

//           ) : (
//             <span className="text-gray-700 font-semibold">
//               {value || (
//                 <span className="text-gray-400 italic">Not provided</span>
//               )}
//             </span>
//           )}
//         </p>
//         <span className="text-slate-100">|</span>
//       </div>
//     );
//   });
// };
