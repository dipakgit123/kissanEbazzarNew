const express = require('express');
const router = express.Router();
const pregnancyController = require('../controllers/pregnancyController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.get('/durations', pregnancyController.getPregnancyDurations);

// Protected routes (authentication required)
router.get('/my-animals', authMiddleware, pregnancyController.getMyAnimals);
router.get('/calendar', authMiddleware, pregnancyController.getCalendarView);
router.get('/stats', authMiddleware, pregnancyController.getStats);

// CRUD operations for pregnancy records
router.post('/records', authMiddleware, pregnancyController.createPregnancyRecord);
router.get('/records', authMiddleware, pregnancyController.getPregnancyRecords);
router.get('/records/:id', authMiddleware, pregnancyController.getPregnancyRecord);
router.put('/records/:id', authMiddleware, pregnancyController.updatePregnancyRecord);
router.delete('/records/:id', authMiddleware, pregnancyController.deletePregnancyRecord);

// Status update routes
router.patch('/records/:id/deliver', authMiddleware, pregnancyController.markAsDelivered);
router.patch('/records/:id/status', authMiddleware, pregnancyController.updateStatus);

module.exports = router;
