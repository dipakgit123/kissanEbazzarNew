import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import logger from '../utils/logger';
import { COLORS } from '../utils/constants';

// Sleep utility for retry logic
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const TOKEN_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const INSTALLATION_ID_KEY = 'notificationInstallationId';

const isUnauthorizedError = (error) => error?.response?.status === 401 || error?.status === 401;
const getAuthConfig = (authToken) => (
  authToken
    ? { headers: { Authorization: `Bearer ${authToken}` } }
    : {}
);

// Configure how notifications appear when app is in foreground with error handling
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      try {
        return {
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };
      } catch (error) {
        logger.error('Notification handler error:', error);
        return {
          shouldShowAlert: false,
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
    },
  });
} catch (error) {
  logger.error('Error setting notification handler:', error);
}

/**
 * Register for push notifications and get the configured push token.
 * Android can use direct Firebase FCM; Expo tokens remain supported as fallback.
 */
export const setupNotificationChannels = async () => {
  if (Platform.OS !== 'android') return;

  const channels = [
    { id: 'default', name: 'General', importance: Notifications.AndroidImportance.DEFAULT },
    { id: 'marketplace', name: 'Marketplace', importance: Notifications.AndroidImportance.DEFAULT },
    { id: 'communications', name: 'Calls and messages', importance: Notifications.AndroidImportance.HIGH },
    { id: 'reminders', name: 'Reminders', importance: Notifications.AndroidImportance.HIGH },
    { id: 'high-priority', name: 'Appointments and calls', importance: Notifications.AndroidImportance.MAX },
  ];

  await Promise.all(channels.map((channel) => Notifications.setNotificationChannelAsync(channel.id, {
    name: channel.name,
    importance: channel.importance,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: COLORS.primary,
    sound: 'default',
  })));
};

export const getNotificationPermissionStatus = async () => {
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.status;
};

export const registerForPushNotifications = async ({ requestPermission = true } = {}) => {
  let token = null;
  let provider = 'expo';
  const configuredProvider = (
    process.env.EXPO_PUBLIC_PUSH_PROVIDER ||
    Constants.expoConfig?.extra?.pushProvider ||
    'firebase'
  ).toLowerCase();

  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
    logger.log('Skipping remote push registration in Expo Go on Android; use a development build for push notifications.');
    return { token: null, provider: null, permissionStatus: 'unavailable', reason: 'expo_go' };
  }

  // Must be a physical device
  if (!Device.isDevice) {
    logger.log('Push notifications require a physical device');
    return { token: null, provider: null, permissionStatus: 'unavailable', reason: 'physical_device_required' };
  }

  try {
    await setupNotificationChannels();
  } catch (error) {
    logger.error('Error setting up notification channels:', error);
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus === 'undetermined' && requestPermission) {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    logger.log('Push notification permission not granted');
    return { token: null, provider: null, permissionStatus: finalStatus, reason: 'permission_not_granted' };
  }

  // Get Firebase FCM token on Android when configured.
  if (Platform.OS === 'android' && configuredProvider === 'firebase') {
    try {
      const devicePushToken = await Notifications.getDevicePushTokenAsync();
      token = devicePushToken?.data;
      provider = 'firebase';

      if (!token) {
        logger.error('Firebase returned an empty FCM token');
        return {
          token: null,
          provider: 'firebase',
          permissionStatus: finalStatus,
          reason: 'firebase_token_missing',
        };
      }

      logger.log('Firebase FCM token obtained');
    } catch (error) {
      logger.error('Error getting Firebase FCM token:', error);
      return {
        token: null,
        provider: 'firebase',
        permissionStatus: finalStatus,
        reason: 'firebase_token_error',
        error: error?.message || 'Unable to obtain an FCM token',
      };
    }
  }

  // Expo tokens are used only when Expo is explicitly configured, never as a
  // silent fallback for an Android Firebase build.
  try {
    if (!token && configuredProvider !== 'firebase') {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      // Validate projectId exists
      if (!projectId) {
        logger.error('EAS Project ID not found in app.json - check app.json configuration');
        return { token: null, provider: null, permissionStatus: finalStatus, reason: 'project_id_missing' };
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      provider = 'expo';
      logger.log('Expo push token obtained');
    }
  } catch (error) {
    logger.error('Error getting push token:', error);
    return { token: null, provider: null, permissionStatus: finalStatus, reason: 'token_error' };
  }

  return { token, provider, permissionStatus: finalStatus };
};

const getInstallationId = async () => {
  let installationId = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (!installationId) {
    installationId = `install-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    await AsyncStorage.setItem(INSTALLATION_ID_KEY, installationId);
  }
  return installationId;
};

/**
 * Register device token with backend (with retry logic)
 */
export const registerTokenWithBackend = async (token, provider = 'expo', retries = 3, authToken = null, recipientKey = null) => {
  if (typeof token !== 'string' || !token) {
    throw new Error('A push token is required');
  }

  for (let i = 0; i < retries; i++) {
    try {
      const deviceId = await getInstallationId();
      const response = await api.post('/api/notifications/register-token', {
        token,
        platform: Platform.OS,
        provider,
        device_id: deviceId,
        app_version: Constants.expoConfig?.version || null,
      }, getAuthConfig(authToken));
      logger.log('Token registered with backend');

      // Save token to AsyncStorage
      await AsyncStorage.setItem('pushToken', token);
      await AsyncStorage.setItem('pushTokenPlatform', Platform.OS);
      await AsyncStorage.setItem('pushTokenProvider', provider);
      if (recipientKey) {
        await AsyncStorage.setItem('pushTokenRecipientKey', recipientKey);
      }
      await AsyncStorage.setItem('pushTokenRegisteredAt', new Date().toISOString());

      return response.data;
    } catch (error) {
      logger.error(`Token registration attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
      } else {
        throw error;
      }
    }
  }
};

/**
 * Get saved push token from AsyncStorage
 */
export const getSavedToken = async () => {
  try {
    const token = await AsyncStorage.getItem('pushToken');
    const platform = await AsyncStorage.getItem('pushTokenPlatform');
    const provider = await AsyncStorage.getItem('pushTokenProvider');
    const recipientKey = await AsyncStorage.getItem('pushTokenRecipientKey');
    const registeredAt = await AsyncStorage.getItem('pushTokenRegisteredAt');
    return { token, platform, provider, recipientKey, registeredAt };
  } catch (error) {
    logger.error('Error getting saved token:', error);
    return { token: null, platform: null };
  }
};

/**
 * Check if token needs re-registration
 */
export const shouldReregisterToken = async (currentToken, recipientKey = null) => {
  try {
    const {
      token: savedToken,
      recipientKey: savedRecipientKey,
      registeredAt,
    } = await getSavedToken();
    const registrationAge = registeredAt ? Date.now() - new Date(registeredAt).getTime() : Infinity;
    return savedToken !== currentToken
      || Boolean(recipientKey && savedRecipientKey !== recipientKey)
      || !Number.isFinite(registrationAge)
      || registrationAge >= TOKEN_REFRESH_INTERVAL_MS;
  } catch (error) {
    logger.error('Error checking token re-registration:', error);
    return true; // Re-register if error
  }
};

/**
 * Unregister device token from backend
 */
export const unregisterToken = async (token, authToken = null) => {
  try {
    const response = await api.post('/api/notifications/unregister-token', { token }, getAuthConfig(authToken));
    await AsyncStorage.removeItem('pushTokenRecipientKey');
    await AsyncStorage.removeItem('pushTokenRegisteredAt');
    return response.data;
  } catch (error) {
    logger.error('Error unregistering token:', error);
    throw error;
  }
};

/**
 * Get all notifications (with validation)
 */
export const getNotifications = async (limit = 50, offset = 0, authToken = null) => {
  try {
    const response = await api.get('/api/notifications', {
      params: { limit, offset },
      ...getAuthConfig(authToken),
    });
    const payload = response?.data || response;

    // Validate response structure
    if (payload && payload.success === true && Array.isArray(payload.data)) {
      return payload.data;
    } else {
      logger.error('Invalid API response structure:', payload);
      return [];
    }
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      logger.error('Error fetching notifications:', error);
    }
    return []; // Return empty array instead of throwing
  }
};

export const getNotificationPage = async (limit = 30, offset = 0, authToken = null) => {
  try {
    const response = await api.get('/api/notifications', {
      params: { limit, offset },
      ...getAuthConfig(authToken),
    });
    const payload = response?.data || response;
    return {
      items: Array.isArray(payload?.data) ? payload.data : [],
      total: Number(payload?.total || 0),
      unreadCount: Number(payload?.unread_count || 0),
    };
  } catch (error) {
    if (!isUnauthorizedError(error)) logger.error('Error fetching notification page:', error);
    throw error;
  }
};

export const getPreferences = async (authToken = null) => {
  const response = await api.get('/api/notifications/preferences', getAuthConfig(authToken));
  return response?.data?.data || null;
};

export const updatePreferences = async (updates, authToken = null) => {
  const response = await api.put('/api/notifications/preferences', updates, getAuthConfig(authToken));
  return response?.data?.data || null;
};

/**
 * Get unread notification count (with validation)
 */
export const getUnreadCount = async (authToken = null) => {
  try {
    const response = await api.get('/api/notifications/unread-count', getAuthConfig(authToken));
    const payload = response?.data || response;

    // Validate response
    if (payload && typeof payload.unread_count === 'number') {
      return payload.unread_count;
    } else {
      logger.error('Invalid unread count response:', payload);
      return 0;
    }
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      logger.error('Error fetching unread count:', error);
    }
    return 0; // Return 0 instead of throwing
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId, authToken = null) => {
  try {
    const response = await api.put(`/api/notifications/${notificationId}/read`, null, getAuthConfig(authToken));
    return response.data;
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (authToken = null) => {
  try {
    const response = await api.put('/api/notifications/read-all', null, getAuthConfig(authToken));
    return response.data;
  } catch (error) {
    logger.error('Error marking all as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId, authToken = null) => {
  try {
    const response = await api.delete(`/api/notifications/${notificationId}`, getAuthConfig(authToken));
    return response.data;
  } catch (error) {
    logger.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (authToken = null) => {
  try {
    const response = await api.delete('/api/notifications', getAuthConfig(authToken));
    return response.data;
  } catch (error) {
    logger.error('Error clearing notifications:', error);
    throw error;
  }
};

/**
 * Add notification received listener
 */
export const addNotificationReceivedListener = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add notification response listener (when user taps notification)
 */
export const addNotificationResponseListener = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

export const addPushTokenListener = (callback) => {
  if (typeof Notifications.addPushTokenListener !== 'function') return null;
  return Notifications.addPushTokenListener(callback);
};

export const getLastNotificationResponse = async () => {
  if (typeof Notifications.getLastNotificationResponseAsync !== 'function') return null;
  return Notifications.getLastNotificationResponseAsync();
};

export const clearLastNotificationResponse = async () => {
  if (typeof Notifications.clearLastNotificationResponseAsync === 'function') {
    await Notifications.clearLastNotificationResponseAsync();
  }
};

/**
 * Schedule a local notification (with error handling and channelId)
 */
export const scheduleLocalNotification = async (title, body, data = {}, trigger = null, channelId = 'default') => {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        channelId, // Required for Android
      },
      trigger: trigger || null, // null = immediate
    });
    logger.log(`Local notification scheduled: ${id}`);
    return id;
  } catch (error) {
    logger.error('Error scheduling local notification:', error);
    return null;
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllScheduledNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Get badge count
 */
export const getBadgeCount = async () => {
  return await Notifications.getBadgeCountAsync();
};

/**
 * Set badge count
 */
export const setBadgeCount = async (count) => {
  await Notifications.setBadgeCountAsync(count);
};

export default {
  registerForPushNotifications,
  setupNotificationChannels,
  getNotificationPermissionStatus,
  registerTokenWithBackend,
  shouldReregisterToken,
  unregisterToken,
  getNotifications,
  getNotificationPage,
  getPreferences,
  updatePreferences,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  addPushTokenListener,
  getLastNotificationResponse,
  clearLastNotificationResponse,
  scheduleLocalNotification,
  cancelAllScheduledNotifications,
  getBadgeCount,
  setBadgeCount,
};
