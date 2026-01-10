import React from "react";

function PayrollReportsTable({ reports, onView }) {
  return (
    <div className="bg-white p-4 shadow rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Month</th>
            <th className="p-3">Employees</th>
            <th className="p-3">Total Payout</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{r.month}</td>
              <td className="p-3">{r.totalEmployees}</td>
              <td className="p-3">${r.totalPayout.toLocaleString()}</td>
              <td className="p-3">{r.status}</td>
              <td className="p-3">
                <button
                  onClick={() => onView(r)}
                  className="text-blue-600 underline"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PayrollReportsTable;
