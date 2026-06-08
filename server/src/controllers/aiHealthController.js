const aiHealthService = require('../services/aiHealthService');
const { uploadToCloudinary } = require('../config/cloudinary');
const multer = require('multer');

const MAX_AI_HEALTH_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;

// Multer setup for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_AI_HEALTH_IMAGE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

const buildQuestionContext = (analysis, additionalInfo = '') => {
  const summaryParts = [
    analysis?.animalType ? `Detected animal: ${analysis.animalType}` : '',
    analysis?.overallHealth ? `Overall health: ${analysis.overallHealth}` : '',
    analysis?.healthScore != null ? `Health score: ${analysis.healthScore}/10` : '',
    analysis?.urgencyLevel ? `Urgency: ${analysis.urgencyLevel}` : '',
    Array.isArray(analysis?.visibleSigns) && analysis.visibleSigns.length
      ? `Visible signs: ${analysis.visibleSigns.slice(0, 4).join(', ')}`
      : '',
    Array.isArray(analysis?.potentialIssues) && analysis.potentialIssues.length
      ? `Potential issues: ${analysis.potentialIssues
          .slice(0, 3)
          .map((issue) => issue.condition || issue.conditionEnglish)
          .filter(Boolean)
          .join(', ')}`
      : '',
    Array.isArray(analysis?.recommendations) && analysis.recommendations.length
      ? `Recommendations: ${analysis.recommendations.slice(0, 3).join(', ')}`
      : '',
  ].filter(Boolean);

  return [additionalInfo, summaryParts.join('\n')].filter(Boolean).join('\n\n').trim();
};

const appendQuestionAnswer = async ({
  analysis,
  customQuestion,
  animalType,
  symptoms,
  age,
  additionalInfo,
  languageHint,
}) => {
  if (!customQuestion?.trim()) {
    return;
  }

  analysis.questionAsked = customQuestion.trim();

  try {
    const questionResult = await aiHealthService.answerHealthQuestion({
      prompt: customQuestion,
      animalType,
      symptoms,
      age,
      additionalInfo: buildQuestionContext(analysis, additionalInfo),
      languageHint,
    });

    analysis.questionAnswer = questionResult.answer;
  } catch (error) {
    console.error('AI health follow-up question failed:', error);
    analysis.questionError = error.message || 'Could not get an AI answer right now.';
  }
};

/**
 * Analyze animal health from uploaded image
 * POST /api/health-check/analyze
 */
const analyzeHealth = async (req, res) => {
  try {
    const { imageUrl, animalType, symptoms, age, additionalInfo, customQuestion, languageHint } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required',
      });
    }

    if (!animalType) {
      return res.status(400).json({
        success: false,
        message: 'Animal type is required',
      });
    }

    const result = await aiHealthService.analyzeAnimalHealth(imageUrl, animalType, {
      symptoms,
      age,
      additionalInfo,
    });

    await appendQuestionAnswer({
      analysis: result.analysis,
      customQuestion,
      animalType,
      symptoms,
      age,
      additionalInfo,
      languageHint,
    });

    res.json({
      success: true,
      data: result.analysis,
    });
  } catch (error) {
    console.error('Health analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze image',
    });
  }
};

/**
 * Upload image and analyze health
 * POST /api/health-check/upload-and-analyze
 */
const uploadAndAnalyze = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required',
      });
    }

    const { animalType, symptoms, age, additionalInfo, customQuestion, languageHint } = req.body;

    if (!animalType) {
      return res.status(400).json({
        success: false,
        message: 'Animal type is required',
      });
    }

    const uploadResult = await uploadToCloudinary(req.file, 'ai-health-check/uploads/images', 'image');

    const imageUrl = uploadResult.secure_url;

    // Analyze the image
    const result = await aiHealthService.analyzeAnimalHealth(imageUrl, animalType, {
      symptoms,
      age,
      additionalInfo,
    });

    await appendQuestionAnswer({
      analysis: result.analysis,
      customQuestion,
      animalType,
      symptoms,
      age,
      additionalInfo,
      languageHint,
    });

    res.json({
      success: true,
      imageUrl,
      data: result.analysis,
    });
  } catch (error) {
    console.error('Upload and analyze error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process image',
    });
  }
};

/**
 * Ask a direct animal health question
 * POST /api/health-check/ask
 */
const askHealthQuestion = async (req, res) => {
  try {
    const { prompt, animalType, symptoms, age, additionalInfo, languageHint } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required',
      });
    }

    const result = await aiHealthService.answerHealthQuestion({
      prompt,
      animalType,
      symptoms,
      age,
      additionalInfo,
      languageHint,
    });

    res.json({
      success: true,
      data: {
        answer: result.answer,
      },
    });
  } catch (error) {
    console.error('Ask health question error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to answer health question',
    });
  }
};

/**
 * Get common health issues for an animal type
 * GET /api/health-check/common-issues/:animalType
 */
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
    res.status(500).json({
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
    res.status(500).json({
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
    res.status(500).json({
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
    res.status(500).json({
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
