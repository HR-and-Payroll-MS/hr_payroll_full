import React from 'react';
import SummaryCardSkeleton from './SummaryCardSkeleton';

function DashboardLayoutSkeleton() {
  return (
    <div className="h-full w-full p-6 flex flex-col gap-8 overflow-y-auto scrollbar-hidden bg-slate-50 dark:bg-slate-900">
      {/* Welcome Overlay Placeholder - optional, only if first-time */}
      <div className="h-96 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl animate-shimmer"></div>

      {/* Summary Cards Row */}
      <div className="w-full">
        <SummaryCardSkeleton />
      </div>

      {/* Charts Row - Bar, Line, Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="h-7 bg-gray-300 dark:bg-slate-600 rounded w-48 animate-shimmer mb-6"></div>
          <div className="h-80 bg-gray-100 dark:bg-slate-900 rounded-xl animate-shimmer"></div>
        </div>

        {/* Line Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="h-7 bg-gray-300 dark:bg-slate-600 rounded w-48 animate-shimmer mb-6"></div>
          <div className="h-80 bg-gray-100 dark:bg-slate-900 rounded-xl animate-shimmer"></div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="h-7 bg-gray-300 dark:bg-slate-600 rounded w-48 animate-shimmer mb-6"></div>
          <div className="h-80 bg-gray-100 dark:bg-slate-900 rounded-xl animate-shimmer"></div>
        </div>
      </div>

      {/* Recent Employees Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="h-8 bg-gray-300 dark:bg-slate-600 rounded w-64 animate-shimmer"></div>
        </div>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                {['USER', 'PHONE', 'DEPARTMENT', 'GENDER', 'STATUS', 'TYPE'].map((_, i) => (
                  <th key={i} className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                    <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-24 animate-shimmer"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-100 dark:border-slate-700">
                  {/* USER column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-slate-600 animate-shimmer"></div>
                      <div className="space-y-2">
                        <div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-48 animate-shimmer"></div>
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-64 animate-shimmer"></div>
                      </div>
                    </div>
                  </td>
                  {/* Other columns */}
                  <td className="px-6 py-4"><div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-32 animate-shimmer"></div></td>
                  <td className="px-6 py-4"><div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-40 animate-shimmer"></div></td>
                  <td className="px-6 py-4"><div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-20 animate-shimmer"></div></td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-20 rounded-full bg-amber-200 dark:bg-amber-900 animate-shimmer"></div>
                  </td>
                  <td className="px-6 py-4"><div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-36 animate-shimmer"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row - 3 Small Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 h-48 animate-shimmer"></div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 h-48 animate-shimmer"></div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 h-48 animate-shimmer"></div>
      </div>
    </div>
  );
}

export default DashboardLayoutSkeleton;