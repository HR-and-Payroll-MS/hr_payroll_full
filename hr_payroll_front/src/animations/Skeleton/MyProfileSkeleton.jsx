import React from 'react';

function MyProfileSkeleton() {
  return (
    <div className="flex flex-col w-full h-full bg-slate-50 dark:bg-slate-900">
      {/* Profile Header Skeleton */}
      <div className="w-full bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Cover Photo */}
        <div className="h-34 bg-gray-200 dark:bg-gray-700 animate-shimmer"></div>

        <div className="relative px-6 -mt-14">
          {/* Profile Picture */}
          <div className="relative inline-block">
            <div className="w-28 h-28 rounded-full bg-gray-300 dark:bg-gray-600 border-4 border-white shadow animate-shimmer"></div>
            <div className="absolute bottom-1 right-1 w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full animate-shimmer"></div>
          </div>

          <div className="flex justify-between mt-6 pb-4">
            {/* Left: Name & Title */}
            <div className="space-y-2">
              <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-64 animate-shimmer"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-48 animate-shimmer"></div>
            </div>

            {/* Middle: Contact Info */}
            <div className="flex-1 flex justify-center">
              <div className="space-y-3 max-w-xs w-full">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-40 animate-shimmer"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Department, Office, Manager */}
            <div className="flex gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-500 rounded w-20 animate-shimmer"></div>
                  <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-shimmer"></div>
                  {i === 2 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 animate-shimmer"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-28 animate-shimmer"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step Tabs */}
      <div className="mt-6 px-4">
        <div className="flex gap-8 border-b border-gray-200 dark:border-slate-700 pb-2">
          {['General', 'Job', 'Payroll', 'Documents'].map((_, i) => (
            <div
              key={i}
              className={`pb-3 px-2 border-b-3 ${
                i === 0 ? 'border-green-700' : 'border-transparent'
              }`}
            >
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-shimmer"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Area (General Step Example) */}
      <div className="flex-1 mt-6 mx-4 mb-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 h-full">
          {/* Section Title + Edit Button */}
          <div className="flex justify-between items-center mb-6">
            <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-48 animate-shimmer"></div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
          </div>

          {/* Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-32 animate-shimmer"></div>
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-shimmer"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyProfileSkeleton;