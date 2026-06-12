const express = require('express');
const router = express.Router();
const animalListingController = require('../controllers/animalListingController');
const authMiddleware = require('../middlewares/authMiddleware'); // Your existing auth middleware
const { uploadFields } = require('../config/cloudinary');
const { uploadLimiter } = require('../config/rateLimiter');

// Public routes (no authentication required)
router.get('/listings', animalListingController.getAllListings);
router.get('/listings/nearby', animalListingController.getNearbyListings);
router.get('/listings/:id', animalListingController.getSingleListing);

// Protected routes (authentication required)
router.post('/listings', authMiddleware, uploadLimiter, uploadFields, animalListingController.createListing);
router.put('/listings/:id', authMiddleware, uploadLimiter, uploadFields, animalListingController.updateListing);
router.delete('/listings/:id', authMiddleware, animalListingController.deleteListing);
router.get('/my-listings', authMiddleware, animalListingController.getUserListings);
router.patch('/listings/:id/sold', authMiddleware, animalListingController.markAsSold);

module.exports = router;
