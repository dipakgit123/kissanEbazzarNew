const express = require('express');
const router = express.Router();
const dogListingController = require('../controllers/dogListingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');
const { createUploadFields } = require('../config/cloudinary');
const { uploadLimiter } = require('../config/rateLimiter');

// Validation rules
const dogValidationRules = [
  body('dogType')
    .isIn(['male', 'female'])
    .withMessage('Dog type must be either male or female'),

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
    .isFloat({ min: 0, max: 150 }).withMessage('Weight must be between 0 and 150 kg'),

  body('height')
    .optional()
    .isFloat({ min: 0, max: 200 }).withMessage('Height must be between 0 and 200 cm'),

  body('vaccinationStatus')
    .optional()
    .isIn(['yes', 'no', 'partial'])
    .withMessage('Vaccination status must be yes, no, or partial'),

  body('healthCondition')
    .optional()
    .isIn(['healthy', 'under_treatment', 'needs_attention'])
    .withMessage('Health condition must be healthy, under_treatment, or needs_attention'),

  body('trained')
    .optional()
    .isIn(['yes', 'no'])
    .withMessage('Trained status must be yes or no'),

  body('behavior')
    .optional()
    .isIn(['friendly', 'aggressive', 'calm', 'shy', 'playful'])
    .withMessage('Behavior must be friendly, aggressive, calm, shy, or playful'),

  body('purpose')
    .optional()
    .isIn(['guard', 'pet', 'breeding', 'show'])
    .withMessage('Purpose must be guard, pet, breeding, or show'),

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
 * @route   POST /api/dogs/listings
 * @desc    Create a new dog listing
 * @access  Protected
 */
router.post(
  '/listings',
  authMiddleware,
  uploadLimiter,
  fileUploadConfig,
  dogValidationRules,
  dogListingController.createDogListing
);

// Public routes - no authentication required
/**
 * @route   GET /api/dogs/listings/nearby
 * @desc    Get nearby dog listings based on location
 * @access  Public
 */
router.get('/listings/nearby', dogListingController.getNearbyDogListings);

/**
 * @route   GET /api/dogs/listings
 * @desc    Get all dog listings with filters and pagination
 * @access  Public
 */
router.get('/listings', dogListingController.getAllDogListings);

/**
 * @route   GET /api/dogs/listings/:id
 * @desc    Get single dog listing by ID
 * @access  Public
 */
router.get('/listings/:id', dogListingController.getDogListingById);

/**
 * @route   GET /api/dogs/my-listings
 * @desc    Get user's own dog listings
 * @access  Protected
 */
router.get('/my-listings', authMiddleware, dogListingController.getMyDogListings);

/**
 * @route   PUT /api/dogs/listings/:id
 * @desc    Update dog listing (owner only)
 * @access  Protected
 */
router.put(
  '/listings/:id',
  authMiddleware,
  uploadLimiter,
  fileUploadConfig,
  dogListingController.updateDogListing
);

/**
 * @route   DELETE /api/dogs/listings/:id
 * @desc    Delete dog listing (soft delete, owner only)
 * @access  Protected
 */
router.delete('/listings/:id', authMiddleware, dogListingController.deleteDogListing);

/**
 * @route   PATCH /api/dogs/listings/:id/sold
 * @desc    Mark dog listing as sold (owner only)
 * @access  Protected
 */
router.patch('/listings/:id/sold', authMiddleware, dogListingController.markDogAsSold);

module.exports = router;
