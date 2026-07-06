const { Expo } = require('expo-server-sdk');
const logger = require('../utils/logger');
const { getMessaging } = require('../config/firebase');

// Create a new Expo SDK client
const expo = new Expo();

const FIREBASE_INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
]);

const isExpoToken = (token) => Expo.isExpoPushToken(token);
const isFirebaseToken = (token) => typeof token === 'string' && token.trim() && !isExpoToken(token);

const toFirebaseData = (data = {}) => (
  Object.entries(data || {}).reduce((payload, [key, value]) => {
    if (value === undefined || value === null) {
      return payload;
    }

    payload[key] = typeof value === 'string' ? value : JSON.stringify(value);
    return payload;
  }, {})
);

const deactivateInvalidToken = async (token) => {
  try {
    const db = require('../models');
    if (db.DeviceToken && token) {
      await db.DeviceToken.update({ is_active: false }, { where: { token } });
      logger.log(`Deactivated invalid push token: ${token.substring(0, 20)}...`);
    }
  } catch (error) {
    logger.error('Error deactivating invalid push token:', error.message);
  }
};

const sendFirebasePushNotification = async (token, title, body, data = {}) => {
  const messaging = getMessaging();

  if (!messaging) {
    logger.warn('Skipping FCM notification because Firebase Admin is not configured.');
    return null;
  }

  try {
    const response = await messaging.send({
      token,
      notification: { title, body },
      data: toFirebaseData(data),
      android: {
        priority: 'high',
        notification: {
          channelId: data.channelId || data.channel_id || 'default',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    });

    return response;
  } catch (error) {
    logger.error('Firebase push notification error:', error.code || error.message);
    if (FIREBASE_INVALID_TOKEN_CODES.has(error.code)) {
      await deactivateInvalidToken(token);
    }
    return null;
  }
};

const sendFirebaseBulkPushNotifications = async (tokens, title, body, data = {}) => {
  const messaging = getMessaging();

  if (!messaging) {
    logger.warn('Skipping FCM bulk notification because Firebase Admin is not configured.');
    return [];
  }

  const validTokens = [...new Set((tokens || []).filter(isFirebaseToken))];
  if (validTokens.length === 0) {
    return [];
  }

  const results = [];
  const chunkSize = 500;

  for (let index = 0; index < validTokens.length; index += chunkSize) {
    const chunk = validTokens.slice(index, index + chunkSize);

    try {
      const response = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: toFirebaseData(data),
        android: {
          priority: 'high',
          notification: {
            channelId: data.channelId || data.channel_id || 'default',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      });

      response.responses.forEach((sendResponse, responseIndex) => {
        const token = chunk[responseIndex];
        if (!sendResponse.success && FIREBASE_INVALID_TOKEN_CODES.has(sendResponse.error?.code)) {
          deactivateInvalidToken(token);
        }
      });

      results.push(response);
    } catch (error) {
      logger.error('Firebase bulk push notification error:', error.code || error.message);
    }
  }

  return results;
};

/**
 * Send push notification to a single device
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (isFirebaseToken(pushToken)) {
    return sendFirebasePushNotification(pushToken, title, body, data);
  }

  if (!isExpoToken(pushToken)) {
    logger.error(`Push token ${pushToken} is not a valid Expo push token`);
    return null;
  }

  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    return tickets;
  } catch (error) {
    logger.error('Error sending push notification:', error);
    return null;
  }
};

/**
 * Send push notifications to multiple devices
 */
const sendBulkPushNotifications = async (tokens, title, body, data = {}) => {
  const expoTokens = (tokens || []).filter(isExpoToken);
  const firebaseTokens = (tokens || []).filter(isFirebaseToken);
  const results = [];

  if (firebaseTokens.length > 0) {
    const firebaseResults = await sendFirebaseBulkPushNotifications(firebaseTokens, title, body, data);
    results.push(...firebaseResults);
  }

  const messages = expoTokens
    .map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

  if (messages.length === 0) {
    if (results.length === 0) {
      logger.log('No valid push tokens to send to');
    }
    return results;
  }

  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    results.push(...tickets);
    return results;
  } catch (error) {
    logger.error('Error sending bulk push notifications:', error);
    return results;
  }
};

/**
 * Create and send notification for new listing nearby
 */
const notifyNewListingNearby = async (db, userId, listing) => {
  const { Notification, DeviceToken } = db;

  // Create notification in database
  const notification = await Notification.create({
    user_id: userId,
    title: 'New Listing Nearby!',
    message: `A new ${listing.animal_type} has been listed near you - ${listing.breed_name || listing.animal_type}`,
    type: 'new_listing',
    data: {
      listing_id: listing.id,
      animal_type: listing.animal_type,
    },
  });

  // Get user's device tokens and send push
  const tokens = await DeviceToken.findAll({
    where: { user_id: userId, is_active: true },
  });

  if (tokens.length > 0) {
    const pushTokens = tokens.map(t => t.token);
    await sendBulkPushNotifications(
      pushTokens,
      'New Listing Nearby!',
      `A new ${listing.animal_type} has been listed near you`,
      { type: 'new_listing', listing_id: listing.id, animal_type: listing.animal_type }
    );
  }

  return notification;
};

/**
 * Create and send notification for contact inquiry
 */
const notifyContactInquiry = async (db, sellerId, buyerName, listing) => {
  const { Notification, DeviceToken } = db;

  const notification = await Notification.create({
    user_id: sellerId,
    title: 'New Inquiry!',
    message: `${buyerName} is interested in your ${listing.animal_type} - ${listing.breed_name || listing.animal_type}`,
    type: 'contact',
    data: {
      listing_id: listing.id,
      animal_type: listing.animal_type,
    },
  });

  const tokens = await DeviceToken.findAll({
    where: { user_id: sellerId, is_active: true },
  });

  if (tokens.length > 0) {
    const pushTokens = tokens.map(t => t.token);
    await sendBulkPushNotifications(
      pushTokens,
      'New Inquiry!',
      `${buyerName} is interested in your listing`,
      { type: 'contact', listing_id: listing.id }
    );
  }

  return notification;
};

/**
 * Create and send pregnancy reminder notification
 */
const notifyPregnancyReminder = async (db, userId, animalName, dueDate, daysRemaining) => {
  const { Notification, DeviceToken } = db;

  const notification = await Notification.create({
    user_id: userId,
    title: 'Pregnancy Reminder',
    message: `${animalName} is due in ${daysRemaining} days (${dueDate})`,
    type: 'pregnancy',
    data: {
      animal_name: animalName,
      due_date: dueDate,
      days_remaining: daysRemaining,
    },
  });

  const tokens = await DeviceToken.findAll({
    where: { user_id: userId, is_active: true },
  });

  if (tokens.length > 0) {
    const pushTokens = tokens.map(t => t.token);
    await sendBulkPushNotifications(
      pushTokens,
      'Pregnancy Reminder',
      `${animalName} is due in ${daysRemaining} days`,
      { type: 'pregnancy', due_date: dueDate }
    );
  }

  return notification;
};

/**
 * Create system notification
 */
const createSystemNotification = async (db, userId, title, message, data = {}) => {
  const { Notification } = db;

  return await Notification.create({
    user_id: userId,
    title,
    message,
    type: 'system',
    data,
  });
};

/**
 * Send appointment notification to veterinarian or user
 * @param {Object} recipient - Veterinarian or User object
 * @param {Object} appointment - Appointment object
 * @param {String} type - 'new', 'confirmed', 'cancelled', 'completed'
 */
async function sendAppointmentNotification(recipient, appointment, type) {
  try {
    let title, body, data;

    switch (type) {
      case 'new':
        title = '🔔 New Appointment Request';
        body = `${appointment.farmer_name} has booked an appointment for ${appointment.animal_type} on ${appointment.appointment_date} at ${appointment.appointment_time}`;
        data = {
          type: 'new_appointment',
          appointment_id: appointment.id,
          action: 'view_appointment'
        };
        break;

      case 'confirmed':
        title = '✅ Appointment Confirmed';
        body = `Dr. ${appointment.veterinarian?.full_name || 'Veterinarian'} has confirmed your appointment for ${appointment.appointment_date} at ${appointment.appointment_time}`;
        data = {
          type: 'appointment_confirmed',
          appointment_id: appointment.id,
          action: 'view_appointment'
        };
        break;

      case 'cancelled':
        title = '❌ Appointment Cancelled';
        body = `Appointment for ${appointment.appointment_date} at ${appointment.appointment_time} has been cancelled`;
        data = {
          type: 'appointment_cancelled',
          appointment_id: appointment.id,
          action: 'view_appointment'
        };
        break;

      case 'completed':
        title = '✔️ Appointment Completed';
        body = `Appointment with ${appointment.farmer_name} has been marked as completed`;
        data = {
          type: 'appointment_completed',
          appointment_id: appointment.id,
          action: 'view_appointment'
        };
        break;

      default:
        title = 'Appointment Update';
        body = `Your appointment status has been updated`;
        data = {
          type: 'appointment_update',
          appointment_id: appointment.id
        };
    }

    // Send push notification if recipient has device tokens
    const db = require('../models');
    if (db.DeviceToken) {
      const tokens = await db.DeviceToken.findAll({
        where: { user_id: recipient.id, is_active: true }
      });

      if (tokens.length > 0) {
        const pushTokens = tokens.map(t => t.token);
        await sendBulkPushNotifications(pushTokens, title, body, data);
      }
    }

    // Create in-app notification
    if (db.Notification) {
      await db.Notification.create({
        user_id: recipient.id,
        title,
        message: body,
        type: data.type,
        data: data,
        is_read: false
      });
    }

    return true;
  } catch (error) {
    logger.error('Send appointment notification error:', error);
    return false;
  }
}

/**
 * Send call notification when user initiates a call
 * @param {Object} veterinarian - Veterinarian object
 * @param {Object} caller - User/Farmer object
 */
async function sendCallNotification(veterinarian, caller) {
  try {
    const title = '📞 Incoming Call';
    const body = `${caller.full_name || 'A farmer'} is calling you regarding their animal`;
    const data = {
      type: 'incoming_call',
      caller_id: caller.id,
      caller_name: caller.full_name,
      caller_phone: caller.phone_number,
      action: 'answer_call'
    };

    // Send push notification to veterinarian's devices
    const db = require('../models');
    if (db.DeviceToken) {
      const tokens = await db.DeviceToken.findAll({
        where: { user_id: veterinarian.id, is_active: true }
      });

      if (tokens.length > 0) {
        const pushTokens = tokens.map(t => t.token);
        await sendBulkPushNotifications(pushTokens, title, body, data);
      }
    }

    // Create in-app notification
    if (db.Notification) {
      await db.Notification.create({
        user_id: veterinarian.id,
        title,
        message: body,
        type: 'incoming_call',
        data: data,
        is_read: false
      });
    }

    return true;
  } catch (error) {
    logger.error('Send call notification error:', error);
    return false;
  }
}

/**
 * Send real-time notification via Socket.IO + Expo Push
 * @param {Number} userId - User ID to send notification to
 * @param {String} title - Notification title
 * @param {String} body - Notification body/message
 * @param {Object} data - Additional data
 * @param {Object} db - Database models
 */
const sendRealtimeNotification = async (userId, title, body, data = {}, db = null) => {
  try {
    // 1. Send via Socket.IO for instant in-app notification
    if (global.io && global.connectedUsers) {
      const socketId = global.connectedUsers.get(userId.toString());
      if (socketId) {
        global.io.to(socketId).emit('notification', {
          title,
          body,
          data,
          timestamp: new Date().toISOString()
        });
        logger.log(`🔔 Real-time notification sent to user ${userId} via Socket.IO`);
      }
    }

    // 2. Save notification to database
    if (db && db.Notification) {
      await db.Notification.create({
        user_id: userId,
        title,
        message: body,
        type: data.type || 'general',
        data,
        is_read: false
      });
    }

    // 3. Send Expo push notification (for background/closed app)
    if (db && db.DeviceToken) {
      const tokens = await db.DeviceToken.findAll({
        where: { user_id: userId, is_active: true }
      });

      if (tokens.length > 0) {
        const pushTokens = tokens.map(t => t.token);
        await sendBulkPushNotifications(pushTokens, title, body, data);
        logger.log(`📱 Expo push notification sent to user ${userId}`);
      }
    }

    return true;
  } catch (error) {
    logger.error('Error sending real-time notification:', error);
    return false;
  }
};

/**
 * Send real-time notification to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {String} title - Notification title
 * @param {String} body - Notification body/message
 * @param {Object} data - Additional data
 * @param {Object} db - Database models
 */
const sendBulkRealtimeNotification = async (userIds, title, body, data = {}, db = null) => {
  try {
    const promises = userIds.map(userId => 
      sendRealtimeNotification(userId, title, body, data, db)
    );
    await Promise.all(promises);
    logger.log(`📢 Bulk notification sent to ${userIds.length} users`);
    return true;
  } catch (error) {
    logger.error('Error sending bulk real-time notification:', error);
    return false;
  }
};

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
  sendFirebasePushNotification,
  sendFirebaseBulkPushNotifications,
  notifyNewListingNearby,
  notifyContactInquiry,
  notifyPregnancyReminder,
  createSystemNotification,
  sendAppointmentNotification,
  sendCallNotification,
  sendRealtimeNotification,
  sendBulkRealtimeNotification
};
