// message/useChat.js
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../Context/SocketProvider';
import useAuth from '../../Context/AuthContext';

export const useChat = (activeChatId) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const socketContext = useSocket();
  const socket = socketContext?.socket;
  const { axiosPrivate, auth } = useAuth();

  // 1. Fetch History & Init Conversation
  useEffect(() => {
      if (!activeChatId || !auth?.user) return;
      
      const initChat = async () => {
          setIsLoading(true);
          try {
              // Initiate (get or create) conversation
              const res = await axiosPrivate.post('/chat/conversations/initiate/', { userId: activeChatId });
              const convo = res.data;
              setConversationId(convo.id);
              
              // Fetch messages
              const msgRes = await axiosPrivate.get(`/chat/conversations/${convo.id}/messages/`);
              setMessages(msgRes.data);
          } catch (err) {
              console.error("Error initializing chat:", err);
          } finally {
              setIsLoading(false);
          }
      };

      initChat();
  }, [activeChatId, axiosPrivate, auth?.user?.id]);

  // 2. Listen for incoming messages
  useEffect(() => {
    if (!socket) return;
    
    // Handler
    const handleReceive = (newMessage) => {
        // Only append if it belongs to current conversation
        if (newMessage.conversation === conversationId) {
             setMessages((prev) => {
                 // Prevent duplicates
                 if (prev.find(m => m.id === newMessage.id)) return prev;
                 return [...prev, newMessage];
             });
        }
    };

    socket.on('receive_message', handleReceive);

    return () => socket.off('receive_message', handleReceive);
  }, [socket, conversationId]);

  const sendMessage = (content, type = 'text') => {
    if (!socket || !auth?.user) return;

    const payload = {
        receiverId: activeChatId,
        content,
        type
    };

    socket.emit('send_message', payload);
  };
  
  const sendFile = async (file) => {
      if (!conversationId) return;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);
      
      let type = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      
      formData.append('type', type);
      
      try {
          const res = await axiosPrivate.post('/chat/upload/', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          // Backend currently doesn't emit socket for upload, so we append manually
          setMessages(prev => [...prev, res.data]);
      } catch (err) {
          console.error("File upload failed", err);
      }
  };

  return { messages, isLoading, sendMessage, sendFile };
};