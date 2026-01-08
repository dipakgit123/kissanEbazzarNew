const express = require('express');
const router = express.Router();
const vetReviewController = require('../controllers/vetReviewController');
const authMiddleware = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (decoded.type !== 'veterinarian') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Veterinarian account required.'
      });
    }

    req.veterinarian = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// ============ PUBLIC ROUTES ============

/**
 * @route   GET /api/vet-reviews/veterinarian/:veterinarianId
 * @desc    Get all reviews for a specific veterinarian
 * @access  Public
 */
router.get('/veterinarian/:veterinarianId', vetReviewController.getVetReviews);

// ============ PROTECTED ROUTES (User) ============

/**
 * @route   POST /api/vet-reviews
 * @desc    Create a review for a veterinarian
 * @access  Protected (User)
 */
router.post('/', authMiddleware, vetReviewController.createReview);

/**
 * @route   GET /api/vet-reviews/my-review/:veterinarianId
 * @desc    Get user's own review for a specific veterinarian
 * @access  Protected (User)
 */
router.get('/my-review/:veterinarianId', authMiddleware, vetReviewController.getUserReview);

/**
 * @route   PUT /api/vet-reviews/:reviewId
 * @desc    Update user's own review
 * @access  Protected (User)
 */
router.put('/:reviewId', authMiddleware, vetReviewController.updateReview);

/**
 * @route   DELETE /api/vet-reviews/:reviewId
 * @desc    Delete user's own review
 * @access  Protected (User)
 */
router.delete('/:reviewId', authMiddleware, vetReviewController.deleteReview);

/**
 * @route   POST /api/vet-reviews/:reviewId/helpful
 * @desc    Mark a review as helpful
 * @access  Protected (User)
 */
router.post('/:reviewId/helpful', authMiddleware, vetReviewController.markHelpful);

// ============ PROTECTED ROUTES (Veterinarian) ============

/**
 * @route   POST /api/vet-reviews/:reviewId/respond
 * @desc    Veterinarian responds to a review
 * @access  Protected (Veterinarian)
 */
router.post('/:reviewId/respond', vetAuthMiddleware, vetReviewController.respondToReview);

module.exports = router;
