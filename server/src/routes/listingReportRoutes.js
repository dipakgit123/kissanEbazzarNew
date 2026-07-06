'use strict';

const express = require('express');
const router = express.Router();
const listingReportController = require('../controllers/listingReportController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminAuth = require('../middleware/adminAuth');

router.post('/', authMiddleware, listingReportController.createReport);
router.get('/my-reports', authMiddleware, listingReportController.getMyReports);

router.get('/', adminAuth, listingReportController.getAllReports);
router.get('/stats', adminAuth, listingReportController.getReportStats);
router.patch('/:reportId/status', adminAuth, listingReportController.updateReportStatus);

module.exports = router;
