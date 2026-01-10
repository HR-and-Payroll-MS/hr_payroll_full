import React from "react";

export default function AttendanceFilterBar({ filters, setFilters }) {
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const statuses = ["All", "Present", "Absent", "Late", "Leave"];

  return (
    <div className="flex flex-wrap gap-3 items-center bg-white border rounded p-3">
      <div>
        <label className="text-xs block">Month</label>
        <select
          value={filters.month}
          onChange={(e) => setFilters((f) => ({ ...f, month: +e.target.value }))}
          className="border rounded px-2 py-1 text-sm"
        >
          {months.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs block">Year</label>
        <select
          value={filters.year}
          onChange={(e) => setFilters((f) => ({ ...f, year: +e.target.value }))}
          className="border rounded px-2 py-1 text-sm"
        >
          {years.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs block">Status</label>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="border rounded px-2 py-1 text-sm"
        >
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
