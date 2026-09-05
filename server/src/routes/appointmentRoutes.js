const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const vetAuthMiddleware = require('../middlewares/vetAuthMiddleware');
const userOrVetAuthMiddleware = require('../middlewares/userOrVetAuthMiddleware');

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
 * @route   GET /api/appointments/available-slots/:vetId
 * @desc    Get available appointment slots for a veterinarian
 * @access  Protected (User)
 */
router.get('/available-slots/:vetId', authMiddleware, appointmentController.getAvailableSlots.bind(appointmentController));

/**
 * @route   PATCH /api/appointments/:id/cancel
 * @desc    Cancel an appointment
 * @access  Protected (User)
 */
router.patch('/:id/cancel', authMiddleware, appointmentController.cancelAppointment.bind(appointmentController));

/**
 * @route   PATCH /api/appointments/:id/reschedule
 * @desc    Reschedule an appointment
 * @access  Protected (User)
 */
router.patch('/:id/reschedule', authMiddleware, appointmentController.rescheduleAppointment.bind(appointmentController));

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
 * @route   GET /api/appointments/stats
 * @desc    Get appointment statistics for vet dashboard
 * @access  Protected (Veterinarian)
 */
router.get('/stats', vetAuthMiddleware, appointmentController.getVetStats.bind(appointmentController));

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
router.get('/:id', userOrVetAuthMiddleware, appointmentController.getAppointmentById.bind(appointmentController));

module.exports = router;
