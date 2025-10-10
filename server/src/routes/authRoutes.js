// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validatePhone, validateOTP } = require('../middlewares/validationMiddleware');

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

// Get user stats (if you have this method)
if (authController.getUserStats) {
  router.get('/stats/:phoneNumber', authMiddleware, authController.getUserStats);
}

// Health check for auth service
if (authController.checkHealth) {
  router.get('/health', authController.checkHealth);
}

module.exports = router;