import { NavLink, Outlet } from 'react-router-dom';
import Header from '../../Components/Header';
import Icon from '../../Components/Icon';
import { Command, HelpCircle, Network } from 'lucide-react';
// no longer need role-based mapping; keep HelpCenter simple

export default function HelpCenter() {
  // Keep HelpCenter links relative to the current parent route.
  const middle = (
    <div
      id="middle"
      className="flex bg-white dark:bg-slate-800 w-full flex-col h-full p-2 gap-2 transition-colors"
    >
      <div id="child1">
        <NavLink
          to="shortcut"
          className={({ isActive }) =>
            `flex dark:hover:bg-slate-700 rounded-md w-full hover:bg-slate-50 justify-between items-center transition-all ${
              isActive ? 'bg-slate-100 dark:bg-slate-700 shadow-sm' : ''
            }`
          }
        >
          <div className="flex items-center gap-1.5 justify-start p-2 rounded">
            <Command size={18} className="opacity-40 dark:text-slate-200" />
            <p className="font-bold text-gray-700 dark:text-slate-200 text-xs">
              Keyboard Shortcut
            </p>
          </div>
        </NavLink>
      </div>

      <div id="child">
        <NavLink
          to="FAQ"
          className={({ isActive }) =>
            `flex dark:hover:bg-slate-700 hover:bg-slate-50 rounded-md w-full justify-between items-center transition-all ${
              isActive ? 'bg-slate-100 dark:bg-slate-700 shadow-sm' : ''
            }`
          }
        >
          <div className="flex items-center gap-1.5 justify-start p-2 rounded">
            <HelpCircle size={18} className="opacity-40 dark:text-slate-200" />
            <p className="font-bold text-gray-700 dark:text-slate-200 text-xs">
              Frequently Asked Questions
            </p>
          </div>
        </NavLink>
      </div>

      <div id="child">
        <NavLink
          to="ORG_chart_page"
          className={({ isActive }) =>
            `flex dark:hover:bg-slate-700 hover:bg-slate-50 rounded-md w-full justify-between items-center transition-all ${
              isActive ? 'bg-slate-100 dark:bg-slate-700 shadow-sm' : ''
            }`
          }
        >
          <div className="flex items-center gap-1.5 justify-start p-2 rounded">
            <Network size={18} className="opacity-40 dark:text-slate-200" />
            <p className="font-bold text-gray-700 dark:text-slate-200 text-xs">
              ORG Chart
            </p>
          </div>
        </NavLink>
      </div>

      <div id="child">
        <NavLink
          to="policies"
          className={({ isActive }) =>
            `flex dark:hover:bg-slate-700 hover:bg-slate-50 rounded-md w-full justify-between items-center transition-all ${
              isActive ? 'bg-slate-100 dark:bg-slate-700 shadow-sm' : ''
            }`
          }
        >
          <div className="flex items-center gap-1.5 justify-start p-2 rounded">
            <Icon
              name="FileText"
              size={18}
              className="opacity-40 dark:text-slate-200"
            />
            <p className="font-bold text-gray-700 dark:text-slate-200 text-xs">
              Policies
            </p>
          </div>
        </NavLink>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 w-full p-2 h-full justify-start dark:bg-slate-900 bg-gray-50 overflow-hidden">
      <div className="flex justify-evenly shrink-0">
        <Header
          Title={'Help Center'}
          Breadcrub={'Find guides and shortcuts here'}
        />
      </div>

      <div className="flex flex-1 gap-5 rounded-md overflow-hidden">
        {/* Left Sidebar - Contains your {middle} */}
        <div className="h-full shadow rounded-md dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 w-1/5 overflow-y-auto scrollbar-hidden transition-all">
          {middle}
        </div>

        {/* Right Content - Properly contained for scrolling */}
        <div className="flex rounded-md shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 flex-1 h-full dark:bg-slate-800 bg-white overflow-hidden transition-all">
          <div className="h-full w-full overflow-y-auto scrollbar-hidden">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
