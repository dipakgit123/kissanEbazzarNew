const express = require('express');
const router = express.Router();
const vetReportController = require('../controllers/vetReportController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminAuth = require('../middleware/adminAuth');

// ============ PROTECTED ROUTES (User) ============

/**
 * @route   POST /api/vet-reports
 * @desc    Create a report against a veterinarian
 * @access  Protected (User)
 */
router.post('/', authMiddleware, vetReportController.createReport);

/**
 * @route   GET /api/vet-reports/my-reports
 * @desc    Get user's own reports
 * @access  Protected (User)
 */
router.get('/my-reports', authMiddleware, vetReportController.getUserReports);

// ============ ADMIN ROUTES ============

/**
 * @route   GET /api/vet-reports
 * @desc    Get all reports (Admin only)
 * @access  Protected (Admin)
 */
router.get('/', adminAuth, vetReportController.getAllReports);

/**
 * @route   GET /api/vet-reports/stats
 * @desc    Get report statistics (Admin only)
 * @access  Protected (Admin)
 */
router.get('/stats', adminAuth, vetReportController.getReportStats);

/**
 * @route   GET /api/vet-reports/veterinarian/:veterinarianId
 * @desc    Get all reports for a specific veterinarian (Admin only)
 * @access  Protected (Admin)
 */
router.get('/veterinarian/:veterinarianId', adminAuth, vetReportController.getVetReports);

/**
 * @route   PUT /api/vet-reports/:reportId/status
 * @desc    Update report status (Admin only)
 * @access  Protected (Admin)
 */
router.put('/:reportId/status', adminAuth, vetReportController.updateReportStatus);

module.exports = router;
