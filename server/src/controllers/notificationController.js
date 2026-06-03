const db = require('../models');
const { Notification, DeviceToken } = db;
const logger = require('../utils/logger');

/**
 * Register device token for push notifications
 */
const registerToken = async (req, res) => {
  try {
    const { token, platform = 'android' } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required',
      });
    }

    // Check if token already exists
    let deviceToken = await DeviceToken.findOne({ where: { token } });

    if (deviceToken) {
      // Update existing token
      await deviceToken.update({
        user_id: userId,
        platform,
        is_active: true,
      });
    } else {
      // Create new token
      deviceToken = await DeviceToken.create({
        user_id: userId,
        token,
        platform,
        is_active: true,
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

/**
 * Unregister device token
 */
const unregisterToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required',
      });
    }

    const [updatedCount] = await DeviceToken.update(
      { is_active: false },
      { where: { token, user_id: userId } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device token not found for this user',
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
 * Get all notifications for current user
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    let { limit = 50, offset = 0 } = req.query;

    // Validate and sanitize limit (max 100 to prevent DoS)
    limit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

    // Validate and sanitize offset (must be non-negative)
    offset = Math.max(parseInt(offset) || 0, 0);

    const notifications = await Notification.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const unreadCount = await Notification.count({
      where: { user_id: userId, is_read: false },
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
    const userId = req.user.id;

    const count = await Notification.count({
      where: { user_id: userId, is_read: false },
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
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, user_id: userId },
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
    const userId = req.user.id;

    await Notification.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
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
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, user_id: userId },
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
    const userId = req.user.id;

    await Notification.destroy({
      where: { user_id: userId },
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
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
