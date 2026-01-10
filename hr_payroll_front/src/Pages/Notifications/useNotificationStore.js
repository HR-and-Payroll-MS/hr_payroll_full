import { useEffect, useState } from "react";

export default function useNotificationStore(initial = []) {
  const [items, setItems] = useState(initial);

  useEffect(() => { setItems(initial); }, []);

  function addNotification(payload) {
    const obj = {
      id: `n${Date.now()}`,
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

  return {
    items,
    addNotification,
    markRead: (id) => setItems((s) => s.map((n)=>n.id===id?{...n,unread:false}:n)),
    markAllRead: ()=>setItems((s)=>s.map((n)=>({...n,unread:false}))),
    remove: (id) => setItems((s)=>s.filter((n)=>n.id!==id)),
  };
}
// Manages notification state globally (add, remove, read, unread) using Zustand or similar.