import React, { createContext, useContext, useEffect, useState } from 'react';
import useAuth from './AuthContext';
import { useSocket } from './SocketProvider';

const ChatBadgeContext = createContext({ unreadTotal: 0 });

export function ChatBadgeProvider({ children }) {
  const { auth, axiosPrivate } = useAuth();
  const { socket } = useSocket() || {};
  const [unreadTotal, setUnreadTotal] = useState(0);

  const recomputeUnread = async () => {
    if (!axiosPrivate || !auth?.accessToken) return;
    try {
      const res = await axiosPrivate.get('/chat/conversations/');
      if (Array.isArray(res.data)) {
        const sum = res.data.reduce((acc, c) => acc + (c.unread_count || 0), 0);
        setUnreadTotal(sum);
      }
    } catch (e) {
      // Avoid recursive retries on auth/network failures.
      setUnreadTotal(0);
    }
  };

  useEffect(() => {
    recomputeUnread();
  }, [auth?.accessToken]);

  useEffect(() => {
    if (!socket) return;
    // On socket connect, recompute unread to sync header badge
    socket.on('connect', recomputeUnread);

    const handleReceive = (msg) => {
      // Backend emits to both sender and receiver rooms.
      // Increment only if the sender is NOT the current user.
      if (msg && msg.sender && auth?.user?.id && msg.sender !== auth.user.id) {
        setUnreadTotal((prev) => prev + 1);
      }
    };

    const handleMessagesRead = (payload) => {
      // Recompute from server to stay accurate after reads
      recomputeUnread();
    };

    socket.on('receive_message', handleReceive);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('connect', recomputeUnread);
      socket.off('receive_message', handleReceive);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, auth?.user?.id]);

  return (
    <ChatBadgeContext.Provider
      value={{ unreadTotal, setUnreadTotal, recomputeUnread }}
    >
      {children}
    </ChatBadgeContext.Provider>
  );
}

export function useChatBadge() {
  return useContext(ChatBadgeContext);
}
