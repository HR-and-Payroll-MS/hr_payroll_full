import React, { useState, useMemo, useEffect } from 'react';
import Header from '../../Components/Header';
import useAuth from '../../Context/AuthContext';

const OvertimeInitiationPage = () => {
  const { axiosPrivate, user } = useAuth();
  
  // Form State
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [justification, setJustification] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Show Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  // Fetch Team Members
  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      try {
        const response = await axiosPrivate.get(`/attendances/manager/department/${date ? `?date=${date}` : ''}`);
        // Mapping backend response to expected format
        const team = response.data.map(emp => ({
          id: emp.employee_id,
          name: emp.employee_name,
          role: emp.job_title || 'Employee' // fallback if job_title not in attendance detail
        }));
        setEmployees(team);
      } catch (error) {
        console.error("Error fetching team:", error);
        showToast("Failed to load team members", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [axiosPrivate, date]);

  // Filtered Employee List
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, employees]);

  const toggleEmployee = (id) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isFormValid = selectedEmployees.length > 0 && justification.trim() !== '' && date !== '' && hours > 0;

  const handleConfirm = async () => {
    if (!isFormValid) return;
    
    setSubmitting(true);
    try {
      await axiosPrivate.post('/attendances/overtime/', {
        date,
        hours,
        justification,
        employees: selectedEmployees
      });
      showToast("Overtime request initiated successfully", "success");
      // Reset form
      setDate('');
      setHours('');
      setJustification('');
      setSelectedEmployees([]);
    } catch (error) {
      console.error("Error initiating overtime:", error);
      const errorMsg = error.response?.data?.message || 
                     (Array.isArray(error.response?.data) ? error.response?.data[0] : null) ||
                     (typeof error.response?.data === 'object' ? Object.values(error.response?.data)[0] : null) ||
                     "Failed to initiate overtime";
      showToast(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen px-4 py-8 font-sans relative">
      {/* Local Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[9999] px-6 py-3 rounded-xl shadow-2xl transition-all border
          ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div className="flex items-center space-x-3">
            <span className={`h-2 w-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
      <div className="mx-auto">
        
        <div className="mb-6">
          <Header 
            Title={"Request Overtime"} 
            subTitle={"Assign overtime hours to team members for specific dates."} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: General Info */}
          <div className="lg:col-span-1 space-y-4">
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Overtime Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                  <input 
                    type="date" 
                    className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-blue-500 outline-none"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Hours</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 2"
                    className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-blue-500 outline-none"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Justification</label>
                  <textarea 
                    rows="3" 
                    className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-blue-500 outline-none"
                    placeholder="Why is this OT needed?"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </section>
          </div>

          {/* Right: Employee Selection */}
          <div className="lg:col-span-2 space-y-4">
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-800">Assign To Employees</h2>
                <input 
                  type="text" 
                  placeholder="Filter by name..."
                  className="w-full sm:w-64 p-2 border border-gray-300 rounded-lg text-sm outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading team members...</div>
                ) : employees.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No employees found in your department.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleEmployee(emp.id)}>
                          <td className="px-6 py-4">
                            <input 
                              type="checkbox" 
                              checked={selectedEmployees.includes(emp.id)}
                              onChange={() => {}} // Handled by tr onClick
                              className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{emp.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{emp.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <button 
                onClick={() => {
                  setDate('');
                  setHours('');
                  setJustification('');
                  setSelectedEmployees([]);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm}
                disabled={!isFormValid || submitting}
                className={`px-8 py-2 rounded-lg text-sm font-semibold text-white transition-all
                  ${isFormValid && !submitting ? 'bg-blue-600 hover:bg-blue-700 shadow-md active:scale-95' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                {submitting ? 'Processing...' : 'Confirm Overtime'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OvertimeInitiationPage;

















// import React, { useState, useMemo } from 'react';
// import Header from '../../Components/Header';

// const MOCK_EMPLOYEES = [
//   { id: 1, name: 'Alice Thompson', role: 'Software Engineer', status: 'Eligible' },
//   { id: 2, name: 'David Miller', role: 'UI Designer', status: 'Near limit' },
//   { id: 3, name: 'Sarah Chen', role: 'Product Manager', status: 'Blocked' },
//   { id: 4, name: 'James Wilson', role: 'QA Analyst', status: 'Eligible' },
//   { id: 5, name: 'Elena Rodriguez', role: 'Backend Dev', status: 'Eligible' },
//   { id: 6, name: 'Robert Fox', role: 'DevOps Engineer', status: 'Near limit' },
// ];

// const OvertimeInitiationPage = () => {
//   // Form State
//   const [date, setDate] = useState('');
//   const [otType, setOtType] = useState('Weekday');
//   const [hours, setHours] = useState('');
//   const [startTime, setStartTime] = useState('');
//   const [endTime, setEndTime] = useState('');
//   const [justification, setJustification] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedEmployees, setSelectedEmployees] = useState([]);

//   // Filtered Employee List
//   const filteredEmployees = useMemo(() => {
//     return MOCK_EMPLOYEES.filter(emp =>
//       emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       emp.role.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   }, [searchTerm]);

//   // Logic: Are there any "Near limit" employees in the selection?
//   const requiresHrApproval = useMemo(() => {
//     return selectedEmployees.some(id => {
//       const emp = MOCK_EMPLOYEES.find(e => e.id === id);
//       return emp?.status === 'Near limit';
//     });
//   }, [selectedEmployees]);

//   const toggleEmployee = (id, status) => {
//     if (status === 'Blocked') return;
//     setSelectedEmployees(prev =>
//       prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
//     );
//   };

//   const isFormValid = selectedEmployees.length > 0 && justification.trim().length > 0 && date && hours;

//   return (
//     <div className="  bg-gray-50 h-screen px-4 sm:px-6 lg:px-2 font-sans">
//       <div className="h-full  mx-auto">
        
//         <div className="mb-4 ">
//          <Header Title={"Initiate Overtime Request "} subTitle={"Department Manager portal for scheduling and authorizing extra work hours."} />
//         </div>

//         <div className="grid h-3/4 grid-cols-1 lg:grid-cols-3 gap-8">
          
//           {/* Left Column: Overtime Details */}
//           <div className="lg:col-span-1 space-y-6">
//             <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//               <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Overtime Details</h2>
              
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
//                   <input 
//                     type="date" 
//                     className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
//                     value={date}
//                     onChange={(e) => setDate(e.target.value)}
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Type</label>
//                   <select 
//                     className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
//                     value={otType}
//                     onChange={(e) => setOtType(e.target.value)}
//                   >
//                     <option>Weekday</option>
//                     <option>Weekend</option>
//                     <option>Holiday</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Expected Hours</label>
//                   <input 
//                     type="number" 
//                     placeholder="e.g. 4"
//                     className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
//                     value={hours}
//                     onChange={(e) => setHours(e.target.value)}
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
//                     <input 
//                       type="time" 
//                       className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
//                       value={startTime}
//                       onChange={(e) => setStartTime(e.target.value)}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
//                     <input 
//                       type="time" 
//                       className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm"
//                       value={endTime}
//                       onChange={(e) => setEndTime(e.target.value)}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* Policy Feedback Box */}
//             <div className={`p-4 rounded-lg border-l-4 ${requiresHrApproval ? 'bg-amber-50 border-amber-400' : 'bg-green-50 border-green-400'}`}>
//               <div className="flex">
//                 <div className="flex-shrink-0">
//                   {requiresHrApproval ? (
//                     <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
//                       <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                     </svg>
//                   ) : (
//                     <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                     </svg>
//                   )}
//                 </div>
//                 <div className="ml-3">
//                   <p className={`text-sm font-medium ${requiresHrApproval ? 'text-amber-800' : 'text-green-800'}`}>
//                     {requiresHrApproval 
//                       ? "Some employees require HR approval due to monthly limits." 
//                       : "All selected employees are eligible for immediate initiation."}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Right Column: Employee Selection & Justification */}
//           <div className="lg:col-span-2 overflow-y-auto hover-bar space-y-4 pb-4">
            
//             {/* Employee Selection Section */}
//             <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//               <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//                 <h2 className="text-lg font-semibold text-gray-800">Select Employees</h2>
//                 <div className="relative w-full sm:w-64">
//                   <input 
//                     type="text" 
//                     placeholder="Search name or role..."
//                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                   />
//                   <div className="absolute left-3 top-2.5 text-gray-400">
//                     <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
//                   </div>
//                 </div>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">Select</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OT Status</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {filteredEmployees.map((emp) => (
//                       <tr key={emp.id} className={emp.status === 'Blocked' ? 'bg-gray-50' : 'hover:bg-blue-50 transition-colors'}>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <input 
//                             type="checkbox" 
//                             disabled={emp.status === 'Blocked'}
//                             checked={selectedEmployees.includes(emp.id)}
//                             onChange={() => toggleEmployee(emp.id, emp.status)}
//                             className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
//                           />
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.name}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.role}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
//                             ${emp.status === 'Eligible' ? 'bg-green-100 text-green-800' : ''}
//                             ${emp.status === 'Near limit' ? 'bg-amber-100 text-amber-800' : ''}
//                             ${emp.status === 'Blocked' ? 'bg-red-100 text-red-800' : ''}
//                           `}>
//                             {emp.status}
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </section>

//             {/* Business Justification */}
//             <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//               <h2 className="text-lg font-semibold text-gray-800 mb-4">Business Justification</h2>
//               <textarea 
//                 rows="4" 
//                 className={`w-full p-3 border rounded-lg text-sm focus:ring-green-500 focus:border-green-500 
//                   ${justification.trim() === '' ? 'border-gray-300' : 'border-gray-300'}`}
//                 placeholder="Explain why overtime is necessary (e.g., project deadline, emergency maintenance)..."
//                 value={justification}
//                 onChange={(e) => setJustification(e.target.value)}
//               ></textarea>
//               {justification.trim() === '' && (
//                 <p className="mt-2 text-xs text-red-500 italic">* Business justification is required to initiate.</p>
//               )}
//             </section>

//             {/* Form Actions */}
//             <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
//               <button 
//                 type="button" 
//                 className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
//               >
//                 Save Draft
//               </button>
//               <button 
//                 type="button" 
//                 disabled={!isFormValid}
//                 className={`px-8 py-2 rounded-lg text-sm font-semibold text-white transition-all 
//                   ${isFormValid 
//                     ? 'bg-green-600 hover:bg-green-700 shadow-md cursor-pointer' 
//                     : 'bg-gray-400 cursor-not-allowed'}`}
//               >
//                 Initiate Overtime
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OvertimeInitiationPage;