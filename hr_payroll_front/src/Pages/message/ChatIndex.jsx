import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import useAuth from '../../Context/AuthContext';
import { useSocket } from '../../Context/SocketProvider';

export default function ChatIndex() {
  const [activeId, setActiveId] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { axiosPrivate, auth } = useAuth();
  const socketContext = useSocket();
  const socket = socketContext?.socket;

  useEffect(() => {
     let isMounted = true;
     
     console.log("ChatIndex: Effect running. Auth:", auth?.user?.username, "Token:", !!auth?.accessToken);

     if (!auth?.accessToken) {
         console.warn("ChatIndex: No access token available.");
         setLoading(false);
         return;
     }

     const fetchData = async () => {
         try {
             console.log("ChatIndex: Fetching chat data...");
             setLoading(true); // Ensure loading is true
             
             // 1. Fetch Users
             const usersRes = await axiosPrivate.get('/chat/users/');
             console.log("ChatIndex: Users fetched:", usersRes.data?.length);
             
             // 2. Fetch Conversations (for unread, last msg)
             const convRes = await axiosPrivate.get('/chat/conversations/');
             console.log("ChatIndex: Conversations fetched:", convRes.data?.length);
             
             if (isMounted) {
                // ... existing mapping logic ...
                // Create a map of conversations by other_participant ID
                const convMap = {};
                if(Array.isArray(convRes.data)){
                    convRes.data.forEach(c => {
                        const partnerId = c.other_participant?.id;
                        if(partnerId) convMap[partnerId] = c;
                    });
                }
                
                const mapped = Array.isArray(usersRes.data) ? usersRes.data.map(u => {
                    const conv = convMap[u.id];
                    return {
                        ...u,
                        msg: conv?.last_message?.content || (conv?.last_message?.attachment ? 'Attachment' : ''), 
                        time: conv?.last_message?.created_at ? new Date(conv.last_message.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '',
                        unread: conv?.unread_count || 0,
                        online: false // Socket will update
                    };
                }) : [];
                
                // Sort: Users with messages first, then by name
                mapped.sort((a, b) => {
                    if (a.msg && !b.msg) return -1;
                    if (!a.msg && b.msg) return 1;
                    return 0;
                });

                setUsers(mapped);
                
                if(mapped.length > 0 && !activeId) {
                    setActiveId(mapped[0].id);
                }
             }
         } catch (err) {
             console.error("ChatIndex: Failed to fetch chat data", err);
             if (isMounted) setError(err.message || "Failed to load chat");
         } finally {
             if (isMounted) setLoading(false);
         }
     };
     
     fetchData();
     
     return () => { isMounted = false; };
  }, [axiosPrivate, auth?.accessToken]);

  // Socket: Listen for status/new messages to update Sidebar
  useEffect(() => {
    if(!socket) return;
    
    // Initial: Get Online Users
    socket.emit('get_online_users', (onlineIds) => {
        if(Array.isArray(onlineIds)) {
            setUsers(prev => prev.map(u => ({
                ...u,
                online: onlineIds.includes(u.id)
            })));
        }
    });

    const handleNewMessage = (msg) => {
        setUsers(prev => prev.map(u => {
            if(u.id === msg.sender) { // Message from them
                return {
                    ...u,
                    msg: msg.content || (msg.attachment ? 'Attachment' : 'New Message'),
                    time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
                    unread: (activeId === u.id) ? u.unread : u.unread + 1
                };
            }
            if(msg.sender === auth.user?.id && u.id === msg.receiver) { // Message from me
                 return {
                    ...u,
                    msg: msg.content || 'Sent attachment',
                    time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
                };
            }
            return u;
        }));
    };
    
    // Real-time status updates
    const handleStatusChange = ({ userId, online }) => {
        setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, online } : u
        ));
    };
    
    socket.on('receive_message', handleNewMessage);
    socket.on('user_status_change', handleStatusChange);

    return () => {
        socket.off('receive_message', handleNewMessage);
        socket.off('user_status_change', handleStatusChange);
    };
  }, [socket, activeId, auth?.user?.id]);

  const activeUser = users.find(u => u.id === activeId);

  if (loading) {
      return (
          <div className="flex w-full h-full bg-gray-100 dark:bg-slate-800 items-center justify-center text-slate-500">
              Loading Chat... (Token: {auth?.accessToken ? 'OK' : 'Missing'})
          </div>
      );
  }
  
  if (error) {
      return (
          <div className="flex w-full h-full bg-gray-100 dark:bg-slate-800 items-center justify-center text-red-500">
              Error: {error}
          </div>
      );
  }

  return (
    <div className="flex w-full h-full bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 overflow-hidden font-sans p-2.5 gap-4">
      <Sidebar activeId={activeId} setActiveId={setActiveId} users={users} />
      <ChatArea activeUser={activeUser} />
    </div>
  );
}