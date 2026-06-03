import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';
import io from 'socket.io-client';
import { API_URL } from '../services/api';
import logger from '../utils/logger';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, navigation }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushToken, setPushToken] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();
  const socketRef = useRef(null);

  // Register for push notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setupNotifications();
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      // Cleanup listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      disconnectSocket();
    };
  }, [isAuthenticated, user?.id, setupNotifications, connectSocket, disconnectSocket]); // ✅ Include all dependencies

  // Connect to Socket.IO for real-time notifications
  const connectSocket = useCallback(() => {
    if (!user?.id || socketRef.current) return;

    try {
      const socket = io(API_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      socket.on('connect', () => {
        logger.log('✅ Socket.IO connected:', socket.id);
        // ✅ Validate user.id before emitting
        if (user?.id) {
          socket.emit('register', user.id);
        } else {
          logger.error('Cannot register socket: user.id is undefined');
        }
      });

      socket.on('notification', (data) => {
        logger.log('🔔 Real-time notification received:', data);

        // Add notification to local state
        const newNotification = {
          id: Date.now(),
          title: data.title,
          message: data.body,
          data: data.data,
          is_read: false,
          created_at: data.timestamp
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show local notification with channelId
        notificationService.scheduleLocalNotification(
          data.title,
          data.body,
          data.data,
          null, // trigger
          'default' // channelId
        );

        // Refresh from server to get complete data
        fetchNotifications();
      });

      socket.on('disconnect', () => {
        logger.log('❌ Socket.IO disconnected');
      });

      socket.on('connect_error', (error) => {
        logger.log('Socket connection error:', error.message);
      });

      socketRef.current = socket;
    } catch (error) {
      logger.error('Error connecting socket:', error);
    }
  }, [user?.id, fetchNotifications]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      logger.log('Socket disconnected');
    }
  }, []);

  const setupNotifications = useCallback(async () => {
    try {
      // Register for push notifications
      const token = await notificationService.registerForPushNotifications();

      if (token) {
        setPushToken(token);

        // Check if token needs re-registration
        const shouldReregister = await notificationService.shouldReregisterToken(token);

        if (shouldReregister) {
          // Register token with backend - wrap in try/catch to prevent network errors from crashing
          try {
            await notificationService.registerTokenWithBackend(token);
            logger.log('✅ Push token registered with backend');
          } catch (backendError) {
            logger.log('Could not register token with backend (offline or server issue):', backendError.message);
            // Continue anyway - app should work without backend token registration
          }
        } else {
          logger.log('Token already registered, skipping re-registration');
        }
      }

      // Set up notification listeners
      notificationListener.current = notificationService.addNotificationReceivedListener(
        (notification) => {
          logger.log('Notification received:', notification);
          // Refresh notifications when new one arrives
          fetchNotifications();
        }
      );

      responseListener.current = notificationService.addNotificationResponseListener(
        (response) => {
          logger.log('Notification tapped:', response);
          // ✅ Safe property access with null checks
          const data = response?.notification?.request?.content?.data || {};
          handleNotificationTap(data);
        }
      );

      // Fetch initial notifications - wrap in try/catch
      try {
        await fetchNotifications();
      } catch (fetchError) {
        logger.log('Could not fetch notifications (offline or server issue):', fetchError.message);
      }
    } catch (error) {
      logger.log('Error setting up notifications (non-fatal):', error.message);
      // Don't crash the app - notifications are optional
    }
  }, [user?.id, fetchNotifications, handleNotificationTap]); // ✅ Add dependencies

  const handleNotificationTap = useCallback((data) => {
    // ✅ Handle missing navigation prop gracefully
    if (!navigation) {
      logger.log('Navigation not available - cannot navigate from notification');
      return;
    }

    // Validate data
    if (!data || typeof data !== 'object') {
      logger.log('Invalid notification data:', data);
      return;
    }

    // Navigate based on notification type
    try {
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
          if (data.listing_id && data.animal_type) {
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
    } catch (error) {
      logger.error('Error navigating from notification:', error);
    }
  }, [navigation]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      // ✅ getNotifications now returns validated data
      const notifications = await notificationService.getNotifications();
      const unreadCount = await notificationService.getUnreadCount();

      if (Array.isArray(notifications)) {
        setNotifications(notifications);
        setUnreadCount(unreadCount);
        // Update badge
        await notificationService.setBadgeCount(unreadCount);
      }
    } catch (error) {
      logger.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refreshUnreadCount = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.unread_count);
        await notificationService.setBadgeCount(response.unread_count);
      }
    } catch (error) {
      logger.error('Error refreshing unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      let newUnreadCount;
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => {
        newUnreadCount = Math.max(0, prev - 1);
        return newUnreadCount;
      });
      await notificationService.setBadgeCount(newUnreadCount);
    } catch (error) {
      logger.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      await notificationService.setBadgeCount(0);
    } catch (error) {
      logger.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        if (notification && !notification.is_read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (error) {
      logger.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      await notificationService.setBadgeCount(0);
    } catch (error) {
      logger.error('Error clearing notifications:', error);
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
