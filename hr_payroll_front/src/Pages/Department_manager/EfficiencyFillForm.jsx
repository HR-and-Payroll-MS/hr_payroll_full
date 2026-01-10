import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import FormRenderer from '../../Examples/FormRenderer';
import useAuth from '../../Context/AuthContext';
import AlertModal from '../../Components/Modals/AlertModal';
import useData from '../../Context/DataContextProvider';

const BASE_URL = import.meta.env.VITE_BASE_URL;
function EfficiencyFillForm() {
    // const { id: employeeId } = useParams();  
    const employeeId = useParams().id;
    const {employees} = useData();
    const { axiosPrivate } = useAuth();
    
    const [formData, setFormData] = useState(null);
    const [employeeData, setEmployeeData] = useState(null); // New state for employee info
    const [loading, setLoading] = useState(true);
    useEffect(() => {
      if (!employeeId) return;

      const loadEmployee = async () => {
        if (!employees.data) {
          await employees.get();
        }

        const emp = employees.getById(employeeId);
        
        setEmployeeData(emp);
      };
      
      loadEmployee();
    }, [employeeId, employees]);




    const [alertConfig, setAlertConfig] = useState({
      isOpen: false,
      type: "error",
      message: ""
    });

    const showAlert = (type, msg) => {
      setAlertConfig({ isOpen: true, type, message: msg });
    };
    
    useEffect(() => {
      const fetchData = async () => {
        try {
          if (!employeeData) setLoading(true);
          
          // Fetch Form Schema, and Attendance Stats
          const [schemaRes, statsRes] = await Promise.all([
            axiosPrivate.get(`/efficiency/templates/schema/`),
            axiosPrivate.get(`/attendances/employees/${employeeId}/attendances/stats/`).catch(() => ({ data: {} }))
          ]);
          
          if (!employeeData && employees.data) {
             const emp = employees.getById(employeeId);
             setEmployeeData({ ...emp, attendanceStats: statsRes.data });
          } else if (employeeData) {
             setEmployeeData(prev => ({ ...prev, attendanceStats: statsRes.data }));
          }

          setFormData({
            title: schemaRes.data.title || "Employee Efficiency Format",
            performanceMetrics: schemaRes.data.performanceMetrics || [],
            feedbackSections: schemaRes.data.feedbackSections || [],
          });

          // setEmployeeData(employeeRes.data);
          
        } catch (err) {
          console.error(err);
          showAlert("error", `Failed to load data: ${err.response?.data?.message || err.message}`);
          
          // Fallback for form data so the page doesn't crash
          setFormData({
            title: "Employee Efficiency Format",
            performanceMetrics: [],
            feedbackSections: [],
          });
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, [axiosPrivate, employeeId]);

  if (loading) return <div className="p-6 text-center">Loading Profile...</div>;

  return (
    <div className='p-6 h-full flex flex-col space-y-4'>
     { console.log(employeeData?.photo)}
        {/* --- Employee Profile Header --- */}
        {/* --- Employee Profile Header --- */}
        {employeeData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* ID Card Style Profile */}
                <div className="md:col-span-2 flex items-center space-x-4 p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="relative">
                        {employeeData?.photo ? (
                            <img 
                                className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-50 dark:ring-slate-800"
                                src={typeof employeeData.photo === 'string' && employeeData.photo.startsWith('http') ? employeeData.photo : `${BASE_URL}${employeeData.photo}`}
                                alt=""
                            />
                        ) : (
                             <div className='h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-2xl ring-4 ring-slate-50 dark:ring-slate-800'>
                                {(employeeData?.fullname || employeeData?.general?.fullname || "NA").charAt(0)}
                            </div>
                        )}
                        <span className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 ${employeeData.status === 'Active' || employeeData.payroll?.employeestatus === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{employeeData?.fullname || employeeData?.general?.fullname}</h2>
                        <p className="text-emerald-600 font-medium">{employeeData?.jobtitle || employeeData?.job?.jobtitle || 'Employee'}</p>
                        
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 text-xs">
                            <div>
                                <p className="text-slate-400">Department</p>
                                <p className="font-semibold text-slate-700 dark:text-slate-300">{employeeData?.department || employeeData?.job?.department || 'General'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Employee ID</p>
                                <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">#{employeeData?.employeeid || employeeData?.job?.employeeid || employeeId}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-slate-400">Email</p>
                                <p className="font-semibold text-slate-700 dark:text-slate-300">{employeeData?.emailaddress || employeeData?.general?.emailaddress || 'No email'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance Stats Card */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Attendance (Current Year)</h3>
                     
                     <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                            <p className="text-xl font-bold text-emerald-600">{employeeData?.attendanceStats?.present || 0}</p>
                            <p className="text-[10px] font-bold uppercase text-emerald-400">Present</p>
                        </div>
                        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20">
                             <p className="text-xl font-bold text-rose-600">{employeeData?.attendanceStats?.absent || 0}</p>
                             <p className="text-[10px] font-bold uppercase text-rose-400">Absent</p>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                             <p className="text-xl font-bold text-amber-600">{employeeData?.attendanceStats?.late || 0}</p>
                             <p className="text-[10px] font-bold uppercase text-amber-400">Late</p>
                        </div>
                     </div>
                </div>
            </div>
        )}

        {/* --- Evaluation Form --- */}
        <div className=" flex-1 overflow-x-auto hover-bar rounded-lg">
            <FormRenderer savedForm={formData} employeeId={employeeId} />
        </div>

        <AlertModal 
            isOpen={alertConfig.isOpen} 
            close={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))} 
            type={alertConfig.type} 
            message={alertConfig.message} 
        />
    </div>
  )
}

export default EfficiencyFillForm;