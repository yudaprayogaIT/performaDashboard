'use client';

// src/hooks/useNotifications.ts
// Custom hook for real-time notifications via SSE

import { useState, useEffect, useCallback, useRef } from 'react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  connected: boolean;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook untuk real-time notifications menggunakan SSE
 *
 * Penggunaan:
 * ```tsx
 * function NotificationBell() {
 *   const { notifications, unreadCount, markAsRead } = useNotifications();
 *
 *   return (
 *     <div>
 *       <Badge count={unreadCount} />
 *       {notifications.map(notif => (
 *         <NotificationItem
 *           key={notif.id}
 *           notification={notif}
 *           onClick={() => markAsRead(notif.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/notifications?limit=10');

      if (!response.ok) {
        // Don't throw, just set empty state
        console.warn('Failed to fetch notifications:', response.status);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.warn('Notifications API returned error:', data.message);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.warn('Fetch notifications error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Set empty state on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect to SSE stream
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Try to connect to SSE (optional, graceful degradation)
    try {
      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE Connected');
        setConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'notifications' && data.data) {
            // New notifications received
            setNotifications((prev) => {
              // Merge new notifications with existing ones, avoid duplicates
              const newNotifications = data.data.filter(
                (newNotif: Notification) =>
                  !prev.some((existingNotif) => existingNotif.id === newNotif.id)
              );

              return [...newNotifications, ...prev].slice(0, 10); // Keep only latest 10
            });

            setUnreadCount((prev) => prev + data.data.length);
          } else if (data.type === 'connected') {
            console.log('SSE:', data.message);
          } else if (data.type === 'heartbeat') {
            // Heartbeat to keep connection alive
          }
        } catch (err) {
          console.warn('SSE parse error:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn('SSE error:', err);
        setConnected(false);
        // Don't set error state, just log it
        // EventSource will automatically reconnect
      };
    } catch (err) {
      console.warn('Failed to initialize SSE:', err);
      setConnected(false);
      // Continue without SSE (graceful degradation)
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      setNotifications((prev) => {
        const deleted = prev.find((n) => n.id === notificationId);
        if (deleted && !deleted.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((notif) => notif.id !== notificationId);
      });
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    connected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
