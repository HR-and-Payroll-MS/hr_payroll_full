import React, { useEffect, useRef, useState } from "react";
import Icon from "../../../Components/Icon";

/* -------------------------------------------------------------------------- */
/* ------------------------- Notifications Module --------------------------- */
/* -------------------------------------------------------------------------- */

/*
  NotificationsModule.jsx
  - Self-contained Notification UI + sample logic
  - Tailwind classes used for styling (make sure Tailwind is active in your app)
  - No external libs required
*/

/* ----------------------------- Mock data --------------------------------- */

const now = (mins = 0) => new Date(Date.now() - mins * 60_000).toISOString();

const MOCK_USERS = [
  { id: 1, name: "John Doe", email: "john.doe@example.com", dept: "Sales" },
  { id: 2, name: "Sarah Johnson", email: "sarah.johnson@example.com", dept: "Engineering" },
  { id: 3, name: "Daniel Mekonnen", email: "daniel.mekonnen@example.com", dept: "Warehouse" },
];

const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    type: "SYSTEM",
    category: "system",
    title: "New integration announcement",
    message: "A new HR integration has been enabled for payroll exports.",
    createdAt: now(60),
    unread: true,
    senderRole: "SYSTEM",
    receivers: ["SYSTEM_ADMIN"],
    meta: { severity: "info" },
  },
  {
    id: "n2",
    type: "TRAINING",
    category: "hr",
    title: "Training session reminder",
    message: "Don't forget to join the upcoming training session on Friday.",
    createdAt: now(120),
    unread: true,
    senderRole: "HR_MANAGER",
    receivers: ["EMPLOYEE", "DEPARTMENT_MANAGER"],
    meta: { sessionId: "t-001" },
  },
  {
    id: "n3",
    type: "ATTENDANCE",
    category: "attendance",
    title: "Missing clock-out detected",
    message: "John Doe did not clock out yesterday — please review.",
    createdAt: now(240),
    unread: false,
    senderRole: "SYSTEM",
    receivers: ["DEPARTMENT_MANAGER", "HR_MANAGER"],
    meta: { employeeId: 1, date: "2025-11-23" },
  },
  {
    id: "n4",
    type: "LEAVE",
    category: "leave",
    title: "Leave request pending",
    message: "Leave request from Sarah Johnson requires your approval.",
    createdAt: now(20),
    unread: true,
    senderRole: "EMPLOYEE",
    receivers: ["DEPARTMENT_MANAGER"],
    meta: { requestId: "leave-123", employeeId: 2 },
  },
];

/* ------------------------------- Helpers --------------------------------- */

function formatTime(iso) {
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 60000;
    if (diff < 1) return "just now";
    if (diff < 60) return `${Math.floor(diff)}m`;
    if (diff < 60 * 24) return `${Math.floor(diff / 60)}h`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}
function notificationIcon(category) {
  switch (category) {
    case "attendance":
      return "⏱️";
    case "leave":
      return "📝";
    case "payroll":
      return "💰";
    case "hr":
      return "📢";
    case "system":
      return "⚙️";
    default:
      return "🔔";
  }
}

/* --------------- role utilities: who can send what ------------------------ */

const ROLE_SEND_PERMISSIONS = {
  SYSTEM_ADMIN: ["system", "hr", "attendance", "payroll"],
  HR_MANAGER: ["hr", "attendance", "leave", "announcement"],
  PAYROLL_OFFICER: ["payroll", "announcement"],
  DEPARTMENT_MANAGER: ["leave", "attendance", "announcement"],
  EMPLOYEE: [], // typically cannot send org-wide notifications
};

const ROLE_RECEIVE_TYPES = {
  SYSTEM_ADMIN: ["system", "hr", "attendance", "payroll", "leave"],
  HR_MANAGER: ["hr", "attendance", "leave", "system"],
  PAYROLL_OFFICER: ["payroll", "system"],
  DEPARTMENT_MANAGER: ["leave", "attendance", "hr", "system"],
  EMPLOYEE: ["hr", "leave", "attendance", "system"],
};

/* ----------------------- useOutside hook for dropdown --------------------- */

function useOutside(ref, onOutside) {
  useEffect(() => {
    function onDown(e) {
        // console.log("clicked somewhere")
      if (!ref.current || ref.current.contains(e.target)) return;
        // console.log("clicked outside")
      onOutside && onOutside();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, onOutside]);
}

/* --------------------------- Notification Store -------------------------- */
/* lightweight in-memory store for demo — in real app replace with API calls */
function useNotificationStore(initial = []) {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    // seed initial notifications once
    setItems(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addNotification(payload) {
    const nid = `n${Date.now()}`;
    const obj = {
      id: nid,
      title: payload.title,
      message: payload.message,
      type: payload.type || "ANNOUNCEMENT",
      category: payload.category || "hr",
      createdAt: new Date().toISOString(),
      unread: true,
      senderRole: payload.senderRole || "HR_MANAGER",
      receivers: payload.receivers || ["ALL"],
      meta: payload.meta || {},
    };
    setItems((s) => [obj, ...s]);
    return obj;
  }

  function markRead(id) {
    setItems((s) => s.map((it) => (it.id === id ? { ...it, unread: false } : it)));
  }

  function markAllRead() {
    setItems((s) => s.map((it) => ({ ...it, unread: false })));
  }

  function remove(id) {
    setItems((s) => s.filter((it) => it.id !== id));
  }

  return {
    items,
    addNotification,
    markRead,
    markAllRead,
    remove,
    setItems,
  };
}
/* ------------------------- NotificationBell ------------------------------ */

export function NotificationBell({ role = "EMPLOYEE", onOpenCenter }) {
  const store = useNotificationStore(MOCK_NOTIFICATIONS);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));

  const unreadCount = store.items.filter(
    (n) =>
      n.unread &&
      (n.receivers.includes("ALL") ||
        n.receivers.includes(role) ||
        ROLE_RECEIVE_TYPES[role]?.includes(n.category))
  ).length;

  function visibleForRole(n) {
    if (n.receivers.includes("ALL")) return true;
    if (n.receivers.includes(role)) return true;
    if (ROLE_RECEIVE_TYPES[role] && ROLE_RECEIVE_TYPES[role].includes(n.category)) return true;
    return false;
  }

  function handleOpen() {
    setOpen((v) => !v);
  }

  function handleItemClick(n) {
    store.markRead(n.id);
    if (onOpenCenter) onOpenCenter();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-md hover:bg-slate-100"
        aria-label="Notifications"
      >
        {/* <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M15 17H9l-1 4h8l-1-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg> */}
        
                {/* <img className="h-6" src="\svg\notification-bell-on-svgrepo-com.svg" alt="" /> */}
                <Icon name={"BellRing"} className="stroke-1 h-6 w-6"/>

        {unreadCount > 0 && (
          <span className="absolute top-0 right-1 bg-rose-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl z-50">
          <div className="p-3  flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-lg text-slate-800 font-semibold">Notification</div>
              <div className="text-xs text-slate-400">{store.items.length} total</div>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={() => store.markAllRead()} className="text-xs text-slate-500 hover:text-slate-900">Mark all read</button>
            </div>
          </div>

          <div className="max-h-72 overflow-auto scrollbar-hidden">
            {store.items.filter(visibleForRole).length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No notifications</div>
            ) : (
              store.items
                .filter(visibleForRole)
                .slice(0, 10)
                .map((n) => (
                  <div key={n.id} className={` relative p-3 px-6 cursor-pointer hover:bg-slate-50 flex gap-3 items-start `}>
                    {n.unread && <div className="bg-red-600 h-1.5 w-1.5 rounded-full absolute right-1/12 top-9/12"></div>}
                    <div className="">{notificationIcon(n.category)}</div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm">{n.title}</div>
                        <div className="text-xs text-slate-400">{formatTime(n.createdAt)}</div>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">{n.message}</div>
                      {/* <div className="mt-2 flex gap-2">
                        {ROLE_RECEIVE_TYPES[role]?.includes(n.category) && (
                          <button onClick={() => { store.markRead(n.id); if (onOpenCenter) onOpenCenter(); }} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">View</button>
                        )}
                        <button onClick={() => store.markRead(n.id)} className="text-xs text-slate-500">Dismiss</button>
                      </div> */}
                    </div>
                  </div>
                ))
            )}
          </div>

          <div className="p-3">
            <button onClick={() => { setOpen(false); if (onOpenCenter) onOpenCenter(); }} className="w-full text-xs px-3 py-2 bg-slate-900 text-white rounded">Show All Notifications</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------- Notification List Item ----------------------- */
function NotificationCard({ n, onView, onMarkRead, onDelete, canAction }) {
  return (
    <div className={`p-3 rounded border ${n.unread ? "bg-slate-50 border-slate-200" : "bg-white border-slate-100"}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{notificationIcon(n.category)}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{n.title}</div>
              <div className="text-xs text-slate-400">{n.senderRole} • {formatTime(n.createdAt)}</div>
            </div>
            <div className="flex gap-2">
              {canAction && <button onClick={() => onView(n)} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded">Open</button>}
              <button onClick={() => onMarkRead(n)} className="text-xs px-2 py-1 bg-slate-200 rounded">{n.unread ? "Mark read" : "Read"}</button>
              <button onClick={() => onDelete(n)} className="text-xs px-2 py-1 bg-rose-100 text-rose-600 rounded">Delete</button>
            </div>
          </div>
          <div className="text-sm text-slate-600 mt-2">{n.message}</div>
        </div>
      </div>
    </div>
  );
}


/* ---------------------- Notification Center Page ------------------------ */

export function NotificationCenterPage({ role = "EMPLOYEE" }) {
  const store = useNotificationStore(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [filter, q]);

  function visibleForRole(n) {
    if (n.receivers.includes("ALL")) return true;
    if (n.receivers.includes(role)) return true;
    if (ROLE_RECEIVE_TYPES[role] && ROLE_RECEIVE_TYPES[role].includes(n.category)) return true;
    return false;
  }

  const filtered = store.items
    .filter(visibleForRole)
    .filter((n) => (filter === "all" ? true : n.category === filter))
    .filter((n) => (q ? (n.title + n.message).toLowerCase().includes(q.toLowerCase()) : true));

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  function onView(n) {
    store.markRead(n.id);
    // optionally show modal; for demo we just mark read and console
    alert(`Open notification:\n\n${n.title}\n\n${n.message}`);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>

        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="border px-3 py-1 rounded" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border px-3 py-1 rounded">
            <option value="all">All</option>
            <option value="system">System</option>
            <option value="hr">HR</option>
            <option value="attendance">Attendance</option>
            <option value="leave">Leave</option>
            <option value="payroll">Payroll</option>
          </select>
          <button onClick={() => store.markAllRead()} className="px-3 py-1 bg-slate-900 text-white rounded">Mark all read</button>
        </div>
      </div>
      <div className="space-y-3">
        {pageItems.map((n) => (
          <NotificationCard
            key={n.id}
            n={n}
            canAction={ROLE_RECEIVE_TYPES[role]?.includes(n.category)}
            onView={(item) => onView(item)}
            onMarkRead={(item) => store.markRead(item.id)}
            onDelete={(item) => store.remove(item.id)}
          />
        ))}

        {pageItems.length === 0 && <div className="p-6 text-slate-500">No notifications found.</div>}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-slate-500">{total} notifications</div>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded">Prev</button>
          <div className="px-3 py-1 border rounded">{page} / {pages}</div>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-3 py-1 border rounded">Next</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Send Notification Page ----------------------- */
export function SendNotificationPage({ role = "HR_MANAGER" }) {
  const store = useNotificationStore(MOCK_NOTIFICATIONS);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("hr");
  const [receiversType, setReceiversType] = useState("ALL"); // ALL, DEPARTMENT, ROLE, USER
  const [targetValue, setTargetValue] = useState(""); // dept or role or user id
  const [priority, setPriority] = useState("normal");

  const canSend = ROLE_SEND_PERMISSIONS[role] || [];

  useEffect(() => {
    if (!canSend.includes(category) && category !== "announcement") {
      // if role cannot send this category, fallback
      setCategory(canSend[0] || "hr");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  function buildReceivers() {
    if (receiversType === "ALL") return ["ALL"];
    if (receiversType === "ROLE") return [targetValue || "DEPARTMENT_MANAGER"];
    if (receiversType === "DEPARTMENT") return [`DEPT:${targetValue}`];
    if (receiversType === "USER") return [Number(targetValue)];
    return ["ALL"];
  }

  function handleSend(e) {
    e.preventDefault();
    const payload = {
      title,
      message,
      category,
      senderRole: role,
      receivers: buildReceivers(),
      meta: { priority },
    };
    store.addNotification(payload);
    // clear
    setTitle("");
    setMessage("");
    setTargetValue("");
    alert("Notification sent (mock)");
  }
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Send Notification</h1>

      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-600">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border px-3 py-1 rounded w-full">
            {/* show only categories allowed for this role */}
            {canSend.includes("system") && <option value="system">System</option>}
            {canSend.includes("hr") && <option value="hr">HR</option>}
            {canSend.includes("attendance") && <option value="attendance">Attendance</option>}
            {canSend.includes("leave") && <option value="leave">Leave</option>}
            {canSend.includes("payroll") && <option value="payroll">Payroll</option>}
            <option value="announcement">Announcement</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-600">Title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="border px-3 py-2 rounded w-full" />
        </div>

        <div>
          <label className="block text-sm text-slate-600">Message</label>
          <textarea required value={message} onChange={(e) => setMessage(e.target.value)} className="border px-3 py-2 rounded w-full"></textarea>
        </div>

        <div>
          <label className="block text-sm text-slate-600">Send to</label>
          <div className="flex gap-2 mt-2">
            <select value={receiversType} onChange={(e) => setReceiversType(e.target.value)} className="border px-3 py-1 rounded">
              <option value="ALL">All users</option>
              <option value="ROLE">Role</option>
              <option value="DEPARTMENT">Department</option>
              <option value="USER">Specific user</option>
            </select>

            {receiversType === "ROLE" && (
              <select value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="border px-3 py-1 rounded">
                <option value="DEPARTMENT_MANAGER">Department Managers</option>
                <option value="HR_MANAGER">HR Managers</option>
                <option value="PAYROLL_OFFICER">Payroll Officers</option>
                <option value="EMPLOYEE">All Employees</option>
              </select>
            )}

            {receiversType === "DEPARTMENT" && (
              <input placeholder="Department e.g. Sales" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="border px-3 py-1 rounded" />
            )}

            {receiversType === "USER" && (
              <select value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="border px-3 py-1 rounded">
                <option value="">Select user</option>
                {MOCK_USERS.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-600">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border px-3 py-1 rounded">
            <option value="normal">Normal</option>
            <option value="important">Important</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Send</button>
          <button type="button" onClick={() => { setTitle(""); setMessage(""); setTargetValue(""); }} className="px-4 py-2 border rounded">Reset</button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------ Export notes ----------------------------- */

/*
  Exports:
  - NotificationBell
  - NotificationCenterPage
  - SendNotificationPage

  Integration tips:
  - Place <NotificationBell role={role} onOpenCenter={() => navigate('/notifications')} />
    in your header.
  - Route /notifications -> <NotificationCenterPage role={role} />
  - Route /notifications/send -> <SendNotificationPage role={role} />
  - Replace useNotificationStore with API integration:
      - GET /api/notifications?role=...
      - POST /api/notifications
      - POST /api/notifications/:id/read
      - etc.

  Notes:
  - The module is intentionally simple and uses Tailwind classes.
  - For production, persist notifications server-side (DB), add push (webpush/FCM), and use sockets for realtime.
*/
