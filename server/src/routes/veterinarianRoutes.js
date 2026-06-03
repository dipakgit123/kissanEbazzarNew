const express = require('express');
const router = express.Router();
const veterinarianController = require('../controllers/veterinarianController');
const multer = require('multer');
const vetAuthMiddleware = require('../middlewares/vetAuthMiddleware');

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

const fileUploadConfig = upload.fields([
  { name: 'profile_photo', maxCount: 1 },
  { name: 'license_document', maxCount: 1 },
  { name: 'degree_certificate', maxCount: 1 },
  { name: 'aadhar_document', maxCount: 1 }
]);

// ============ PUBLIC ROUTES ============

/**
 * @route   POST /api/veterinarians/register
 * @desc    Register a new veterinarian
 * @access  Public
 */
router.post('/register', fileUploadConfig, veterinarianController.register.bind(veterinarianController));

/**
 * @route   POST /api/veterinarians/send-otp
 * @desc    Send OTP for login
 * @access  Public
 */
router.post('/send-otp', veterinarianController.sendOtp.bind(veterinarianController));

/**
 * @route   POST /api/veterinarians/verify-otp
 * @desc    Verify OTP and login
 * @access  Public
 */
router.post('/verify-otp', veterinarianController.verifyOtp.bind(veterinarianController));

/**
 * @route   POST /api/veterinarians/login
 * @desc    Login with email and password (for verified veterinarians)
 * @access  Public
 */
router.post('/login', veterinarianController.login.bind(veterinarianController));

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
router.put('/profile/me', vetAuthMiddleware, fileUploadConfig, veterinarianController.updateProfile.bind(veterinarianController));

/**
 * @route   GET /api/veterinarians/dashboard
 * @desc    Get dashboard data for veterinarian
 * @access  Protected (Veterinarian)
 */
router.get('/dashboard', vetAuthMiddleware, veterinarianController.getDashboard.bind(veterinarianController));

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
