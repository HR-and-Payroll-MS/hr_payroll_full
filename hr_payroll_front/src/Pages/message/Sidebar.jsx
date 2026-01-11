// message/Sidebar.jsx
import React from 'react';
import { Search, MoreVertical } from 'lucide-react';

const Sidebar = ({ activeId, setActiveId, users = [] }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterType, setFilterType] = React.useState('All'); // 'All' or 'Unread'

  const totalUnread = users.reduce((acc, u) => acc + (u.unread || 0), 0);
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' ? true : user.unread > 0;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-80 flex-shrink-0 bg-gray-50 dark:bg-slate-700 shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 rounded-lg flex flex-col h-full overflow-hidden border-r border-gray-200 dark:border-slate-800">
      {/* Search Header */}
      <div className="p-5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-xl py-3 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-gray-200 dark:border-slate-600 shadow-sm"
          />
          <Search className="absolute right-3 top-3 text-slate-400 w-5 h-5" />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 flex gap-6 text-sm font-medium pb-2">
        <button
          onClick={() => setFilterType('All')}
          className={`pb-2 ${
            filterType === 'All'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('Unread')}
          className={`pb-2 ${
            filterType === 'Unread'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <span>Unread</span>
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => setActiveId(user.id)}
            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors relative ${
              activeId === user.id
                ? 'bg-white dark:bg-slate-800 border-l-4 border-emerald-500 shadow-sm'
                : 'border-l-4 border-transparent'
            }`}
          >
            <div className="relative">
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${user.name}&background=random`
                }
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-slate-600"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${user.name}&background=random`;
                }}
              />
              {user.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-700"></div>
              )}
              {user.unread > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-md">
                  {user.unread > 9 ? '9+' : user.unread}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-slate-200 font-semibold text-sm truncate">
                  {user.name}
                </h3>
                <span className="text-xs text-slate-500">
                  {user.time || ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-xs truncate pr-2">
                  {user.msg || user.role}
                </p>
                {/* Role Badge if msg is empty or just generic badge */}
                {user.role && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
