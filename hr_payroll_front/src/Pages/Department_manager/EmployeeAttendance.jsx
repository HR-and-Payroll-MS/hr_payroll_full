import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import Header from '../../Components/Header';
import { AttendanceStatus } from '../../Components/Level2Hearder';
import Table from '../../Components/Table';
import EmployeeDirectorySkeleton from '../../animations/Skeleton/EmployeeDirectorySkeleton';
import useAuth from '../../Context/AuthContext';

function EmployeeAttendance() {
  const { axiosPrivate } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axiosPrivate.get('/attendances/manager/department/');
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch department attendance", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [axiosPrivate]);

  const handleRowClick = (rowData, index, fullArray) => {
      // rowData is last cell? No, Table logic varies. 
      // Safest is to use fullArray[index]
      const row = fullArray[index];
      if (row && row.employee_id) {
          navigate(`${row.employee_id}`); // Relative path to :id
      }
  };

  const structure = [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const ke2 = [
    ["employee_photo", "employee_name", "job_title"],
    ["date"],
    ["clock_in"],
    ["clock_in_location"],
    ["clock_out"],
    ["status"],
    ["clock_out_location"],
    ["work_schedule_hours"],
    ["paid_time"],
    ["notes"],
    ["view"],
  ];
  
  const title = [
    "EMPLOYEE",
    "DATE",
    "CLOCK IN",
    "CLOCK IN LOCATION",
    "CLOCK OUT",
    "STATUS",
    "CLOCK OUT LOCATION",
    "WORK SCHEDULES",
    "PAID TIME",
    "NOTES",
    "ACTION",
  ];

  if (loading) return <EmployeeDirectorySkeleton />;

  return (
    <div className='p-4 flex flex-col overflow-hidden h-full'>
        <Header Title={"Employee Attendance"} subTitle={"View all employee's Attendance. Click a row to view details."} />
        <AttendanceStatus />
        
        {data.length > 0 ? (
            <Table 
                clickable={true} 
                Data={data} 
                title={title} 
                Structure={structure} 
                ke={ke2} 
                pages ={9}
                totPage={Math.ceil(data.length / 10) || 1} 
                onRowClick={handleRowClick}
            />
        ) : (
            <div className="flex items-center justify-center flex-1 text-slate-500">
                No attendance records found for today.
            </div>
        )}
    </div>
  );
}

export default EmployeeAttendance;