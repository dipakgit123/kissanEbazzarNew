const express = require('express');
const router = express.Router();
const buffaloListingController = require('../controllers/buffaloListingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

// Validation rules
const buffaloValidationRules = [
  body('breedName')
    .trim()
    .notEmpty().withMessage('Breed name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Breed name must be between 2 and 100 characters'),

  body('age')
    .trim()
    .notEmpty().withMessage('Age is required'),

  body('milkCapacity')
    .notEmpty().withMessage('Milk capacity is required')
    .isFloat({ min: 0, max: 100 }).withMessage('Milk capacity must be between 0 and 100 liters'),

  body('pregnancyStatus')
    .isIn(['pregnant', 'not_pregnant', 'recently_delivered', 'unknown'])
    .withMessage('Invalid pregnancy status'),

  body('hasHorns')
    .notEmpty().withMessage('Horns information is required')
    .isBoolean().withMessage('Has horns must be true or false'),

  body('healthCondition')
    .isIn(['excellent', 'good', 'average'])
    .withMessage('Invalid health condition'),

  body('expectedPrice')
    .notEmpty().withMessage('Expected price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('isNegotiable')
    .notEmpty().withMessage('Negotiable status is required')
    .isBoolean().withMessage('Negotiable must be true or false')
];

// Multer configuration for file uploads
const upload = require('multer')({ storage: require('multer').memoryStorage() });

const fileUploadConfig = upload.fields([
  { name: 'frontPhoto', maxCount: 1 },
  { name: 'sidePhoto', maxCount: 1 },
  { name: 'milkScenePhoto', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

// Protected routes - authentication required (POST routes first)
/**
 * @route   POST /api/buffalos/listings
 * @desc    Create a new buffalo listing
 * @access  Protected
 */
router.post(
  '/listings',
  authMiddleware,
  fileUploadConfig,
  buffaloValidationRules,
  buffaloListingController.createBuffaloListing
);

// Public routes - no authentication required
/**
 * @route   GET /api/buffalos/listings/nearby
 * @desc    Get nearby buffalo listings based on location
 * @access  Public
 */
router.get('/listings/nearby', buffaloListingController.getNearbyBuffaloListings);

/**
 * @route   GET /api/buffalos/listings
 * @desc    Get all buffalo listings with filters and pagination
 * @access  Public
 */
router.get('/listings', buffaloListingController.getAllBuffaloListings);

/**
 * @route   GET /api/buffalos/listings/:id
 * @desc    Get single buffalo listing by ID
 * @access  Public
 */
router.get('/listings/:id', buffaloListingController.getBuffaloListingById);

/**
 * @route   GET /api/buffalos/my-listings
 * @desc    Get user's own buffalo listings
 * @access  Protected
 */
router.get('/my-listings', authMiddleware, buffaloListingController.getMyBuffaloListings);

/**
 * @route   PUT /api/buffalos/listings/:id
 * @desc    Update buffalo listing (owner only)
 * @access  Protected
 */
router.put(
  '/listings/:id',
  authMiddleware,
  fileUploadConfig,
  buffaloListingController.updateBuffaloListing
);

/**
 * @route   DELETE /api/buffalos/listings/:id
 * @desc    Delete buffalo listing (soft delete, owner only)
 * @access  Protected
 */
router.delete('/listings/:id', authMiddleware, buffaloListingController.deleteBuffaloListing);

/**
 * @route   PATCH /api/buffalos/listings/:id/sold
 * @desc    Mark buffalo listing as sold (owner only)
 * @access  Protected
 */
router.patch('/listings/:id/sold', authMiddleware, buffaloListingController.markBuffaloAsSold);

module.exports = router;
