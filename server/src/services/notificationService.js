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

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
  notifyNewListingNearby,
  notifyContactInquiry,
  notifyPregnancyReminder,
  createSystemNotification,
};
