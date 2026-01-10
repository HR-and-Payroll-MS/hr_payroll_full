import { NavLink, Outlet } from "react-router-dom";
import Header from "../../Components/Header";
import { 
  Building2, 
  CalendarClock, 
  ShieldCheck, 
  KeyRound, 
  Search,
  Settings as SettingsIcon 
} from "lucide-react";

export default function Setting() {
  
  // Sidebar Navigation logic
  const navItems = [
    { to: "CompanyInfo", label: "Company Info", icon: <Building2 size={16} /> },
    { to: "WorkSchedule", label: "Work Schedule", icon: <CalendarClock size={16} /> },
    { to: "FAQ", label: "Permission", icon: <ShieldCheck size={16} /> },
    { to: "ChangePassword", label: "Change Password", icon: <KeyRound size={16} /> },
  ];

  const middle = (
    <div id="middle" className="flex flex-col h-full w-full bg-white dark:bg-slate-800 p-2 gap-1.5 transition-colors">
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-3 py-2 tracking-wider">
        System Settings
      </p>
      
      {navItems.map((item) => (
        <NavLink 
          key={item.to}
          to={item.to} 
          className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2.5 rounded transition-all group
            ${isActive 
              ? "bg-slate-100 dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm" 
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }
          `}
        >
          <span className="opacity-70 group-hover:opacity-100 transition-opacity">
            {item.icon}
          </span>
          <p className="font-bold text-xs uppercase tracking-tight">{item.label}</p>
        </NavLink>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 w-full h-full dark:bg-slate-900 bg-gray-50 transition-colors overflow-hidden">
      
      {/* HEADER */}
      <div className="flex shrink-0"> 
        <Header Title={"Settings"} Breadcrub={"Configure your organization workspace"}>
          <div className="flex dark:text-slate-200 text-xs w-full items-center justify-between px-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 h-9">
            <input 
              className="h-full bg-transparent border-none outline-none w-full text-slate-700 dark:text-slate-200" 
              type="text" 
              placeholder="Search settings..." 
            />
            <Search size={14} className="opacity-40" />
          </div>
        </Header>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 gap-5 overflow-hidden pb-4 pr-4">
        
        {/* LEFT SIDEBAR (Sticky Feel) */}
        <div className="h-full w-1/5 shrink-0 bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 overflow-y-auto scrollbar-hidden"> 
          {middle}
        </div>

        {/* RIGHT CONTENT (Scrollable Child) */}
        <div className="flex-1 h-full bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 flex flex-col overflow-hidden transition-colors"> 
          <div className="flex-1 overflow-y-auto px-6 scrollbar-hidden">
            <Outlet />
          </div>
        </div>

      </div>
    </div>
  );
}