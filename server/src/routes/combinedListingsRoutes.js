'use strict';

const express = require('express');
const router = express.Router();
const combinedListingsController = require('../controllers/combinedListingsController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes - No authentication required

// Get all nearby listings from all animal categories
// GET /api/listings/nearby?latitude=XX&longitude=XX&radius=50&limit=20
router.get('/nearby', combinedListingsController.getAllNearbyListings);

// Get featured listings (most recent from all categories)
// GET /api/listings/featured?limit=20
router.get('/featured', combinedListingsController.getFeaturedListings);

// Search listings across all categories
// GET /api/listings/search?query=xxx&animalType=xxx&minPrice=xxx&maxPrice=xxx
router.get('/search', combinedListingsController.searchListings);

// Get listings by animal type
// GET /api/listings/type/:animalType?limit=50
router.get('/type/:animalType', combinedListingsController.getListingsByType);

// Protected routes - Authentication required

// Get user's own listings from all categories
// GET /api/combined/my-listings
router.get('/my-listings', authMiddleware, combinedListingsController.getMyListings);

// Mark listing as sold
// PATCH /api/listings/:animalType/:id/sold
router.patch('/:animalType/:id/sold', authMiddleware, combinedListingsController.markListingAsSold);

// Get single listing by animal type and ID
// GET /api/listings/:animalType/:id
router.get('/:animalType/:id', combinedListingsController.getListingById);

module.exports = router;
