const express = require('express');
const router = express.Router();
const veterinarianController = require('../controllers/veterinarianController');
const vetAuthMiddleware = require('../middlewares/vetAuthMiddleware');
const { createUploadFields } = require('../config/cloudinary');
const { authLimiter, uploadLimiter } = require('../config/rateLimiter');

const VET_REGISTRATION_MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024;

const fileUploadConfig = createUploadFields([
  { name: 'profile_photo', maxCount: 1 },
  { name: 'license_document', maxCount: 1 },
  { name: 'degree_certificate', maxCount: 1 },
  { name: 'aadhar_document', maxCount: 1 }
], {
  maxFileSizeBytes: VET_REGISTRATION_MAX_FILE_SIZE_BYTES,
  fieldTypeMap: {
    profile_photo: ['image'],
    license_document: ['image', 'raw'],
    degree_certificate: ['image', 'raw'],
    aadhar_document: ['image', 'raw']
  }
});

const handleVeterinarianUpload = (req, res, next) => {
  fileUploadConfig(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        code: 'VET_UPLOAD_FILE_TOO_LARGE',
        message: 'Each registration document must be 6MB or smaller.'
      });
    }

    return res.status(400).json({
      success: false,
      code: 'VET_UPLOAD_INVALID_FILE',
      message: error.message || 'Invalid registration document upload.'
    });
  });
};

// ============ PUBLIC ROUTES ============

/**
 * @route   POST /api/veterinarians/register
 * @desc    Register a new veterinarian
 * @access  Public
 */
router.post('/register', uploadLimiter, handleVeterinarianUpload, veterinarianController.register.bind(veterinarianController));

/**
 * @route   POST /api/veterinarians/send-otp
 * @desc    Send OTP for login
 * @access  Public
 */
router.post('/send-otp', authLimiter, veterinarianController.sendOtp.bind(veterinarianController));

/**
 * @route   POST /api/veterinarians/verify-otp
 * @desc    Verify OTP and login
 * @access  Public
 */
router.post('/verify-otp', authLimiter, veterinarianController.verifyOtp.bind(veterinarianController));

/**
 * @route   POST /api/veterinarians/login
 * @desc    Login with email and password (for verified veterinarians)
 * @access  Public
 */
router.post('/login', authLimiter, veterinarianController.login.bind(veterinarianController));
router.post('/forgot-password', authLimiter, veterinarianController.requestPasswordReset.bind(veterinarianController));
router.post('/reset-password', authLimiter, veterinarianController.resetPassword.bind(veterinarianController));

/**
 * @route   GET /api/veterinarians/nearby
 * @desc    Get nearby veterinarians based on location
 * @access  Public
 */
router.get('/nearby', veterinarianController.getNearbyVeterinarians.bind(veterinarianController));

// ============ PROTECTED ROUTES (Vet's own profile) ============
// NOTE: These must come BEFORE the /:id route to avoid conflicts

/**
 * @route   GET /api/veterinarians/profile/me
 * @desc    Get own profile
 * @access  Protected (Veterinarian)
 */
router.get('/profile/me', vetAuthMiddleware, veterinarianController.getProfile.bind(veterinarianController));

/**
 * @route   PUT /api/veterinarians/profile/me
 * @desc    Update own profile
 * @access  Protected (Veterinarian)
 */
router.put('/profile/me', vetAuthMiddleware, uploadLimiter, handleVeterinarianUpload, veterinarianController.updateProfile.bind(veterinarianController));

/**
 * @route   GET /api/veterinarians/dashboard
 * @desc    Get dashboard data for veterinarian
 * @access  Protected (Veterinarian)
 */
router.get('/dashboard', vetAuthMiddleware, veterinarianController.getDashboard.bind(veterinarianController));

/**
 * @route   POST /api/veterinarians/:id/track-interaction
 * @desc    Track public veterinarian profile views and contact clicks
 * @access  Public
 */
router.post('/:id/track-interaction', veterinarianController.trackInteraction.bind(veterinarianController));

/**
 * @route   GET /api/veterinarians
 * @desc    Get all verified veterinarians
 * @access  Public
 */
router.get('/', veterinarianController.getAllVeterinarians.bind(veterinarianController));

/**
 * @route   GET /api/veterinarians/:id
 * @desc    Get veterinarian by ID
 * @access  Public
 */
router.get('/:id', veterinarianController.getVeterinarianById.bind(veterinarianController));

module.exports = router;
