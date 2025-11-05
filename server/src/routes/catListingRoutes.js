const express = require('express');
const router = express.Router();
const catListingController = require('../controllers/catListingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

// Validation rules
const catValidationRules = [
  body('catType')
    .isIn(['male', 'female'])
    .withMessage('Cat type must be either male or female'),

  body('breedName')
    .trim()
    .notEmpty().withMessage('Breed name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Breed name must be between 2 and 100 characters'),

  body('age')
    .trim()
    .notEmpty().withMessage('Age is required'),

  body('color')
    .trim()
    .notEmpty().withMessage('Color is required'),

  body('weight')
    .notEmpty().withMessage('Weight is required')
    .isFloat({ min: 0, max: 50 }).withMessage('Weight must be between 0 and 50 kg'),

  body('eyeColor')
    .trim()
    .notEmpty().withMessage('Eye color is required'),

  body('furType')
    .isIn(['short', 'long', 'curly'])
    .withMessage('Fur type must be short, long, or curly'),

  body('vaccinationStatus')
    .isIn(['yes', 'no'])
    .withMessage('Vaccination status must be yes or no'),

  body('healthCondition')
    .isIn(['healthy', 'under_treatment'])
    .withMessage('Health condition must be healthy or under_treatment'),

  body('behavior')
    .isIn(['friendly', 'aggressive', 'calm'])
    .withMessage('Behavior must be friendly, aggressive, or calm'),

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
 * @route   GET /api/cats/listings
 * @desc    Get all cat listings with filters and pagination
 * @access  Public
 */
router.get('/listings', catListingController.getAllCatListings);

/**
 * @route   GET /api/cats/listings/nearby
 * @desc    Get nearby cat listings based on location
 * @access  Public
 */
router.get('/listings/nearby', catListingController.getNearbyCatListings);

/**
 * @route   GET /api/cats/listings/:id
 * @desc    Get single cat listing by ID
 * @access  Public
 */
router.get('/listings/:id', catListingController.getCatListingById);

// Protected routes - authentication required
/**
 * @route   POST /api/cats/listings
 * @desc    Create a new cat listing
 * @access  Protected
 */
router.post(
  '/listings',
  authMiddleware,
  fileUploadConfig,
  catValidationRules,
  catListingController.createCatListing
);

/**
 * @route   GET /api/cats/my-listings
 * @desc    Get user's own cat listings
 * @access  Protected
 */
router.get('/my-listings', authMiddleware, catListingController.getMyCatListings);

/**
 * @route   PUT /api/cats/listings/:id
 * @desc    Update cat listing (owner only)
 * @access  Protected
 */
router.put(
  '/listings/:id',
  authMiddleware,
  fileUploadConfig,
  catListingController.updateCatListing
);

/**
 * @route   DELETE /api/cats/listings/:id
 * @desc    Delete cat listing (soft delete, owner only)
 * @access  Protected
 */
router.delete('/listings/:id', authMiddleware, catListingController.deleteCatListing);

/**
 * @route   PATCH /api/cats/listings/:id/sold
 * @desc    Mark cat listing as sold (owner only)
 * @access  Protected
 */
router.patch('/listings/:id/sold', authMiddleware, catListingController.markCatAsSold);

module.exports = router;
