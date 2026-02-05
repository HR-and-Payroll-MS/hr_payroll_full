import React, { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_BASE_URL;
import useAuth from '../../../Context/AuthContext';
import useData from '../../../Context/DataContextProvider'; 
import ThreeDots from '../../../animations/ThreeDots';
import Modal from '../../../Components/Modal';

export default function WorkSchedule() {
    const { axiosPrivate, auth } = useAuth();
    const { departments, employees } = useData();
    const userRole = auth?.user?.role || 'Employee'; 
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);

    // Bulk Assign State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [targetSchedule, setTargetSchedule] = useState(null);
    const [assignType, setAssignType] = useState('department'); // department, employee, all
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [assignLoading, setAssignLoading] = useState(false);

    useEffect(() => {
        if (departments.get) departments.get();
        if (employees.get) employees.get();
    }, []);
    const [expandedId, setExpandedId] = useState(1); 
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchSchedules = async () => {
        try {
            const res = await axiosPrivate.get('/attendances/schedules/');
            // Transform backend data to frontend format if needed
            // Backend: { id, title, start_time, end_time, days_of_week }
            // Frontend: { id, name, days: [{day, hours}], ... }
            // Handle pagination ({ results: [...] }) or flat list
            const rawData = res.data.results || res.data; 
            const mapped = rawData.map(s => ({
                id: s.id,
                name: s.title,
                isDefault: false, // Backend doesn't have this yet, assume false
                workingHoursDay: "08:00", // placeholder or derive
                effectiveFrom: s.created_at.split('T')[0],
                type: "Fixed Time",
                totalHoursWeek: "40:00",
                startTime: s.start_time,
                endTime: s.end_time,
                days: s.days_of_week && s.days_of_week.length ? s.days_of_week : [
                    { day: "Monday", hours: `${s.start_time}-${s.end_time}` },
                    { day: "Tuesday", hours: `${s.start_time}-${s.end_time}` },
                    { day: "Wednesday", hours: `${s.start_time}-${s.end_time}` },
                    { day: "Thursday", hours: `${s.start_time}-${s.end_time}` },
                    { day: "Friday", hours: `${s.start_time}-${s.end_time}` }
                ]
            }));
            setSchedules(mapped);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const toggleExpand = (id) => {
        if (editingId === id) return; 
        setExpandedId(expandedId === id ? null : id);
    };

    const handleEditClick = (e, schedule) => {
        e.stopPropagation();
        setEditingId(schedule.id);
        
        // Merge existing days with full 7-day template to ensure removed days can be added back
        const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const mergedDays = allDays.map(dayName => {
            const existing = schedule.days?.find(d => d.day === dayName);
            if (existing) return { ...existing, enabled: true };
            return { day: dayName, hours: "Off", enabled: false };
        });

        setFormData({ 
            ...schedule,
            days: mergedDays
        });
    };

    const handleCancel = () => {
        if (editingId && !schedules.find(s => s.id === editingId)) {
           // It was a new temporary item?
        }
        setEditingId(null);
        setFormData(null);
    };

    const handleSave = async () => {
        try {
            // Format days with individual times for backend
            const formattedDays = formData.days
                .filter(d => d.enabled !== false)
                .map(d => ({
                    day: d.day,
                    hours: d.customTime || `${formData.startTime}-${formData.endTime}`,
                    start_time: d.customStartTime || formData.startTime,
                    end_time: d.customEndTime || formData.endTime
                }));

            const payload = {
                title: formData.name,
                start_time: formData.startTime || "09:00",
                end_time: formData.endTime || "17:00",
                days_of_week: formattedDays,
                schedule_type: formData.type || "Fixed Time",
                hours_per_day: formData.workingHoursDay || "08:00",
                hours_per_week: formData.totalHoursWeek || "40:00"
            };
            
            if (String(editingId).includes('new')) {
                // Create
                await axiosPrivate.post('/attendances/schedules/', payload);
            } else {
                // Update
                await axiosPrivate.put(`/attendances/schedules/${editingId}/`, payload);
            }
            fetchSchedules();
            setEditingId(null);
        } catch (err) {
            console.error("Failed to save schedule", err);
            alert("Failed to save schedule.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this schedule?")) {
            try {
                await axiosPrivate.delete(`/attendances/schedules/${id}/`);
                setSchedules(schedules.filter(s => s.id !== id));
            } catch (err) {
                console.error(err);
                alert("Failed to delete.");
            }
        }
    };

    const handleCreateNew = () => {
        const newId = 'new-' + Date.now();
        const newSchedule = {
            id: newId,
            name: "New Work Schedule",
            isDefault: false,
            workingHoursDay: "08:00",
            effectiveFrom: new Date().toISOString().split('T')[0],
            type: "Fixed Time",
            totalHoursWeek: "40:00",
            startTime: "09:00",
            endTime: "17:00",
            days: [
                { day: "Monday", hours: "09:00-17:00", enabled: true },
                { day: "Tuesday", hours: "09:00-17:00", enabled: true },
                { day: "Wednesday", hours: "09:00-17:00", enabled: true },
                { day: "Thursday", hours: "09:00-17:00", enabled: true },
                { day: "Friday", hours: "09:00-17:00", enabled: true },
                { day: "Saturday", hours: "Off", enabled: false },
                { day: "Sunday", hours: "Off", enabled: false },
            ]
        };
        setSchedules([newSchedule, ...schedules]);
        setExpandedId(newId);
        setEditingId(newId);
        setFormData(newSchedule);
    };

    const handleOpenAssign = (e, schedule) => {
        e.stopPropagation();
        setTargetSchedule(schedule);
        setAssignType('department');
        setSelectedDepartments([]);
        setSelectedEmployees([]);
        setIsAssignModalOpen(true);
    };

    const handleBulkAssignSubmit = async () => {
        if (!targetSchedule) return;
        setAssignLoading(true);
        try {
            const payload = {
                all_employees: assignType === 'all',
                department_ids: assignType === 'department' ? selectedDepartments : [],
                employee_ids: assignType === 'employee' ? selectedEmployees : []
            };
            
            await axiosPrivate.post(`/attendances/schedules/${targetSchedule.id}/assign-bulk/`, payload);
            alert("Schedule assigned successfully!");
            setIsAssignModalOpen(false);
        } catch (err) {
            console.error("Assign failed", err);
            alert("Failed to assign schedule.");
        } finally {
            setAssignLoading(false);
        }
    };

    const toggleSelection = (id, list, setList) => {
        if (list.includes(id)) {
            setList(list.filter(item => item !== id));
        } else {
            setList([...list, id]);
        }
    };

    const filteredSchedules = schedules.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isManagement = ['Manager', 'Payroll'].includes(userRole);

    return (
        <div className="flex relative flex-col w-full p-8 bg-white dark:bg-slate-800 dark:text-slate-100 min-h-screen">
            {/* HEADER */}
            <div className="flex sticky z-30 bg-white dark:bg-slate-800 p-4 top-0 gap-2 border-b border-gray-100 dark:border-slate-700 mb-6">
                <p className="text-xl flex-1 font-bold">Work Schedule</p>
                <div className="flex items-center w-1/3 px-1.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-lg">
                    <div className="flex text-xs w-full items-center justify-between px-2.5 py-2.5 h-full">
                        <input 
                            className="h-full rounded w-full outline-none bg-transparent" 
                            type="text" 
                            placeholder="Search schedule name..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <img className="h-3.5 opacity-45 dark:invert" src="/svg/search-svgrepo-com.svg" alt="" />
                    </div>
                </div>

                {isManagement && (
                    editingId ? (
                        <div className="flex gap-2">
                             <button onClick={handleCancel} className="flex bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-200 items-center px-5 py-3 rounded-md font-semibold text-xs transition-transform active:scale-95">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="flex bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 items-center gap-1.5 px-5 py-3 rounded-md transition-transform active:scale-95">
                                <img className="h-4 dark:invert" src="/svg/down-arrow-5-svgrepo-com.svg" alt="" />
                                <p className="text-xs font-semibold">Save</p>
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleCreateNew} className="flex bg-green-600 text-white items-center px-5 py-3 rounded-lg shadow-lg shadow-green-500/20 transition-transform active:scale-95">
                            <p className="text-xs font-bold">+ New Schedule</p>
                        </button>
                    )
                )}
            </div>

            {/* LIST */}
            <div className="flex flex-col gap-4">
                {filteredSchedules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                        <img src="/pic/empty-calendar.png" className="w-24 opacity-20 dark:invert mb-4" alt="" />
                        <h3 className="text-lg font-bold text-gray-400">No Work Schedule Assigned</h3>
                        <p className="text-sm text-gray-400">Please contact your Manager if you believe this is an error.</p>
                    </div>
                ) : (
                    filteredSchedules.map((sched) => {
                        const isExpanded = expandedId === sched.id;
                        const isEditing = editingId === sched.id;

                        return (
                            <div key={sched.id} className={`flex border ${isExpanded ? 'border-green-500 ring-2 ring-green-500/10' : 'border-gray-100 dark:border-slate-700'} rounded-xl bg-white dark:bg-slate-800 flex-col overflow-hidden transition-all shadow-sm`}>
                                {/* TOP BAR */}
                                <div onClick={() => toggleExpand(sched.id)} className={`flex p-5 flex-1 gap-5 justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors`}>
                                    <div className="flex-1 flex gap-3 items-center">
                                        {isEditing ? (
                                            <input 
                                                className="text-sm font-bold text-gray-800 dark:text-slate-100 border-b-2 border-green-500 outline-none bg-transparent py-1"
                                                value={formData.name}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                autoFocus
                                            />
                                        ) : (
                                            <p className="text-md font-bold text-slate-800 dark:text-slate-200">{sched.name}</p>
                                        )}
                                        {sched.isDefault && <p className="px-3 rounded-full text-[10px] py-1 text-green-600 dark:text-green-400 font-black bg-blue-50 dark:bg-blue-900/20 uppercase tracking-widest">Default</p>}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end mr-4">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Effective From</p>
                                            <p className="text-xs font-bold">{sched.effectiveFrom}</p>
                                        </div>
                                        <img className={`h-5 transition-transform dark:invert ${isExpanded ? 'rotate-0' : 'rotate-180 opacity-35'}`} src="/svg/down-arrow-5-svgrepo-com.svg" alt="" />
                                    </div>
                                </div>

                                {/* MIDDLE (Details) */}
                                {isExpanded && (
                                    <div className="flex flex-col p-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <hr className="border-slate-100 dark:border-slate-700 mb-6" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700/50">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Hours per Day</p>
                                                    {isEditing ? (
                                                        <input 
                                                            type="text" 
                                                            className="text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 w-20 text-right"
                                                            value={formData.workingHoursDay}
                                                            onChange={(e) => setFormData({...formData, workingHoursDay: e.target.value})}
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{sched.workingHoursDay}</p>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700/50">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Schedule Type</p>
                                                    {isEditing ? (
                                                        <select 
                                                            className="text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1"
                                                            value={formData.type}
                                                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                                                        >
                                                            <option value="Fixed Time">Fixed Time</option>
                                                            <option value="Flexible">Flexible</option>
                                                            <option value="Shift Based">Shift Based</option>
                                                            <option value="Remote">Remote</option>
                                                        </select>
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{sched.type}</p>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700/50">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Hours per Week</p>
                                                    {isEditing ? (
                                                        <input 
                                                            type="text" 
                                                            className="text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 w-20 text-right"
                                                            value={formData.totalHoursWeek}
                                                            onChange={(e) => setFormData({...formData, totalHoursWeek: e.target.value})}
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{sched.totalHoursWeek}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Daily Timeline</p>
                                                
                                                {isEditing ? (
                                                    <div className="space-y-6">
                                                        <div className="flex gap-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                                            <div className="flex-1">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Start Time</label>
                                                                <input type="time" className="text-sm font-bold w-full outline-none bg-transparent dark:text-slate-100 border-b border-slate-200" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">End Time</label>
                                                                <input type="time" className="text-sm font-bold w-full outline-none bg-transparent dark:text-slate-100 border-b border-slate-200" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {formData.days.map((d, i) => (
                                                                <div key={i} className={`flex items-center gap-3 p-3 rounded border ${d.enabled !== false ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-50'}`}>
                                                                    <label className="flex items-center gap-2 cursor-pointer min-w-[80px]">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={d.enabled !== false}
                                                                            onChange={(e) => {
                                                                                const newDays = [...formData.days];
                                                                                newDays[i] = { 
                                                                                    ...newDays[i], 
                                                                                    enabled: e.target.checked, 
                                                                                    hours: e.target.checked ? `${formData.startTime}-${formData.endTime}` : 'Off',
                                                                                    customStartTime: null,
                                                                                    customEndTime: null
                                                                                };
                                                                                setFormData({...formData, days: newDays});
                                                                            }}
                                                                            className="accent-green-500"
                                                                        />
                                                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{d.day}</p>
                                                                    </label>
                                                                    {d.enabled !== false && (
                                                                        <div className="flex items-center gap-2 flex-1">
                                                                            <input 
                                                                                type="time" 
                                                                                className="text-xs font-bold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1"
                                                                                value={d.customStartTime || formData.startTime}
                                                                                onChange={(e) => {
                                                                                    const newDays = [...formData.days];
                                                                                    newDays[i] = { ...newDays[i], customStartTime: e.target.value };
                                                                                    setFormData({...formData, days: newDays});
                                                                                }}
                                                                            />
                                                                            <span className="text-slate-400">-</span>
                                                                            <input 
                                                                                type="time" 
                                                                                className="text-xs font-bold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1"
                                                                                value={d.customEndTime || formData.endTime}
                                                                                onChange={(e) => {
                                                                                    const newDays = [...formData.days];
                                                                                    newDays[i] = { ...newDays[i], customEndTime: e.target.value };
                                                                                    setFormData({...formData, days: newDays});
                                                                                }}
                                                                            />
                                                                            {(d.customStartTime || d.customEndTime) && (
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        const newDays = [...formData.days];
                                                                                        newDays[i] = { ...newDays[i], customStartTime: null, customEndTime: null };
                                                                                        setFormData({...formData, days: newDays});
                                                                                    }}
                                                                                    className="text-[8px] text-slate-400 hover:text-red-500"
                                                                                    title="Reset to default"
                                                                                >
                                                                                    Reset
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {d.enabled === false && (
                                                                        <span className="text-xs text-slate-400 italic">Day Off</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {sched.days.map((d, i) => (
                                                            <div key={i} className="flex justify-between items-center hover:bg-white dark:hover:bg-slate-800 p-2 rounded-lg transition-colors group">
                                                                <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{d.day}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                                                    <p className="text-xs font-bold text-slate-500 group-hover:text-green-500 transition-colors tracking-tighter">{d.hours}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {isManagement && !isEditing && (
                                            <div className="flex gap-3 mt-8 pt-6 border-t border-slate-50 dark:border-slate-700">
                                                <button 
                                                    onClick={(e) => handleEditClick(e, sched)}
                                                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95 border border-slate-200 dark:border-slate-600 shadow-sm"
                                                >
                                                    Edit Schedule
                                                </button>
                                                <button 
                                                    onClick={(e) => handleOpenAssign(e, sched)}
                                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                                                >
                                                    Assign Employees
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(sched.id)}
                                                    className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 border border-red-100 dark:border-red-900/30"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            <Modal isOpen={isAssignModalOpen} location="center">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-[500px] shadow-xl max-h-[80vh] flex flex-col">
                    <h3 className="text-lg font-bold mb-4 dark:text-white">Assign Schedule: {targetSchedule?.name}</h3>
                    
                    <div className="flex gap-4 mb-4 border-b border-gray-200 dark:border-slate-700 pb-2">
                        <button 
                            className={`pb-2 px-2 text-sm font-semibold ${assignType === 'department' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                            onClick={() => setAssignType('department')}
                        >
                            By Department
                        </button>
                        <button 
                             className={`pb-2 px-2 text-sm font-semibold ${assignType === 'employee' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                             onClick={() => setAssignType('employee')}
                        >
                            By Employee
                        </button>
                        <button 
                             className={`pb-2 px-2 text-sm font-semibold ${assignType === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                             onClick={() => setAssignType('all')}
                        >
                            All Employees
                        </button>
                    </div>

                    <div className="flex-1 hover-bar overflow-y-auto mb-4 border rounded p-2 border-gray-100 dark:border-slate-700">
                        {assignType === 'all' && (
                            <p className="text-center text-gray-500 py-8">This will assign the schedule to ALL employees in the system.</p>
                        )}

                        {assignType === 'department' && (
                            <div className="flex flex-col gap-2">
                                {departments.data?.map(dept => (
                                    <label key={dept.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-2 rounded">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedDepartments.includes(dept.id)}
                                            onChange={() => toggleSelection(dept.id, selectedDepartments, setSelectedDepartments)}
                                        />
                                        <span className="text-sm dark:text-slate-200">{dept.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {assignType === 'employee' && (
                            <div className="flex flex-col gap-2">
                                {employees.data?.map(emp => (
                                    <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-2 rounded">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedEmployees.includes(emp.id)}
                                            onChange={() => toggleSelection(emp.id, selectedEmployees, setSelectedEmployees)}
                                        />
                                        <span className="text-sm dark:text-slate-200">{emp.fullname} ({emp.department})</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 mt-auto pt-4 border-t border-gray-200 dark:border-slate-700">
                        <button 
                            onClick={() => setIsAssignModalOpen(false)}
                            className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                            disabled={assignLoading}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleBulkAssignSubmit}
                            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded"
                            disabled={assignLoading}
                        >
                            {assignLoading ? <ThreeDots /> : "Assign Selected"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}