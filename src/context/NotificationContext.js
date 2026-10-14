'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@/src/lib/api';
import { useSettings } from './SettingsContext';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'lead_mgmt_notifications_v1';

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const seenServerIds = useRef(new Set());
  const initialFetchDone = useRef(false);
  const isFetchingRef = useRef(false);
  const { settings } = useSettings?.() || {};

  // Fetch persistent notifications from backend API
  const fetchNotifications = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      setNotifications([]);
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      // Append cache-buster timestamp query param to prevent Safari from returning 304 cached response
      const res = await api.get('/notifications', {
        params: { _t: Date.now() },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        const serverItems = res.data.data;

        // If this is a subsequent poll, detect any newly arrived unread notifications and pop a toast
        if (initialFetchDone.current) {
          const notifPrefs = settings?.notifications || {};
          if (notifPrefs.inAppToasts !== false) {
            const newlyArrived = serverItems.filter(item => !seenServerIds.current.has(item.id) && !item.read);
            const filteredArrivals = newlyArrived.filter(item => {
              const text = `${item.title || ''} ${item.message || ''}`.toLowerCase();
              const isNewLead = text.includes('lead arrived') || text.includes('new lead') || text.includes('received:');
              const isAssignment = text.includes('assign') || text.includes('shared');
              if (isNewLead && notifPrefs.newLeadAlerts === false) return false;
              if (isAssignment && notifPrefs.assignmentAlerts === false) return false;
              return true;
            });

            if (filteredArrivals.length > 2) {
              toast(`🔔 ${filteredArrivals.length} new notifications received`, {
                id: 'batch-notifications-toast',
                duration: 5000,
                style: {
                  borderRadius: '10px',
                  background: '#1e293b',
                  color: '#fff',
                  fontSize: '0.88rem'
                }
              });
            } else if (filteredArrivals.length > 0) {
              filteredArrivals.forEach(item => {
                toast(item.message || item.title || 'New notification', {
                  id: `toast-${item.id}`,
                  icon: '🔔',
                  duration: 5000,
                  style: {
                    borderRadius: '10px',
                    background: '#1e293b',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }
                });
              });
            }
          }
        }

        // Track all seen server notification IDs
        serverItems.forEach(item => {
          if (item.id) seenServerIds.current.add(item.id);
        });
        initialFetchDone.current = true;

        setNotifications(serverItems.slice(0, 50));
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        console.debug('Failed to fetch notifications from server:', err.message);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Initial load on client mount
  useEffect(() => {
    setIsClient(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(p => !p.id || !String(p.id).startsWith('toast_'));
          setNotifications(cleaned);
          cleaned.forEach(p => {
            if (p.id) seenServerIds.current.add(p.id);
          });
        }
      }
    } catch (e) {
      console.error('Failed to load notifications from storage', e);
    }

    // Initial fetch from backend
    fetchNotifications();

    // Fast polling every 5 seconds for real-time lead arrivals and assignments
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    // Also fetch when window gains focus, online, or custom event
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);
    window.addEventListener('notification:refresh', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
      window.removeEventListener('notification:refresh', handleFocus);
    };
  }, [fetchNotifications]);

  // Persist locally for instant offline/initial rendering
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }, [notifications, isClient]);

  const addNotification = (notif) => {
    const item = {
      id: notif.id || 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: notif.title || 'Notification',
      message: notif.message || notif.title || 'New notification',
      type: notif.type || 'info',
      entityType: notif.entityType || 'lead',
      entityId: notif.entityId || null,
      link: notif.link || null,
      createdAt: notif.createdAt || new Date().toISOString(),
      read: false
    };
    setNotifications((prev) => [item, ...prev].slice(0, 50));
  };

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    // Sync with backend if server notification
    if (id && !String(id).startsWith('toast_')) {
      try {
        await api.patch(`/notifications/${id}/read`);
      } catch (err) {
        console.debug('Failed to mark read on server:', err.message);
      }
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await api.patch('/notifications/read-all');
    } catch (err) {
      console.debug('Failed to mark all as read on server:', err.message);
    }
  };

  const removeNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    // Sync with backend if server notification
    if (id && !String(id).startsWith('toast_')) {
      try {
        await api.delete(`/notifications/${id}`);
      } catch (err) {
        console.debug('Failed to remove notification on server:', err.message);
      }
    }
  };

  const clearAll = async () => {
    setNotifications([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      await api.delete('/notifications');
    } catch (err) {
      console.debug('Failed to clear notifications on server:', err.message);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
