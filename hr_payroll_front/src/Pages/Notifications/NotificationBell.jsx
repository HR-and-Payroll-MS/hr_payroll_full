
import { useState, useRef } from "react";
import { ROLE_RECEIVE_TYPES, formatTime, notificationIcon } from "./utils";
import useOutside from "./useOutside";
import Icon from "../../Components/Icon";
import { useNotifications } from "../../Context/NotificationProvider";

export default function NotificationBell({ role = "EMPLOYEE", onOpenCenter }) {
  const notifications = useNotifications();
  // Safe check in case hook is used outside provider
  if (!notifications) return null;

  const { items, unreadCount, markRead, markAllRead, setSelected } = notifications;

  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));

  const visible = (n) => {
    if (!n.receivers) return true;
    return (
      n.receivers.includes("ALL") ||
      n.receivers.includes(role) ||
      ROLE_RECEIVE_TYPES[role]?.includes(n.category)
    );
  };

  // 🔹 Sort: Unread items first, then by date
  const visibleItems = (items || [])
    // .filter(visible) // Backend filters for us
    .sort((a, b) => {
        if (a.unread === b.unread) return 0;
        return a.unread ? -1 : 1; 
    });

  return (
    <div className="relative z-40" ref={ref}>
      {/* TRIGGER BUTTON */}
      <button
        id="number_of_unread"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Icon name="BellRing" className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full shadow-lg font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        /* DROPDOWN CONTAINER */
        <div className="absolute right-0 mt-3 w-96 bg-white dark:bg-slate-800 rounded shadow-2xl z-50 dark:shadow-2xl dark:inset-shadow-2xs dark:inset-shadow-slate-700 inset-shadow-2xs inset-shadow-white flex flex-col animate-scaleIn overflow-hidden">
          
          {/* HEADER */}
          <div className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Notifications</span>
              <span className="bg-slate-800 dark:bg-green-800 text-white text-[9px] px-2 py-0.5 rounded font-bold">
                {visibleItems.length}
              </span>
            </div>
            <button 
              onClick={markAllRead} 
              className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
            >
              Mark all read
            </button>
          </div>

          {/* LIST AREA */}
          <div className="max-h-80 overflow-auto scrollbar-hidden bg-white dark:bg-slate-800">
            {visibleItems.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center">
                <Icon name="BellOff" className="w-8 h-8 mb-2 opacity-10 dark:text-slate-100" />
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No notifications</p>
              </div>
            ) : (
              visibleItems.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    markRead(n.id);
                    setSelected(n);
                    onOpenCenter?.();
                    setOpen(false);
                  }}
                  className={`relative p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 flex gap-4 items-start border-b border-slate-50 dark:border-slate-700/30 transition-all ${
                    n.unread ? "bg-slate-50/50 dark:bg-slate-900/20" : ""
                  }`}
                >
                  {/* UNREAD DOT */}
                  {n.unread && (
                    <div className="bg-rose-500 h-2 w-2 rounded-full absolute right-4 top-5 shadow-sm" />
                  )}

                  <div className="mt-0.5 opacity-60 dark:invert">{notificationIcon(n.category)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className={`text-sm truncate ${n.unread ? "font-bold text-slate-900 dark:text-slate-100" : "font-semibold text-slate-600 dark:text-slate-400"}`}>
                        {n.title}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap ml-2">
                        {formatTime(n.createdAt || n.created_at)}
                      </div>
                    </div>
                    <div 
                      className="text-xs line-clamp-2 text-slate-500 dark:text-slate-400 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: n.message }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FOOTER */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/50">
            <button
              onClick={() => {
                setSelected(null);
                setOpen(false);
                onOpenCenter?.();
              }}
              className="w-full text-[10px] py-2.5 bg-slate-800 dark:bg-green-800 text-white font-bold uppercase tracking-widest rounded shadow-lg active:scale-95 transition-all"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}








