const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Middleware to verify veterinarian JWT token
const vetAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (decoded.type !== 'veterinarian') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Veterinarian account required.'
      });
    }

    req.vet = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// ============ USER ROUTES (Protected with authMiddleware) ============

/**
 * @route   POST /api/appointments
 * @desc    Book a new appointment with veterinarian
 * @access  Protected (User)
 */
router.post('/', authMiddleware, appointmentController.createAppointment.bind(appointmentController));

/**
 * @route   GET /api/appointments/my-appointments
 * @desc    Get user's appointments
 * @access  Protected (User)
 */
router.get('/my-appointments', authMiddleware, appointmentController.getUserAppointments.bind(appointmentController));

/**
 * @route   PATCH /api/appointments/:id/cancel
 * @desc    Cancel an appointment
 * @access  Protected (User)
 */
router.patch('/:id/cancel', authMiddleware, appointmentController.cancelAppointment.bind(appointmentController));

// ============ VETERINARIAN ROUTES (Protected with vetAuthMiddleware) ============

/**
 * @route   GET /api/appointments/vet-appointments
 * @desc    Get veterinarian's appointments
 * @access  Protected (Veterinarian)
 */
router.get('/vet-appointments', vetAuthMiddleware, appointmentController.getVetAppointments.bind(appointmentController));

/**
 * @route   GET /api/appointments/vet/stats
 * @desc    Get appointment statistics for vet dashboard
 * @access  Protected (Veterinarian)
 */
router.get('/vet/stats', vetAuthMiddleware, appointmentController.getVetStats.bind(appointmentController));

/**
 * @route   PATCH /api/appointments/:id/status
 * @desc    Update appointment status (confirm/reject/complete)
 * @access  Protected (Veterinarian)
 */
router.patch('/:id/status', vetAuthMiddleware, appointmentController.updateAppointmentStatus.bind(appointmentController));

// ============ COMMON ROUTES ============

/**
 * @route   GET /api/appointments/:id
 * @desc    Get single appointment details
 * @access  Protected (User or Veterinarian)
 */
router.get('/:id', (req, res, next) => {
  // Try both auth middlewares
  authMiddleware(req, res, (err) => {
    if (!err) return next();
    vetAuthMiddleware(req, res, next);
  });
}, appointmentController.getAppointmentById.bind(appointmentController));

module.exports = router;
