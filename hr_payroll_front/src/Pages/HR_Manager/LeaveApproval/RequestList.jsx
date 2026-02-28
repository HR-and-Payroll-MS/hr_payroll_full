import React from 'react';
import { Search } from 'lucide-react';
import InputField from '../../../Components/InputField';
import Dropdown from '../../../Components/Dropdown';
import { ApproveReject } from '../../../Components/Level2Hearder';

export default function RequestList({
  requests,
  employees,
  filter,
  setFilter,
  onOpen,
}) {
  const status = [
    { content: 'all', svg: null, placeholder: true },
    { content: 'pending', svg: null },
    { content: 'approved', svg: null },
    { content: 'denied', svg: null },
  ];

  return (
    <div className="flex flex-col h-full transition-colors">
      {/* Filter Header Area */}
      <div className="p-4 border-b border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex gap-2">
          <ApproveReject FiltersChange={setFilter} />
        </div>
      </div>

      {/* Scrollable List Area */}
      <div className="flex-1 p-2 space-y-3 overflow-auto scrollbar-hidden">
        {requests.map((req) => {
          // prefer global employees list, fallback to per-request employee_info
          const empFromList = employees.find((e) => e.id === req.employeeId);
          const empFromReq = req.employee_info
            ? {
                id: req.employee_info.id,
                name: req.employee_info.fullname || 'Unknown',
                dept: req.employee_info.department || 'N/A',
                photo: req.employee_info.photo || null,
              }
            : null;

          const emp = empFromList ||
            empFromReq || { name: 'Unknown', dept: 'N/A' };

          return (
            <div
              key={req.id}
              onClick={() => onOpen(req)}
              className="group relative p-4 bg-white dark:bg-slate-700/50 rounded shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700  transition-all active:scale-[0.99]"
            >
              {/* Status Indicator Bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${
                  req.status === 'approved'
                    ? 'bg-emerald-500'
                    : req.status === 'denied'
                      ? 'bg-red-500'
                      : 'bg-slate-500'
                }`}
              />

              <div className="flex justify-between items-start pl-2 gap-3">
                {/* Profile Picture / Avatar */}
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600 ${
                    !emp.photo ? 'bg-indigo-100 text-indigo-600' : 'bg-white'
                  }`}
                >
                  {emp.photo ? (
                    <img
                      src={
                        emp.photo.startsWith('http')
                          ? emp.photo
                          : `${
                              import.meta.env.VITE_BASE_URL ||
                              import.meta.env.VITE_API_URL ||
                              ''
                            }${emp.photo}`
                      }
                      alt={emp.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-sm">
                      {emp.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 truncate">
                    {emp.name}
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 rounded shrink-0">
                      {emp.dept}
                    </span>
                  </div>

                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1 truncate">
                    {req.type} •{' '}
                    <span className="text-xs">
                      {new Date(req.startDate).toLocaleDateString()} —{' '}
                      {new Date(req.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-1">
                    {req.reason}
                  </div>
                </div>

                <div className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-green-500 transition-colors shrink-0 pt-1">
                  View →
                </div>
              </div>
            </div>
          );
        })}

        {requests.length === 0 && (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm italic">
            No requests found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
