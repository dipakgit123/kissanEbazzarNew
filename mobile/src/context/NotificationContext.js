import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, navigation }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushToken, setPushToken] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();

  // Register for push notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setupNotifications();
    }

    return () => {
      // Cleanup listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated]);

  const setupNotifications = async () => {
    try {
      // Register for push notifications
      const token = await notificationService.registerForPushNotifications();

      if (token) {
        setPushToken(token);
        // Register token with backend - wrap in try/catch to prevent network errors from crashing
        try {
          await notificationService.registerTokenWithBackend(token);
        } catch (backendError) {
          console.log('Could not register token with backend (offline or server issue):', backendError.message);
          // Continue anyway - app should work without backend token registration
        }
      }

      // Set up notification listeners
      notificationListener.current = notificationService.addNotificationReceivedListener(
        (notification) => {
          console.log('Notification received:', notification);
          // Refresh notifications when new one arrives
          fetchNotifications();
        }
      );

      responseListener.current = notificationService.addNotificationResponseListener(
        (response) => {
          console.log('Notification tapped:', response);
          const data = response.notification.request.content.data;
          handleNotificationTap(data);
        }
      );

      // Fetch initial notifications - wrap in try/catch
      try {
        await fetchNotifications();
      } catch (fetchError) {
        console.log('Could not fetch notifications (offline or server issue):', fetchError.message);
      }
    } catch (error) {
      console.log('Error setting up notifications (non-fatal):', error.message);
      // Don't crash the app - notifications are optional
    }
  };

  const handleNotificationTap = (data) => {
    if (!navigation) return;

    // Navigate based on notification type
    switch (data.type) {
      case 'new_listing':
        if (data.listing_id && data.animal_type) {
          navigation.navigate('AnimalDetail', {
            id: data.listing_id,
            animalType: data.animal_type,
          });
        }
        break;
      case 'contact':
        // Navigate to messages or listing
        if (data.listing_id) {
          navigation.navigate('AnimalDetail', {
            id: data.listing_id,
            animalType: data.animal_type,
          });
        }
        break;
      case 'pregnancy':
        navigation.navigate('PregnancyCalendar');
        break;
      default:
        navigation.navigate('Notifications');
        break;
    }
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const response = await notificationService.getNotifications();
      if (response.success) {
        setNotifications(response.data);
        setUnreadCount(response.unread_count);
        // Update badge
        await notificationService.setBadgeCount(response.unread_count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUnreadCount = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.unread_count);
        await notificationService.setBadgeCount(response.unread_count);
      }
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      await notificationService.setBadgeCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      await notificationService.setBadgeCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      await notificationService.setBadgeCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        pushToken,
        fetchNotifications,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
