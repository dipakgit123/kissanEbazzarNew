const aiHealthService = require('../services/aiHealthService');
const multer = require('multer');
const { MAX_IMAGE_BYTES: MAX_AI_HEALTH_IMAGE_SIZE_BYTES } = require('../utils/healthContract');
const { analyze: analyzeHealth, ask: askHealthQuestion } = require('./healthReportsController');
const uploadAndAnalyze = analyzeHealth;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_AI_HEALTH_IMAGE_SIZE_BYTES, files: 1, fields: 16, fieldSize: 6000 }, fileFilter: (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) cb(null, true);
  else cb(new Error('Use a JPEG, PNG, WebP or GIF image.'));
} });

const getCommonIssues = (req, res) => {
  try {
    const { animalType } = req.params;
    const issues = aiHealthService.getCommonHealthIssues(animalType);

    res.json({
      success: true,
      animalType,
      data: issues,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: 'Failed to get common issues',
    });
  }
};

/**
 * Get emergency symptoms
 * GET /api/health-check/emergency-symptoms
 */
const getEmergencySymptoms = (req, res) => {
  try {
    const symptoms = aiHealthService.getEmergencySymptoms();

    res.json({
      success: true,
      data: symptoms,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: 'Failed to get emergency symptoms',
    });
  }
};

/**
 * Get vaccination schedule for an animal type
 * GET /api/health-check/vaccination/:animalType
 */
const getVaccinationSchedule = (req, res) => {
  try {
    const { animalType } = req.params;
    const schedule = aiHealthService.getVaccinationSchedule(animalType);

    res.json({
      success: true,
      animalType,
      data: schedule,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: 'Failed to get vaccination schedule',
    });
  }
};

/**
 * Get deworming schedule for an animal type
 * GET /api/health-check/deworming/:animalType
 */
const getDewormingSchedule = (req, res) => {
  try {
    const { animalType } = req.params;
    const schedule = aiHealthService.getDewormingSchedule(animalType);

    res.json({
      success: true,
      animalType,
      data: schedule,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: 'Failed to get deworming schedule',
    });
  }
};

module.exports = {
  analyzeHealth,
  uploadAndAnalyze,
  askHealthQuestion,
  getCommonIssues,
  getEmergencySymptoms,
  getVaccinationSchedule,
  getDewormingSchedule,
  upload,
  MAX_AI_HEALTH_IMAGE_SIZE_BYTES,
};
