import React from "react";

export default function AttendanceTable({ data = [], loading }) {
  return (
    <div className="bg-white border rounded shadow-sm overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-slate-500 bg-slate-50">
          <tr>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Check-in</th>
            <th className="px-4 py-2">Check-out</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Working Hours</th>
            <th className="px-4 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-6 text-slate-400">
                Loading attendance...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-6 text-slate-400">
                No records found.
              </td>
            </tr>
          ) : (
            data.map((a) => (
              <tr key={a.date} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2">{a.date}</td>
                <td className="px-4 py-2">{a.checkIn || "-"}</td>
                <td className="px-4 py-2">{a.checkOut || "-"}</td>
                <td className={`px-4 py-2 font-medium ${
                  a.status === "Present"
                    ? "text-green-600"
                    : a.status === "Absent"
                    ? "text-red-500"
                    : a.status === "Late"
                    ? "text-yellow-600"
                    : "text-slate-600"
                }`}>
                  {a.status}
                </td>
                <td className="px-4 py-2">{a.hours || "-"}</td>
                <td className="px-4 py-2">{a.notes || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
