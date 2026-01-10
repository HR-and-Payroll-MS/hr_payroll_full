import React from "react";
import FileDrawer from "../../../Components/FileDrawer"
import MyPayslipList from "../../MyPayslipList";
import PayslipTemplate from "../../../Components/PayslipTemplate";

function MyPayslipDrawer({ data }) {
  const mockdata={
   "company": {
     "name": "ACME Corp",
     "address": "1 Example Street",
     "phone": "+251 555 123",
     "email": "hr@acme.test",
     "logoUrl": ""
   },
   "employee": {
     "name": "John Doe",
     "id": "EMP001",
     "department": "Finance",
     "jobTitle": "Accountant",
     "bankAccount": "0011223344"
   },
   "month": "2025-12",
   "paymentMethod": "Bank Transfer",
   "paymentDate": "12/15/2025",
   "earnings": [
     { "label": "Basic Salary", "amount": 15000 },
     { "label": "Housing Allowance", "amount": 5000 },
     { "label": "Transport Allowance", "amount": 5000 }
   ],
   "deductions": [
     { "label": "Tax", "amount": 2000 },
     { "label": "Pension", "amount": 1250 }
   ],
   "gross": 25000,
   "totalDeductions": 3250,
   "net": 21750
 }
 
   return (
       <PayslipTemplate payroll={mockdata} isEditable={false} />
  );
}

export default MyPayslipDrawer;
