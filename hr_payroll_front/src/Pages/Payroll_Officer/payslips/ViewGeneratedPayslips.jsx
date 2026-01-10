import React, { useEffect ,useState} from 'react'
import Table from '../../../Components/Table'
import Header from '../../../Components/Header'
import {SearchStatus, ViewEditPayslips} from '../../../Components/Level2Hearder'
import { useNavigate } from "react-router-dom";
import PayslipTemplate from '../../../Components/PayslipTemplate';
function ViewGeneratedPayslips() {
useEffect(()=>{
});
const navigate = useNavigate();
const onRowClick=(id)=>{
    navigate(`/hr_dashboard/Employee_Attendance/${id}`, {state: id})
        console.log(id)
}
const structure=[3,1,1,1,1,1,1,65];
const ke2=[
  [ "employee_pic", "employee_name","employee_id",], 
  ["employee_jobTitle"], 
  ["employee_bankAccount"], 
  ["gross"], 
  ["totalDeductions"], 
  ["paymentDate"],
  ["paymentMethod"], 
  ["view"], 
]
const title=['EMPLOYEE','JOB TITLE','BANK ACCOUNT','GROSS','TOTAL DEDUCTIONS','PAYMENT DATE','PAYMENT METHOD',"ACTION"]

const attendanceData = [
  {
    "company": {
      "address": "1 Example Street",
      "email": "hr@acme.test",
      "logoUrl": "",
      "name": "ACME Corp",
      "phone": "+251 555 123"
    },
    "deductions": [
      { "label": "Income Tax (10%)", "amount": 2500 },
      { "label": "Pension (3%)", "amount": 750 }
    ],
    "earnings": [
      { "label": "Basic Salary", "amount": 20000 },
      { "label": "Allowance", "amount": 4000 },
      { "label": "Bonus", "amount": 1000 }
    ],
    "employee": {
      "name": "John Doe",
      "id": "EMP001",
      "department": "Finance",
      "jobTitle": "Accountant",
      "bankAccount": "0011223344"
    },
    "gross": 25000,
    "totalDeductions": 3250,
    "net": 21750,
    "month": "2025-12",
    "paymentDate": "12/15/2025",
    "paymentMethod": "Bank Transfer"
  },
  {
    "company": {
      "address": "1 Example Street",
      "email": "hr@acme.test",
      "logoUrl": "",
      "name": "ACME Corp",
      "phone": "+251 555 123"
    },
    "deductions": [
      { "label": "Income Tax (10%)", "amount": 3200 },
      { "label": "Pension (3%)", "amount": 960 }
    ],
    "earnings": [
      { "label": "Basic Salary", "amount": 28000 },
      { "label": "Allowance", "amount": 3000 },
      { "label": "Bonus", "amount": 2000 }
    ],
    "employee": {
      "name": "Jane Smith",
      "id": "EMP002",
      "department": "Marketing",
      "jobTitle": "Marketing Manager",
      "bankAccount": "0055667788"
    },
    "gross": 33000,
    "totalDeductions": 4160,
    "net": 28840,
    "month": "2025-12",
    "paymentDate": "12/15/2025",
    "paymentMethod": "Bank Transfer"
  },
  {
    "company": {
      "address": "1 Example Street",
      "email": "hr@acme.test",
      "logoUrl": "",
      "name": "ACME Corp",
      "phone": "+251 555 123"
    },
    "deductions": [
      { "label": "Income Tax (10%)", "amount": 1800 },
      { "label": "Pension (3%)", "amount": 540 }
    ],
    "earnings": [
      { "label": "Basic Salary", "amount": 15000 },
      { "label": "Allowance", "amount": 2500 },
      { "label": "Bonus", "amount": 500 }
    ],
    "employee": {
      "name": "Michael Brown",
      "id": "EMP003",
      "department": "IT",
      "jobTitle": "Software Developer",
      "bankAccount": "0099887766"
    },
    "gross": 18000,
    "totalDeductions": 2340,
    "net": 15660,
    "month": "2025-12",
    "paymentDate": "12/15/2025",
    "paymentMethod": "Bank Transfer"
  }
]
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
      // console.log("Dynamic URL:", dynamicURL);
    return (
    <div className='p-4 flex flex-col  overflow-hidden h-full'>
        <Header Title={"View/Edit Payslips"}/>
        <ViewEditPayslips onFiltersChange={updateFilter} />
        {/* <Table URL={"/attendances/"} Data={[]}  title={title} Structure={structure} ke={ke2} onRowClick={onRowClick} totPage={10}/> */}
        
        {/* <Table Data={attendanceData} URL={dynamicURL} title={title} Structure={structure} ke={ke2} onRowClick={onRowClick} totPage={10} /> */}
        <Table components={PayslipTemplate} clickable={false} Data={attendanceData} title={title} Structure={structure} ke={ke2} onRowClick={onRowClick} totPage={10} />
    </div>
  )
}

export default ViewGeneratedPayslips