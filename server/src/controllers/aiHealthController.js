const aiHealthService = require('../services/aiHealthService');
const { cloudinary } = require('../config/cloudinary');
const multer = require('multer');

// Multer setup for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

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

    if (customQuestion?.trim()) {
      const questionResult = await aiHealthService.answerHealthQuestion({
        prompt: customQuestion,
        animalType,
        symptoms,
        age,
        additionalInfo: `${additionalInfo || ''}\nImage analysis summary: ${JSON.stringify(result.analysis)}`.trim(),
        languageHint,
      });
      result.analysis.questionAnswer = questionResult.answer;
      result.analysis.questionAsked = customQuestion.trim();
    }

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

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'health-check',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const imageUrl = uploadResult.secure_url;

    // Analyze the image
    const result = await aiHealthService.analyzeAnimalHealth(imageUrl, animalType, {
      symptoms,
      age,
      additionalInfo,
    });

    if (customQuestion?.trim()) {
      const questionResult = await aiHealthService.answerHealthQuestion({
        prompt: customQuestion,
        animalType,
        symptoms,
        age,
        additionalInfo: `${additionalInfo || ''}\nImage analysis summary: ${JSON.stringify(result.analysis)}`.trim(),
        languageHint,
      });
      result.analysis.questionAnswer = questionResult.answer;
      result.analysis.questionAsked = customQuestion.trim();
    }

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
};
