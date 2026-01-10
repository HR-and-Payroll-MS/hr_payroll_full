// src/components/ShorCut.jsx
import React from 'react';
import ROLE_SHORTCUTS from '../../../config/shorcuts';
import { getLocalData } from '../../../Hooks/useLocalStorage';

const ShorCut = () => {
  const role = getLocalData('role') || 'Employee';
  const shortcuts = ROLE_SHORTCUTS[role] || [];

  // Helper to format keys nicely for display
  const formatKey = (keyString) => {
    return keyString
      .toLowerCase()
      .replace('ctrl', 'Ctrl')
      .replace('shift', 'Shift')
      .replace('alt', 'Alt')
      .replace('+', ' + ');
  };

  // Convert Ctrl → ⌘ for Mac display
  const getMacKey = (winKey) => {
    if (winKey.toLowerCase().includes('ctrl')) {
      return winKey.toLowerCase().replace('ctrl', '⌘');
    }
    return formatKey(winKey);
  };

  return (
    <div className="flex flex-col w-full h-full p-8 gap-5 bg-white dark:bg-slate-800 transition-colors duration-300">
      
      {/* Top Header Label */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
          Keyboard Shortcuts for {role} Dashboard
        </h1>
        <div className="w-4 h-4 rounded-full border border-slate-400 dark:border-slate-500 flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 cursor-help">
          i
        </div>
      </div>

      <hr className="opacity-10 dark:opacity-5 border-slate-500" />

      {/* Main Card Container */}
      <div className="w-full hover-bar max-w-7xl border h-full overflow-y-auto border-gray-100 shadow dark:border-slate-800/60 rounded-xl bg-white dark:bg-[#1e293b]/40 p-10 dark:shadow-xs dark:shadow-slate-900 inset-shadow-xs inset-shadow-green-700/25 backdrop-blur-sm">
        
        {/* Card Title & Subtitle */}
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          A list of Keyboard Shortcuts to help you navigate faster
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">
          Here are {shortcuts.length} keyboard shortcuts available for your role.
        </p>

        {/* Shortcuts Table */}
        <div className="w-full ">
          {/* Header Row */}
          <div className="grid shadow grid-cols-3 bg-slate-50 dark:bg-[#2d3a4f] rounded-lg py-3.5 px-8 mb-6 text-[12px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-3">
              Shortcuts Key on Windows
              <span className="text-[10px] opacity-40">↕</span>
            </div>
            <div className="flex items-center gap-3">
              Shortcuts Key on MacOS
              <span className="text-[10px] opacity-40">↕</span>
            </div>
            <div className="flex items-center gap-3">
              Action
              <span className="text-[10px] opacity-40">↕</span>
            </div>
          </div>

          {/* Data Rows */}
          <div className="flex flex-col gap-7 px-8">
            {shortcuts.length > 0 ? (
              shortcuts.map((item, index) => (
                <div key={index} className="grid grid-cols-3 text-[14px] items-center">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                    {formatKey(item.keys)}
                  </div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                    {getMacKey(item.keys)}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-medium">
                    {item.description}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 col-span-3 py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                No shortcuts defined for your role yet.
              </div>
            )}
          </div>
        </div>

        {/* Thin Divider */}
        <div className="h-[1px] w-full bg-gray-100 dark:bg-slate-800/80 my-12" />

        {/* Footer Note Section */}
        <div className="flex flex-col  gap-4">
          <p className="text-lg font-bold text-slate-800 dark:text-white">Note :</p>
          <div className="border shadow dark:shadow-xs dark:shadow-slate-900 dark:inset-shadow-xs dark:inset-shadow-green-700/25 border-gray-100 dark:border-slate-700/50 rounded-xl p-8 bg-slate-50/50 dark:bg-[#0f172a]/40">
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
              These shortcuts work anywhere in the dashboard after you log in. 
              Use them to navigate quickly between pages and boost your productivity. 
              New shortcuts can be added by updating the configuration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShorCut;