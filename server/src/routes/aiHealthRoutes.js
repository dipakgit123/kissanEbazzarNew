const express = require('express');
const router = express.Router();
const aiHealthController = require('../controllers/aiHealthController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes (no auth required)
router.get('/common-issues/:animalType', aiHealthController.getCommonIssues);
router.get('/emergency-symptoms', aiHealthController.getEmergencySymptoms);
router.get('/vaccination/:animalType', aiHealthController.getVaccinationSchedule);
router.get('/deworming/:animalType', aiHealthController.getDewormingSchedule);

// Protected routes (auth required for AI analysis to prevent abuse)
router.post('/analyze', authMiddleware, aiHealthController.analyzeHealth);
router.post(
  '/upload-and-analyze',
  authMiddleware,
  aiHealthController.upload.single('image'),
  aiHealthController.uploadAndAnalyze
);

module.exports = router;
