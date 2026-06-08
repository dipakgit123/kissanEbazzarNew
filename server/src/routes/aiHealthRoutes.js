const express = require('express');
const router = express.Router();
const aiHealthController = require('../controllers/aiHealthController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');

const aiHealthUploadMiddleware = (req, res, next) => {
  aiHealthController.upload.single('image')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        message: `Image size must be ${Math.floor(aiHealthController.MAX_AI_HEALTH_IMAGE_SIZE_BYTES / (1024 * 1024))}MB or less`
      });
      return;
    }

    res.status(400).json({
      success: false,
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
router.post('/ask', authMiddleware, aiHealthController.askHealthQuestion);
router.post('/analyze', authMiddleware, aiHealthController.analyzeHealth);
router.post(
  '/upload-and-analyze',
  authMiddleware,
  aiHealthUploadMiddleware,
  aiHealthController.uploadAndAnalyze
);

module.exports = router;
