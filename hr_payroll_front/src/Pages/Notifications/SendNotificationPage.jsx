import { useState, useEffect } from "react";
import Dropdown from "../../Components/Dropdown";
import InputField from "../../Components/InputField";
import TextEditor from "../../Components/TextEditor";
import useAuth from "../../Context/AuthContext";
import useData from "../../Context/DataContextProvider";
import { getLocalData } from "../../Hooks/useLocalStorage";
import AlertModal from "../../Components/Modals/AlertModal";

export default function SendNotificationPage() {
  const { axiosPrivate, user } = useAuth();
  const { employees, departments } = useData();
  const role = (user?.role || getLocalData('role') || "Employee").toUpperCase();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [receiverType, setReceiverType] = useState("GROUP");
  const [target, setTarget] = useState("");
  const [type, setType] = useState("system");
  
  // This key forces the TextEditor to re-render (clear) on submit
  const [resetKey, setResetKey] = useState(0); 
  const [loading, setLoading] = useState(false);

  // Filter options based on role
  const receiverOptions = role === "EMPLOYEE" 
    ? [{ content: "USER" }] 
    : [
        { content: "GROUP" },
        { content: "USER" },
        { content: "ALL" },
      ];

  const notificationTypes = [
    { content: "system" },
    { content: "hr" },
    { content: "leave" },
    { content: "attendance" },
    { content: "payroll" },
    { content: "promotion" },
    { content: "policy" },
  ];

  /*
  const receiverOptions = [
    { content: "GROUP" },
    { content: "USER" },
    { content: "ALL" },
  ];
  */

  // Build groups from predefined roles + dynamic departments
  const baseGroups = [
    { content: "Payroll" },
    { content: "HR" },
    { content: "Management" },
    { content: "IT" },
    { content: "Marketing" },
    { content: "Interns" },
    { content: "Employee" }
  ];
  
  // Add departments dynamically
  const departmentGroups = (departments?.data || []).map(dept => ({
    content: dept.name || dept.department_name
  }));
  
  const groups = [...baseGroups, ...departmentGroups.filter(d => 
    !baseGroups.some(b => b.content.toLowerCase() === d.content?.toLowerCase())
  )];
  
  // Build employee options for USER dropdown
  const employeeOptions = (employees?.data || []).map(emp => ({
    content: emp.fullname || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee #${emp.id}`,
    value: String(emp.id)
  }));
    const [alertConfig, setAlertConfig] = useState({
      isOpen: false,
      type: "error",
      message: ""
    });


//   // Helper to trigger the custom AlertModal
  const showAlert = (type, msg) => {
    setAlertConfig({
      isOpen: true,
      type: type,
      message: msg
    });
  };

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!title || !message) {
      // alert("Please fill in Title and Message");
      
      showAlert("error", "Please fill in Title and Message before dispatching.");
      setLoading(false);
      return;
    }

    if (role !== "EMPLOYEE" && receiverType !== "ALL" && !target) {
      // alert("Please select a Target (Group or User ID)");
      showAlert("error", `Please select a specific ${receiverType === "GROUP" ? "Group" : "User ID"}.`);

      setLoading(false);
      return;
    }

    let payload = {
      title,
      message,
      notification_type: type,
      related_link: "",
    };

    if (role === "EMPLOYEE") {
       payload.receiver_group = "my_manager";
    } else if (receiverType === "USER") {
      payload.recipient_id = Number(target);
    } else if (receiverType === "GROUP") {
      payload.receiver_group = target;
    } else {
      payload.receivers = ["ALL"];
    }

    try {
      await axiosPrivate.post("notifications/", payload);
      
      // Clear all states
      setTitle("");
      setMessage("");
      setTarget("");
      setReceiverType("GROUP");
      
      // Increment key to force TextEditor to wipe clean
      setResetKey(prev => prev + 1);
      
      // alert("✅ Notification sent successfully!");
      showAlert("success", "Notification broadcasted successfully!");
    } catch (e) {
      console.error(e);
      // Show the actual error message from backend if available
      const errorMsg = e.response?.data?.detail || "Failed to send notification. Please try again.";
      // alert(`❌ Error: ${errorMsg}`);
      showAlert("error", errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (<>
  <form 
    onSubmit={submit} 
    className="mx-auto overflow-y-auto scrollbar-hidden h-full p-5 space-y-5 bg-white dark:bg-slate-800 transition-colors"
  >
    {/* Header Section */}
    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
      <div>
        <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-white uppercase">
          Broadcast
        </h2>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Send System Notification
        </p>
      </div>
      <div className="w-8 h-1 bg-blue-500 rounded-full" />
    </div>

    {/* Target Selection Grid */}
    {role !== "EMPLOYEE" ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
            Recipient Type
          </label>
          <Dropdown
            options={receiverOptions}
            placeholder="Select Type"
            value={receiverType}
            onChange={(val) => {
              setReceiverType(val);
              setTarget("");
            }}
            className="dark:bg-slate-950"
          />
        </div>

        <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
          <label className="block text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
            Notification Type
          </label>
          <Dropdown
            options={notificationTypes}
            placeholder="Select Type"
            value={type}
            onChange={setType}
            className="dark:bg-slate-950"
          />
        </div>

        {receiverType === "GROUP" && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
            <label className="block text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
              Target Group
            </label>
            <Dropdown
              options={groups}
              placeholder="Select Group"
              value={target}
              onChange={setTarget}
              className="dark:bg-slate-950"
            />
          </div>
        )}

        {receiverType === "USER" && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
            <label className="block text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
              Select Employee
            </label>
            <InputField
              searchMode='api'
              apiEndpoint="/employees/"
              placeholder="Search employee by name..."
              displayKey="fullname"
              onSelect={(emp) => {
                // emp can be string (from typing) or object (from selection)
                if (typeof emp === 'object' && emp?.id) {
                  setTarget(String(emp.id));
                } else if (typeof emp === 'string') {
                  // Try to find employee by name in the list
                  const found = employees?.data?.find(e => 
                    (e.fullname || '').toLowerCase().includes(emp.toLowerCase())
                  );
                  if (found) setTarget(String(found.id));
                }
              }}
              icon={true}
              border="border-slate-200 dark:border-slate-700"
              maxWidth="bg-slate-50 dark:bg-slate-950 h-9 text-xs"
            />
            {target && (
              <p className="text-[10px] text-emerald-500 font-medium">
                Selected ID: {target}
              </p>
            )}
          </div>
        )}
      </div>
    ) : (
      /* Employee View: Fixed Recipient */
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 opacity-75 cursor-not-allowed">
             <label className="block text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
               Recipient
             </label>
             <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded h-10 flex items-center px-3 text-xs font-bold text-slate-600 dark:text-slate-400">
               Action: Notify Department Manager
             </div>
          </div>
          
          <div className="space-y-1.5">
           <label className="block text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
             Type
           </label>
           <Dropdown
             options={notificationTypes}
             value={type}
             onChange={setType}
             className="dark:bg-slate-950"
           />
         </div>
      </div>
    )}

    {/* Content Section */}
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
          Subject Line
        </label>
        <InputField 
          placeholder="Enter notification title..." 
          searchMode="input" 
          icon={false} 
          value={title}
          onChangeValue={setTitle}
          border="border-slate-200 dark:border-slate-700"
          maxWidth="bg-slate-50 dark:bg-slate-950 h-10 text-xs font-bold"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
          Message Body
        </label>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-all focus-within:ring-2 focus-within:ring-blue-500/10">
          <TextEditor 
            key={resetKey} 
            onChange={setMessage} 
          />
        </div>
      </div>
    </div>

    {/* Action Footer */}
    <div className="pt-4 flex justify-end border-t border-slate-100 dark:border-slate-800">
      <button 
        disabled={loading}
        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md flex items-center gap-2 ${
          loading 
          ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
          : "bg-slate-900 dark:bg-blue-600 text-white hover:opacity-90"
        }`}
      >
        {loading ? (
          <>
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          "Dispatch Notification"
        )}
      </button>
    </div>
  </form>
         <AlertModal 
         isOpen={alertConfig.isOpen} 
         close={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))} 
         type={alertConfig.type} 
         message={alertConfig.message} 
       />
  </>
);
}














// import { useState } from "react";
// import Dropdown from "../../Components/Dropdown";
// import InputField from "../../Components/InputField";
// import TextEditor from "../../Components/TextEditor";
// import useAuth from "../../Context/AuthContext";
// import AlertModal from "../../Components/Modals/AlertModal";

// export default function SendNotificationPage() {
//   const { axiosPrivate } = useAuth();

//   // Form States
//   const [title, setTitle] = useState("");
//   const [message, setMessage] = useState("");
//   const [receiverType, setReceiverType] = useState("GROUP");
//   const [target, setTarget] = useState("");
//   const [type, setType] = useState("other");
//   const [loading, setLoading] = useState(false);
  
//   // Logic States
//   const [resetKey, setResetKey] = useState(0); 
//   const [alertConfig, setAlertConfig] = useState({
//     isOpen: false,
//     type: "error",
//     message: ""
//   });

//   const receiverOptions = [
//     { content: "GROUP" },
//     { content: "USER" },
//     { content: "ALL" },
//   ];

//   const groups = [
//     { content: "Payroll" },
//     { content: "HR" },
//     { content: "Management" },
//     { content: "IT" },
//     { content: "Marketing" },
//     { content: "Interns" },
//     { content: "Employee" }
//   ];

//   // Helper to trigger the custom AlertModal
//   const showAlert = (type, msg) => {
//     setAlertConfig({
//       isOpen: true,
//       type: type,
//       message: msg
//     });
//   };

//   async function submit(e) {
//     e.preventDefault();
//     setLoading(true);

//     // Validation
//     if (!title || !message) {
//       showAlert("error", "Please fill in Title and Message before dispatching.");
//       setLoading(false);
//       return;
//     }

//     if (receiverType !== "ALL" && !target) {
//       showAlert("error", `Please select a specific ${receiverType === "GROUP" ? "Group" : "User ID"}.`);
//       setLoading(false);
//       return;
//     }

//     let payload = {
//       title,
//       message,
//       notification_type: type,
//       related_link: "",
//     };

//     if (receiverType === "USER") {
//       payload.recipient_id = Number(target);
//     } else if (receiverType === "GROUP") {
//       payload.receiver_group = target;
//     } else {
//       payload.receivers = ["ALL"];
//     }

//     try {
//       await axiosPrivate.post("notifications/", payload);
      
//       // Clear all fields on success
//       setTitle("");
//       setMessage("");
//       setTarget("");
//       setReceiverType("GROUP");
//       setResetKey(prev => prev + 1); // Wipes the TextEditor content
      
//       showAlert("success", "Notification broadcasted successfully!");
//     } catch (err) {
//       console.error(err);
//       const errorMsg = err.response?.data?.detail || "Failed to send notification. Please try again.";
//       showAlert("error", errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <>
//       <form 
//         onSubmit={submit} 
//         className="mx-auto overflow-y-auto scrollbar-hidden h-full p-5 space-y-5 bg-white dark:bg-slate-900 transition-colors"
//       >
//         {/* Header Section */}
//         <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
//           <div>
//             <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-white uppercase">
//               Broadcast
//             </h2>
//             <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
//               Send System Notification
//             </p>
//           </div>
//           <div className="w-8 h-1 bg-blue-500 rounded-full" />
//         </div>

//         {/* Target Selection Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="space-y-1.5">
//             <label className="block text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
//               Recipient Type
//             </label>
//             <Dropdown
//               options={receiverOptions}
//               placeholder="Select Type"
//               value={receiverType}
//               onChange={(val) => {
//                 setReceiverType(val);
//                 setTarget("");
//               }}
//               className="dark:bg-slate-950"
//             />
//           </div>

//           {receiverType === "GROUP" && (
//             <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
//               <label className="block text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
//                 Target Group
//               </label>
//               <Dropdown
//                 options={groups}
//                 placeholder="Select Group"
//                 value={target}
//                 onChange={setTarget}
//                 className="dark:bg-slate-950"
//               />
//             </div>
//           )}

//           {receiverType === "USER" && (
//             <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
//               <label className="block text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
//                 User ID Reference
//               </label>
//               <InputField
//                 placeholder="e.g., 502"
//                 icon={false}
//                 value={target}
//                 onChangeValue={setTarget}
//                 type="number"
//                 border="border-slate-200 dark:border-slate-700"
//                 maxWidth="bg-slate-50 dark:bg-slate-950 h-9 text-xs"
//               />
//             </div>
//           )}
//         </div>

//         {/* Content Section */}
//         <div className="space-y-4">
//           <div className="space-y-1.5">
//             <label className="block text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
//               Subject Line
//             </label>
//             <InputField 
//               placeholder="Enter notification title..." 
//               searchMode="input" 
//               icon={false} 
//               value={title}
//               onChangeValue={setTitle}
//               border="border-slate-200 dark:border-slate-700"
//               maxWidth="bg-slate-50 dark:bg-slate-950 h-10 text-xs font-bold"
//             />
//           </div>

//           <div className="space-y-1.5">
//             <label className="block text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
//               Message Body
//             </label>
//             <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-all focus-within:ring-2 focus-within:ring-blue-500/10">
//               <TextEditor 
//                 key={resetKey} 
//                 onChange={setMessage} 
//               />
//             </div>
//           </div>
//         </div>

//         {/* Action Footer */}
//         <div className="pt-4 flex justify-end border-t border-slate-100 dark:border-slate-800">
//           <button 
//             disabled={loading}
//             className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md flex items-center gap-2 ${
//               loading 
//               ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
//               : "bg-slate-900 dark:bg-blue-600 text-white hover:opacity-90"
//             }`}
//           >
//             {loading ? (
//               <>
//                 <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                 Processing...
//               </>
//             ) : (
//               "Dispatch Notification"
//             )}
//           </button>
//         </div>
//       </form>

//       {/* Global Alert Modal */}
//       <AlertModal 
//         isOpen={alertConfig.isOpen} 
//         close={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))} 
//         type={alertConfig.type} 
//         message={alertConfig.message} 
//       />
//     </>
//   );
// }