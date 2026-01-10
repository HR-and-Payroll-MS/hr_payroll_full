import React from 'react';

function EmployeeAttendanceListSkeleton() {
  return (
    <div className="p-4 flex flex-col overflow-hidden h-full">
      {/* Back Button + Department Title (Employee Mode) */}
      <div className="flex gap-4 items-center mb-4">
        <div className="px-6 py-2 bg-gray-300 dark:bg-gray-600 rounded w-28 h-10 animate-shimmer"></div>
        <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-72 animate-shimmer"></div>
      </div>

      {/* Filters Bar */}
      <div className="flex py-2.5 gap-3 justify-between items-center mb-4">
        <div className="flex-1 max-w-md">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 animate-shimmer"></div>
        </div>
        <div className="flex gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-36 h-10 bg-gray-200 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 animate-shimmer"></div>
          ))}
        </div>
      </div>

      {/* Employee Table Skeleton (wider columns) */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
            <tr>
              {[
                'EMPLOYEE', 'DATE', 'CLOCK IN', 'CLOCK IN LOCATION',
                'CLOCK OUT', 'STATUS', 'CLOCK OUT LOCATION',
                'WORK SCHEDULES',
              ].map((_, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-shimmer"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100 dark:border-slate-700">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 animate-shimmer"></div>
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-40 animate-shimmer"></div>
                  </div>
                </td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-20 animate-shimmer"></div></td>
                <td className="px-4 py-3">
                  <div className="h-6 w-16 bg-amber-200 dark:bg-amber-900 rounded-full animate-shimmer"></div>
                </td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-32 animate-shimmer"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-20 animate-shimmer"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-20 animate-shimmer"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-48 animate-shimmer"></div></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmployeeAttendanceListSkeleton;