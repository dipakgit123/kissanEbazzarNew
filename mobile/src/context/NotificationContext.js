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
  const { isAuthenticated, token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushToken, setPushToken] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();
  const socketRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !token) return;

    setLoading(true);
    try {
      const nextNotifications = await notificationService.getNotifications();
      const nextUnreadCount = await notificationService.getUnreadCount();

      if (Array.isArray(nextNotifications)) {
        setNotifications(nextNotifications);
        setUnreadCount(nextUnreadCount);
        await notificationService.setBadgeCount(nextUnreadCount);
      }
    } catch (error) {
      logger.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const handleNotificationTap = useCallback((data) => {
    if (!navigation) {
      logger.log('Navigation not available - cannot navigate from notification');
      return;
    }

    if (!data || typeof data !== 'object') {
      logger.log('Invalid notification data:', data);
      return;
    }

    try {
      switch (data.type) {
        case 'new_listing':
        case 'contact':
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

  const connectSocket = useCallback(() => {
    if (!user?.id || socketRef.current) return;

    try {
      const socket = io(API_URL, {
        // Polling succeeds on more local Expo networks; Socket.IO can upgrade after connecting.
        transports: ['polling', 'websocket'],
        tryAllTransports: true,
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        logger.log('Socket.IO connected:', socket.id);
        if (user?.id) {
          socket.emit('register', user.id);
        } else {
          logger.error('Cannot register socket: user.id is undefined');
        }
      });

      socket.on('notification', (data) => {
        logger.log('Real-time notification received:', data);

        const newNotification = {
          id: Date.now(),
          title: data.title,
          message: data.body,
          data: data.data,
          is_read: false,
          created_at: data.timestamp,
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        notificationService.scheduleLocalNotification(
          data.title,
          data.body,
          data.data,
          null,
          'default'
        );

        fetchNotifications();
      });

      socket.on('disconnect', () => {
        logger.log('Socket.IO disconnected');
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
      const pushRegistration = await notificationService.registerForPushNotifications();
      const nextPushToken = typeof pushRegistration === 'string'
        ? pushRegistration
        : pushRegistration?.token;
      const provider = typeof pushRegistration === 'string'
        ? 'expo'
        : pushRegistration?.provider || 'expo';

      if (nextPushToken) {
        setPushToken(nextPushToken);

        const shouldReregister = await notificationService.shouldReregisterToken(nextPushToken);

        if (shouldReregister) {
          try {
            await notificationService.registerTokenWithBackend(nextPushToken, provider);
            logger.log('Push token registered with backend');
          } catch (backendError) {
            logger.log('Could not register token with backend:', backendError.message);
          }
        } else {
          logger.log('Token already registered, skipping re-registration');
        }
      }

      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }

      notificationListener.current = notificationService.addNotificationReceivedListener(() => {
        fetchNotifications();
      });

      responseListener.current = notificationService.addNotificationResponseListener((response) => {
        const data = response?.notification?.request?.content?.data || {};
        handleNotificationTap(data);
      });

      await fetchNotifications();
    } catch (error) {
      logger.log('Error setting up notifications (non-fatal):', error.message);
    }
  }, [fetchNotifications, handleNotificationTap]);

  useEffect(() => {
    if (isAuthenticated && token) {
      setupNotifications();
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
        notificationListener.current = null;
      }
      if (responseListener.current) {
        responseListener.current.remove();
        responseListener.current = null;
      }
      disconnectSocket();
    };
  }, [isAuthenticated, token, user?.id, setupNotifications, connectSocket, disconnectSocket]);

  const refreshUnreadCount = async () => {
    if (!isAuthenticated || !token) return;

    try {
      const nextUnreadCount = await notificationService.getUnreadCount();
      setUnreadCount(nextUnreadCount);
      await notificationService.setBadgeCount(nextUnreadCount);
    } catch (error) {
      logger.error('Error refreshing unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      let nextUnreadCount;
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => {
        nextUnreadCount = Math.max(0, prev - 1);
        return nextUnreadCount;
      });
      await notificationService.setBadgeCount(nextUnreadCount);
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
