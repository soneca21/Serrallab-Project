
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getNotifications, markAsRead as apiMarkAsRead, deleteNotification as apiDeleteNotification } from '@/features/notifications/api/notifications';
import { supabase } from '@/lib/customSupabaseClient';

const NotificationContext = createContext(undefined);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // Realtime subscription
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
         setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
         // Recalculate unread isn't trivial with single update, better to refetch or complex logic
         // For simplicity, we assume generic update might allow marking read
         if (payload.new.read) {
             setUnreadCount(prev => Math.max(0, prev - 1));
         }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await apiMarkAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const removeNotification = async (id) => {
    try {
      await apiDeleteNotification(id);
      const notif = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif && !notif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const addNotification = (notification) => {
      // Optimistic add for client-side triggered notifs that haven't hit DB yet (if any)
      // Usually better to let DB trigger subscription handle it, but provided for interface
      setNotifications(prev => [notification, ...prev]);
      if (!notification.read) setUnreadCount(prev => prev + 1);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, removeNotification, addNotification, refresh: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
