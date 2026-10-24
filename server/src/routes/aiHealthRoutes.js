const express = require('express');
const router = express.Router();
const aiHealthController = require('../controllers/aiHealthController');
const reports = require('../controllers/healthReportsController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const { uploadLimiter } = require('../config/rateLimiter');

const aiHealthUploadMiddleware = (req, res, next) => {
  aiHealthController.upload.single('image')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        code: 'HEALTH_IMAGE_TOO_LARGE',
        message: `Image size must be ${Math.floor(aiHealthController.MAX_AI_HEALTH_IMAGE_SIZE_BYTES / (1024 * 1024))}MB or less`
      });
      return;
    }

    res.status(400).json({
      success: false,
      code: 'HEALTH_INVALID_IMAGE',
      message: error.message || 'Failed to upload image'
    });
  });
};

// Public routes (no auth required)
router.get('/common-issues/:animalType', aiHealthController.getCommonIssues);
router.get('/emergency-symptoms', aiHealthController.getEmergencySymptoms);
router.get('/vaccination/:animalType', aiHealthController.getVaccinationSchedule);
router.get('/deworming/:animalType', aiHealthController.getDewormingSchedule);

// Protected routes (auth required for AI analysis to prevent abuse)
router.get('/animals', authMiddleware, reports.animals);
router.get('/reports', authMiddleware, reports.list);
router.get('/reports/:id', authMiddleware, reports.detail);
router.delete('/reports/:id', authMiddleware, reports.remove);
router.post('/reports/:id/ask', authMiddleware, reports.ask);
router.post('/ask', authMiddleware, reports.ask);
router.post('/analyze', authMiddleware, reports.analyze);
router.post(
  '/upload-and-analyze',
  authMiddleware,
  uploadLimiter,
  aiHealthUploadMiddleware,
  reports.analyze
);

module.exports = router;
