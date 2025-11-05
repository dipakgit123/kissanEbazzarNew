const express = require('express');
const router = express.Router();
const goatListingController = require('../controllers/goatListingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

// Validation rules
const goatValidationRules = [
  body('goatType')
    .isIn(['male', 'female'])
    .withMessage('Goat type must be either male or female'),

  body('breedName')
    .trim()
    .notEmpty().withMessage('Breed name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Breed name must be between 2 and 100 characters'),

  body('age')
    .trim()
    .notEmpty().withMessage('Age is required'),

  body('weight')
    .notEmpty().withMessage('Weight is required')
    .isFloat({ min: 0, max: 200 }).withMessage('Weight must be between 0 and 200 kg'),

  body('color')
    .trim()
    .notEmpty().withMessage('Color is required'),

  body('hornType')
    .isIn(['with_horns', 'without_horns'])
    .withMessage('Horn type must be with_horns or without_horns'),

  body('healthStatus')
    .isIn(['healthy', 'under_treatment', 'vaccinated'])
    .withMessage('Invalid health status'),

  body('purpose')
    .isIn(['milk', 'meat', 'breeding', 'pet'])
    .withMessage('Purpose must be milk, meat, breeding, or pet'),

  body('expectedPrice')
    .notEmpty().withMessage('Expected price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('isNegotiable')
    .notEmpty().withMessage('Negotiable status is required')
    .isBoolean().withMessage('Negotiable must be true or false'),

  body('detailsConfirmed')
    .notEmpty().withMessage('Details confirmation is required')
    .isBoolean().withMessage('Details confirmed must be true or false'),

  body('termsAccepted')
    .notEmpty().withMessage('Terms acceptance is required')
    .isBoolean().withMessage('Terms accepted must be true or false')
];

// Multer configuration for file uploads
const upload = require('multer')({ storage: require('multer').memoryStorage() });

const fileUploadConfig = upload.fields([
  { name: 'photo1', maxCount: 1 },
  { name: 'photo2', maxCount: 1 },
  { name: 'photo3', maxCount: 1 },
  { name: 'photo4', maxCount: 1 },
  { name: 'photo5', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

// Public routes - no authentication required
/**
 * @route   GET /api/goats/listings
 * @desc    Get all goat listings with filters and pagination
 * @access  Public
 */
router.get('/listings', goatListingController.getAllGoatListings);

/**
 * @route   GET /api/goats/listings/nearby
 * @desc    Get nearby goat listings based on location
 * @access  Public
 */
router.get('/listings/nearby', goatListingController.getNearbyGoatListings);

/**
 * @route   GET /api/goats/listings/:id
 * @desc    Get single goat listing by ID
 * @access  Public
 */
router.get('/listings/:id', goatListingController.getGoatListingById);

// Protected routes - authentication required
/**
 * @route   POST /api/goats/listings
 * @desc    Create a new goat listing
 * @access  Protected
 */
router.post(
  '/listings',
  authMiddleware,
  fileUploadConfig,
  goatValidationRules,
  goatListingController.createGoatListing
);

/**
 * @route   GET /api/goats/my-listings
 * @desc    Get user's own goat listings
 * @access  Protected
 */
router.get('/my-listings', authMiddleware, goatListingController.getMyGoatListings);

/**
 * @route   PUT /api/goats/listings/:id
 * @desc    Update goat listing (owner only)
 * @access  Protected
 */
router.put(
  '/listings/:id',
  authMiddleware,
  fileUploadConfig,
  goatListingController.updateGoatListing
);

/**
 * @route   DELETE /api/goats/listings/:id
 * @desc    Delete goat listing (soft delete, owner only)
 * @access  Protected
 */
router.delete('/listings/:id', authMiddleware, goatListingController.deleteGoatListing);

/**
 * @route   PATCH /api/goats/listings/:id/sold
 * @desc    Mark goat listing as sold (owner only)
 * @access  Protected
 */
router.patch('/listings/:id/sold', authMiddleware, goatListingController.markGoatAsSold);

module.exports = router;
