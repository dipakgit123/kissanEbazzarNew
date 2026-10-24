const express = require('express');
const router = express.Router();
const milkReportController = require('../controllers/milkReportController');
const authMiddleware = require('../middlewares/authMiddleware');
const expenses = require('../controllers/milkExpenseController');
const advice = require('../controllers/milkAdviceController');
const { rateLimit } = require('express-rate-limit');
const adviceLimit = rateLimit({ windowMs: 60 * 1000, limit: 20, keyGenerator: req => String(req.user.id), standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false, code: 'AI_BUSY' }) });
router.get('/cows/:id/advice', authMiddleware, adviceLimit, advice.get);
router.put('/cows/:id/feeding', authMiddleware, adviceLimit, advice.saveRoutine);
router.post('/cows/:id/advice', authMiddleware, adviceLimit, advice.generate);

router.get('/expenses', authMiddleware, expenses.list);
router.post('/expenses', authMiddleware, expenses.create);
router.put('/expenses/:id', authMiddleware, expenses.update);
router.delete('/expenses/:id', authMiddleware, expenses.remove);

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
