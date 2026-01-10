import React from 'react';

function SummaryCardSkeleton() {
  return (
    <div className="flex gap-4 py-4 px-2">
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="group relative flex-1 min-h-32 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="flex flex-col gap-5 px-6 py-5 h-full justify-start">
            {/* Top: Title + Icon */}
            <div className="flex w-full justify-between items-start">
              <div className="h-6 bg-gray-300 dark:bg-slate-600 rounded w-40 animate-shimmer"></div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg animate-shimmer"></div>
            </div>

            {/* Bottom: Number + Unit */}
            <div className="h-8 bg-gray-300 dark:bg-slate-600 rounded w-32 animate-shimmer"></div>
          </div>

          {/* Bottom hover accent bar */}
          <span className="absolute left-1/2 bottom-0 w-0 h-1 bg-blue-500 dark:bg-blue-600 transition-all duration-500 group-hover:w-full group-hover:left-0 animate-shimmer"></span>
        </div>
      ))}
    </div>
  );
}

export default SummaryCardSkeleton;