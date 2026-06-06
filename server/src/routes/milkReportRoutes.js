const express = require('express');
const router = express.Router();
const milkReportController = require('../controllers/milkReportController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/stats', authMiddleware, milkReportController.getStats);
router.post('/cows', authMiddleware, milkReportController.createCow);
router.get('/cows', authMiddleware, milkReportController.getCows);
router.put('/cows/:id', authMiddleware, milkReportController.updateCow);
router.delete('/cows/:id', authMiddleware, milkReportController.deleteCow);
router.post('/reports', authMiddleware, milkReportController.createReport);
router.get('/reports', authMiddleware, milkReportController.getReports);
router.get('/reports/:id', authMiddleware, milkReportController.getReport);
router.put('/reports/:id', authMiddleware, milkReportController.updateReport);
router.delete('/reports/:id', authMiddleware, milkReportController.deleteReport);

module.exports = router;
