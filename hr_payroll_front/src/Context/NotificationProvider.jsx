import { createContext, useContext, useEffect, useState } from 'react';
import useAuth from './AuthContext';
import { useSocket } from './SocketProvider';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { axiosPrivate } = useAuth();
  const socket = useSocket();

  const [items, setItems] = useState([]);
  const [sentItems, setSentItems] = useState([]);
  const [selected, setSelected] = useState(null);

  // 🔹 Helper: Count items where unread is strictly true
  const unreadCount = items.filter((n) => n.unread === true).length;

  /* 🔹 1. Initial Fetch (Received) */
  useEffect(() => {
    let mounted = true;

    axiosPrivate
      .get('notifications/')
      .then((res) => {
        if (!mounted) return;

        // DEBUG: log raw backend payload so we can inspect link fields
        console.log(
          'notifications fetch raw response:',
          res.data?.results || res.data
        );

        // NORMALIZE DATA: Backend sends 'is_read', Frontend needs 'unread'
        const formatted = (res.data?.results || []).map((n) => ({
          ...n,
          unread: !n.is_read, // If is_read is false, unread is true
          createdAt: n.created_at || n.createdAt, // Handle both snake_case and camelCase
          category: n.notification_type || 'info',
        }));

        // DEBUG: log formatted notifications so we can see the fields frontend will use
        console.log('notifications formatted for UI:', formatted);

        setItems(formatted);
      })
      .catch((err) => {
        console.error('Failed to fetch notifications:', err);
      });

    return () => {
      mounted = false;
    };
  }, [axiosPrivate]);

  /* 🔹 1.5 Fetch Sent Notifications */
  const fetchSent = async () => {
    try {
      const res = await axiosPrivate.get('notifications/?type=sent');
      const formatted = (res.data?.results || []).map((n) => ({
        ...n,
        unread: false, // Sent items aren't "unread" for the sender
        createdAt: n.created_at || n.createdAt,
        category: n.notification_type || 'info',
      }));
      setSentItems(formatted);
    } catch (err) {
      console.error('Failed to fetch sent notifications:', err);
    }
  };

  useEffect(() => {
    fetchSent();
  }, [axiosPrivate]);

  /* 🔹 2. Realtime Socket Listener (FIXED) */
  useEffect(() => {
    if (!socket) return;

    const onNotification = (data) => {
      console.log('Socket Notification Received:', data); // Debug log

      setItems((prev) => {
        // Prevent duplicates
        if (prev.some((n) => n.id === data.id)) return prev;

        // FORCE 'unread: true' on new items
        const newItem = {
          ...data,
          is_read: false, // Backend standard
          unread: true, // Frontend standard (Vital for Red Dot)
          createdAt: data.created_at || new Date().toISOString(),
          category: data.type || data.notification_type || 'info',
        };

        // Add new item to the TOP of the list
        return [newItem, ...prev];
      });
    };

    socket.on('new_notification', onNotification);

    return () => {
      socket.off('new_notification', onNotification);
    };
  }, [socket]);

  /* 🔹 Actions */
  const markRead = async (id) => {
    // UI Update
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, unread: false, is_read: true } : n
      )
    );

    // API Update
    try {
      await axiosPrivate.post(`notifications/${id}/mark-read/`);
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const markAllRead = async () => {
    setItems((prev) =>
      prev.map((n) => ({ ...n, unread: false, is_read: true }))
    );
    try {
      await axiosPrivate.post('notifications/mark-all-read/');
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  };

  const remove = async (id) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    setSentItems((prev) => prev.filter((n) => n.id !== id));
    if (selected?.id === id) setSelected(null);
    try {
      await axiosPrivate.delete(`notifications/${id}/`);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        items,
        sentItems,
        unreadCount,
        markRead,
        markAllRead,
        remove,
        fetchSent,
        selected,
        setSelected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      'useNotifications must be used inside NotificationProvider'
    );
  }
  return ctx;
}

// import { createContext, useContext, useEffect, useState } from "react";
// import useAuth from "./AuthContext";
// import { useSocket } from "./SocketProvider";

// const NotificationContext = createContext(null);

// export function NotificationProvider({ children }) {
//   const { axiosPrivate } = useAuth();
//   const socket = useSocket();

//   const [items, setItems] = useState([]);

//   const unreadCount = items.filter((n) => !n.is_read).length;

//   /* 🔹 Initial fetch */
//   useEffect(() => {
//     let mounted = true;

//     axiosPrivate
//       .get("notifications/")
//       .then((res) => {
//         if (!mounted) return;
//         setItems(res.data?.results || []); // ✅ FIX
//       })
//       .catch((err) => {
//         console.error("Failed to fetch notifications:", err);
//       });

//     return () => {
//       mounted = false;
//     };
//   }, [axiosPrivate]);

//   /* 🔹 Realtime socket */
//   useEffect(() => {
//     if (!socket) return;

//     const onNotification = (data) => {
//       setItems((prev) => {
//         if (prev.some((n) => n.id === data.id)) return prev;

//         return [
//           {
//             ...data,
//             is_read: false,
//             created_at: new Date().toISOString(),
//           },
//           ...prev,
//         ];
//       });
//     };

//     socket.on("notification", onNotification);
//     return () => socket.off("notification", onNotification);
//   }, [socket]);

//   /* 🔹 Actions */
//   const markRead = async (id) => {
//     await axiosPrivate.post(`notifications/${id}/mark-read/`);
//     setItems((prev) =>
//       prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
//     );
//   };

//   const markAllRead = async () => {
//     await axiosPrivate.post("notifications/mark-all-read/");
//     setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
//   };

//   const remove = async (id) => {
//     await axiosPrivate.delete(`notifications/${id}/`);
//     setItems((prev) => prev.filter((n) => n.id !== id));
//   };

//   return (
//     <NotificationContext.Provider
//       value={{
//         items,
//         unreadCount,
//         markRead,
//         markAllRead,
//         remove,
//       }}
//     >
//       {children}
//     </NotificationContext.Provider>
//   );
// }

// export function useNotifications() {
//   const ctx = useContext(NotificationContext);

//   if (!ctx) {
//     throw new Error(
//       "useNotifications must be used inside NotificationProvider"
//     );
//   }

//   return ctx;
// }
