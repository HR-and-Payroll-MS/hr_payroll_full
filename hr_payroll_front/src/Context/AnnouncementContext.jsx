import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketProvider';
import useAuth from './AuthContext';

const AnnouncementContext = createContext(null);

export const AnnouncementProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { axiosPrivate } = useAuth(); 
  const socketObj = useSocket(); 

  // 1. Fetch History
  const fetchHistory = useCallback(async () => {
    try {
      const response = await axiosPrivate.get('/announcements/');
      const data = response.data.results || response.data;
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Announcement Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 2. Real-time Socket Listeners
  useEffect(() => {
    if (!socketObj || !socketObj.on) return;

    const handleNewPost = (newPost) => {
      setAnnouncements((prev) => [newPost, ...(Array.isArray(prev) ? prev : [])]);
    };

    const handleDeletePost = (postId) => {
      setAnnouncements((prev) => (Array.isArray(prev) ? prev.filter(a => (a._id !== postId && a.id !== postId)) : []));
    };

    socketObj.on('new_announcement', handleNewPost);
    socketObj.on('delete_announcement', handleDeletePost);

    return () => {
      socketObj.off('new_announcement', handleNewPost);
      socketObj.off('delete_announcement', handleDeletePost);
    };
  }, [socketObj]);

  const publishAnnouncement = async (formData) => {
    console.log("Publishing Announcement:", formData);
    return await axiosPrivate.post('/announcements/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  };

  const removeAnnouncement = async (id) => {
    try {
      await axiosPrivate.delete(`/announcements/${id}/`);
      setAnnouncements(prev => (Array.isArray(prev) ? prev.filter(a => (a._id !== id && a.id !== id)) : []));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const updateAnnouncement = async (id, formData) => {
    try {
      const response = await axiosPrivate.patch(`/announcements/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Update local state
      setAnnouncements(prev => prev.map(a => 
        (String(a.id) === String(id) || (a._id && String(a._id) === String(id))) 
          ? response.data 
          : a
      ));
      return response;
    } catch (err) {
      console.error("Update failed", err);
      throw err;
    }
  };

  const trackView = async (id) => {
    try {
      const response = await axiosPrivate.post(`/announcements/${id}/track-view/`);
      const updatedViews = response.data.views;
      
      // Update local state so UI reflects the change (handling both id and _id)
      setAnnouncements(prev => prev.map(a => 
        (String(a.id) === String(id) || (a._id && String(a._id) === String(id))) 
          ? { ...a, views: updatedViews } 
          : a
      ));
      
      console.log(`View tracked for post ${id}: ${updatedViews} total views`);
    } catch (err) {
      console.error("Track view failed", err);
    }
  };

  return (
    <AnnouncementContext.Provider value={{ announcements, loading, publishAnnouncement, updateAnnouncement, removeAnnouncement, trackView }}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncements = () => {
  const context = useContext(AnnouncementContext);
  if (!context) throw new Error("useAnnouncements must be used within AnnouncementProvider");
  return context;
};