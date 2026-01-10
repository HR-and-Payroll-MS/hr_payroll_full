import React, { useState } from 'react'
import Header from '../../../Components/Header';
import { SearchStatus } from '../../../Components/Level2Hearder';
import Table from '../../../Components/Table';
import { useNavigate } from 'react-router-dom';
const employeeAttendanceMock = 
   [
  {
    id:1,
    employee: {
      name: "John Doe",
      email: "john.doe@example.com",
      pic: ""
    },
    attendance:{
    date: "2025-11-23",
    clockIn: "08:59 AM",
    clockInLocation: "HQ Office - Main Gate",
    clockOut: "05:02 PM",
    clockOutLocation: "HQ Office - Side Exit",
    workSchedules: "9:00 AM - 5:00 PM",
    paidTime: "8h 03m",
    notes: "On time",}
  },
  {
    id:2,
    employee: {
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      pic: ""
    },
    
    attendance:{date: "2025-11-23",
    clockIn: "09:17 AM",
    clockInLocation: "Remote - Addis Ababa",
    clockOut: "06:00 PM",
    clockOutLocation: "Remote - Addis Ababa",
    workSchedules: "9:00 AM - 5:00 PM",
    paidTime: "7h 43m",
    notes: "Late arrival explained"}
  },
  {
    id:3,
    employee: {
      name: "Daniel Mekonnen",
      email: "daniel.mekonnen@example.com",
      pic: ""
    },
    attendance:{date: "2025-11-23",
    clockIn: "07:55 AM",
    clockInLocation: "Warehouse Entry Point 2",
    clockOut: "04:10 PM",
    clockOutLocation: "Warehouse Exit Point 1",
    workSchedules: "8:00 AM - 4:00 PM",
    paidTime: "8h 15m",
    notes: "Overtime 15 minutes"}
  }
];
function ViewEmployeeSalaryInfo({employeeData}) {
  const navigate = useNavigate();

  const onRowClick = (id) => {
    navigate(`/payroll/users/${id}`, {state:{Role:"payroll"}});
  };

const [filters, setFilters] = useState({});
    
    function updateFilter(obj){
        const key = Object.keys(obj)[0];
        const value = obj[key]
        setFilters(prev =>{
            if(value == null || value === "" ){
                const {[key]:removed, ...rest}=prev;
                return rest;
            }
            return {...prev,[key]:value};
        });
    }
    
    
      const queryString = new URLSearchParams(
        Object.entries(filters).filter(([k,v]) => v && v !== "")
      ).toString();
    
      const dynamicURL = queryString ? `/employees/?${queryString}` : "/employees/";
      console.log("Dynamic URL:", dynamicURL);

  const structure = [3,1,1,1,1,1];
  const ke2 = [
    ["general_photo", "general_fullname", "general_emailaddress"],
    ["general_phonenumber"],
    ["job_joindate"],
    ["general_gender"],
    ["payroll_employeestatus"],
    ["general_maritalstatus"],
  ];
  const title = ['USER','PHONE','JOIN DATE','GENDER','STATUS','MARITAL STATUS'];

  return (
    <div className='p-4 flex flex-col h-full'>
      <Header Title="Employee Directory" subTitle="view all employees and click to view detail"/>
      <SearchStatus onFiltersChange={updateFilter} />
        {console.log(dynamicURL)}
      <Table Data={employeeAttendanceMock}  title={title} Structure={structure} ke={ke2} onRowClick={onRowClick} totPage={10} />
    </div>
    // URL={dynamicURL}
  );
}

export default ViewEmployeeSalaryInfo