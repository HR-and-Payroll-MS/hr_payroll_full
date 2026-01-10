import React from 'react';
import Header from '../../Components/Header';

function EmployeeDirectorySkeleton() {
  return (
    <div className="p-4 flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Header Skeleton */}
      <Header Title="" subTitle="">
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg w-10 h-9 flex items-center justify-center">
            <div className="w-5 h-5 bg-gray-300 dark:bg-slate-600 rounded-full animate-shimmer"></div>
          </button>
        </div>
      </Header>

      {/* Search & Filters Bar Skeleton */}
      <div className="flex py-2.5 gap-3 justify-between items-center mb-6">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-md border border-gray-300 dark:border-slate-600 animate-shimmer"></div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-32">
              <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-md border border-gray-300 dark:border-slate-600 animate-shimmer"></div>
            </div>
          ))}
        </div>

        {/* Extra placeholder (e.g., date picker) */}
        <div className="w-32">
          <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-md animate-shimmer"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="flex-1 mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <tr>
              {['USER', 'PHONE', 'JOIN DATE', 'GENDER', 'STATUS', 'MARITAL STATUS'].map((_, i) => (
                <th key={i} className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                  <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-24 animate-shimmer"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100 dark:border-slate-700">
                {/* USER column: photo + name + email */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-300 dark:bg-slate-600 rounded-full animate-shimmer"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-48 animate-shimmer"></div>
                      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-64 animate-shimmer"></div>
                    </div>
                  </div>
                </td>

                {/* PHONE */}
                <td className="px-4 py-4">
                  <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-32 animate-shimmer"></div>
                </td>

                {/* JOIN DATE */}
                <td className="px-4 py-4">
                  <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-24 animate-shimmer"></div>
                </td>

                {/* GENDER */}
                <td className="px-4 py-4">
                  <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-16 animate-shimmer"></div>
                </td>

                {/* STATUS */}
                <td className="px-4 py-4">
                  <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-20 animate-shimmer"></div>
                </td>

                {/* MARITAL STATUS */}
                <td className="px-4 py-4">
                  <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-32 animate-shimmer"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmployeeDirectorySkeleton;