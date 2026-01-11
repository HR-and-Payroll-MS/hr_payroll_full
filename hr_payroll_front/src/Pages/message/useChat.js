// message/useChat.js
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../Context/SocketProvider';
import useAuth from '../../Context/AuthContext';
import { useChatBadge } from '../../Context/ChatBadgeContext';

export const useChat = (activeChatId) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const socketContext = useSocket();
  const socket = socketContext?.socket;
  const { axiosPrivate, auth } = useAuth();
  const replyToRef = useRef(null);
  const { recomputeUnread } = useChatBadge() || {};

  const normalizeMessage = (m) => {
    if (!m) return null;
    const type = m.message_type || m.type || 'text';
    const content = m.content || m.message || m.text || '';
    const mediaUrl = m.attachment_url || m.attachment || null;
    const replyTo = m.reply_to || null;
    const replyPreview = m.reply_preview || null;
    const status = m.is_read ? 'read' : m.status || 'sent';
    const time =
      m.time ||
      (m.created_at
        ? new Date(m.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '');
    return {
      ...m,
      content,
      type,
      mediaUrl,
      replyTo,
      replyPreview,
      time,
      status,
    };
  };

  // 1. Fetch History & Init Conversation
  useEffect(() => {
    if (!activeChatId || !auth?.user) return;

    const initChat = async () => {
      setIsLoading(true);
      try {
        // Initiate (get or create) conversation
        const res = await axiosPrivate.post('/chat/conversations/initiate/', {
          userId: activeChatId,
        });
        const convo = res.data;
        setConversationId(convo.id);

        // Fetch messages
        const msgRes = await axiosPrivate.get(
          `/chat/conversations/${convo.id}/messages/`
        );
        const normalized = Array.isArray(msgRes.data)
          ? msgRes.data.map(normalizeMessage).filter(Boolean)
          : [];
        setMessages(normalized);
        recomputeUnread?.();
      } catch (err) {
        console.error('Error initializing chat:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [activeChatId, axiosPrivate, auth?.user?.id]);

  // 2. Listen for incoming messages and typing
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (newMessage) => {
      console.log('[socket] receive_message raw:', newMessage);
      const norm = normalizeMessage(newMessage);
      if (!norm) return;
      const convoMatch = norm.conversation || norm.conversation_id;
      if (convoMatch === conversationId) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === norm.id)) return prev;
          const cleaned = prev.filter((m) => {
            const isTemp = typeof m.id === 'string' && m.id.startsWith('temp-');
            const sameSender = m.sender === norm.sender;
            const sameConv =
              (m.conversation || m.conversation_id) === convoMatch;
            const sameContent = (m.content || '') === (norm.content || '');
            return !(isTemp && sameSender && sameConv && sameContent);
          });
          return [...cleaned, norm];
        });
      }
    };

    const handleTyping = (payload) => {
      console.log('[socket] typing payload:', payload);
      const from = payload?.senderId ?? payload?.from;
      const flag = payload?.isTyping ?? true;
      if (from && from === activeChatId && flag) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    };

    const handleRead = (payload) => {
      const convoId = payload?.conversationId;
      const readerId = payload?.readerId;
      if (!convoId || convoId !== conversationId) return;
      // If the other user (activeChatId) read my messages, mark my sent messages as read
      if (readerId && readerId === activeChatId) {
        setMessages((prev) =>
          prev.map((m) => {
            const conv = m.conversation || m.conversation_id;
            if (conv === conversationId && m.sender === auth?.user?.id) {
              return { ...m, status: 'read', is_read: true };
            }
            return m;
          })
        );
      }
    };

    socket.on('receive_message', handleReceive);
    // Listen to both event names to be safe
    socket.on('display_typing', handleTyping);
    socket.on('typing', handleTyping);
    socket.on('messages_read', handleRead);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('display_typing', handleTyping);
      socket.off('typing', handleTyping);
      socket.off('messages_read', handleRead);
    };
  }, [socket, conversationId, auth?.user?.id, activeChatId]);

  const sendMessage = (content, type = 'text') => {
    if (!auth?.user || !activeChatId || !content?.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const now = new Date();
    const optimistic = {
      id: tempId,
      content,
      type,
      sender: auth.user.id,
      receiver: activeChatId,
      conversation: conversationId,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setMessages((prev) => [...prev, optimistic]);

    if (socket) {
      const payload = {
        receiverId: activeChatId,
        content,
        type,
        conversationId,
        replyTo: replyToRef.current || undefined,
      };
      socket.emit('send_message', payload);
      // Clear reply after sending
      replyToRef.current = null;
    }
  };

  const setReplyTarget = (id) => {
    replyToRef.current = id;
  };
  const clearReplyTarget = () => {
    replyToRef.current = null;
  };

  const sendFile = async (file, caption) => {
    if (!conversationId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

    let type = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    formData.append('type', type);
    if (caption) formData.append('content', caption);
    if (replyToRef.current) formData.append('replyTo', replyToRef.current);

    try {
      const res = await axiosPrivate.post('/chat/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Normalize before appending so sender sees correct type/content
      const norm = normalizeMessage(res.data);
      setMessages((prev) => [...prev, norm]);
    } catch (err) {
      console.error('File upload failed', err);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    sendFile,
    isTyping,
    setReplyTarget,
    clearReplyTarget,
  };
};
