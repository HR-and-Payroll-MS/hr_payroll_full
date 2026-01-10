import React from 'react';
import Icon from './Icon';

/**
 * RecentActivitiesTable - Displays top 5 recent activities in the system
 * Used in the Dashboard to show a compact list of recent actions
 */
function RecentActivitiesTable({ activities = [], loading = false }) {
  
  // Format timestamp to relative time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  
  // Get icon color based on activity type
  const getTypeColor = (type) => {
    switch (type) {
      case 'notification': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      case 'leave': return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
      case 'attendance': return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case 'payroll': return 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="w-full animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-40"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="w-full text-center py-8">
        <Icon name="Inbox" className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Recent Activities
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Last updated just now
        </span>
      </div>
      
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {activities.map((activity, index) => (
          <div 
            key={index}
            className="flex items-center gap-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg px-2 -mx-2 cursor-pointer group"
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(activity.type)}`}>
              <Icon name={activity.icon || 'Activity'} className="w-5 h-5" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {activity.title}
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {activity.description}
              </p>
            </div>
            
            {/* Meta */}
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatTime(activity.timestamp)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
                {activity.user}
              </p>
            </div>
            
            {/* Hover indicator */}
            <Icon 
              name="ChevronRight" 
              className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" 
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentActivitiesTable;
