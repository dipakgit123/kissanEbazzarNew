// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validatePhone, validateOTP } = require('../middlewares/validationMiddleware');

// Multer configuration for profile photo upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
// Send OTP
router.post('/send-otp', validatePhone, authController.sendOTP);

// Verify OTP
router.post('/verify-otp', validateOTP, authController.verifyOTP);

// Resend OTP
router.post('/resend-otp', validatePhone, authController.resendOTP);

// Protected routes (require authentication)
// Get user profile
router.get('/profile', authMiddleware, authController.getUserProfile);

// Complete user profile (first-time login)
router.post('/complete-profile', authMiddleware, authController.completeProfile);

// Update user profile
router.put('/update-profile', authMiddleware, authController.updateProfile);

// Upload profile photo
router.post('/upload-photo', authMiddleware, upload.single('photo'), authController.uploadProfilePhoto);

// Delete profile photo
router.delete('/delete-photo', authMiddleware, authController.deleteProfilePhoto);

// Get user stats (if you have this method)
if (authController.getUserStats) {
  router.get('/stats/:phoneNumber', authMiddleware, authController.getUserStats);
}

// Health check for auth service
if (authController.checkHealth) {
  router.get('/health', authController.checkHealth);
}

module.exports = router;
