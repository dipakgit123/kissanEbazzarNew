const express = require('express');
const router = express.Router();
const catListingController = require('../controllers/catListingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');
const { createUploadFields } = require('../config/cloudinary');
const { uploadLimiter } = require('../config/rateLimiter');

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
    .optional()
    .trim(),

  body('weight')
    .optional()
    .isFloat({ min: 0, max: 50 }).withMessage('Weight must be between 0 and 50 kg'),

  body('eyeColor')
    .optional()
    .trim(),

  body('furType')
    .optional()
    .isIn(['short', 'long', 'medium', 'curly'])
    .withMessage('Fur type must be short, long, medium, or curly'),

  body('vaccinationStatus')
    .optional()
    .isIn(['yes', 'no', 'partial'])
    .withMessage('Vaccination status must be yes, no, or partial'),

  body('healthCondition')
    .optional()
    .isIn(['healthy', 'under_treatment', 'needs_attention'])
    .withMessage('Health condition must be healthy, under_treatment, or needs_attention'),

  body('behavior')
    .optional()
    .isIn(['friendly', 'aggressive', 'calm', 'shy'])
    .withMessage('Behavior must be friendly, aggressive, calm, or shy'),

  body('expectedPrice')
    .notEmpty().withMessage('Expected price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('isNegotiable')
    .optional()
    .isBoolean().withMessage('Negotiable must be true or false')
];

const fileUploadConfig = createUploadFields([
  { name: 'photo1', maxCount: 1 },
  { name: 'photo2', maxCount: 1 },
  { name: 'photo3', maxCount: 1 },
  { name: 'photo4', maxCount: 1 },
  { name: 'photo5', maxCount: 1 },
  { name: 'video', maxCount: 1 }
], {
  fieldTypeMap: {
    photo1: ['image'],
    photo2: ['image'],
    photo3: ['image'],
    photo4: ['image'],
    photo5: ['image'],
    video: ['video']
  }
});

// Protected routes - authentication required (POST routes first)
/**
 * @route   POST /api/cats/listings
 * @desc    Create a new cat listing
 * @access  Protected
 */
router.post(
  '/listings',
  authMiddleware,
  uploadLimiter,
  fileUploadConfig,
  catValidationRules,
  catListingController.createCatListing
);

// Public routes - no authentication required
/**
 * @route   GET /api/cats/listings/nearby
 * @desc    Get nearby cat listings based on location
 * @access  Public
 */
router.get('/listings/nearby', catListingController.getNearbyCatListings);

/**
 * @route   GET /api/cats/listings
 * @desc    Get all cat listings with filters and pagination
 * @access  Public
 */
router.get('/listings', catListingController.getAllCatListings);

/**
 * @route   GET /api/cats/listings/:id
 * @desc    Get single cat listing by ID
 * @access  Public
 */
router.get('/listings/:id', catListingController.getCatListingById);

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
  uploadLimiter,
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
