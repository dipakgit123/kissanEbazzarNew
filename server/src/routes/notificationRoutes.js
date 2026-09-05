const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const userOrVetAuthMiddleware = require('../middlewares/userOrVetAuthMiddleware');

// All routes require authenticated farmers or veterinarians
router.use(userOrVetAuthMiddleware);

// Device token management
router.post('/register-token', notificationController.registerToken);
router.post('/unregister-token', notificationController.unregisterToken);
router.post('/test-push', notificationController.sendTestNotification);
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

// Notification management
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.delete('/', notificationController.clearAllNotifications);

module.exports = router;
