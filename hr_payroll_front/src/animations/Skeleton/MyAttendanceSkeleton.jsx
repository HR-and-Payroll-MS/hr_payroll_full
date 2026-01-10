import React from 'react';

function MyAttendanceSkeleton() {
  return (
    <div className="p-6 space-y-8 h-full bg-slate-50 dark:bg-slate-900">
      {/* Title & Subtitle */}
      <div className="space-y-3">
        <div className="h-9 bg-gray-300 dark:bg-slate-600 rounded-lg w-80 animate-shimmer"></div>
        <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-full max-w-lg animate-shimmer"></div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="h-6 bg-gray-300 dark:bg-slate-600 rounded w-36 animate-shimmer"></div>
                <div className="h-10 bg-gray-300 dark:bg-slate-600 rounded w-28 animate-shimmer"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-xl animate-shimmer"></div>
            </div>
            {/* Bottom accent bar (like hover effect) */}
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-200 dark:bg-slate-600 animate-shimmer"></div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Pie / Donut Chart Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="h-7 bg-gray-300 dark:bg-slate-600 rounded w-64 animate-shimmer mb-6"></div>
          <div className="h-96 bg-gray-100 dark:bg-slate-900 rounded-2xl animate-shimmer"></div>
        </div>

        {/* Right: Attendance Calendar (Heatmap Style) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="h-7 bg-gray-300 dark:bg-slate-600 rounded w-64 animate-shimmer mb-6"></div>

          {/* Calendar Navigation */}
          <div className="flex justify-between items-center mb-8">
            <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg animate-shimmer"></div>
            <div className="h-7 bg-gray-300 dark:bg-slate-600 rounded w-48 animate-shimmer"></div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg animate-shimmer"></div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 text-center text-sm mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((_, i) => (
              <div key={i} className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-shimmer"></div>
            ))}
          </div>

          {/* Calendar Grid (5 weeks ≈ 35 days) */}
          <div className="grid grid-cols-7 gap-3">
            {[...Array(35)].map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-gray-100 dark:bg-slate-900 animate-shimmer flex items-center justify-center"
              >
                <div className="h-5 w-5 bg-gray-300 dark:bg-slate-600 rounded animate-shimmer"></div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-8 mt-8">
            {['Present', 'Absent', 'Late', 'Permission'].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-gray-300 dark:bg-slate-600 animate-shimmer"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20 animate-shimmer"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyAttendanceSkeleton;