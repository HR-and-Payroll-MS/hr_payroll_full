import React from 'react'
import Icon from '../../../../Components/Icon';
import useAuth from '../../../../Context/AuthContext';
import { useTableContext } from '../../../../Context/TableContext';
const BASE_URL = import.meta.env.VITE_BASE_URL;
function EmployeeProfile({employeeData,role}) {  
  const {axiosPrivate} = useAuth();
  const { refreshTableSilently } = useTableContext();
  const handleDelete = async () => {
  
  try {
    const response = await axiosPrivate.delete(`/employees/${employeeData?.id}/`);
    
    console.log("Delete response:", response.data);
    console.log("Deleted user:", employeeData?.general?.fullname);
    
      refreshTableSilently('users');

  } catch (error) {
    console.error("Failed to delete employee:", error);
  }
};

  return (
    <div id="left" className="flex w-full flex-col h-full p-6 gap-6 transition-all overflow-y-auto scrollbar-hidden">
        {/* TOP SECTION: Avatar & Identity */}
        <div id="top" className="items-center justify-center flex flex-col gap-4 shrink-0">
          <div className="relative group">
            {/* Emerald Accent Glow */}
            <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500 to-emerald-200 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            
              {employeeData?.general?.photo?<img className="relative w-24 h-24 object-cover rounded-full border-4 border-white dark:border-slate-600 shadow-sm"
              src={`${BASE_URL}${employeeData.general.photo}`}
              alt="Profile"
            />: (
        <div className="rounded-full bg-slate-800 dark:bg-slate-600 text-slate-100 flex items-center justify-center w-28 h-28 text-4xl font-bold border-4 border-white dark:border-slate-700 shadow-md transition-colors">
          {(employeeData.general.fullname ?? "")
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("") || "NA"}
        </div>
      )}
              
          </div>
    
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="font-bold text-slate-800 dark:text-slate-100 text-xl tracking-tight">
              {employeeData?.general?.fullname || "Not Provided"}
            </p>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-[0.2em] opacity-90">
              {employeeData?.job?.jobtitle || "Not Provided"}
            </p>
          </div>
    
          <div className="flex items-center justify-center">
            <p className={`font-bold px-4 py-1.5 text-[10px] uppercase tracking-widest rounded-full shadow-xs border ${
              employeeData?.payroll?.employeestatus === "Active"
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-500/20"
            }`}>
              {employeeData?.payroll?.employeestatus || "unknown"}
            </p>
          </div>
        </div>
    
        {/* Horizontal Divider matched to sunken theme */}
        <hr className="border-slate-200 dark:border-slate-600/50" />
    
        {/* MIDDLE SECTION: Contact Details */}
        <div id="middle" className="flex flex-col gap-1.5">
          {[
            { id: 'Mail', value: employeeData?.general?.emailaddress || "No email" },
            { id: 'Phone', value: employeeData?.general?.phonenumber || "0972334145" },
            { id: 'MapPinned', value: employeeData?.general?.timezone || "GMT+07:00" }
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-600/50 transition-all group shadow-none hover:shadow-sm">
                <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-slate-400 group-hover:text-emerald-500 transition-colors">
                    <Icon className='w-4 h-4' name={item.id}/>
                </div>
                <p className="font-semibold text-xs text-slate-600 dark:text-slate-300 truncate">
                  {item.value}
                </p>
            </div>
          ))}
        </div>
    
        <hr className="border-slate-200 dark:border-slate-600/50" />
    
        {/* BOTTOM SECTION: Organizational Context */}
        <div id="bottom" className="flex flex-col gap-5 flex-1">
          <div className="px-2">
            <p className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.15em] mb-1.5">Department</p>
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
              {employeeData?.job?.department || "Designer"}
            </p>
          </div>
    
          <div className="px-2">
            <p className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.15em] mb-1.5">Office</p>
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
              {employeeData?.job?.office || "Unpixel Studio"}
            </p>
          </div>
    
          <div className="px-2">
            <p className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.15em] mb-2.5">Line Manager</p>
            <div className="flex items-center gap-3 p-2 bg-white/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-600/50">
                <img
                    className="w-8 h-8 object-cover rounded-full border border-white dark:border-slate-700 shadow-sm"
                    src={employeeData?.general?.profilepicture || "/pic/download (48).png"}
                    alt="Manager"
                />
                <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                  {employeeData?.job?.linemanager || "Skylar Catzoni"}
                </p>
            </div>
          </div>
    
          {/* Action Area: Positioned at bottom */}
          <div className="mt-auto pt-4">
            {role === "Manager" && (
              <button  
                onClick={handleDelete} 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-all border border-rose-100 dark:border-rose-500/20 active:scale-[0.98]"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest">Delete User</p>
                <Icon className='w-4 h-4' name={'Trash'}/>
              </button>
            )}
          </div>
        </div>
    </div>
);
    
  
}

export default EmployeeProfile