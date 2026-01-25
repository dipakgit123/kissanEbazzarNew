const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middlewares/authMiddleware');

// All wishlist routes require authentication
router.use(authMiddleware);

// Get user's wishlist
router.get('/', wishlistController.getWishlist);

// Add item to wishlist
router.post('/add', wishlistController.addToWishlist);

// Remove item from wishlist
router.post('/remove', wishlistController.removeFromWishlist);

// Check if item is in wishlist
router.get('/check', wishlistController.checkWishlist);

// Clear entire wishlist
router.delete('/clear', wishlistController.clearWishlist);

module.exports = router;
