import React, { useState, useEffect } from "react";
import ThreeDots from "../../../animations/ThreeDots";
import { useParams } from "react-router-dom";
import useAuth from "../../../Context/AuthContext";
import { Clock, Notebook, Edit3, Save, X, Calendar } from "lucide-react";
import useData from "../../../Context/DataContextProvider";
import Icon from "../../../Components/Icon";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const EDITABLE_ATTENDANCE_FIELDS = ["clockIn", "clockOut", "clockInLocation", "clockOutLocation", "notes"];
const DEFAULT_LOCATION = "Onsite";
const ATTENDANCE_FIELD_MAP = {
  clockIn: "clock_in",
  clockOut: "clock_out",
  clockInLocation: "clock_in_location",
  clockOutLocation: "clock_out_location",
  notes: "notes",
};

export default function AttendanceCorrectionPage({ Data, data }) {
  const activeData = Data || data;
  const {employees} = useData()
  const { id } = useParams();
  const { axiosPrivate } = useAuth();
  const [userData, setUserData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [updatedData, setUpdatedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState({ attendance: false });
  const [userDetails, setUserDetails] = useState(null);

  const formatBackendData = (d) => {
    if (!d) return null;
    return {
      employee: { name: d.employee_name || "", pic: d.employee_pic || "" },
      attendance: {
        attendance_id: d.id || d.attendance_id,
        date: d.date || "",
        clockIn: d.clock_in || "",
        clockOut: d.clock_out || "",
        clockInLocation: d.clock_in_location || "",
        clockOutLocation: d.clock_out_location || "",
        paidTime: d.paid_time || "",
        workScheduleHours: d.work_schedule_hours || "",
        status: d.status || "",
        notes: d.notes || "",
      },
    };
  };

  useEffect(() => {
    if (activeData) {
      const formatted = formatBackendData(activeData);
      setUserData(formatted);
      setOriginalData(formatted);
      setLoading(false);
    }
  }, [activeData, id]);

 useEffect(() => {
    if (!userData?.employee?.name) return;

    employees.get().then((data) => {
      if (!data) return;

      const found = data.find(emp =>
        emp.fullname
          ?.toLowerCase()
          .includes(userData.employee.name.toLowerCase())
      );

      setUserDetails(found || null);
    });
  }, [userData, employees]);

  const toggleEdit = () => setEditMode({ attendance: !editMode.attendance });

  const handleInputChange = (sectionKey, field, value) => {
    const processValue = (f, v, target) => {
      const updated = { ...target };
      if (f === "clockIn" && v === null) {
        updated.clockIn = null; updated.clockOut = null;
        updated.clockInLocation = null; updated.clockOutLocation = null;
      } else if (f === "clockOut" && v === null) {
        updated.clockOut = null; updated.clockOutLocation = null;
      } else if ((f === "clockInLocation" || f === "clockOutLocation") && (v === null || v === "")) {
        updated[f] = DEFAULT_LOCATION;
      } else {
        updated[f] = v;
      }
      return updated;
    };

    setUserData(prev => ({ ...prev, [sectionKey]: processValue(field, value, prev[sectionKey]) }));
    setUpdatedData(prev => ({ ...prev, [sectionKey]: processValue(field, value, prev[sectionKey] || {}) }));
  };

  const handleSave = async () => {
    try {
      console.log("Updated Data to Save:", updatedData);
      const payload = {};
      Object.entries(updatedData.attendance || {}).forEach(([k, v]) => {
        if (ATTENDANCE_FIELD_MAP[k]) {
           let val = v === "" ? null : v;
           if (val === "--:--") val = null; // Sanitize placeholder

           // Check if this is a time field and we have a value and a date
           if ((k === 'clockIn' || k === 'clockOut') && val && userData.attendance.date) {
               if (!val.includes('T') && !val.includes(':')) {
                   // Invalid format, skip
               } else if (!val.includes('T')) {
                   val = `${userData.attendance.date}T${val}`;
               }
           }
           payload[ATTENDANCE_FIELD_MAP[k]] = val;
        }
      });
      
      if (Object.keys(payload).length > 0) {
        if (userData.attendance.attendance_id) {
            // Update existing
            console.log("PATCH payload:", payload);  
            await axiosPrivate.patch(`/attendances/${userData.attendance.attendance_id}/`, payload);
        } else {
            // Create new (for absent/future dates being corrected)
            // We need employee ID. stored in userData.employee? No, we need the ID.
            // The original Data prop had employee_id.
            
            // We need to fetch the employee ID from somewhere. 
            // In formatBackendData, we mapped: employee_id: d.id || d.attendance_id... wait.
            // In DepartmentAttendanceDetailView, we sent 'employee_id'.
            // Let's verify formatBackendData usage.
            if (activeData?.employee_id) {
                payload.employee = activeData.employee_id;
                payload.date = userData.attendance.date;
                // Default status if not provided, though backend handles it
                if (!payload.status) payload.status = 'present'; 
                
                console.log("POST payload:", payload);
                const res = await axiosPrivate.post('/attendances/', payload);
                // Update local ID so subsequent saves are PATCH
                if (res.data.id) {
                    userData.attendance.attendance_id = res.data.id;
                }
            } else {
                console.error("Cannot create attendance: missing employee_id");
            }
        }
        setOriginalData(JSON.parse(JSON.stringify(userData))); // Deep copy
      }
      setUpdatedData({}); setEditMode({ attendance: false });
    } catch (err) { console.error("Save failed:", err); }
  };

  const isEdit = editMode?.attendance;
  const att = userData?.attendance;

  useEffect(() => {
    console.log("user details saved ------------", userDetails);
  }, [userDetails]);

  if (loading) return <div className="flex justify-center py-20"><ThreeDots /></div>;

  return (
    <div className="h-full scrollbar-hidden w-full flex flex-col gap-4">
      
      {/* HEADER SECTION - Matches your Dashboard Card Style */}
      <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
         {userDetails?.photo ? <img src={`${BASE_URL}${userDetails?.photo}`} className="w-24 h-24 rounded-full object-cover" /> :             <div className='rounded-full w-24 h-24 bg-slate-800 dark:bg-slate-600 text-slate-100 text-center items-center flex justify-center' >
                  {userDetails?.fullname
                    .split(" ")
                    .map(n => n[0])
                    .slice(0, 2)
                    .join("") || "NA"}
                            
              </div>}  <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{userDetails?.fullname}</h1>
            <h1 className="text-xs capitalize font-semibold text-slate-800 dark:text-slate-100">{userDetails?.employeeid}</h1>
            <h1 className="text-xs flex items-center text-slate-800 dark:text-slate-100">{userDetails?.emailaddress} <Icon className="w-4 h-4 text-slate-500" name={"Dot"}/> {userDetails?.department}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
              <Calendar size={14} /> {att.date} • <span className="font-semibold text-blue-500">{att.status}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isEdit ? (
            <button onClick={toggleEdit} className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 text-white px-5 py-2 rounded text-sm font-medium hover:opacity-90 transition-all">
              <Edit3 size={16} /> Edit
            </button>
          ) : (
            <>
              <button onClick={() => { setUserData(originalData); setEditMode({ attendance: false }); }} className="bg-gray-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-5 py-2 rounded text-sm font-medium transition-all">
                Cancel
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-emerald-700 transition-all shadow-md">
                <Save size={16} /> Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Paid Time", value: att.paidTime, color: "text-blue-500" },
          { label: "Schedule", value: att.workScheduleHours, color: "text-indigo-500" },
          { label: "In Loc", value: att.clockInLocation, color: "text-slate-500 dark:text-slate-300" },
          { label: "Out Loc", value: att.clockOutLocation, color: "text-slate-500 dark:text-slate-300" },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-50 dark:bg-slate-700 p-4 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-colors">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">{stat.label}</p>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value || "—"}</p>
          </div>
        ))}
      </div>

      {/* FORM GRID */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Entry & Exit Cards */}
        {[
          { title: "Clock In", icon: <Clock size={18}/>, timeKey: "clockIn", locKey: "clockInLocation", color: "blue" },
          { title: "Clock Out", icon: <Clock size={18}/>, timeKey: "clockOut", locKey: "clockOutLocation", color: "indigo" }
        ].map((card, i) => {
            // Helper to get safe time value for input
            // If value is "--:--" or null, return ""
            let timeVal = att[card.timeKey];
            if (timeVal === "--:--" || !timeVal) timeVal = "";
            else if (timeVal.includes('T')) {
                // If full ISO, extract HH:mm
                timeVal = timeVal.split('T')[1].substring(0, 5);
            }
            // If HH:mm:ss, take HH:mm
            else if (timeVal.length > 5 && timeVal.includes(':')) {
                timeVal = timeVal.substring(0, 5);
            }
            
            return (
              <div key={i} className="bg-gray-50 dark:bg-slate-700 p-6 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-colors">
                <div className={`flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold border-b dark:border-slate-600 pb-3 mb-4`}>
                  <span className={`text-${card.color}-500`}>{card.icon}</span> {card.title}
                </div>
                <div className="space-y-4 text-slate-700 dark:text-slate-300">
                  <div>
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Time</label>
                    <input type="time" disabled={!isEdit} value={timeVal} onChange={(e) => handleInputChange("attendance", card.timeKey, e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Location</label>
                    <select disabled={!isEdit} value={att[card.locKey] === '-' ? '' : att[card.locKey]} onChange={(e) => handleInputChange("attendance", card.locKey, e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all outline-none">
                      <option value="">Select Location</option>
                      <option value="Onsite">Onsite</option><option value="Remote">Remote</option><option value="Field">Field</option>
                    </select>
                  </div>
                </div>
              </div>
            );
        })}

        {/* Notes Section */}
        <div className="md:col-span-2 bg-gray-50 dark:bg-slate-700 p-6 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-colors">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold border-b dark:border-slate-600 pb-3 mb-4">
            <Notebook size={18} className="text-slate-500" /> Correction Notes
          </div>
          <textarea disabled={!isEdit} value={att.notes} onChange={(e) => handleInputChange("attendance", "notes", e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 rounded px-4 py-2 h-24 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all outline-none resize-none" />
        </div>
      </div>
    </div>
  );
}


















































// import React, { useState, useEffect } from "react";
// import ThreeDots from "../../../animations/ThreeDots";
// import { RenderFields } from "../../../utils/renderFields";
// import { useParams } from "react-router-dom";
// import useAuth from "../../../Context/AuthContext";

// const EDITABLE_ATTENDANCE_FIELDS = [
//   "clockIn",
//   "clockOut",
//   "clockInLocation",
//   "clockOutLocation",
//   "notes",
// ];

// const DEFAULT_LOCATION = "Onsite";


// const ATTENDANCE_FIELD_MAP = {
//   clockIn: "clock_in",
//   clockOut: "clock_out",
//   clockInLocation: "clock_in_location",
//   clockOutLocation: "clock_out_location",
//   notes: "notes",
// };


// export default function AttendanceCorrectionPage({ Data }) {
//   const { id } = useParams();
//   const { axiosPrivate } = useAuth();

//   const [userData, setUserData] = useState(null);
//   const [originalData, setOriginalData] = useState(null);
//   const [updatedData, setUpdatedData] = useState({});
//   const [loading, setLoading] = useState(true);

//   const [editMode, setEditMode] = useState({ attendance: false });

//   const formatBackendData = (d) => {
//     if (!d) return null;

//     return {
//       employee: {
//         name: d.employee_name || "",
//         email: "",
//         pic: "",
//       },
//       attendance: {
//         attendance_id: d.attendance_id,
//         date: d.date || "",
//         clockIn: d.clock_in || "",
//         clockOut: d.clock_out || "",
//         clockInLocation: d.clock_in_location || "",
//         clockOutLocation: d.clock_out_location || "",
//         paidTime: d.paid_time || "",
//         workScheduleHours: d.work_schedule_hours || "",
//         status: d.status || "",
//         notes: d.notes || "",
//       },
//     };
//   };

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const formatted = formatBackendData(Data);
//         setUserData(formatted);
//         setOriginalData(formatted);
//         setUpdatedData({});
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, [Data, id]);

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-40">
//         <ThreeDots />
//       </div>
//     );
//   }

//   if (!userData?.attendance) {
//     return (
//       <div className="text-gray-500 text-center p-4">
//         No Attendance Data Found
//       </div>
//     );
//   }

//   const toggleEdit = () => {
//     setEditMode({ attendance: !editMode.attendance });
//   };

//   const handleInputChange = (sectionKey, field, value) => {
//   setUserData((prev) => {
//     const updatedSection = { ...prev[sectionKey] };

//     // 1️⃣ Deleting CLOCK IN → wipe everything
//     if (field === "clockIn" && value === null) {
//       updatedSection.clockIn = null;
//       updatedSection.clockOut = null;
//       updatedSection.clockInLocation = null;
//       updatedSection.clockOutLocation = null;
//     }

//     // 2️⃣ Deleting CLOCK OUT → wipe clockOut + clockOutLocation
//     else if (field === "clockOut" && value === null) {
//       updatedSection.clockOut = null;
//       updatedSection.clockOutLocation = null;
//     }

//     // 3️⃣ Location cleared → apply default
//     else if (
//       (field === "clockInLocation" || field === "clockOutLocation") &&
//       (value === null || value === "")
//     ) {
//       updatedSection[field] = DEFAULT_LOCATION;
//     }

//     // Normal update
//     else {
//       updatedSection[field] = value;
//     }

//     return {
//       ...prev,
//       [sectionKey]: updatedSection,
//     };
//   });

//   // 🔁 Mirror same logic for updatedData
//   setUpdatedData((prev) => {
//     const updatedSection = { ...(prev[sectionKey] || {}) };

//     if (field === "clockIn" && value === null) {
//       updatedSection.clockIn = null;
//       updatedSection.clockOut = null;
//       updatedSection.clockInLocation = null;
//       updatedSection.clockOutLocation = null;
//     } else if (field === "clockOut" && value === null) {
//       updatedSection.clockOut = null;
//       updatedSection.clockOutLocation = null;
//     } else if (
//       (field === "clockInLocation" || field === "clockOutLocation") &&
//       (value === null || value === "")
//     ) {
//       updatedSection[field] = DEFAULT_LOCATION;
//     } else {
//       updatedSection[field] = value;
//     }

//     return {
//       ...prev,
//       [sectionKey]: updatedSection,
//     };
//   });
// };

//   // const handleInputChange = (sectionKey, field, value) => {
//   //   setUserData((prev) => ({
//   //     ...prev,
//   //     [sectionKey]: {
//   //       ...prev[sectionKey],
//   //       [field]: value === "" ? null : value,
//   //     },
//   //   }));

//   //   setUpdatedData((prev) => ({
//   //     ...prev,
//   //     [sectionKey]: {
//   //       ...prev[sectionKey],
//   //       [field]: value === "" ? null : value,
//   //     },
//   //   }));
//   // };

//   const handleSave = async () => {
//   try {
//     const payload = {};

//     Object.entries(updatedData.attendance || {}).forEach(
//       ([frontendKey, value]) => {
//         const backendKey = ATTENDANCE_FIELD_MAP[frontendKey];

//         if (backendKey !== undefined) {
//           payload[backendKey] = value;
//         }
//       }
//     );

//     console.log("PATCH payload (backend format):", payload);

//     if (Object.keys(payload).length === 0) {
//       console.log("No changes to save");
//       setEditMode({ attendance: false });
//       return;
//     }

//     await axiosPrivate.patch(
//       `/attendances/${userData.attendance.attendance_id}/`,
//       payload
//     );

//     setOriginalData(userData);
//     setUpdatedData({});
//     setEditMode({ attendance: false });
//   } catch (err) {
//     console.error("Save failed:", err);
//   }
// };


//   // const handleSave = async () => {
//   //   try {
//   //     const payload = {};

//   //     EDITABLE_ATTENDANCE_FIELDS.forEach((field) => {
//   //       if (updatedData.attendance?.hasOwnProperty(field)) {
//   //         payload[field] = updatedData.attendance[field];
//   //       }
//   //     });

//   //     console.log("PATCH payload:", payload);

//   //     await axiosPrivate.patch(
//   //       `/attendances/${userData.attendance.attendance_id}/`,
//   //       payload
//   //     );

//   //     setOriginalData(userData);
//   //     setUpdatedData({});
//   //     setEditMode({ attendance: false });
//   //   } catch (err) {
//   //     console.error("Save failed:", err);
//   //   }
//   // };

//   const handleCancel = () => {
//     setUserData(originalData);
//     setUpdatedData({});
//     setEditMode({ attendance: false });
//   };

//   return (
//     <div className="bg-white rounded-md w-full p-4 flex flex-col gap-6">
//       <div className="flex flex-col items-center gap-2">
//         <img
//           className="w-20 h-20 rounded-full object-cover"
//           src={userData.employee.pic || "/avatar.png"}
//           alt="Profile"
//         />
//         <p className="font-bold text-gray-700 text-lg">
//           {userData.employee.name}
//         </p>
//       </div>

//       <hr />

//       <div className="flex justify-between items-center">
//         <h2 className="font-bold text-gray-700 text-md">
//           Attendance Details
//         </h2>

//         {!editMode.attendance ? (
//           <button
//             onClick={toggleEdit}
//             className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm"
//           >
//             Edit
//           </button>
//         ) : (
//           <div className="flex gap-2">
//             <button
//               onClick={handleSave}
//               className="bg-green-600 text-white px-4 py-1 rounded-md text-sm"
//             >
//               Save
//             </button>
//             <button
//               onClick={handleCancel}
//               className="bg-gray-300 text-gray-700 px-4 py-1 rounded-md text-sm"
//             >
//               Cancel
//             </button>
//           </div>
//         )}
//       </div>

//       <RenderFields
//         sectionKey="attendance"
//         sectionData={userData.attendance}
//         handleInputChange={handleInputChange}
//         editMode={editMode}
//         editableFields={EDITABLE_ATTENDANCE_FIELDS}
//       />
//     </div>
//   );
// }






































// import React, { useState, useEffect } from "react";
// import ThreeDots from "../../../animations/ThreeDots";
// import { RenderFields } from "../../../utils/renderFields";
// import { useParams } from "react-router-dom";
// import useAuth from "../../../Context/AuthContext";

// const EDITABLE_ATTENDANCE_FIELDS = [
//   "clockIn",
//   "clockOut",
//   "clockInLocation",
//   "clockOutLocation",
// ];

// export default function AttendanceCorrectionPage({ Data }) {
//   const { id } = useParams();
//   const { axiosPrivate } = useAuth();

//   const [userData, setUserData] = useState(null);
//   const [originalData, setOriginalData] = useState(null);
//   const [updatedData, setUpdatedData] = useState({});
//   const [loading, setLoading] = useState(true);

//   const [editMode, setEditMode] = useState({
//     attendance: false,
//   });

//   // ---------------- FORMAT BACKEND DATA ----------------
//   const formatBackendData = (d) => {
//     if (!d) return null;

//     return {
//       employee: {
//         name: d.employee_name || "",
//         email: "",
//         pic: "",
//       },
//       attendance: {
//         attendance_id: d.attendance_id,
//         date: d.date || "",
//         clockIn: d.clock_in || "",
//         clockOut: d.clock_out || "",
//         clockInLocation: d.clock_in_location || "",
//         clockOutLocation: d.clock_out_location || "",
//         paidTime: d.paid_time || "",
//         workScheduleHours: d.work_schedule_hours || "",
//         status: d.status || "",
//         notes: d.notes || "",
//       },
//     };
//   };

//   // ---------------- LOAD DATA ----------------
//   useEffect(() => {
//     const load = async () => {
//       try {
//         console.log("Initial Data:", Data);
//         const formatted = formatBackendData(Data);
//         setUserData(formatted);
//         setOriginalData(formatted);
//         setUpdatedData({});
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     load();
//   }, [Data, id]);

//   // ---------------- LOADING ----------------
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-40">
//         <ThreeDots />
//       </div>
//     );
//   }

//   if (!userData?.attendance) {
//     return (
//       <div className="text-gray-500 text-center p-4">
//         No Attendance Data Found
//       </div>
//     );
//   }

//   // ---------------- EDIT TOGGLE ----------------
//   const toggleEdit = () => {
//     setEditMode({ attendance: !editMode.attendance });
//   };

//   // ---------------- INPUT CHANGE ----------------
//   const handleInputChange = (sectionKey, field, value) => {
//     setUserData((prev) => ({
//       ...prev,
//       [sectionKey]: {
//         ...prev[sectionKey],
//         [field]: value === "" ? null : value,
//       },
//     }));

//     setUpdatedData((prev) => ({
//       ...prev,
//       [sectionKey]: {
//         ...prev[sectionKey],
//         [field]: value === "" ? null : value,
//       },
//     }));
//   };

//   // ---------------- SAVE ----------------
//   const handleSave = async () => {
//     try {
//       const payload = {};

//       EDITABLE_ATTENDANCE_FIELDS.forEach((field) => {
//         if (updatedData.attendance?.hasOwnProperty(field)) {
//           payload[field] = updatedData.attendance[field];
//         }
//       });

//       console.log("Payload:", payload);

//       await axiosPrivate.patch(
//         `/attendances/${userData.attendance.attendance_id}/`,
//         payload
//       );

//       setOriginalData(userData);
//       setUpdatedData({});
//       setEditMode({ attendance: false });
//     } catch (err) {
//       console.error("Save failed:", err);
//     }
//   };

//   // ---------------- CANCEL ----------------
//   const handleCancel = () => {
//     setUserData(originalData);
//     setUpdatedData({});
//     setEditMode({ attendance: false });
//   };

//   // ---------------- RENDER ----------------
//   return (
//     <div className="bg-white rounded-md w-full p-4 flex flex-col gap-6">
//       {/* Employee */}
//       <div className="flex flex-col items-center gap-2">
//         <img
//           className="w-20 h-20 rounded-full object-cover"
//           src={userData.employee.pic || "/avatar.png"}
//           alt="Profile"
//         />
//         <p className="font-bold text-gray-700 text-lg">
//           {userData.employee.name}
//         </p>
//       </div>

//       <hr />

//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <h2 className="font-bold text-gray-700 text-md">
//           Attendance Details
//         </h2>

//         {!editMode.attendance ? (
//           <button
//             onClick={toggleEdit}
//             className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm"
//           >
//             Edit
//           </button>
//         ) : (
//           <div className="flex gap-2">
//             <button
//               onClick={handleSave}
//               className="bg-green-600 text-white px-4 py-1 rounded-md text-sm"
//             >
//               Save
//             </button>
//             <button
//               onClick={handleCancel}
//               className="bg-gray-300 text-gray-700 px-4 py-1 rounded-md text-sm"
//             >
//               Cancel
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Fields */}
//       <RenderFields
//         sectionKey="attendance"
//         sectionData={userData.attendance}
//         handleInputChange={handleInputChange}
//         editMode={editMode}
//         editableFields={EDITABLE_ATTENDANCE_FIELDS}
//       />
//     </div>
//   );
// }

















// import React, { useState, useEffect } from "react";
// import ThreeDots from "../../../animations/ThreeDots";
// import { RenderFields } from "../../../utils/renderFields";
// import { useParams } from "react-router-dom";
// import useAuth from "../../../Context/AuthContext";

// export default function AttendanceCorrectionPage({ Data }) {
//   const { id } = useParams();
//   const { axiosPrivate } = useAuth();

//   const [userData, setUserData] = useState(null);
//   const [originalData, setOriginalData] = useState(null);
//   const [updatedData, setUpdatedData] = useState({});
//   const [loading, setLoading] = useState(true);

//   const [editMode, setEditMode] = useState({
//     attendance: false,
//   });

//   // ------------------- FORMAT BACKEND DATA -------------------
//   const formatBackendData = (d) => {
//     if (!d) return null;

//     return {
//       employee: {
//         name: d.employee_name || "",
//         email: "",        // backend does not provide it
//         pic: "",          // backend does not provide it
//       },
//       attendance: {
//         attendance_id: d.attendance_id,
//         date: d.date || "",
//         clockIn: d.clock_in || "",
//         clockOut: d.clock_out || "",
//         clockInLocation: d.clock_in_location || "",
//         clockOutLocation: d.clock_out_location || "",
//         paidTime: d.paid_time || "",
//         workScheduleHours: d.work_schedule_hours || "",
//         status: d.status || "",
//         notes: d.notes || "",
//       },
//     };
//   };

//   // ------------------- LOAD DATA -------------------
//   useEffect(() => {
//     const load = async () => {
//       try {
//         // If Data is already passed from parent
//         const formatted = formatBackendData(Data);

//         setUserData(formatted);
//         setOriginalData(formatted);
//         setUpdatedData({});
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     load();
//   }, [Data, id]);

//   // ------------------- LOADING -------------------
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-40">
//         <ThreeDots />
//       </div>
//     );
//   }

//   if (!userData || !userData.employee || !userData.attendance) {
//     return (
//       <div className="text-gray-500 text-center p-4">
//         No Attendance Data Found
//       </div>
//     );
//   }

//   // ------------------------ EDIT TOGGLE ---------------------------
//   const toggleEdit = () => {
//     setEditMode({ attendance: !editMode.attendance });
//   };

//   // ------------------ HANDLE INPUT CHANGE -------------------------
//   const handleInputChange = (sectionKey, field, value) => {
//     setUserData((prev) => ({
//       ...prev,
//       [sectionKey]: {
//         ...prev[sectionKey],
//         [field]: value === "" ? null : value,
//       },
//     }));

//     setUpdatedData((prev) => ({
//       ...prev,
//       [sectionKey]: {
//         ...prev[sectionKey],
//         [field]: value === "" ? null : value,
//       },
//     }));
//   };

//   // ---------------------------- SAVE ------------------------------
//   const handleSave = async () => {
//     try {
//       console.log("Saving updated data:", updatedData);

//       // Example backend payload (only changed fields)
//       const payload = {
//         ...updatedData.attendance,
//       };

//       await axiosPrivate.patch(
//         `/attendances/${userData.attendance.attendance_id}/`,
//         payload
//       );
// console.log("Payload to be sent to backend:", payload);
//       setOriginalData(userData);
//       setUpdatedData({});
//       setEditMode({ attendance: false });
//     } catch (err) {
//       console.error("Save failed:", err);
//     }
//   };

//   // --------------------------- CANCEL -----------------------------
//   const handleCancel = () => {
//     setUserData(originalData);
//     setUpdatedData({});
//     setEditMode({ attendance: false });
//   };

//   // --------------------------- RENDER -----------------------------
//   return (
//     <div className="bg-white rounded-md w-full p-4 flex flex-col gap-6">

//       {/* -------------------- Employee Info -------------------- */}
//       <div className="flex flex-col items-center gap-2">
//         <img
//           className="w-20 h-20 rounded-full object-cover"
//           src={userData.employee.pic || "/avatar.png"}
//           alt="Profile"
//         />
//         <p className="font-bold text-gray-700 text-lg">
//           {userData.employee.name}
//         </p>
//         {userData.employee.email && (
//           <p className="text-sm text-gray-500">
//             {userData.employee.email}
//           </p>
//         )}
//       </div>

//       <hr className="border-gray-200" />

//       {/* -------------------- Attendance Header -------------------- */}
//       <div className="flex justify-between items-center">
//         <h2 className="font-bold text-gray-700 text-md">
//           Attendance Details
//         </h2>

//         {!editMode.attendance ? (
//           <button
//             onClick={toggleEdit}
//             className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm"
//           >
//             Edit
//           </button>
//         ) : (
//           <div className="flex gap-2">
//             <button
//               onClick={handleSave}
//               className="bg-green-600 text-white px-4 py-1 rounded-md text-sm"
//             >
//               Save
//             </button>
//             <button
//               onClick={handleCancel}
//               className="bg-gray-300 text-gray-700 px-4 py-1 rounded-md text-sm"
//             >
//               Cancel
//             </button>
//           </div>
//         )}
//       </div>

//       {/* -------------------- Attendance Fields -------------------- */}
//       <RenderFields
//         sectionKey="attendance"
//         sectionData={userData.attendance}
//         handleInputChange={handleInputChange}
//         editMode={editMode}
//       />
//     </div>
//   );
// }
