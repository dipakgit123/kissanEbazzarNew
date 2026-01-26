const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to a single device
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
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
    console.error('Error sending push notification:', error);
    return null;
  }
};

/**
 * Send push notifications to multiple devices
 */
const sendBulkPushNotifications = async (tokens, title, body, data = {}) => {
  const messages = tokens
    .filter(token => Expo.isExpoPushToken(token))
    .map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

  if (messages.length === 0) {
    console.log('No valid push tokens to send to');
    return [];
  }

  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    return tickets;
  } catch (error) {
    console.error('Error sending bulk push notifications:', error);
    return [];
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
    await sendPushNotification(recipient, title, body, data);

    // Create in-app notification
    const db = require('../models');
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
    console.error('Send appointment notification error:', error);
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

    await sendPushNotification(veterinarian, title, body, data);

    // Create in-app notification
    const db = require('../models');
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
    console.error('Send call notification error:', error);
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
        console.log(`🔔 Real-time notification sent to user ${userId} via Socket.IO`);
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
        console.log(`📱 Expo push notification sent to user ${userId}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending real-time notification:', error);
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
    console.log(`📢 Bulk notification sent to ${userIds.length} users`);
    return true;
  } catch (error) {
    console.error('Error sending bulk real-time notification:', error);
    return false;
  }
};

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
  notifyNewListingNearby,
  notifyContactInquiry,
  notifyPregnancyReminder,
  createSystemNotification,
  sendAppointmentNotification,
  sendCallNotification,
  sendRealtimeNotification,
  sendBulkRealtimeNotification
};
