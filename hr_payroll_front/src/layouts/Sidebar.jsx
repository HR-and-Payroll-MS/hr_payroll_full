import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../Context/ThemeContext';
import { sidebarList } from '../Hooks/useSidebarContent';
import useAuth from '../Context/AuthContext';
import Icon from '../Components/Icon';
import { getLocalData } from '../Hooks/useLocalStorage';
import { useNetwork } from '../Context/NetworkContext';
import useSocketEvent from '../Hooks/useSocketEvent';

export default function Sidebar() {
  const clockinPath = { 
    Payroll: "payroll", 
    Manager: "hr_dashboard", 
    Employee: "employee", 
    "Line Manager": "department_manager",
    Admin: "admin_dashboard" // Added Admin path just in case
  };

  const { auth, axiosPrivate, logout } = useAuth();
  const { isLocal, checking } = useNetwork();
  const role = auth?.user?.role;
  const navigate = useNavigate();
  
  // Initialize list from sidebarList
  const [list, setList] = useState([]);
  const [leaveCount, setLeaveCount] = useState(0);

  const [collapsed, setCollapsed] = useState(false);
  const { theme, changeTheme } = useTheme();
  const location = useLocation();

  // Initialize list when role changes
  useEffect(() => {
    const pRole = role === "Department Manager" ? "Manager" : role; // Handle mapped roles if needed
    // sidebarList keys: Payroll, Manager, Employee, "Line Manager", Admin
    const initialList = sidebarList[role] || sidebarList["Employee"] || [];
    setList(initialList);
    fetchLeaveCount();
  }, [role]);

  // Fetch Leave Count 
  const fetchLeaveCount = useCallback(async () => {
    if (!role) return;
    try {
      // Determine actionable statuses based on role
      let actionableStatuses = [];
      
      const isHR = auth?.user?.employee?.position?.toLowerCase().includes('hr') || 
                   auth?.user?.employee?.position?.toLowerCase().includes('human resources') ||
                   role === 'Payroll'; // Payroll might also act as HR

      if (role === 'Manager' || role === 'Line Manager' || role === 'Department Manager' || role === 'Admin') {
        actionableStatuses.push('pending');
      }
      
      if (isHR) {
        actionableStatuses.push('manager_approved');
      }

      if (actionableStatuses.length === 0) {
        setLeaveCount(0);
        return;
      }

      // Fetch each status and sum up
      let totalCount = 0;
      for (const status of actionableStatuses) {
        const response = await axiosPrivate.get(`/leaves/requests/?status=${status}`);
        const results = response.data.results || response.data || [];
        totalCount += results.length;
      }
      
      setLeaveCount(totalCount);
    } catch (error) {
        console.error("Failed to fetch leave count:", error);
    }
  }, [role, auth?.user?.employee?.position, axiosPrivate]);

  // Listen for real-time leave updates
  useSocketEvent('leave_updated', () => {
    fetchLeaveCount();
  });

  // Inject badge into list
  useEffect(() => {
    const isHR = auth?.user?.employee?.position?.toLowerCase().includes('hr') || 
                 auth?.user?.employee?.position?.toLowerCase().includes('human resources') ||
                 role === 'Payroll';

    setList(prevList => prevList.map(item => {
        // Show badge if item is Leave Management and user is a Manager or HR
        if (item.label === 'Leave Management' && (role === 'Manager' || role === 'Line Manager' || role === 'Department Manager' || isHR)) {
            return { ...item, badge: leaveCount };
        }
        return item;
    }));
  }, [leaveCount, role, auth?.user?.employee?.position]);


  const toggleVisible = (label) =>
    setList((prev) =>
      prev.map((item) =>
        item.label === label
          ? { ...item, Visible: !item.Visible, path: null }
          : item
      )
    );

  const handleIconClick = (path) => {
    if (collapsed) {
      setCollapsed(false);
    } else {
      return path;
    }
  };

  const top1 = (
    <div
      id="top"
      className="flex w-full justify-between items-center m-0.5 px-2.5"
    >
      <div className="flex items-center justify-center py-2.5">
        <img
          className={`h-9 transition-all duration-300 ${
            collapsed ? 'hidden' : 'block'
          }`}
          src="/pic/Robot Thumb Up with Artificial Intelligence.png"
          alt=""
        />
        {!collapsed && (
          <p className="dark:text-white font-bold text-gray-700 text-xl">
            HRDashboard
          </p>
        )}
      </div>

      <Icon
        name="PanelLeft"
        className="w-5 h-5 cursor-pointer text-slate-500 dark:text-slate-400"
        onClick={() => setCollapsed(!collapsed)}
      />
    </div>
  );

  const top2 = (
    <NavLink
      to=""
      id="top2"
      className={`bg-green-600 shadow rounded-md p-2.5 px-5 flex w-full justify-between items-center ${
        collapsed ? 'justify-center' : ''
      }`}
    >
      {!collapsed && (
        <p className="font-semibold text-white text-xs">Dashboard</p>
      )}
      <Icon name="LayoutDashboard" className="w-4 h-4 text-white" />
    </NavLink>
  );

  const middle1 = (
    <div id="middle" className="flex relative flex-col w-full flex-1 my-4 hover-bar overflow-y-auto gap-2" >
      {list.map((lists, index) =>
        lists.path ? (
          <div key={index} className="cursor-pointer">
            <NavLink
              to={collapsed ? '#' : lists.path} // prevent navigation when collapsed
              onClick={() => handleIconClick(lists.path)}
              end
              className={({ isActive }) =>
                `flex gap-1.5 rounded-md w-full items-center px-2.5 py-1.5 
                ${
                  isActive
                    ? 'bg-slate-200 shadow dark:bg-slate-700 text-green-700'
                    : 'hover:bg-slate-50 hover:dark:bg-slate-700'
                }
                ${collapsed ? 'justify-center' : 'justify-start'}
                transition-all`
              }
            >
              <div className="relative">
                <Icon
                    name={lists.Icons || 'User'}
                    className={`w-4 h-4 ${
                    location.pathname === lists.path
                        ? 'text-green-700'
                        : 'text-slate-400'
                    }`}
                />
                 {collapsed && lists.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                 )}
              </div>

              {!collapsed && (
                <div className="flex flex-1 items-center justify-between">
                    <p className="dark:text-slate-300 font-semibold text-gray-700 text-sm">
                    {lists.label}
                    </p>
                    {lists.badge > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                            {lists.badge}
                        </span>
                    )}
                </div>
              )}
            </NavLink>
          </div>
        ) : (
          <div key={index} className="cursor-pointer">
            <div 
              onClick={() => { if (collapsed) setCollapsed(false); else toggleVisible(lists.label);}}
              className={` ${lists.Visible ?"":'hover:bg-slate-50 dark:hover:bg-slate-700'} flex w-full ${collapsed ? 'justify-center' : 'justify-between'} items-center p-2.5 transition-all`}>
              <div className="flex items-center gap-1.5 justify-center">
                <div className="relative">
                    <Icon name={lists.Icons} className={`w-4 h-4 ${lists.Visible ? 'text-green-700' : 'text-slate-400'}`}/>
                    {collapsed && lists.badge > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    )}
                </div>
                {!collapsed && (
                  <p className="dark:text-slate-300 font-semibold text-gray-700 text-sm">
                    {lists.label}
                  </p>
                )}
              </div>
              {!collapsed && (
                 <div className="flex items-center gap-2">
                    {lists.badge > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                            {lists.badge}
                        </span>
                    )}
                    <Icon name="ChevronDown" className={`w-4 h-4 text-slate-400 transition-transform ${lists.Visible ? 'rotate-180' : ''}`}/>
                </div>
              )}
            </div>

            {/* sub-items */}
            {!collapsed && (
              <div className={`${lists.Visible ? 'flex' : 'hidden'}  dark:border-slate-500 ml-4 my-1.5  border-l  relative rounded border-gray-300 flex-col gap-1.5`}>
                {(lists.label === "Attendance")?( <>{
                checking ? (
        <div className='relative px-4.5'>
          <div className='absolute left-0 top-1/2 -translate-y-1/2 w-[30%] h-2 border-b-1  border-slate-300 dark:border-slate-500 rounded-full z-0 '/>
          <div className="relative z-10 px-3 py-1 rounded bg-yellow-50 text-sm text-yellow-800">Checking network...</div>
        </div>
        ) : (isLocal) ? (<div className='relative px-4.5 '>
                    <div className='absolute left-0 top-1/2 -translate-y-1/2 w-[30%] h-2 border-b-1 border-slate-300 dark:border-slate-500 rounded-full z-0 '/>
          <NavLink to={`/${clockinPath[role] || 'employee'}/clock_in`} end className={({ isActive }) => `relative z-10  flex rounded-md w-full justify-between items-center px-2.5 py-1.5 ${isActive? 'bg-slate-200 shadow dark:bg-slate-700' : 'hover:bg-slate-50 bg-white dark:bg-slate-800  dark:hover:bg-slate-700'}`}>
                  <p className="dark:text-slate-300 font-semibold text-gray-700 text-sm">
                      Clock In
                    </p>
          </NavLink></div>
        ) : (<div className='relative px-4.5 '>
                    <div className='absolute left-0 top-1/2 -translate-y-1/2 w-[30%] h-2 border-b-1  border-slate-300 dark:border-slate-500 rounded-full z-0 '/>
          
          <div className="relative z-10 px-3 bg-white dark:bg-slate-800  py-1 hover:cursor-not-allowed rounded text-sm text-gray-400">Clock In</div></div>
        ) }
          <div className={`px-5 flex gap-1 items-center  text-xs font-light ${checking ? 'text-gray-400' : isLocal ? 'text-green-500' : 'text-amber-400'}`}>
          <Icon name="ShieldAlert" className={`w-3 h-3 ${checking ? 'text-gray-400' : isLocal ? 'text-green-500' : 'text-amber-400'}`}/>
           {checking ? 'checking...' : isLocal ? 'office network' : 'external network'}
           </div></>
):("")}
                {lists.sub?.map((subs,index) => (
                  <div key={index} className='relative px-4.5 '>
                    <div className='absolute left-0 top-1/2 -translate-y-1/2 w-[30%] h-2 border-b-1 border-slate-300 dark:border-slate-500 rounded-full z-0 '></div>
                    <NavLink key={subs.label} to={subs.subPath} end className={({ isActive }) => `relative z-10 flex rounded-md w-full justify-between items-center px-2.5 py-1.5 ${isActive ? 'bg-slate-200 shadow dark:bg-slate-700 ' : ' bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                      <p className="dark:text-slate-300 font-semibold text-gray-700 text-sm">
                        {subs.label}
                      </p>
                    </NavLink>
                    </div>
                ))}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );

  const bottom = (
    <div id="bottom" className="w-full flex flex-col items-center py-3.5">
      {!collapsed && (
        <>
          <div className="flex w-full justify-between items-center m-0.5">
            <div className="flex items-center gap-1.5 justify-center py-2.5">
              <Icon name="HelpCircle" className="w-5 h-5 text-slate-400" />
              <NavLink to="HelpCenter/shortcut">
              <p className="font-semibold text-gray-700 text-sm dark:text-slate-300">
                Help Center
              </p>
              </NavLink>
            </div>
          </div>

          <div className="flex w-full justify-between items-center m-0.5">
            <div className="flex items-center gap-1.5 justify-center py-2.5">
              <Icon name="Settings" className="w-5 h-5 text-slate-400" />
              <NavLink to="Setting/CompanyInfo">
                <p className="font-semibold text-gray-700 text-sm dark:text-slate-300">
                  Settings
                </p>
              </NavLink>
            </div>
          </div>
<div className="relative dark:bg-slate-900  inset-shadow-slate-200 inset-shadow-2xs shadow shadow-slate-100 dark:inset-shadow-xs dark:inset-shadow-black dark:shadow dark:shadow-slate-700 flex gap-0.5 rounded-4xl cursor-pointer bg-gray-50 h-11 w-full justify-around items-center m-0.5 p-1 overflow-hidden">
            
            {/* Animated Background Slider */}
            <div 
              className={`absolute top-1 bottom-1 w-[48%] rounded-4xl transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] bg-white dark:bg-slate-800 shadow-md ${theme === 'dark' ? 'left-[50%]' : 'left-[1%]'}`}
            />

            <div
              onClick={() => changeTheme('light')}
              className={`relative z-10 flex flex-1 h-full items-center gap-1.5 justify-center py-2.5 transition-colors duration-300 ${theme === 'light' ? 'text-gray-800' : 'text-slate-400'}`}
            >
              <Icon name="Sun" className="w-4 h-4" />
              <p className="font-bold text-xs uppercase tracking-widest">
                Light
              </p>
            </div>
            <div
  onClick={() => changeTheme('dark')}
  className={`relative z-10 flex flex-1 h-full items-center gap-1.5 justify-center py-2.5 transition-all duration-300 rounded-4xl
    ${theme === 'dark' 
      ? 'bg-gray-50 dark:bg-slate-700 shadow-md dark:shadow-slate-950 dark:inset-shadow-xs dark:inset-shadow-slate-600 text-white' 
      : 'text-slate-500'
    }`}
>
  <Icon name="Moon" className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-slate-500'}`} />
  <p className="font-bold text-xs uppercase tracking-widest">
    Dark
  </p>
</div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div
      className={`bg-white  dark:bg-slate-800 dark:text-white flex h-full dark:shadow-slate-600  ${
        collapsed ? 'w-16' : 'w-64 min-w-64'
      } transition-all duration-300 flex-col items-center shadow px-2.5 py-0.5`}
    >
      {top1}
      {top2}
      {middle1}
      {bottom}
    </div>
  );
}
