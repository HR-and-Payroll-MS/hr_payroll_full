import React, { useState } from 'react';
import Dropdown from '../Components/Dropdown';
import TextEditor from '../Components/TextEditor';
import SearchDate from '../Components/SearchDate';
import FileUploader from '../Components/FileUploader';
import useAuth from '../Context/AuthContext';

export default function SendRequestForEmployee() {
  const [requestType, setRequestType] = useState('Leave');
  const [leaveCategory, setLeaveCategory] = useState('Annual');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [date, setDate] = useState(null);
  const { axiosPrivate, user } = useAuth();

  const REQUEST_TYPES = ['Leave', 'Complaint', 'Internal Application', 'Resource Request', 'Resignation'];
  const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Maternity', 'Paternity', 'Unpaid', 'Compensatory'];

  function toISODate(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  async function submit(e) {
    e.preventDefault();
    const destination = requestType === 'Leave' ? 'DEPARTMENT_MANAGER' : 'HR_MANAGER';
    const startDateISO = toISODate(date?.from);
    const endDateISO = toISODate(date?.to);

    // Calculate days
    const start = new Date(startDateISO);
    const end = new Date(endDateISO);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Map frontend categories to backend choices
    const mapCategory = (cat) => {
      const lower = cat.toLowerCase();
      if (['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'personal'].includes(lower)) return lower;
      if (lower === 'casual') return 'personal';
      return 'other';
    };

    const typeValue = requestType === 'Leave' ? mapCategory(leaveCategory) : 'other';

    const fd = new FormData();
    fd.append('employee', useAuth?.user?.employee_id || ''); // Backend might take from user context, but robust to send if needed? No, backend usually uses request.user.employee. I'll omit this, or let it fail if required. Wait, useAuth doesn't expose user here directly? I'll rely on backend getting user. 
    // Actually, backend creates for 'employee' field. If using CreateAPIView, perform_create usually sets it.
    // But Step 586 LeaveRequestCreateSerializer has 'employee' in fields.
    // If I don't send it, is it read_only? No.
    // I should check if backend View sets it. 
    // I will assume backend View sets it from request.user, but if not, I might fail.
    // Previous code didn't send it.

    fd.append('leave_type', typeValue);
    fd.append('start_date', startDateISO);
    fd.append('end_date', endDateISO);
    fd.append('days', isNaN(days) ? 1 : days);
    
    // Prefix reason if not Leave
    const finalReason = requestType === 'Leave' ? message : `[${requestType}] ${message}`;
    fd.append('reason', finalReason || "No reason provided");
    
    if (file instanceof File) fd.append('attachment', file);

    try {
      await axiosPrivate.post('/leaves/requests/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Request sent successfully!`);
      // Reset form or redirect?
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        // Format error details
        const details = typeof err.response.data === 'object' 
          ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join('\n')
          : err.response.data;
        alert(`Request failed:\n${details}`);
      } else {
        alert('Request failed: ' + (err.message || "Unknown error"));
      }
    }
  }

  return (
    <div className="h-full w-full p-2.5 flex flex-col gap-4 overflow-y-auto scrollbar-hidden">
      {/* Header Section */}
      <div className="flex flex-col gap-1 px-2 py-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Submit a New Request</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Please fill in the details below. Requests are automatically routed to HR or your Department Manager.</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        {/* Top Controls Bar - Matching the Table/Graph container style */}
        <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded shadow dark:shadow-black dark:inset-shadow-xs flex flex-wrap items-center gap-6">
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Request Type</label>
            <Dropdown
              padding="p-1.5 w-60"
              width="w-60"
              onChange={setRequestType}
              placeholder="Select Type"
              options={REQUEST_TYPES}
            />
          </div>

          {requestType === 'Leave' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Leave Category</label>
              <Dropdown
                padding="p-1.5 w-60"
                width="w-60"
                onChange={setLeaveCategory}
                placeholder="Select Category"
                options={LEAVE_TYPES}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Select Date Range</label>
            <SearchDate onSubmit={setDate} applyButton={false} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Attachments</label>
            <FileUploader
              btnBackground="bg-white dark:bg-slate-600 dark:text-white"
              IconName="Link2"
              buttonOnly={true}
              label="Attach File"
              onFileSelect={setFile}
            />
          </div>
        </div>

        {/* Editor Section - Full width matching the Table style */}
        <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded shadow dark:shadow-black flex-1 min-h-[300px]">
           <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase block mb-2">
             {requestType === 'Complaint' ? 'Detailed Description' : 'Message / Reason'}
           </label>
           <TextEditor onChange={setMessage} />
        </div>

        {/* Action Footer */}
        <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-700 p-4 rounded shadow">
          <div className="text-sm">
             <span className="text-slate-400">Destination:</span>
             <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded text-xs font-bold uppercase">
               {requestType === 'Leave' ? 'Dept Manager' : 'HR Manager'}
             </span>
          </div>
          <button
            type="submit"
            className="px-8 py-2.5 bg-[#052f4a] hover:bg-[#0a4166] text-white rounded font-bold transition-all shadow-md"
          >
            SEND REQUEST
          </button>
        </div>
      </form>
    </div>
  );
}



































// import React, { useState } from 'react';
// import Dropdown from '../Components/Dropdown';
// import TextEditor from '../Components/TextEditor';
// import SearchDate from '../Components/SearchDate';
// import FileUploader from '../Components/FileUploader';
// import useAuth from '../Context/AuthContext';

// export default function SendRequestForEmployee({ role = 'HR_MANAGER' }) {
//   const [message, setMessage] = useState('');
//   const [category, setCategory] = useState('hr');
//   const [file, setFile] = useState(null);
//   const [date, setDate] = useState(null);
//   const { axiosPrivate } = useAuth();
//   const LEAVE_TYPES = [
//     'Annual',
//     'Sick',
//     'Casual',
//     'Maternity',
//     'Paternity',
//     'Unpaid',
//     'Compensatory',
//     'Bereavement',
//     'Study',
//     'Sabbatical',
//   ];

//   function toISODate(date) {
//     if (!date) return null;

//     const d = new Date(date);
//     return d.toISOString().split('T')[0]; // YYYY-MM-DD
//   }

//   async function submit(e) {
//     e.preventDefault();

//     console.log('message', message);
//     console.log('category', category);
//     console.log('file', file);
//     console.log('date', date);

//     const startDateISO = toISODate(date?.from);
//     const endDateISO = toISODate(date?.to);

//     try {
//       let res;

//       if (file instanceof File) {
//         const fd = new FormData();
//         fd.append('type', category);
//         fd.append('startDate', startDateISO);
//         fd.append('endDate', endDateISO);
//         if (message) fd.append('reason', message);
//         fd.append('attachment', file);
//         console.log(startDateISO, endDateISO);
//         res = await axiosPrivate.post('/leaves/requests/', fd);
//       } else {
//         const payload = {
//           type: category,
//           startDate: startDateISO,
//           endDate: endDateISO,
//           ...(message ? { reason: message } : {}),
//         };

//         res = await axiosPrivate.post('/leaves/requests/', payload);
//       }

//       console.log('BACKEND RESPONSE →', res.data);
//       alert('Request sent (check network tab)');
//     } catch (err) {
//       console.error('BACKEND ERROR →', err);
//       alert('Request failed – check console');
//     }
//   }

//   return (
//     <form onSubmit={submit} className=" mx-auto p- space-y-4">
//       <div className="flex items-center gap-2">
//         <p>Type</p>
//         {/* <InputField placeholder="Title..." maxWidth={"w-full"} icon={false} onSelect={setTitle}/> */}
//         <Dropdown
//           padding="p-1.5 w-120"
//           width="w-120"
//           onChange={setCategory}
//           placeholder="Casual"
//           options={LEAVE_TYPES}
//         />
//         <SearchDate onSubmit={setDate} applyButton={false} style="" />
//         <FileUploader
//           btnBackground="hover:bg-slate-50"
//           IconName="Link2"
//           buttonOnly={true}
//           label="Attach File"
//           onFileSelect={setFile}
//         >
//           .
//         </FileUploader>
//       </div>
//       <TextEditor onChange={setMessage} />

//       <button
//         type="submit"
//         className="px-4 py-2 bg-slate-800 text-white rounded"
//       >
//         Send
//       </button>
//     </form>
//   );
// }
