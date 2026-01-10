import React from 'react';

const STEPS = [
  { id: 'General', icon: '🏢' },
  { id: 'Attendance', icon: '⏰' },
  { id: 'Leave', icon: '✈️' },
  { id: 'Holiday', icon: '📅' },
  { id: 'Shift', icon: '🔄' },
  { id: 'Overtime', icon: '⏱️' },
  { id: 'Disciplinary', icon: '⚖️' },
  { id: 'Job Structure', icon: '🧱' },
  { id: 'Salary Structure', icon: '💵' },
  { id: 'Tax & Statutory', icon: '💰' },
];

const PolicySidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-72 bg-slate-900 h-full flex flex-col shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-white text-xl font-black tracking-tight">ERP POLICY <span className="text-blue-400">CORE</span></h1>
        <p className="text-slate-400 text-xs mt-1 uppercase font-bold tracking-widest">Global Configuration</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {STEPS.map((step) => {
          const isActive = activeTab === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveTab(step.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className={`text-xl ${isActive ? 'scale-110' : 'opacity-70'} transition-transform`}>
                {step.icon}
              </span>
              <span className="font-semibold text-sm">{step.id} Policy</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 bg-slate-950/50 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">AD</div>
          <div className="overflow-hidden">
            <p className="text-white text-xs font-bold truncate">System Architect</p>
            <p className="text-slate-500 text-[10px] truncate">Admin Privileges</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default PolicySidebar;