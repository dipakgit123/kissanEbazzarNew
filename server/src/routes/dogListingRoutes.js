const express = require('express');
const router = express.Router();
const dogListingController = require('../controllers/dogListingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

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
    .trim()
    .notEmpty().withMessage('Color is required'),

  body('weight')
    .notEmpty().withMessage('Weight is required')
    .isFloat({ min: 0, max: 150 }).withMessage('Weight must be between 0 and 150 kg'),

  body('height')
    .notEmpty().withMessage('Height is required')
    .isFloat({ min: 0, max: 200 }).withMessage('Height must be between 0 and 200 cm'),

  body('vaccinationStatus')
    .isIn(['yes', 'no'])
    .withMessage('Vaccination status must be yes or no'),

  body('healthCondition')
    .isIn(['healthy', 'under_treatment'])
    .withMessage('Health condition must be healthy or under_treatment'),

  body('trained')
    .isIn(['yes', 'no'])
    .withMessage('Trained status must be yes or no'),

  body('behavior')
    .isIn(['friendly', 'aggressive', 'calm'])
    .withMessage('Behavior must be friendly, aggressive, or calm'),

  body('purpose')
    .isIn(['guard', 'pet', 'breeding', 'show'])
    .withMessage('Purpose must be guard, pet, breeding, or show'),

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
 * @route   GET /api/dogs/listings
 * @desc    Get all dog listings with filters and pagination
 * @access  Public
 */
router.get('/listings', dogListingController.getAllDogListings);

/**
 * @route   GET /api/dogs/listings/nearby
 * @desc    Get nearby dog listings based on location
 * @access  Public
 */
router.get('/listings/nearby', dogListingController.getNearbyDogListings);

/**
 * @route   GET /api/dogs/listings/:id
 * @desc    Get single dog listing by ID
 * @access  Public
 */
router.get('/listings/:id', dogListingController.getDogListingById);

// Protected routes - authentication required
/**
 * @route   POST /api/dogs/listings
 * @desc    Create a new dog listing
 * @access  Protected
 */
router.post(
  '/listings',
  authMiddleware,
  fileUploadConfig,
  dogValidationRules,
  dogListingController.createDogListing
);

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
