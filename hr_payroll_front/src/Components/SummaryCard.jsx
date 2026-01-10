import React from 'react';
import Icon from './Icon';

/**
 * SummaryCard - Dashboard summary cards displaying key metrics
 * Accepts dynamic data from DashboardContext
 */
function SummaryCard({ data = [], loading = false, classname = "bg-white text-slate-800" }) {
  
  // Default data if none provided (for backwards compatibility)
  const defaultData = [
    { title: 'Total Employees', value: '--', subtitle: 'loading', icon: 'Users', color: 'bg-blue-500' },
    { title: 'Pending Requests', value: '--', subtitle: 'loading', icon: 'Calendar', color: 'bg-amber-500' },
    { title: 'Monthly Payroll', value: '--', subtitle: 'loading', icon: 'DollarSign', color: 'bg-green-500' },
    { title: 'Departments', value: '--', subtitle: 'loading', icon: 'Building2', color: 'bg-indigo-500' },
  ];
  
  const displayData = data && data.length > 0 ? data : defaultData;
  
  if (loading) {
    return (
      <div className="flex py-2.5 flex-2 gap-3 shadow p-4 justify-around items-center dark:shadow dark:shadow-slate-900 bg-slate-50 dark:bg-slate-700 rounded dark:inset-shadow-xs dark:inset-shadow-slate-600 w-full">
        {[...Array(4)].map((_, index) => (
          <div 
            key={index} 
            className="group flex bg-white overflow-hidden min-h-32 dark:bg-slate-800 dark:shadow dark:shadow-slate-900 dark:inset-shadow-xs dark:inset-shadow-slate-600 shadow flex-1 flex-col items-start justify-start gap-4 px-5 py-4 rounded-xl relative animate-pulse"
          >
            <div className="flex w-full justify-between items-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-xl"></div>
            </div>
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex py-2.5 flex-2 gap-3 shadow p-4 justify-around items-center dark:shadow dark:shadow-slate-900 bg-slate-50 dark:bg-slate-700 rounded dark:inset-shadow-xs dark:inset-shadow-slate-600 w-full">
      {displayData.map((info, index) => (
        <div 
          key={index} 
          className={`group flex ${classname} overflow-hidden min-h-32 hover:cursor-pointer dark:bg-slate-800 dark:shadow dark:shadow-slate-900 dark:inset-shadow-xs dark:inset-shadow-slate-600 shadow flex-1 flex-col dark:text-slate-300 text-gray-700 items-start justify-between gap-3 px-5 py-4 rounded-xl relative transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
        >
          {/* Header */}
          <div className="flex w-full justify-between items-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {info.title || info.Title}
            </p>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${info.color || 'bg-blue-500'} bg-opacity-90 shadow-sm`}>
              <Icon 
                name={info.icon || info.logo || 'Activity'} 
                className="w-5 h-5 text-white" 
              />
            </div>
          </div>
          
          {/* Value */}
          <div>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {info.value !== undefined ? info.value : info.data}
            </p>
            <p className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">
              {info.subtitle || info.and}
            </p>
          </div>
          
          {/* Bottom accent line */}
          <span className={`absolute left-1/2 bottom-0 w-0 h-[3px] ${info.color || 'bg-blue-500'} transition-all duration-500 group-hover:w-full group-hover:left-0`}></span>
        </div>
      ))}
    </div>
  );
}

export default SummaryCard;
