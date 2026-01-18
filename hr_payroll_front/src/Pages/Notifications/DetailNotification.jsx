import React from 'react';
import Icon from '../../Components/Icon';

function DetailNotification({ n, setSelected, store }) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 transition-colors">
      {/* 1. HEADER AREA - Matching Drawer Header style */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500"
          >
            <Icon name="ArrowLeft" className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {n.title}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {n.category} • {n.type}
            </p>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
            n.unread
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
          }`}
        >
          {n.unread ? 'Unread' : 'Archived'}
        </span>
      </div>

      {/* 2. MAIN CONTENT AREA - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hidden">
        {/* Message Bubble - Similar to the "Reason" or "Notes" styling */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl p-5 mb-6">
          <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap italic">
            {/* "{n.message}" */}
            <div
              className="text-xs text-slate-500"
              dangerouslySetInnerHTML={{ __html: n.message }}
            />
          </div>
        </div>

        {/* Metadata Grid - Clean, Professional labels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 border-t dark:border-slate-700 pt-6">
          <DetailItem
            label="Sender Role"
            value={n.sender_role || 'System'}
            icon="User"
          />
          <DetailItem
            label="Date Sent"
            value={new Date(n.createdAt || n.created_at).toLocaleString()}
            icon="Calendar"
          />
          <DetailItem
            label="Distribution"
            value={n.receivers ? n.receivers.join(', ') : 'Personal'}
            icon="Users"
            className="sm:col-span-2"
          />
        </div>
      </div>

      {/* 3. FIXED ACTION PANEL - Bottom Docked matching Leave Request style */}
      <div className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex gap-3">
        {n.unread && (
          <button
            onClick={() => {
              store.markRead(n.id);
              setSelected({ ...n, unread: false });
            }}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Icon name="Check" className="w-4 h-4" />
            Mark as Read
          </button>
        )}

        <button
          onClick={() => {
            store.remove(n.id);
            setSelected(null);
          }}
          className={`py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 ${
            n.unread
              ? 'px-6 border border-rose-200 dark:border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10'
              : 'flex-1 bg-rose-600 hover:bg-rose-700 text-white'
          }`}
        >
          <Icon name="Trash2" className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}

// Helper component for clean metadata display
function DetailItem({ label, value, icon, className = '' }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="mt-1 p-1.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500">
        <Icon name={icon} className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {value || 'N/A'}
        </p>
      </div>
    </div>
  );
}

export default DetailNotification;
