import Icon from "../../Components/Icon";
import { formatTime, notificationIcon } from "./utils";

export default function NotificationCard({ n, onView, onDelete, onMarkRead }) {
  return (
    <div
      onClick={onView}
      className="group relative p-4 bg-white dark:bg-slate-700/50 rounded shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-green-400/15 dark:hover:border-green-500/15 hover:shadow-md transition-all active:scale-[0.99] mb-3"
    >
      {/* Status Indicator Bar - Matching the Leave Request style */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l transition-colors ${
          n.unread ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
        }`} 
      />

      <div className="flex gap-4 items-center pl-2">
        {/* Icon Area */}
        <div className={`p-2 rounded ${n.unread ? 'bg-green-50 dark:bg-green-500/10' : 'opacity-60'}`}>
          {notificationIcon(n.category)}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className={`text-[11px] uppercase tracking-wider font-bold ${n.unread ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
              {n.sender_view ? `To: ${n.recipient_name || 'Individual'}` : n.title}
              {n.unread && !n.sender_view && (
                <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300 rounded">
                  NEW
                </span>
              )}
            </h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {formatTime(n.createdAt)}
            </span>
          </div>
          
          <div className={`text-sm mt-1 line-clamp-1 ${n.unread ? "text-slate-600 dark:text-slate-300 font-medium" : "text-slate-400 dark:text-slate-500 italic"}`}>
            {/* "{n.message}" */}
            <div 
                      className="text-xs line-clamp-2 text-slate-500"
                      dangerouslySetInnerHTML={{ __html: n.message }} 
                    />
          </div>
        </div>

        {/* Action Buttons - Matching the hover interaction style */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          {n.unread && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead();
              }}
              className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded transition-colors"
              title="Mark as Read"
            >
              <Icon name="Check" className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors"
            title="Delete"
          >
            <Icon name="Trash2" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}