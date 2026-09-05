import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useVetAuth } from './VetAuthContext';
import notificationService from '../services/notificationService';
import { API_URL } from '../services/api';
import { navigateFromNotification } from '../navigation/notificationNavigation';
import logger from '../utils/logger';

const NotificationContext = createContext();
const PAGE_SIZE = 30;
const DEFAULT_PREFERENCES = {
  push_enabled: true,
  appointments_enabled: true,
  marketplace_enabled: true,
  reminders_enabled: true,
  communication_enabled: true,
  system_enabled: true,
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

const getResponseIdentifier = (response) => (
  response?.notification?.request?.content?.data?.notification_id
  || response?.notification?.request?.identifier
  || null
);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  const { isVetAuthenticated, vetToken, veterinarian } = useVetAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [pushToken, setPushToken] = useState(null);
  const [pushRegistrationStatus, setPushRegistrationStatus] = useState('idle');
  const [pushRegistrationError, setPushRegistrationError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  const socketRef = useRef(null);
  const notificationListenerRef = useRef(null);
  const responseListenerRef = useRef(null);
  const tokenListenerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const notificationsRef = useRef([]);
  const accountKeyRef = useRef(null);
  const handledResponsesRef = useRef(new Set());

  const activeToken = isVetAuthenticated ? vetToken : token;
  const activeRecipient = isVetAuthenticated ? veterinarian : user;
  const activeRecipientType = isVetAuthenticated ? 'veterinarian' : 'user';
  const activeRecipientKey = activeRecipient?.id ? `${activeRecipientType}:${activeRecipient.id}` : null;
  const hasNotificationAccount = Boolean(
    activeToken && activeRecipient?.id && (isVetAuthenticated || isAuthenticated)
  );

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const updateBadge = useCallback((count) => {
    notificationService.setBadgeCount(Math.max(0, count)).catch((error) => {
      logger.log('Unable to update app badge:', error.message);
    });
  }, []);

  const fetchNotifications = useCallback(async ({ append = false } = {}) => {
    if (!hasNotificationAccount) return;
    const requestAccountKey = activeRecipientKey;
    append ? setLoadingMore(true) : setLoading(true);

    try {
      const offset = append ? notificationsRef.current.length : 0;
      const page = await notificationService.getNotificationPage(PAGE_SIZE, offset, activeToken);
      if (accountKeyRef.current !== requestAccountKey) return;

      setNotifications((current) => {
        if (!append) return page.items;
        const knownIds = new Set(current.map((item) => String(item.id)));
        return [...current, ...page.items.filter((item) => !knownIds.has(String(item.id)))];
      });
      setUnreadCount(page.unreadCount);
      setHasMore(offset + page.items.length < page.total);
      updateBadge(page.unreadCount);
    } catch (error) {
      logger.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeRecipientKey, activeToken, hasNotificationAccount, updateBadge]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => fetchNotifications(), 250);
  }, [fetchNotifications]);

  const loadPreferences = useCallback(async () => {
    if (!hasNotificationAccount) return;
    setPreferencesLoading(true);
    try {
      const nextPreferences = await notificationService.getPreferences(activeToken);
      if (nextPreferences) setPreferences({ ...DEFAULT_PREFERENCES, ...nextPreferences });
    } catch (error) {
      logger.error('Error loading notification preferences:', error);
    } finally {
      setPreferencesLoading(false);
    }
  }, [activeToken, hasNotificationAccount]);

  const updatePreference = useCallback(async (field, value) => {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_PREFERENCES, field)) return false;
    const previous = preferences[field];
    setPreferences((current) => ({ ...current, [field]: value }));
    try {
      const nextPreferences = await notificationService.updatePreferences({ [field]: value }, activeToken);
      if (nextPreferences) setPreferences({ ...DEFAULT_PREFERENCES, ...nextPreferences });
      return true;
    } catch (error) {
      setPreferences((current) => ({ ...current, [field]: previous }));
      logger.error('Error updating notification preference:', error);
      return false;
    }
  }, [activeToken, preferences]);

  const syncPushToken = useCallback(async ({ requestPermission = false, force = false } = {}) => {
    if (!hasNotificationAccount) return null;
    setPushRegistrationStatus('registering');
    setPushRegistrationError(null);

    try {
      const registration = await notificationService.registerForPushNotifications({ requestPermission });
      setPermissionStatus(registration?.permissionStatus || 'unavailable');
      if (!registration?.token) {
        setPushToken(null);
        setPushRegistrationStatus('failed');
        setPushRegistrationError(registration?.error || registration?.reason || 'push_token_unavailable');
        return registration;
      }

      setPushToken(registration.token);
      const shouldRegister = force || await notificationService.shouldReregisterToken(
        registration.token,
        activeRecipientKey
      );
      if (shouldRegister) {
        await notificationService.registerTokenWithBackend(
          registration.token,
          registration.provider,
          3,
          activeToken,
          activeRecipientKey
        );
      }
      setPushRegistrationStatus('registered');
      return registration;
    } catch (error) {
      setPushRegistrationStatus('failed');
      setPushRegistrationError(error?.message || 'push_registration_failed');
      throw error;
    }
  }, [activeRecipientKey, activeToken, hasNotificationAccount]);

  const requestPushPermission = useCallback(async () => {
    try {
      return await syncPushToken({ requestPermission: true, force: true });
    } catch (error) {
      logger.error('Unable to enable push notifications:', error);
      return null;
    }
  }, [syncPushToken]);

  const markAsRead = useCallback(async (notificationId) => {
    const item = notificationsRef.current.find((entry) => String(entry.id) === String(notificationId));
    if (item?.is_read) return;
    try {
      await notificationService.markAsRead(notificationId, activeToken);
      setNotifications((current) => current.map((entry) => (
        String(entry.id) === String(notificationId) ? { ...entry, is_read: true } : entry
      )));
      setUnreadCount((current) => {
        const next = Math.max(0, current - 1);
        updateBadge(next);
        return next;
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }, [activeToken, updateBadge]);

  const handleNotificationResponse = useCallback(async (response) => {
    const identifier = getResponseIdentifier(response);
    if (identifier && handledResponsesRef.current.has(String(identifier))) return;
    if (identifier) handledResponsesRef.current.add(String(identifier));

    const data = response?.notification?.request?.content?.data || {};
    if (data.notification_id) await markAsRead(data.notification_id);
    navigateFromNotification(data, isVetAuthenticated);
  }, [isVetAuthenticated, markAsRead]);

  const openNotification = useCallback(async (notification) => {
    if (!notification) return;
    if (!notification.is_read && notification.id) await markAsRead(notification.id);
    navigateFromNotification(
      { ...(notification.data || {}), type: notification.type || notification.data?.type },
      isVetAuthenticated
    );
  }, [isVetAuthenticated, markAsRead]);

  const connectSocket = useCallback(() => {
    if (!hasNotificationAccount || socketRef.current) return;
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      tryAllTransports: true,
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      auth: { token: activeToken },
    });

    socket.on('notification', (payload) => {
      const incoming = {
        id: payload.id || payload.data?.notification_id,
        title: payload.title,
        message: payload.body,
        type: payload.type || payload.data?.type,
        data: payload.data || {},
        is_read: false,
        created_at: payload.timestamp,
      };
      if (incoming.id) {
        setNotifications((current) => {
          if (current.some((item) => String(item.id) === String(incoming.id))) return current;
          return [incoming, ...current];
        });
      }
      scheduleRefresh();
    });
    socket.on('connect_error', (error) => logger.log('Notification socket error:', error.message));
    socketRef.current = socket;
  }, [activeToken, hasNotificationAccount, scheduleRefresh]);

  const disconnectSocket = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  useEffect(() => {
    accountKeyRef.current = activeRecipientKey;
    setNotifications([]);
    setUnreadCount(0);
    setHasMore(false);
    handledResponsesRef.current.clear();

    if (!hasNotificationAccount) {
      disconnectSocket();
      setPushToken(null);
      setPushRegistrationStatus('idle');
      setPushRegistrationError(null);
      updateBadge(0);
      return undefined;
    }

    let cancelled = false;
    const setup = async () => {
      try {
        await Promise.all([
          fetchNotifications(),
          loadPreferences(),
          syncPushToken({ requestPermission: true, force: true }),
        ]);
        if (!cancelled) {
          const lastResponse = await notificationService.getLastNotificationResponse();
          if (lastResponse) {
            await handleNotificationResponse(lastResponse);
            await notificationService.clearLastNotificationResponse();
          }
        }
      } catch (error) {
        logger.log('Notification setup completed with a non-fatal error:', error.message);
      }
    };

    notificationListenerRef.current = notificationService.addNotificationReceivedListener(scheduleRefresh);
    responseListenerRef.current = notificationService.addNotificationResponseListener(handleNotificationResponse);
    tokenListenerRef.current = notificationService.addPushTokenListener(() => {
      syncPushToken({ force: true }).catch((error) => logger.error('Push token refresh failed:', error));
    });
    connectSocket();
    setup();

    return () => {
      cancelled = true;
      notificationListenerRef.current?.remove();
      responseListenerRef.current?.remove();
      tokenListenerRef.current?.remove?.();
      notificationListenerRef.current = null;
      responseListenerRef.current = null;
      tokenListenerRef.current = null;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      disconnectSocket();
    };
  }, [
    activeRecipientKey,
    connectSocket,
    disconnectSocket,
    fetchNotifications,
    handleNotificationResponse,
    hasNotificationAccount,
    loadPreferences,
    scheduleRefresh,
    syncPushToken,
    updateBadge,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' || !hasNotificationAccount) return;
      fetchNotifications();
      notificationService.getNotificationPermissionStatus()
        .then(setPermissionStatus)
        .catch(() => {});
      syncPushToken().catch(() => {});
    });
    return () => subscription.remove();
  }, [fetchNotifications, hasNotificationAccount, syncPushToken]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead(activeToken);
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
      updateBadge(0);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  }, [activeToken, updateBadge]);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId, activeToken);
      const item = notificationsRef.current.find((entry) => String(entry.id) === String(notificationId));
      setNotifications((current) => current.filter((entry) => String(entry.id) !== String(notificationId)));
      if (item && !item.is_read) {
        setUnreadCount((current) => {
          const next = Math.max(0, current - 1);
          updateBadge(next);
          return next;
        });
      }
    } catch (error) {
      logger.error('Error deleting notification:', error);
    }
  }, [activeToken, updateBadge]);

  const clearAll = useCallback(async () => {
    try {
      await notificationService.clearAllNotifications(activeToken);
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      updateBadge(0);
    } catch (error) {
      logger.error('Error clearing notifications:', error);
    }
  }, [activeToken, updateBadge]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    pushToken,
    pushRegistrationStatus,
    pushRegistrationError,
    permissionStatus,
    preferences,
    preferencesLoading,
    fetchNotifications,
    loadMore: () => hasMore && !loadingMore && fetchNotifications({ append: true }),
    refreshUnreadCount: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreference,
    requestPushPermission,
    supportsSystemNotificationSettings: Platform.OS === 'ios' || Platform.OS === 'android',
    handleNotificationResponse,
    openNotification,
  }), [
    clearAll, deleteNotification, fetchNotifications, handleNotificationResponse, hasMore, loading,
    loadingMore, markAllAsRead, markAsRead, notifications, permissionStatus, preferences,
    openNotification, preferencesLoading, pushRegistrationError, pushRegistrationStatus,
    pushToken, requestPushPermission, unreadCount,
    updatePreference,
  ]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export default NotificationContext;
