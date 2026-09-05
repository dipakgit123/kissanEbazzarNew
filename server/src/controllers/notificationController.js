const db = require('../models');
const { Notification, DeviceToken, NotificationPreference } = db;
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { sendRealtimeNotification } = require('../services/notificationService');

const getRequestRecipient = (req) => {
  if (req.vet) {
    return {
      id: req.vet.id,
      type: 'veterinarian',
      legacyUserId: null,
    };
  }

  return {
    id: req.user.id,
    type: 'user',
    legacyUserId: req.user.id,
  };
};

const buildRecipientWhere = ({ id, type, legacyUserId }, extra = {}) => {
  const recipientWhere = {
    recipient_type: type,
    recipient_id: id,
  };

  if (type !== 'user') {
    return {
      ...recipientWhere,
      ...extra,
    };
  }

  return {
    ...extra,
    [Op.or]: [
      recipientWhere,
      { user_id: legacyUserId },
    ],
  };
};

const buildRecipientPayload = ({ id, type, legacyUserId }) => ({
  user_id: type === 'user' ? legacyUserId : null,
  recipient_type: type,
  recipient_id: id,
});

const DEFAULT_PREFERENCES = {
  push_enabled: true,
  appointments_enabled: true,
  marketplace_enabled: true,
  reminders_enabled: true,
  communication_enabled: true,
  system_enabled: true,
};
const PREFERENCE_FIELDS = Object.keys(DEFAULT_PREFERENCES);

/**
 * Register device token for push notifications
 */
const registerToken = async (req, res) => {
  try {
    const {
      token,
      platform = 'android',
      provider = 'expo',
      device_id = null,
      app_version = null,
    } = req.body;
    const recipient = getRequestRecipient(req);
    const normalizedProvider = provider === 'firebase' ? 'firebase' : 'expo';
    const normalizedPlatform = ['android', 'ios', 'web'].includes(platform) ? platform : null;

    if (typeof token !== 'string' || token.trim().length < 20 || token.length > 2048) {
      return res.status(400).json({
        success: false,
        message: 'A valid device token is required',
      });
    }

    if (!normalizedPlatform) {
      return res.status(400).json({ success: false, message: 'Invalid device platform' });
    }

    // Check if token already exists
    let deviceToken = await DeviceToken.findOne({ where: { token } });

    if (deviceToken) {
      // Update existing token
      await deviceToken.update({
        ...buildRecipientPayload(recipient),
        platform: normalizedPlatform,
        provider: normalizedProvider,
        is_active: true,
        device_id: device_id ? String(device_id).slice(0, 120) : null,
        app_version: app_version ? String(app_version).slice(0, 40) : null,
        last_seen_at: new Date(),
        failure_count: 0,
        last_error: null,
      });
    } else {
      // Create new token
      deviceToken = await DeviceToken.create({
        ...buildRecipientPayload(recipient),
        token,
        platform: normalizedPlatform,
        provider: normalizedProvider,
        is_active: true,
        device_id: device_id ? String(device_id).slice(0, 120) : null,
        app_version: app_version ? String(app_version).slice(0, 40) : null,
        last_seen_at: new Date(),
        failure_count: 0,
        last_error: null,
      });
    }

    res.json({
      success: true,
      message: 'Device token registered successfully',
    });
  } catch (error) {
    logger.error('Error registering device token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device token',
    });
  }
};

const getPreferences = async (req, res) => {
  try {
    const recipient = getRequestRecipient(req);
    const [preferences] = await NotificationPreference.findOrCreate({
      where: {
        recipient_type: recipient.type,
        recipient_id: recipient.id,
      },
      defaults: DEFAULT_PREFERENCES,
    });

    res.json({ success: true, data: preferences });
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notification preferences' });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const recipient = getRequestRecipient(req);
    const updates = {};

    for (const field of PREFERENCE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        if (typeof req.body[field] !== 'boolean') {
          return res.status(400).json({ success: false, message: `${field} must be a boolean` });
        }
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid preference fields provided' });
    }

    const [preferences] = await NotificationPreference.findOrCreate({
      where: {
        recipient_type: recipient.type,
        recipient_id: recipient.id,
      },
      defaults: { ...DEFAULT_PREFERENCES, ...updates },
    });
    await preferences.update(updates);

    res.json({ success: true, data: preferences });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification preferences' });
  }
};

/**
 * Unregister device token
 */
const unregisterToken = async (req, res) => {
  try {
    const recipient = getRequestRecipient(req);
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required',
      });
    }

    const [updatedCount] = await DeviceToken.update(
      { is_active: false },
      { where: buildRecipientWhere(recipient, { token }) }
    );

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device token not found for this account',
      });
    }

    res.json({
      success: true,
      message: 'Device token unregistered successfully',
    });
  } catch (error) {
    logger.error('Error unregistering device token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unregister device token',
    });
  }
};

/**
 * Send a test notification to the authenticated user's registered devices.
 * This is intended for local/staging verification, not public production use.
 */
const sendTestNotification = async (req, res) => {
  try {
    const enabled =
      process.env.NODE_ENV !== 'production' ||
      process.env.ENABLE_TEST_NOTIFICATIONS === 'true';

    if (!enabled) {
      return res.status(403).json({
        success: false,
        message: 'Test notifications are disabled',
      });
    }

    const recipient = getRequestRecipient(req);
    const title = req.body?.title || 'Animal E Bazar test';
    const body = req.body?.body || 'Your local push notification setup is working.';

    const activeTokenCount = await DeviceToken.count({
      where: buildRecipientWhere(recipient, { is_active: true }),
    });

    const sent = await sendRealtimeNotification(
      recipient.id,
      title,
      body,
      {
        type: 'test_notification',
        source: 'local_test',
        sentAt: new Date().toISOString(),
      },
      db,
      recipient.type
    );

    res.json({
      success: sent,
      message: sent ? 'Test notification sent' : 'Test notification could not be sent',
      active_token_count: activeTokenCount,
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
    });
  }
};

/**
 * Get all notifications for current user
 */
const getNotifications = async (req, res) => {
  try {
    const recipient = getRequestRecipient(req);
    let { limit = 50, offset = 0 } = req.query;

    // Validate and sanitize limit (max 100 to prevent DoS)
    limit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

    // Validate and sanitize offset (must be non-negative)
    offset = Math.max(parseInt(offset) || 0, 0);

    const notifications = await Notification.findAndCountAll({
      where: buildRecipientWhere(recipient),
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const unreadCount = await Notification.count({
      where: buildRecipientWhere(recipient, { is_read: false }),
    });

    res.json({
      success: true,
      data: notifications.rows,
      total: notifications.count,
      unread_count: unreadCount,
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res) => {
  try {
    const recipient = getRequestRecipient(req);

    const count = await Notification.count({
      where: buildRecipientWhere(recipient, { is_read: false }),
    });

    res.json({
      success: true,
      unread_count: count,
    });
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
    });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const recipient = getRequestRecipient(req);

    const notification = await Notification.findOne({
      where: buildRecipientWhere(recipient, { id }),
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.update({ is_read: true });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const recipient = getRequestRecipient(req);

    await Notification.update(
      { is_read: true },
      { where: buildRecipientWhere(recipient, { is_read: false }) }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
    });
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const recipient = getRequestRecipient(req);

    const notification = await Notification.findOne({
      where: buildRecipientWhere(recipient, { id }),
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
    });
  }
};

/**
 * Clear all notifications
 */
const clearAllNotifications = async (req, res) => {
  try {
    const recipient = getRequestRecipient(req);

    await Notification.destroy({
      where: buildRecipientWhere(recipient),
    });

    res.json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error) {
    logger.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
    });
  }
};

module.exports = {
  registerToken,
  unregisterToken,
  sendTestNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getPreferences,
  updatePreferences,
};
