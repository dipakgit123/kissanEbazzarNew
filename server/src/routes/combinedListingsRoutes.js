'use strict';

const express = require('express');
const router = express.Router();
const combinedListingsController = require('../controllers/combinedListingsController');

// Public routes - No authentication required

// Get all nearby listings from all animal categories
// GET /api/listings/nearby?latitude=XX&longitude=XX&radius=50&limit=20
router.get('/nearby', combinedListingsController.getAllNearbyListings);

// Get featured listings (most recent from all categories)
// GET /api/listings/featured?limit=20
router.get('/featured', combinedListingsController.getFeaturedListings);

// Get single listing by animal type and ID
// GET /api/listings/:animalType/:id
router.get('/:animalType/:id', combinedListingsController.getListingById);

module.exports = router;
