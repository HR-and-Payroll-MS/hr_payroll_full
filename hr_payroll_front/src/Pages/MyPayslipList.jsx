import React from "react";
import PayslipTemplate from "../Components/PayslipTemplate";

function MyPayslipList({ payslips, onView }) {
  const mockdata=payslips||{
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
      // <PayslipTemplate payroll={mockdata} isEditable={false} />
    <div className="bg-white p-4 shadow rounded-lg">
      {console.log("Rendering MyPayslipList with payslips:", payslips)}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-3">Month</th>
            <th className="p-3">Net Salary</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {payslips.map((p) => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{p.month}</td>
              <td className="p-3">${p.net.toLocaleString()}</td>
              <td className="p-3">
                <button
                  onClick={() => onView(p)}
                  className="text-blue-600 underline"
                >
                  View Payslip
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MyPayslipList;
