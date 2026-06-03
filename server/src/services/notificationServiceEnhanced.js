/**
 * Enhanced notification service with production-ready features
 * Handles rate limiting, delivery receipts, token cleanup
 */

const { Expo } = require('expo-server-sdk');
const logger = require('../utils/logger');
const db = require('../models');

// Create Expo client
const expo = new Expo();

// Configuration
const NOTIFICATION_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000, // 1 second
  MAX_TTL: 86400, // 24 hours in seconds
  PRIORITY_HIGH: 'high',
  PRIORITY_NORMAL: 'normal',
  CHANNEL_DEFAULT: 'default',
  CHANNEL_HIGH_PRIORITY: 'high-priority',
};

/**
 * Sleep utility for retry delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Send push notification with retry logic and rate limiting
 */
const sendPushNotification = async (pushToken, title, body, data = {}, options = {}) => {
  // Validate token
  if (!Expo.isExpoPushToken(pushToken)) {
    logger.error(`Push token ${pushToken} is not a valid Expo push token`);
    await deactivateInvalidToken(pushToken);
    return null;
  }

  // Build message with production-ready options
  const message = {
    to: pushToken,
    sound: options.sound || 'default',
    title,
    body,
    data,
    priority: options.priority || NOTIFICATION_CONFIG.PRIORITY_NORMAL,
    ttl: options.ttl || NOTIFICATION_CONFIG.MAX_TTL,
    channelId: options.channel || NOTIFICATION_CONFIG.CHANNEL_DEFAULT,
    // Add iOS-specific options
    badge: options.badge !== undefined ? options.badge : 1,
    // Add Android-specific options
    android: {
      priority: options.priority === NOTIFICATION_CONFIG.PRIORITY_HIGH ? 'high' : 'normal',
      channelId: options.channel || NOTIFICATION_CONFIG.CHANNEL_DEFAULT,
    },
  };

  // Send with retry logic
  let retryCount = 0;
  let lastError = null;

  while (retryCount < NOTIFICATION_CONFIG.MAX_RETRIES) {
    try {
      const chunks = expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      // Schedule receipt check for later
      if (tickets.length > 0) {
        scheduleReceiptCheck(tickets);
      }

      logger.log(`✅ Notification sent to ${pushToken.substring(0, 20)}...`);
      return tickets;

    } catch (error) {
      lastError = error;
      retryCount++;

      // Handle specific errors
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        const delay = Math.pow(2, retryCount) * NOTIFICATION_CONFIG.RETRY_DELAY_BASE;
        logger.warn(`Rate limited, retrying in ${delay}ms...`);
        await sleep(delay);
      } else if (error.code === 'DEVICE_NOT_REGISTERED' || error.code === 'INVALID_TOKEN') {
        // Token is invalid, don't retry
        await deactivateInvalidToken(pushToken);
        return null;
      } else if (retryCount < NOTIFICATION_CONFIG.MAX_RETRIES) {
        logger.warn(`Send failed (attempt ${retryCount}), retrying...`, error.message);
        await sleep(NOTIFICATION_CONFIG.RETRY_DELAY_BASE * retryCount);
      }
    }
  }

  // All retries failed
  logger.error(`Failed to send notification after ${NOTIFICATION_CONFIG.MAX_RETRIES} attempts:`, lastError);
  return null;
};

/**
 * Send bulk push notifications with error handling
 */
const sendBulkPushNotifications = async (tokens, title, body, data = {}, options = {}) => {
  if (!tokens || tokens.length === 0) {
    logger.log('No tokens provided for bulk notification');
    return [];
  }

  // Filter valid tokens
  const validTokens = tokens.filter(token => {
    const isValid = Expo.isExpoPushToken(token);
    if (!isValid) {
      logger.warn(`Invalid token filtered out: ${token.substring(0, 20)}...`);
    }
    return isValid;
  });

  if (validTokens.length === 0) {
    logger.log('No valid tokens after filtering');
    return [];
  }

  logger.log(`Sending bulk notification to ${validTokens.length} devices`);

  // Build messages
  const messages = validTokens.map(token => ({
    to: token,
    sound: options.sound || 'default',
    title,
    body,
    data,
    priority: options.priority || NOTIFICATION_CONFIG.PRIORITY_NORMAL,
    ttl: options.ttl || NOTIFICATION_CONFIG.MAX_TTL,
    channelId: options.channel || NOTIFICATION_CONFIG.CHANNEL_DEFAULT,
    badge: options.badge,
  }));

  // Chunk and send
  try {
    const chunks = expo.chunkPushNotifications(messages);
    const allTickets = [];

    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      allTickets.push(...tickets);

      // Schedule receipt check
      scheduleReceiptCheck(tickets);
    }

    logger.log(`✅ Bulk notification sent to ${validTokens.length} devices`);
    return allTickets;

  } catch (error) {
    logger.error('Error sending bulk push notifications:', error);

    // Try sending individually if bulk fails
    logger.log('Attempting individual sends...');
    const individualResults = [];

    for (const token of validTokens) {
      const result = await sendPushNotification(token, title, body, data, options);
      if (result) {
        individualResults.push(...result);
      }
    }

    return individualResults;
  }
};

/**
 * Deactivate invalid token from database
 */
const deactivateInvalidToken = async (token) => {
  try {
    if (db.DeviceToken) {
      await db.DeviceToken.update(
        { is_active: false },
        { where: { token } }
      );
      logger.log(`Deactivated invalid token: ${token.substring(0, 20)}...`);
    }
  } catch (error) {
    logger.error('Error deactivating token:', error);
  }
};

/**
 * Schedule receipt check (runs in background)
 */
const scheduleReceiptCheck = (tickets) => {
  // Schedule check 5 minutes from now
  setTimeout(async () => {
    await checkReceipts(tickets);
  }, 5 * 60 * 1000);
};

/**
 * Check delivery receipts and handle failed notifications
 */
const checkReceipts = async (tickets) => {
  try {
    const receiptIds = tickets.map(ticket => ticket.id);

    if (receiptIds.length === 0) {
      return;
    }

    logger.log(`Checking receipts for ${receiptIds.length} notifications...`);

    const receipts = await expo.getPushNotificationReceiptsAsync(receiptIds);

    for (const receipt of receipts) {
      if (receipt.status === 'error') {
        logger.error(`Notification failed: ${receipt.message}`, receipt.details);

        // Handle specific errors
        if (receipt.details?.error === 'DeviceNotRegistered') {
          // User uninstalled app or token expired
          await deactivateInvalidToken(receiptIdToToken(receipt.id));
        } else if (receipt.details?.error === 'InvalidCredentials') {
          logger.error('Invalid Expo credentials');
          // Alert: Check Expo project configuration
        } else if (receipt.details?.error === 'MessageTooBig') {
          logger.error('Notification payload too large');
          // Alert: Reduce notification size
        } else if (receipt.details?.error === 'MessageRateExceeded') {
          logger.warn('Message rate exceeded for this device');
          // Throttle notifications to this device
        }
      } else if (receipt.status === 'ok') {
        logger.log(`Notification delivered successfully`);
      }
    }

  } catch (error) {
    logger.error('Error checking receipts:', error);
  }
};

/**
 * Helper: Get token from receipt ID (you'd need to store this mapping)
 */
const receiptIdToToken = (receiptId) => {
  // You should store receiptId -> token mapping when sending
  // For now, return null
  return null;
};

/**
 * Clean up inactive tokens (runs daily)
 */
const cleanupInactiveTokens = async () => {
  try {
    if (!db.DeviceToken) {
      return;
    }

    // Remove tokens that haven't been used in 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await db.DeviceToken.destroy({
      where: {
        is_active: false,
        updated_at: { [db.Sequelize.Op.lt]: thirtyDaysAgo }
      }
    });

    if (deleted > 0) {
      logger.log(`Cleaned up ${deleted} inactive tokens`);
    }

  } catch (error) {
    logger.error('Error cleaning up tokens:', error);
  }
};

/**
 * Test notification function
 */
const sendTestNotification = async (userId) => {
  try {
    const tokens = await db.DeviceToken.findAll({
      where: { user_id: userId, is_active: true },
      limit: 1
    });

    if (tokens.length === 0) {
      return { success: false, message: 'No device tokens found' };
    }

    const tickets = await sendPushNotification(
      tokens[0].token,
      '🔔 Test Notification',
      'This is a test notification from Kissan Ebazzar',
      { type: 'test' },
      { priority: NOTIFICATION_CONFIG.PRIORITY_HIGH }
    );

    return {
      success: !!tickets,
      message: tickets ? 'Test notification sent' : 'Failed to send'
    };

  } catch (error) {
    logger.error('Error sending test notification:', error);
    return { success: false, message: error.message };
  }
};

// Export all functions
module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
  sendRealtimeNotification: require('./notificationService').sendRealtimeNotification,
  sendBulkRealtimeNotification: require('./notificationService').sendBulkRealtimeNotification,
  notifyNewListingNearby: require('./notificationService').notifyNewListingNearby,
  notifyContactInquiry: require('./notificationService').notifyContactInquiry,
  notifyPregnancyReminder: require('./notificationService').notifyPregnancyReminder,
  createSystemNotification: require('./notificationService').createSystemNotification,
  sendAppointmentNotification: require('./notificationService').sendAppointmentNotification,
  sendCallNotification: require('./notificationService').sendCallNotification,
  checkReceipts,
  cleanupInactiveTokens,
  sendTestNotification,
};
