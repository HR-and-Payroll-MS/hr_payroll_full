import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../Context/AuthContext';
import NotificationCard from './NotificationCard';
import { ROLE_RECEIVE_TYPES } from './utils';
import InputField from '../../Components/InputField';
import Dropdown from '../../Components/Dropdown';
import DetailNotification from './DetailNotification';
import { useNotifications } from '../../Context/NotificationProvider';
import Icon from '../../Components/Icon';

export default function NotificationCenterPage({ role = 'EMPLOYEE' }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const currentRole = auth?.user?.role || role || 'EMPLOYEE';
  const {
    items,
    sentItems,
    markRead,
    remove,
    selected,
    setSelected,
    fetchSent,
  } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('received'); // 'received' or 'sent'

  const pageSize = 10;

  const visible = (n) => {
    if (tab === 'sent') return true; // Show all sent
    if (!n.receivers) return true;
    return (
      n.receivers.includes('ALL') ||
      n.receivers.includes(role) ||
      ROLE_RECEIVE_TYPES[role]?.includes(n.category)
    );
  };

  const filtered = useMemo(() => {
    const list = tab === 'received' ? items || [] : sentItems || [];
    return list
      .filter(visible)
      .filter((n) => (filter === 'all' ? true : n.category === filter))
      .filter((n) =>
        q ? (n.title + n.message).toLowerCase().includes(q.toLowerCase()) : true
      )
      .sort((a, b) => {
        if (tab === 'sent')
          return new Date(b.createdAt) - new Date(a.createdAt);
        return a.unread === b.unread ? 0 : a.unread ? -1 : 1;
      });
  }, [items, sentItems, filter, q, role, tab]);

  useEffect(() => {
    setPage(1);
  }, [filter, q, tab]);

  useEffect(() => {
    if (tab === 'sent') fetchSent();
  }, [tab]);

  const pages = Math.ceil(filtered.length / pageSize) || 1;
  const view = filtered.slice((page - 1) * pageSize, page * pageSize);

  const types = [
    { content: 'all' },
    { content: 'system' },
    { content: 'attendance' },
    { content: 'payroll' },
  ];

  const normalizeLink = (link, n) => {
    if (!link || typeof link !== 'string') return null;
    let path = link.trim();
    // Strip query/hash
    path = path.split('?')[0].split('#')[0];
    // Remove trailing numeric/hex-like ID segments to avoid 404
    path = path.replace(/\/+$/, '');
    const segs = path.split('/').filter(Boolean);
    if (segs.length > 0) {
      const last = segs[segs.length - 1];
      if (/^\d+$/.test(last) || /^[0-9a-fA-F]{8,}$/.test(last)) {
        segs.pop();
        path = '/' + segs.join('/');
      }
    }
    // Normalize known base segments to match Router paths
    path = path.replace(/^\/employee\b/i, '/Employee');
    path = path.replace(/^\/payroll\b/i, '/Payroll');
    // Keep /hr_dashboard and /department_manager as-is

    const cat = (n?.category || n?.notification_type || '').toLowerCase();
    if (cat.includes('tax')) return null; // force detail view for tax code notifications

    // Handle backend leaf links like /leaves/:id
    if (/^\/leaves(\/|$)/i.test(path)) {
      const roleNorm = (currentRole || '').toLowerCase();
      if (roleNorm.includes('employee')) return '/Employee/Request';
      if (roleNorm.includes('line manager'))
        return '/department_manager/Approve_Reject';
      if (roleNorm.includes('manager') || roleNorm.includes('hr'))
        return '/hr_dashboard/Approve_Reject';
      return '/Employee/Request';
    }

    // Category-based fallback when path still unknown
    if (!/^\//.test(path) || path === '/') {
      if (cat.includes('attendance')) return '/Employee/myovertime';
      if (cat.includes('leave')) return '/Employee/Request';
      if (cat.includes('payroll')) return '/Employee/my-payslips';
    }

    return path;
  };

  if (selected) {
    return (
      <DetailNotification
        n={selected}
        setSelected={setSelected}
        store={{ markRead, remove }}
      />
    );
  }

  return (
    <div className="h-full w-full flex flex-col gap-4 p-4 md:p-7 dark:bg-slate-800 bg-gray-50 overflow-hidden transition-colors">
      {/* HEADER SECTION - Matching Leave Requests Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {tab === 'received'
              ? 'Stay updated with system alerts and personal notifications'
              : "Review the notifications you've dispatched to others"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InputField
            maxWidth="min-w-128"
            searchMode="input"
            placeholder="Search..."
            onChangeValue={setQ}
          />
          <Dropdown
            onChange={setFilter}
            placeholder="Category"
            padding="p-2 min-w-[120px]"
            options={types}
          />
        </div>
      </div>

      {/* TABS SECTION */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 px-2 shrink-0">
        <button
          onClick={() => setTab('received')}
          className={`pb-3 text-xs font-black uppercase tracking-widest transition-all relative ${
            tab === 'received'
              ? 'text-green-600'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Inbox
          {tab === 'received' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-full animate-in fade-in duration-300" />
          )}
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`pb-3 text-xs font-black uppercase tracking-widest transition-all relative ${
            tab === 'sent'
              ? 'text-green-600'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Sent
          {tab === 'sent' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-full animate-in fade-in duration-300" />
          )}
        </button>
      </div>

      {/* MAIN CONTENT - Inset Shadow Container style from Leave Page */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 overflow-hidden transition-all">
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hidden">
          {view.length > 0 ? (
            <div className="space-y-1">
              {view.map((n) => (
                <NotificationCard
                  key={n.id}
                  n={{ ...n, sender_view: tab === 'sent' }}
                  onView={() => {
                    const rawLink = n.related_link || n.link;
                    const target = normalizeLink(rawLink, n);
                    if (tab === 'received') markRead(n.id);
                    if (target) {
                      navigate(target);
                    } else {
                      setSelected({
                        ...n,
                        unread: tab === 'received' ? false : n.unread,
                      });
                    }
                  }}
                  onDelete={() => remove(n.id)}
                  onMarkRead={() => tab === 'received' && markRead(n.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Icon name="BellOff" className="w-12 h-12 mb-2 opacity-10" />
              <p className="text-sm italic">No notifications found</p>
            </div>
          )}
        </div>

        {/* PAGINATION - Professional Footer style */}
        {filtered.length > pageSize && (
          <div className="shrink-0 p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border rounded bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <span>
              Page {page} of {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 border rounded bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// import { useEffect, useState, useMemo } from "react";
// import NotificationCard from "./NotificationCard";
// import { ROLE_RECEIVE_TYPES } from "./utils";
// import InputField from "../../Components/InputField";
// import Dropdown from "../../Components/Dropdown";
// import DetailNotification from "./DetailNotification";
// import { useNotifications } from "../../Context/NotificationProvider";

// export default function NotificationCenterPage({ role = "EMPLOYEE" }) {
//   const { items, markRead, remove } = useNotifications();

//   const [filter, setFilter] = useState("all");
//   const [q, setQ] = useState("");
//   const [page, setPage] = useState(1);
//   const [selected, setSelected] = useState(null);

//   const pageSize = 10;

//   const visible = (n) => {
//     if (!n.receivers) return true;
//     return (
//       n.receivers.includes("ALL") ||
//       n.receivers.includes(role) ||
//       ROLE_RECEIVE_TYPES[role]?.includes(n.category)
//     );
//   };

//   const filtered = useMemo(() => {
//     const list = items || [];
//     return list
//       .filter(visible)
//       .filter((n) => (filter === "all" ? true : n.category === filter))
//       .filter((n) =>
//         q ? (n.title + n.message).toLowerCase().includes(q.toLowerCase()) : true
//       );
//   }, [items, filter, q, role]);

//   useEffect(() => {
//     setPage(1);
//   }, [filter, q]);

//   const pages = Math.ceil(filtered.length / pageSize) || 1;
//   const view = filtered.slice((page - 1) * pageSize, page * pageSize);

//   const types = [
//     { content: "all" },
//     { content: "system" },
//     { content: "attendance" },
//     { content: "payroll" },
//   ];

//   // If a notification is selected, render the Detail view instead of the list
//   if (selected) {
//     return (
//       <DetailNotification
//         n={selected}
//         setSelected={setSelected}
//         store={{ markRead, remove }}
//       />
//     );
//   }

//   return (
//     <div className="p-6 w-full flex flex-col h-full mx-auto max-w-5xl">
//       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
//         <h2 className="font-bold text-2xl text-slate-800 dark:text-slate-100 flex-1">
//           Notification Center
//         </h2>
//         <div className="flex items-center gap-2 w-full md:w-auto">
//           <InputField
//             maxWidth="w-64"
//             searchMode="input"
//             placeholder="Search notifications..."
//             onChangeValue={setQ}
//           />
//           <Dropdown
//             onChange={setFilter}
//             placeholder="Filter Category"
//             padding="p-2 min-w-[140px]"
//             options={types}
//           />
//         </div>
//       </div>

//       <div className="flex-1 border rounded-xl border-slate-200 bg-white shadow-sm py-4 overflow-y-auto scrollbar-hidden">
//         {view.length > 0 ? (
//           <div className="space-y-3">
//             {view.map((n) => (
//               <NotificationCard
//                 key={n.id}
//                 n={n}
//                 canAction={ROLE_RECEIVE_TYPES[role]?.includes(n.category)}
//                 onView={() => {
//                   markRead(n.id);
//                   setSelected({ ...n, unread: false }); // Transition to Detail view
//                 }}
//                 onDelete={() => remove(n.id)}
//                 onMarkRead={() => markRead(n.id)}
//               />
//             ))}
//           </div>
//         ) : (
//           <div className="flex flex-col items-center justify-center h-64 text-slate-400">
//             <Icon name="BellOff" className="w-12 h-12 mb-2 opacity-20" />
//             <p className="text-sm">No notifications found</p>
//           </div>
//         )}
//       </div>

//       {filtered.length > pageSize && (
//         <div className="flex justify-between items-center mt-6 text-sm text-slate-600 font-medium">
//           <button
//             onClick={() => setPage((p) => Math.max(1, p - 1))}
//             disabled={page === 1}
//             className="px-4 py-2 border rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
//           >
//             Previous
//           </button>
//           <span>
//             Page <span className="text-slate-900">{page}</span> of {pages}
//           </span>
//           <button
//             onClick={() => setPage((p) => Math.min(pages, p + 1))}
//             disabled={page === pages}
//             className="px-4 py-2 border rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
//           >
//             Next
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import NotificationCard from "./NotificationCard";
// import { ROLE_RECEIVE_TYPES } from "./utils";
// import InputField from "../../Components/InputField";
// import Dropdown from "../../Components/Dropdown";
// import DetailNotification from "./DetailNotification";
// import useAuth from "../../Context/AuthContext"; // for axiosPrivate
// import { useSocket } from "../../Context/SocketProvider";

// export default function NotificationCenterPage({ role = "EMPLOYEE" }) {
//   const { axiosPrivate } = useAuth();
//   const socket = useSocket();

//   const [notifications, setNotifications] = useState([]);
//   const [filter, setFilter] = useState("all");
//   const [q, setQ] = useState("");
//   const [page, setPage] = useState(1);
//   const [selected, setSelected] = useState(null);
//   const pageSize = 10;

//   useEffect(() => {
//     let isMounted = true;

//     const fetchNotifications = async () => {
//       try {
//         const res = await axiosPrivate.get("/api/notifications/"); // adjust endpoint
//         if (isMounted) setNotifications(res.data || []);
//       } catch (err) {
//         console.error("Failed to fetch notifications:", err);
//       }
//     };

//     fetchNotifications();

//     return () => {
//       isMounted = false;
//     };
//   }, [axiosPrivate]);

//   useEffect(() => {
//     if (!socket) return;

//     // const handleNewNotification = (data) => {
//     //   setNotifications((prev) => [data, ...prev]);
//     // };

//     const handleNewNotification = (data) => {
//   setNotifications((prev) => {
//     if (prev.some((n) => n.id === data.id)) return prev;
//     return [data, ...prev];
//   });
// };

//     socket.on("notification", handleNewNotification);

//     return () => {
//       socket.off("notification", handleNewNotification);
//     };
//   }, [socket]);

//   // const visible = (n) =>
//   //   n.receivers.includes("ALL") ||
//   //   n.receivers.includes(role) ||
//   //   ROLE_RECEIVE_TYPES[role]?.includes(n.category);
//   const visible = (n) => {
//   if (!n.receivers) return true;

//   return (
//     n.receivers.includes("ALL") ||
//     n.receivers.includes(role) ||
//     ROLE_RECEIVE_TYPES[role]?.includes(n.category)
//   );
// };

// useEffect(() => {
//   setPage(1);
// }, [filter, q]);

//   const filtered = notifications
//     .filter(visible)
//     .filter((n) => (filter === "all" ? true : n.category === filter))
//     .filter((n) =>
//       q ? (n.title + n.message).toLowerCase().includes(q.toLowerCase()) : true
//     );

//   const pages = Math.ceil(filtered.length / pageSize) || 1;
//   const view = filtered.slice((page - 1) * pageSize, page * pageSize);

//   const types = [
//     { content: "all" },
//     { content: "system" },
//     { content: "attendance" },
//     { content: "payroll" },
//   ];

//   const markRead = async (id) => {
//     try {
//       await axiosPrivate.post(`/api/notifications/${id}/mark-read/`);
//       setNotifications((prev) =>
//         prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
//       );
//     } catch (err) {
//       console.error("Failed to mark read:", err);
//     }
//   };

//   const remove = async (id) => {
//     try {
//       await axiosPrivate.delete(`/api/notifications/${id}/`);
//       setNotifications((prev) => prev.filter((n) => n.id !== id));
//     } catch (err) {
//       console.error("Failed to delete notification:", err);
//     }
//   };

//   if (selected)
//     return (
//       <DetailNotification
//         n={selected}
//         setSelected={setSelected}
//         store={{ markRead, remove }}
//       />
//     );

//   return (
//     <div className="p-6 w-full flex flex-col h-full mx-auto">
//       Header & Filters
//        <div className="flex justify-between mb-4">
//         <h2 className="font-semibold text-xl">Notifications</h2>
//         <div className="flex gap-2">
//           <InputField searchMode="input" placeholder="Search..." onChangeValue={setQ} />
//           <Dropdown
//             onChange={setFilter}
//             placeholder="Filter"
//             padding="p-1.5"
//             options={types}
//           />
//         </div>
//       </div> {/**/}

//       Notification Cards  {/**/}
//       <div className="space-y-3 py-3 overflow-y-auto scrollbar-hidden">
//         {view.length > 0 ? (
//           view.map((n) => (
//             <NotificationCard
//               key={n.id}
//               n={n}
//               canAction={ROLE_RECEIVE_TYPES[role]?.includes(n.category)}
//               onView={() => {
//                 markRead(n.id);
//                 setSelected({ ...n, unread: false });
//               }}
//               onDelete={() => remove(n.id)}
//               onMarkRead={() => markRead(n.id)}
//             />
//           ))
//         ) : (
//           <p className="text-center text-gray-500 mt-10 text-sm">No Notifications</p>
//         )}
//       </div>  {/**/}

//       {/* Pagination */}
//      {filtered.length > 0 && (
//         <div className="flex justify-between mt-5 text-sm">
//           <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-40" >
//             Prev
//           </button>
//           <span>
//             Page {page} / {pages}
//           </span>
//           <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1 border rounded disabled:opacity-40" >
//             Next
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import { useSocket } from "../../Context/SocketProvider";

// export default function NotificationCenterPage() {
//   const socketContext = useSocket();
//   const [notifications, setNotifications] = useState([]);

//   /* 1️⃣ LISTEN FOR BACKEND NOTIFICATIONS */
//   useEffect(() => {
//     if (!socketContext?.socket) return;

//     const handler = (data) => {
//       console.log("🔔 Notification received:", data);
//       setNotifications((prev) => [...prev, { ...data, type: "received" }]);
//     };

//     socketContext.on("notification", handler);

//     return () => {
//       socketContext.off("notification", handler);
//     };
//   }, [socketContext]);

//   /* 2️⃣ SEND EVENT AND DISPLAY IT IMMEDIATELY */
//   const sendPing = () => {
//     if (!socketContext?.socket) {
//       console.warn("Socket not ready");
//       return;
//     }

//     const messageData = {
//       id: Date.now(), // temporary id for UI
//       title: "Ping Sent",
//       message: "Hello from NotificationCenterPage",
//       sentAt: new Date().toISOString(),
//     };

//     // Show sent message immediately
//     setNotifications((prev) => [...prev, { ...messageData, type: "sent" }]);

//     // Send to backend
//     socketContext.emit("ping_notification", messageData);

//     console.log("📤 Ping sent", messageData);
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-semibold mb-4">
//         Notification Center (Send & Receive)
//       </h2>

//       <button
//         onClick={sendPing}
//         className="px-4 py-2 bg-blue-600 text-white rounded"
//       >
//         Send Socket Ping
//       </button>

//       <div className="mt-6 space-y-2">
//         {notifications.map((n) => (
//           <div
//             key={n.id}
//             className={`border p-3 rounded ${
//               n.type === "sent" ? "bg-blue-50 border-blue-400" : "bg-green-50 border-green-400"
//             }`}
//           >
//             <strong>{n.title}</strong>
//             <p>{n.message}</p>
//             {n.sentAt && (
//               <small className="text-gray-500 text-xs">
//                 {new Date(n.sentAt).toLocaleTimeString()}
//               </small>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// import { useState } from "react";
// import NotificationCard from "./NotificationCard";
// import { ROLE_RECEIVE_TYPES, formatTime } from "./utils";
// import useNotificationStore from "./useNotificationStore";
// import { MOCK_NOTIFICATIONS } from "./mockData";
// import Dropdown from "../../Components/Dropdown";
// import InputField from "../../Components/InputField";
// import DetailNotification from "./DetailNotification";

// export default function NotificationCenterPage({ role = "EMPLOYEE" }) {
//   const store = useNotificationStore(MOCK_NOTIFICATIONS);

//   const [filter, setFilter] = useState("all");
//   const [q, setQ] = useState("");
//   const [page, setPage] = useState(1);
//   const [selected, setSelected] = useState(null); // For detail view
//   const pageSize = 10;

//   const visible = (n) =>
//     n.receivers.includes("ALL") ||
//     n.receivers.includes(role) ||
//     ROLE_RECEIVE_TYPES[role]?.includes(n.category);

//   const filtered = store.items
//     .filter(visible)
//     .filter((n) => (filter === "all" ? true : n.category === filter))
//     .filter((n) =>
//       q ? (n.title + n.message).toLowerCase().includes(q.toLowerCase()) : true
//     );

//   const pages = Math.ceil(filtered.length / pageSize) || 1;
//   const view = filtered.slice((page - 1) * pageSize, page * pageSize);

//   const types = [
//     { content: "all" },
//     { content: "system" },
//     { content: "attendance" },
//     { content: "payroll" },
//   ];

//   return selected? (
//   <DetailNotification
//     n={selected}
//     setSelected={setSelected}
//     store={store}
//   />
// ): (
//     <div className="p-6 w-full flex flex-col h-full mx-auto">
//       {/* Header & Filters */}
//       <div className="flex justify-between mb-4">
//         <h2 className="font-semibold text-xl">Notifications</h2>
//         <div className="flex gap-2">
//           <InputField searchMode="input" placeholder="Search..." onSelect={setQ} />
//           <Dropdown onChange={setFilter} placeholder="Filter" padding="p-1.5" options={types} />
//         </div>
//       </div>

//       {/* Notification Cards */}
//       <div className="space-y-3 py-3 overflow-y-auto scrollbar-hidden ">
//         {view.length > 0 ? (
//           view.map((n) => (
//             <NotificationCard
//               key={n.id}
//               n={n}
//               canAction={ROLE_RECEIVE_TYPES[role]?.includes(n.category)}
//               onView={() => {
//                 store.markRead(n.id);
//                 setSelected({ ...n, unread: false });
//               }}

//               onDelete={() => store.remove(n.id)}
//               onMarkRead={() => store.markRead(n.id)}
//             />
//           ))
//         ) : (
//           <p className="text-center text-gray-500 mt-10 text-sm">No Notifications</p>
//         )}
//       </div>

//       {/* Pagination */}
//       {filtered.length > 0 && (
//         <div className="flex justify-between mt-5 text-sm">
//           <button
//             className="px-3 py-1 border rounded disabled:opacity-40"
//             onClick={() => setPage((p) => Math.max(1, p - 1))}
//             disabled={page === 1}
//           >
//             Prev
//           </button>
//           <span>
//             Page {page} / {pages}
//           </span>
//           <button
//             className="px-3 py-1 border rounded disabled:opacity-40"
//             onClick={() => setPage((p) => Math.min(pages, p + 1))}
//             disabled={page === pages}
//           >
//             Next
//           </button>
//         </div>
//       )}

//     </div>
//   );
// }
