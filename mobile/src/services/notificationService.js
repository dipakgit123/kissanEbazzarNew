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

// Configure how notifications appear when app is in foreground with error handling
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      try {
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };
      } catch (error) {
        logger.error('Notification handler error:', error);
        return {
          shouldShowAlert: false,
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
 * Register for push notifications and get the Expo push token
 */
export const registerForPushNotifications = async () => {
  let token = null;

  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
    logger.log('Skipping remote push registration in Expo Go on Android; use a development build for push notifications.');
    return null;
  }

  // Must be a physical device
  if (!Device.isDevice) {
    logger.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    logger.log('Push notification permission not granted');
    return null;
  }

  // Get Expo push token with validation
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    // Validate projectId exists
    if (!projectId) {
      logger.error('EAS Project ID not found in app.json - check app.json configuration');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    logger.log('Expo push token obtained:', token.substring(0, 20) + '...');
  } catch (error) {
    logger.error('Error getting push token:', error);
    return null;
  }

  // Android-specific channel setup
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: COLORS.primary,
      });

      // Also create high-priority channel
      await Notifications.setNotificationChannelAsync('high-priority', {
        name: 'High Priority',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: COLORS.primary,
      });
    } catch (error) {
      logger.error('Error setting up Android notification channels:', error);
    }
  }

  return token;
};

/**
 * Register device token with backend (with retry logic)
 */
export const registerTokenWithBackend = async (token, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await api.post('/api/notifications/register-token', {
        token,
        platform: Platform.OS,
      });
      logger.log('Token registered with backend');

      // Save token to AsyncStorage
      await AsyncStorage.setItem('pushToken', token);
      await AsyncStorage.setItem('pushTokenPlatform', Platform.OS);

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
    return { token, platform };
  } catch (error) {
    logger.error('Error getting saved token:', error);
    return { token: null, platform: null };
  }
};

/**
 * Check if token needs re-registration
 */
export const shouldReregisterToken = async (currentToken) => {
  try {
    const { token: savedToken } = await getSavedToken();
    return savedToken !== currentToken;
  } catch (error) {
    logger.error('Error checking token re-registration:', error);
    return true; // Re-register if error
  }
};

/**
 * Unregister device token from backend
 */
export const unregisterToken = async (token) => {
  try {
    const response = await api.post('/api/notifications/unregister-token', { token });
    return response.data;
  } catch (error) {
    logger.error('Error unregistering token:', error);
    throw error;
  }
};

/**
 * Get all notifications (with validation)
 */
export const getNotifications = async (limit = 50, offset = 0) => {
  try {
    const response = await api.get('/api/notifications', {
      params: { limit, offset },
    });

    // Validate response structure
    if (response && response.success === true && Array.isArray(response.data)) {
      return response.data;
    } else {
      logger.error('Invalid API response structure:', response);
      return [];
    }
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    return []; // Return empty array instead of throwing
  }
};

/**
 * Get unread notification count (with validation)
 */
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/api/notifications/unread-count');

    // Validate response
    if (response && typeof response.unread_count === 'number') {
      return response.unread_count;
    } else {
      logger.error('Invalid unread count response:', response);
      return 0;
    }
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    return 0; // Return 0 instead of throwing
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  try {
    const response = await api.put('/api/notifications/read-all');
    return response.data;
  } catch (error) {
    logger.error('Error marking all as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    logger.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async () => {
  try {
    const response = await api.delete('/api/notifications');
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
  registerTokenWithBackend,
  shouldReregisterToken,
  unregisterToken,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  scheduleLocalNotification,
  cancelAllScheduledNotifications,
  getBadgeCount,
  setBadgeCount,
};
