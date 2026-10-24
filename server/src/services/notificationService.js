const { Expo } = require('expo-server-sdk');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { getMessaging } = require('../config/firebase');

const expo = new Expo();
const MAX_SEND_ATTEMPTS = 3;
const EXPO_RECEIPT_DELAY_MS = 15 * 60 * 1000;
const FIREBASE_INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);
const EXPO_INVALID_TOKEN_ERRORS = new Set(['DeviceNotRegistered']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isExpoToken = (token) => Expo.isExpoPushToken(token);
const isFirebaseToken = (token) => typeof token === 'string' && token.trim() && !isExpoToken(token);
const normalizeRecipientType = (value = 'user') => (
  value === 'veterinarian' ? 'veterinarian' : 'user'
);
const getSocketKey = (recipientId, recipientType = 'user') => (
  `${normalizeRecipientType(recipientType)}:${recipientId}`
);
const getSocketRoom = (recipientId, recipientType = 'user') => (
  `recipient:${getSocketKey(recipientId, recipientType)}`
);

const buildRecipientPayload = (recipientId, recipientType = 'user') => {
  const normalizedType = normalizeRecipientType(recipientType);
  return {
    user_id: normalizedType === 'user' ? recipientId : null,
    recipient_type: normalizedType,
    recipient_id: recipientId,
  };
};

const buildRecipientWhere = (recipientId, recipientType = 'user', extra = {}) => {
  const normalizedType = normalizeRecipientType(recipientType);
  const currentRecipient = {
    recipient_type: normalizedType,
    recipient_id: recipientId,
  };

  if (normalizedType !== 'user') return { ...currentRecipient, ...extra };

  return {
    ...extra,
    [Op.or]: [currentRecipient, { user_id: recipientId }],
  };
};

const buildRecipientTokenWhere = (recipientId, recipientType = 'user') => (
  buildRecipientWhere(recipientId, recipientType, { is_active: true })
);

const normalizeNotificationData = (type, data = {}) => {
  const { dedupe_key: _dedupeKey, ...publicData } = data;
  const normalized = { ...publicData, type: type || data.type || 'system' };
  if (normalized.listingId && !normalized.listing_id) normalized.listing_id = normalized.listingId;
  if (normalized.animalType && !normalized.animal_type) normalized.animal_type = normalized.animalType;
  if (normalized.appointmentId && !normalized.appointment_id) normalized.appointment_id = normalized.appointmentId;
  if (normalized.recordId && !normalized.record_id) normalized.record_id = normalized.recordId;
  return normalized;
};

const toFirebaseData = (data = {}) => Object.entries(data).reduce((payload, [key, value]) => {
  if (value !== undefined && value !== null) {
    payload[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return payload;
}, {});

const getCategoryPreference = (type = 'system') => {
  if (type === 'milk_reminder') return 'milk_reminders_enabled';
  if (type === 'health_report') return 'health_enabled';
  if (type === 'pet_status') return 'pet_mating_enabled';
  if (['blog_published', 'scheme_published'].includes(type)) return 'content_enabled';
  if (type === 'appointment_reminder' || type.includes('reminder') || type.includes('pregnancy')) {
    return 'reminders_enabled';
  }
  if (type.includes('appointment')) return 'appointments_enabled';
  if (['new_listing', 'price_drop', 'listing_sold'].includes(type)) return 'marketplace_enabled';
  if (type === 'vet_contact' || type === 'contact' || type.includes('call') || type.includes('message') || type.includes('inquiry')) {
    return 'communication_enabled';
  }
  return 'system_enabled';
};

const getChannelForType = (type = 'system') => {
  if (type.includes('appointment') || type.includes('call')) return 'high-priority';
  if (type.includes('reminder') || type.includes('pregnancy')) return 'reminders';
  if (['new_listing', 'price_drop', 'listing_sold'].includes(type)) return 'marketplace';
  if (type === 'vet_contact' || type === 'contact' || type.includes('message') || type.includes('inquiry')) return 'communications';
  return 'default';
};

const getNotificationPreferences = async (db, recipientId, recipientType) => {
  if (!db?.NotificationPreference) return null;
  return db.NotificationPreference.findOne({
    where: {
      recipient_type: normalizeRecipientType(recipientType),
      recipient_id: recipientId,
    },
  });
};

const recordTokenFailure = async (token, errorCode, deactivate = false) => {
  if (!token) return;
  try {
    const db = require('../models');
    if (!db.DeviceToken) return;
    await db.DeviceToken.increment('failure_count', { where: { token } });
    await db.DeviceToken.update({
      last_error: String(errorCode || 'push_failed').slice(0, 255),
      ...(deactivate ? { is_active: false } : {}),
    }, { where: { token } });
  } catch (error) {
    logger.error('Unable to update push token health:', error.message);
  }
};

const sendWithRetry = async (operation, label) => {
  let lastError;
  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_SEND_ATTEMPTS) await sleep(500 * (2 ** (attempt - 1)));
    }
  }
  logger.error(`${label} failed after ${MAX_SEND_ATTEMPTS} attempts:`, lastError?.message || lastError);
  throw lastError;
};

const checkExpoReceipts = async (receiptEntries) => {
  const validEntries = receiptEntries.filter((entry) => entry.id && entry.token);
  if (validEntries.length === 0) return;
  try {
    const receipts = await expo.getPushNotificationReceiptsAsync(validEntries.map((entry) => entry.id));
    for (const entry of validEntries) {
      const receipt = receipts[entry.id];
      if (receipt?.status !== 'error') continue;
      const errorCode = receipt.details?.error || receipt.message || 'expo_receipt_failed';
      await recordTokenFailure(entry.token, errorCode, EXPO_INVALID_TOKEN_ERRORS.has(errorCode));
    }
  } catch (error) {
    logger.error('Expo receipt check failed:', error.message);
  }
};

const scheduleExpoReceiptCheck = (entries) => {
  if (entries.length === 0) return;
  const timer = setTimeout(() => checkExpoReceipts(entries), EXPO_RECEIPT_DELAY_MS);
  timer.unref?.();
};

const sendExpoMessages = async (messages) => {
  const receiptEntries = [];
  const results = [];
  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      const tickets = await sendWithRetry(
        () => expo.sendPushNotificationsAsync(chunk),
        'Expo push batch'
      );
      tickets.forEach((ticket, index) => {
        const token = chunk[index]?.to;
        results.push(ticket);
        if (ticket.status === 'ok' && ticket.id) {
          receiptEntries.push({ id: ticket.id, token });
        } else if (ticket.status === 'error') {
          const errorCode = ticket.details?.error || ticket.message || 'expo_ticket_failed';
          recordTokenFailure(token, errorCode, EXPO_INVALID_TOKEN_ERRORS.has(errorCode));
        }
      });
    } catch (error) {
      await Promise.all(chunk.map((message) => recordTokenFailure(message.to, error.message)));
    }
  }
  scheduleExpoReceiptCheck(receiptEntries);
  return results;
};

const buildExpoMessage = (token, title, body, data, options = {}) => ({
  to: token,
  title: String(title).slice(0, 255),
  body: String(body).slice(0, 1000),
  data,
  sound: options.sound === false ? undefined : 'default',
  priority: options.priority || 'high',
  ttl: options.ttl || 86400,
  channelId: options.channelId || 'default',
  ...(Number.isInteger(options.badge) ? { badge: options.badge } : {}),
});

const sendFirebaseBulkPushNotifications = async (tokens, title, body, data = {}, options = {}) => {
  const messaging = getMessaging();
  const validTokens = [...new Set((tokens || []).filter(isFirebaseToken))];
  if (!messaging || validTokens.length === 0) return [];

  const results = [];
  for (let index = 0; index < validTokens.length; index += 500) {
    const chunk = validTokens.slice(index, index + 500);
    try {
      const response = await sendWithRetry(() => messaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title: String(title).slice(0, 255), body: String(body).slice(0, 1000) },
        data: toFirebaseData(data),
        android: {
          priority: options.priority || 'high',
          notification: {
            channelId: options.channelId || 'default',
            sound: options.sound === false ? undefined : 'default',
          },
        },
        apns: {
          headers: { 'apns-priority': options.priority === 'normal' ? '5' : '10' },
          payload: {
            aps: {
              sound: options.sound === false ? undefined : 'default',
              ...(Number.isInteger(options.badge) ? { badge: options.badge } : {}),
            },
          },
        },
      }), 'Firebase push batch');
      await Promise.all(response.responses.map(async (sendResponse, responseIndex) => {
        if (sendResponse.success) return;
        const token = chunk[responseIndex];
        const code = sendResponse.error?.code || 'firebase_send_failed';
        await recordTokenFailure(token, code, FIREBASE_INVALID_TOKEN_CODES.has(code));
      }));
      results.push(response);
    } catch (error) {
      await Promise.all(chunk.map((token) => recordTokenFailure(token, error.code || error.message)));
    }
  }
  return results;
};

const sendFirebasePushNotification = async (token, title, body, data = {}, options = {}) => {
  const results = await sendFirebaseBulkPushNotifications([token], title, body, data, options);
  return results[0] || null;
};

const sendBulkPushNotifications = async (tokens, title, body, data = {}, options = {}) => {
  const uniqueTokens = [...new Set((tokens || []).filter(Boolean))];
  const expoTokens = uniqueTokens.filter(isExpoToken);
  const firebaseTokens = uniqueTokens.filter(isFirebaseToken);
  const results = [];
  if (firebaseTokens.length > 0) {
    results.push(...await sendFirebaseBulkPushNotifications(firebaseTokens, title, body, data, options));
  }
  if (expoTokens.length > 0) {
    const messages = expoTokens.map((token) => buildExpoMessage(token, title, body, data, options));
    results.push(...await sendExpoMessages(messages));
  }
  return results;
};

const sendPushNotification = async (token, title, body, data = {}, options = {}) => {
  const results = await sendBulkPushNotifications([token], title, body, data, options);
  return results.length > 0 ? results : null;
};

const deliverNotification = async ({
  db, recipientId, recipientType = 'user', title, body, type, data = {}, pushOptions = {},
}) => {
  const normalizedRecipientType = normalizeRecipientType(recipientType);
  const notificationType = type || data.type || 'system';
  if (notificationType.includes('appointment')) return { delivered: false, suppressed: true, notification: null };
  const recipientModel = normalizedRecipientType === 'veterinarian' ? db?.Veterinarian : db?.User;
  if (recipientModel) {
    const recipient = await recipientModel.findByPk(recipientId);
    const denied = !recipient || (normalizedRecipientType === 'veterinarian'
      ? ((!recipient.is_active || recipient.verification_status !== 'verified') && notificationType !== 'vet_status')
      : !recipient.is_verified || (recipient.is_blocked && (!recipient.blocked_until || new Date(recipient.blocked_until) > new Date())));
    if (denied) {
      global.io?.in(getSocketRoom(recipientId, normalizedRecipientType)).disconnectSockets(true);
      return { delivered: false, suppressed: true, notification: null };
    }
  }
  if (!data.animal_group && data.animal_type === 'other' && data.listing_id && db.OtherAnimalListing) {
    const listing = await db.OtherAnimalListing.findByPk(data.listing_id);
    data = { ...data, animal_group: listing?.animal_group };
  }
  const preferences = await getNotificationPreferences(db, recipientId, normalizedRecipientType);
  data = { ...data, animal_group: data.animal_group || require('../utils/animalGroup').groupForSpecies(data.animal_type) || (notificationType === 'milk_reminder' || notificationType === 'scheme_published' ? 'farm' : notificationType === 'pet_status' ? 'pet' : undefined) };
  if (['farm', 'pet'].includes(data.animal_group) && preferences?.[data.animal_group + '_enabled'] === false) return { delivered: false, suppressed: true, notification: null };
  if (data.animal_group === 'both' && preferences?.farm_enabled === false && preferences?.pet_enabled === false) return { delivered: false, suppressed: true, notification: null };
  const categoryFlag = getCategoryPreference(notificationType);
  const translated = require('./notificationText').renderMessage(data.message_key || notificationType, preferences?.language, data.message_args);
  if (translated) { title = translated.title; body = translated.body; }

  if (preferences && preferences[categoryFlag] === false) {
    return { delivered: false, suppressed: true, notification: null };
  }

  // Save the inbox item and its dispatch job atomically. Delivery happens in the worker.
  if (!db?.Notification || !db?.NotificationJob) throw new Error('Notification storage is required');
  const queue = require('./notificationQueue');
  let created = true;
  let notification;
  await db.sequelize.transaction(async transaction => {
    const values = {
      ...buildRecipientPayload(recipientId, normalizedRecipientType), title, message: body,
      type: notificationType, data: normalizeNotificationData(notificationType, data), is_read: false,
      dedupe_key: data.dedupe_key || null, push_status: preferences?.push_enabled === false ? 'suppressed' : 'queued',
    };
    if (values.dedupe_key) [notification, created] = await db.Notification.findOrCreate({ where: { dedupe_key: values.dedupe_key }, defaults: values, transaction });
    else notification = await db.Notification.create(values, { transaction });
    if (!created) return;
    await notification.update({ data: { ...values.data, notification_id: notification.id, recipient_id: recipientId, recipient_type: normalizedRecipientType } }, { transaction });
    if (preferences?.push_enabled !== false) {
      let expiresAt;
      if (notificationType === 'milk_reminder' && data.report_date) {
        const { addCalendarDays, appointmentInstant } = require('../utils/businessTime');
        expiresAt = appointmentInstant(addCalendarDays(data.report_date, 1), '00:00:00', process.env.NOTIFICATION_TIMEZONE || 'Asia/Kolkata');
      }
      await queue.enqueue(db, 'notification', `notification:${notification.id}`, { notificationId: notification.id }, { transaction, expiresAt });
    }
  });
  if (created) global.io?.to(getSocketRoom(recipientId, normalizedRecipientType)).emit('notification', {
    id: notification.id, title, body, type: notificationType, data: notification.data, timestamp: notification.created_at,
  });
  return { delivered: false, stored: true, queued: created && preferences?.push_enabled !== false, duplicate: !created, suppressed: false, notification };

};

const sendRealtimeNotification = async (
  recipientId, title, body, data = {}, db = null, recipientType = 'user'
) => {
  try {
    const notificationType = String(data.type || 'system');
    const result = await deliverNotification({
      db,
      recipientId,
      recipientType,
      title,
      body,
      type: notificationType,
      data,
      pushOptions: {
        channelId: data.channelId || data.channel_id || getChannelForType(notificationType),
      },
    });
    return Boolean(result.stored || result.suppressed || result.duplicate);
  } catch (error) {
    logger.error('Notification delivery failed:', error);
    return false;
  }
};

const sendBulkRealtimeNotification = async (
  recipientIds, title, body, data = {}, db = null, recipientType = 'user'
) => {
  const results = await Promise.allSettled(
    recipientIds.map((id) => sendRealtimeNotification(id, title, body, data, db, recipientType))
  );
  return results.every((result) => result.status === 'fulfilled' && result.value === true);
};

const notifyNewListingNearby = (db, userId, listing) => sendRealtimeNotification(
  userId,
  'New Listing Nearby!',
  `A new ${listing.animal_type} has been listed near you - ${listing.breed_name || listing.animal_type}`,
  { type: 'new_listing', listing_id: listing.id, animal_type: listing.animal_type },
  db
);

const notifyContactInquiry = (db, sellerId, buyerName, listing) => sendRealtimeNotification(
  sellerId,
  'New Inquiry!',
  `${buyerName} is interested in your ${listing.animal_type} - ${listing.breed_name || listing.animal_type}`,
  { type: 'contact', listing_id: listing.id, animal_type: listing.animal_type },
  db
);

const notifyPregnancyReminder = (db, userId, animalName, dueDate, daysRemaining) => sendRealtimeNotification(
  userId,
  'Pregnancy Reminder',
  `${animalName} is due in ${daysRemaining} days (${dueDate})`,
  { type: 'pregnancy_reminder', animal_name: animalName, due_date: dueDate, days_remaining: daysRemaining },
  db
);

const createSystemNotification = async (db, userId, title, message, data = {}) => {
  const result = await deliverNotification({
    db, recipientId: userId, title, body: message, type: 'system', data,
  });
  return result.notification;
};

const sendAppointmentNotification = async (recipient, appointment, status) => {
  const recipientType = recipient?.type === 'veterinarian' || recipient?.license_number
    ? 'veterinarian'
    : 'user';
  const labels = {
    new: ['New Appointment Request', `${appointment.farmer_name} booked an appointment on ${appointment.appointment_date} at ${appointment.appointment_time}`],
    confirmed: ['Appointment Confirmed', `Your appointment on ${appointment.appointment_date} at ${appointment.appointment_time} was confirmed`],
    cancelled: ['Appointment Cancelled', `Your appointment on ${appointment.appointment_date} at ${appointment.appointment_time} was cancelled`],
    completed: ['Appointment Completed', `The appointment on ${appointment.appointment_date} was completed`],
  };
  const [title, body] = labels[status] || ['Appointment Update', 'Your appointment has been updated'];
  const db = require('../models');
  return sendRealtimeNotification(
    recipient.id,
    title,
    body,
    { type: status === 'new' ? 'new_appointment' : `appointment_${status}`, appointment_id: appointment.id },
    db,
    recipientType
  );
};

const sendCallNotification = async (veterinarian, caller) => {
  const db = require('../models');
  return sendRealtimeNotification(
    veterinarian.id,
    'Incoming Call',
    `${caller.full_name || 'A farmer'} is calling you regarding their animal`,
    {
      type: 'incoming_call', caller_id: caller.id, caller_name: caller.full_name,
      caller_phone: caller.phone_number,
    },
    db,
    'veterinarian'
  );
};

const cleanupInactiveTokens = async (db = require('../models'), days = 30) => {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db.DeviceToken.destroy({
    where: { is_active: false, updated_at: { [Op.lt]: cutoff } },
  });
};

// A single provider attempt. The durable worker owns retries and Expo receipts.
const sendPushAttempt = async (token, notification, badge, ttlMs = 86400000) => {
  const data = notification.data || {};
  try {
    if (token.provider === 'expo' || isExpoToken(token.token)) {
      const [ticket] = await expo.sendPushNotificationsAsync([buildExpoMessage(token.token, notification.title, notification.message, data, { badge, ttl: Math.max(1, Math.floor(ttlMs / 1000)), channelId: getChannelForType(notification.type) })]);
      if (ticket?.status === 'ok' && ticket.id) return { receiptId: ticket.id };
      const code = ticket?.details?.error || ticket?.message || 'expo_send_failed';
      await recordTokenFailure(token.token, code, EXPO_INVALID_TOKEN_ERRORS.has(code));
      return { error: code, permanent: EXPO_INVALID_TOKEN_ERRORS.has(code) };
    }
    const messaging = getMessaging();
    if (!messaging) return { error: 'push_provider_unavailable' };
    await messaging.send({ token: token.token, notification: { title: notification.title, body: notification.message }, data: toFirebaseData(data),
      android: { priority: 'high', ttl: Math.max(0, ttlMs), notification: { channelId: getChannelForType(notification.type), sound: 'default' } },
      apns: { headers: { 'apns-expiration': String(Math.floor((Date.now() + ttlMs) / 1000)) }, payload: { aps: { badge, sound: 'default' } } },
    });
    return { accepted: true };
  } catch (error) {
    const code = error.code || 'push_send_failed';
    await recordTokenFailure(token.token, code, FIREBASE_INVALID_TOKEN_CODES.has(code));
    return { error: code, permanent: FIREBASE_INVALID_TOKEN_CODES.has(code) };
  }
};
const getExpoReceipt = async id => (await expo.getPushNotificationReceiptsAsync([id]))[id];

module.exports = {
  getCategoryPreference, buildRecipientWhere, sendPushAttempt, getExpoReceipt, recordTokenFailure,
  buildRecipientTokenWhere,
  cleanupInactiveTokens,
  createSystemNotification,
  deliverNotification,
  notifyContactInquiry,
  notifyNewListingNearby,
  notifyPregnancyReminder,
  sendAppointmentNotification,
  sendBulkPushNotifications,
  sendBulkRealtimeNotification,
  sendCallNotification,
  sendFirebaseBulkPushNotifications,
  sendFirebasePushNotification,
  sendPushNotification,
  sendRealtimeNotification,
};
