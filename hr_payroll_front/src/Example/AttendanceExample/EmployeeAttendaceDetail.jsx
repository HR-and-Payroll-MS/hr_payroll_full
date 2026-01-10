import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AttendanceFilterBar as Filters } from "../../Components/Level2Hearder";
import Table from "../../Components/Table";
import useAuth from "../../Context/AuthContext";
import SummaryCard from "../../Components/SummaryCard";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function EmployeeAttendanceDetail() {

  const data=[
  {
    "employee": 17,
    "date": "2025-01-01",
    "clock_in": null,
    "clock_in_location": "",
    "clock_out": null,
    "clock_out_location": "",
    "work_schedule_hours": 8,
    "paid_time": 0,
    "notes": "Holiday"
  },
  {
    "employee": 17,
    "date": "2025-01-02",
    "clock_in": "09:02",
    "clock_in_location": "Office A",
    "clock_out": "17:11",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.15,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-03",
    "clock_in": "08:55",
    "clock_in_location": "Office A",
    "clock_out": "17:03",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.13,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-04",
    "clock_in": null,
    "clock_in_location": "",
    "clock_out": null,
    "clock_out_location": "",
    "work_schedule_hours": 0,
    "paid_time": 0,
    "notes": "Weekend"
  }, {
    "employee": 17,
    "date": "2025-01-05",
    "clock_in": null,
    "clock_in_location": "",
    "clock_out": null,
    "clock_out_location": "",
    "work_schedule_hours": 0,
    "paid_time": 0,
    "notes": "Weekend"
  },
  {
    "employee": 17,
    "date": "2025-01-06",
    "clock_in": "09:04",
    "clock_in_location": "Office A",
    "clock_out": "17:00",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 7.93,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-07",
    "clock_in": "08:51",
    "clock_in_location": "Office A",
    "clock_out": "17:10",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.32,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-08",
    "clock_in": "09:00",
    "clock_in_location": "Office A",
    "clock_out": "17:05",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.08,
    "notes": ""
  },  {
    "employee": 17,
    "date": "2025-01-09",
    "clock_in": "09:11",
    "clock_in_location": "Office A",
    "clock_out": "17:00",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 7.82,
    "notes": "Late arrival"
  },
  {
    "employee": 17,
    "date": "2025-01-10",
    "clock_in": "08:57",
    "clock_in_location": "Office A",
    "clock_out": "17:02",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.08,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-11",
    "clock_in": null,
    "clock_in_location": "",
    "clock_out": null,
    "clock_out_location": "",
    "work_schedule_hours": 0,
    "paid_time": 0,
    "notes": "Weekend"
  },
  {
    "employee": 17,
    "date": "2025-01-12",
    "clock_in": null,
    "clock_in_location": "",
    "clock_out": null,
    "clock_out_location": "",
    "work_schedule_hours": 0,
    "paid_time": 0,
    "notes": "Weekend"
  },  {
    "employee": 17,
    "date": "2025-01-13",
    "clock_in": "09:03",
    "clock_in_location": "Office A",
    "clock_out": "17:04",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.02,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-14",
    "clock_in": "08:59",
    "clock_in_location": "Office A",
    "clock_out": "17:06",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.12,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-15",
    "clock_in": "09:05",
    "clock_in_location": "Office A",
    "clock_out": "16:58",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 7.88,
    "notes": "Short exit for personal errand"
  },
  {
    "employee": 17,
    "date": "2025-01-16",
    "clock_in": "08:50",
    "clock_in_location": "Office A",
    "clock_out": "17:12",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.37,
    "notes": ""
  },  {
    "employee": 17,
    "date": "2025-01-17",
    "clock_in": "09:00",
    "clock_in_location": "Office A",
    "clock_out": "17:03",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.05,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-18",
    "clock_in": null,
    "clock_in_location": "",
    "clock_out": null,
    "clock_out_location": "",
    "work_schedule_hours": 0,
    "paid_time": 0,
    "notes": "Weekend"
  },
  {
    "employee": 17,
    "date": "2025-01-19",
    "clock_in": null,
    "clock_in_location": "",
    "clock_out": null,
    "clock_out_location": "",
    "work_schedule_hours": 0,
    "paid_time": 0,
    "notes": "Weekend"
  },
  {
    "employee": 17,
    "date": "2025-01-20",
    "clock_in": "09:10",
    "clock_in_location": "Office A",
    "clock_out": "17:01",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 7.85,
    "notes": "Late arrival"
  },  {
    "employee": 17,
    "date": "2025-01-21",
    "clock_in": "08:53",
    "clock_in_location": "Office A",
    "clock_out": "17:07",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.23,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-22",
    "clock_in": "09:01",
    "clock_in_location": "Office A",
    "clock_out": "17:04",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.05,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-23",
    "clock_in": "09:08",
    "clock_in_location": "Office A",
    "clock_out": "17:02",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 7.9,
    "notes": "Late"
  },
  {
    "employee": 17,
    "date": "2025-01-24",
    "clock_in": "08:56",
    "clock_in_location": "Office A",
    "clock_out": "17:11",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.25,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-25",
    "clock_in": null,
    "clock_in_location": "",
    "clock_out": null,
    "clock_out_location": "",
    "work_schedule_hours": 0,
    "paid_time": 0,
    "notes": "Weekend"
  },  {
    "employee": 17,
    "date": "2025-01-26",
    "clock_in": null,
    "clock_in_location": "",
    "clock_out": null,
    "clock_out_location": "",
    "work_schedule_hours": 0,
    "paid_time": 0,
    "notes": "Weekend"
  },
  {
    "employee": 17,
    "date": "2025-01-27",
    "clock_in": "08:52",
    "clock_in_location": "Office A",
    "clock_out": "17:06",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.23,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-28",
    "clock_in": "09:00",
    "clock_in_location": "Office A",
    "clock_out": "17:03",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.05,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-29",
    "clock_in": "08:58",
    "clock_in_location": "Office A",
    "clock_out": "17:09",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 8.18,
    "notes": ""
  },
  {
    "employee": 17,
    "date": "2025-01-30",
    "clock_in": "09:06",
    "clock_in_location": "Office A",
    "clock_out": "17:00",
    "clock_out_location": "Office A",
    "work_schedule_hours": 8,
    "paid_time": 7.9,
    "notes": "Late"
  }
]
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosPrivate } = useAuth();
  
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: "All",
  });

  const structure = [1, 1, 1, 1, 1, 1, 1, 1, 3];
  const ke2 = [
    ["date"], ["clock_in"], ["clock_in_location"], ["clock_out"], 
    ["status"], ["clock_out_location"], ["work_schedule_hours"], 
    ["paid_time"], ["notes"]
  ];
  const title = [
    'DATE', 'CLOCK IN', 'CLOCK IN LOCATION', 'CLOCK OUT', 
    'STATUS', 'CLOCK OUT LOCATION', 'WORK SCHEDULES', 'PAID TIME', 'NOTES'
  ];

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        let url = `attendances/?employee=${id}`;
        if (filters.month !== 'All') url += `&month=${filters.month}`;
        if (filters.year !== 'All') url += `&year=${filters.year}`;
        if (filters.status !== 'All') url += `&status=${filters.status.toLowerCase()}`;
        
        const res = await axiosPrivate.get(url);
        const resuser = await axiosPrivate.get(`employees/${id}`);

        setEmployee(resuser.data);
        const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setAttendance(list);
      } catch (err) {
        console.error("Failed to load attendance", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, filters, axiosPrivate]);

  // Calculate dynamic summary
  const summaryData = {
    total: attendance.length,
    present: attendance.filter(a => a.status?.toLowerCase() === 'present' || a.status?.toLowerCase() === 'late').length,
    absent: attendance.filter(a => a.status?.toLowerCase() === 'absent').length,
    late: attendance.filter(a => a.status?.toLowerCase() === 'late').length,
    leave: attendance.filter(a => a.status?.toLowerCase() === 'permission' || a.status?.toLowerCase() === 'leave').length,
  };

  const cards = [
    { Title: "Total Days", and: "days", color: "bg-indigo-500", logo: "Calendar", data: summaryData.total },
    { Title: "Present", and: "days", color: "bg-emerald-500", logo: "CheckCircle", data: summaryData.present },
    { Title: "Absent", and: "days", color: "bg-rose-500", logo: "XCircle", data: summaryData.absent },
    { Title: "Late", and: "days", color: "bg-amber-500", logo: "Clock", data: summaryData.late },
    { Title: "Leave", and: "days", color: "bg-blue-500", logo: "UserCheck", data: summaryData.leave },
  ];

  if (loading && !employee) return <div className="p-6">Loading attendance details...</div>;
  if (!employee) return <div className="p-6">Employee not found.</div>;

  const generalData = employee.general || {};
  const jobData = employee.job || {};

  return (
    <div className="p-6 flex flex-col space-y-6 hover-bar overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            ←
          </button>
          <img 
            src={typeof generalData.photo === 'string' && generalData.photo.startsWith('http') ? generalData.photo : `${BASE_URL}${generalData.photo ? generalData.photo : '/pic/avatar.jpg'}`} 
            className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm" 
            alt="Profile" 
            onError={(e) => {e.target.src="/pic/avatar.jpg"}}
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{generalData.fullname || employee?.fullname || "Employee"}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {jobData.jobtitle || employee?.jobtitle || "N/A"} • {jobData.department || employee?.department || "N/A"}
            </p>
          </div>
        </div>
      </div>

      <SummaryCard data={cards} />
      
      <Filters filters={filters} setFilters={setFilters} />
      
      <div className="flex-1 bg-white dark:bg-slate-700 rounded-lg shadow-sm border min-h-fit dark:border-slate-600 scrollbar-hidden overflow-auto">
        <div className="min-w-[1000px] h-full">
            <Table 
              Data={attendance} 
              title={title} 
              Structure={structure} 
              ke={ke2} 
              totPage={Math.ceil(attendance.length / 10) || 1}
            />
        </div>
      </div>
    </div>
  );
}
