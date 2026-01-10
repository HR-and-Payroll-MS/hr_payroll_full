import React, { createContext, useContext, useEffect, useState } from 'react';
import useAuth from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { axiosPrivate, auth } = useAuth();
    const { socket } = useSocket();
    
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch Notifications
    const fetchNotifications = async () => {
        if (!auth.accessToken) return;
        try {
            const res = await axiosPrivate.get('/notifications/');
            setNotifications(res.data.results || res.data || []);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    // Calculate unread count
    useEffect(() => {
        const count = notifications.filter(n => !n.is_read).length;
        setUnreadCount(count);
    }, [notifications]);

    // Initial Fetch
    useEffect(() => {
        fetchNotifications();
    }, [auth.accessToken]);

    // Socket Listener
    useEffect(() => {
        if (socket) {
            socket.on('new_notification', (newNotif) => {
                console.log('New Notification Received:', newNotif);
                // Add to list (at top)
                setNotifications(prev => [newNotif, ...prev]);
                // Play sound? Show Toast?
            });

            return () => {
                socket.off('new_notification');
            };
        }
    }, [socket]);

    const markAsRead = async (id) => {
        try {
            await axiosPrivate.post(`/notifications/${id}/mark-read/`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllRead = async () => {
        try {
            await axiosPrivate.post(`/notifications/mark-all-read/`);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
             await axiosPrivate.delete(`/notifications/${id}/`);
             setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
             console.error('Failed to delete notification', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            loading, 
            fetchNotifications, 
            markAsRead, 
            markAllRead,
            deleteNotification 
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
