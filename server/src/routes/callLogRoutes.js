const express = require('express');
const router = express.Router();
const callLogController = require('../controllers/callLogController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/call-logs
 * @desc    Log a new call
 * @access  Protected
 */
router.post('/', authMiddleware, callLogController.logCall);

/**
 * @route   GET /api/call-logs/history
 * @desc    Get user's complete call history (made + received)
 * @access  Protected
 */
router.get('/history', authMiddleware, callLogController.getUserCallHistory);

/**
 * @route   GET /api/call-logs/made
 * @desc    Get calls made by user
 * @access  Protected
 */
router.get('/made', authMiddleware, callLogController.getCallsMade);

/**
 * @route   GET /api/call-logs/received
 * @desc    Get calls received by user
 * @access  Protected
 */
router.get('/received', authMiddleware, callLogController.getCallsReceived);

/**
 * @route   GET /api/call-logs/stats
 * @desc    Get call statistics for user
 * @access  Protected
 */
router.get('/stats', authMiddleware, callLogController.getUserCallStats);

/**
 * @route   GET /api/call-logs/listing/:listingType/:listingId
 * @desc    Get calls for a specific listing
 * @access  Protected
 */
router.get('/listing/:listingType/:listingId', authMiddleware, callLogController.getListingCalls);

/**
 * @route   PUT /api/call-logs/:id/status
 * @desc    Update call status (e.g., when call ends)
 * @access  Protected
 */
router.put('/:id/status', authMiddleware, callLogController.updateCallStatus);

module.exports = router;
