const express = require('express');
const router = express.Router();
const otherAnimalListingController = require('../controllers/otherAnimalListingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

// Validation rules
const otherAnimalValidationRules = [
  body('animalType')
    .trim()
    .notEmpty().withMessage('Animal type is required')
    .isIn(['sheep', 'pig', 'rabbit', 'chicken', 'duck', 'turkey', 'camel', 'donkey', 'mule', 'exotic', 'other'])
    .withMessage('Invalid animal type'),

  body('breedName')
    .trim()
    .notEmpty().withMessage('Breed/Type name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Breed name must be between 2 and 100 characters'),

  body('age')
    .trim()
    .notEmpty().withMessage('Age is required'),

  body('gender')
    .isIn(['male', 'female'])
    .withMessage('Invalid gender'),

  body('healthCondition')
    .isIn(['excellent', 'good', 'average'])
    .withMessage('Invalid health condition'),

  body('temperament')
    .isIn(['friendly', 'calm', 'energetic', 'protective', 'independent'])
    .withMessage('Invalid temperament'),

  body('expectedPrice')
    .notEmpty().withMessage('Expected price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('isNegotiable')
    .custom(value => {
      return value === true || value === false || value === 'true' || value === 'false';
    })
    .withMessage('Negotiable must be true or false'),

  body('isTrainedForWork')
    .custom(value => {
      return value === true || value === false || value === 'true' || value === 'false';
    })
    .withMessage('Training status must be true or false')
];

// Multer configuration for file uploads
const upload = require('multer')({ storage: require('multer').memoryStorage() });

const fileUploadConfig = upload.fields([
  { name: 'frontPhoto', maxCount: 1 },
  { name: 'sidePhoto', maxCount: 1 },
  { name: 'additionalPhoto', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

// Protected routes - authentication required (POST routes should come before parameterized routes)
/**
 * @route   POST /api/other-animals/listings
 * @desc    Create a new other animal listing
 * @access  Protected
 */
router.post(
  '/listings',
  authMiddleware,
  fileUploadConfig,
  otherAnimalValidationRules,
  otherAnimalListingController.createOtherAnimalListing
);

// Public routes - no authentication required
/**
 * @route   GET /api/other-animals/listings/nearby
 * @desc    Get nearby other animal listings based on location
 * @access  Public
 */
router.get('/listings/nearby', otherAnimalListingController.getNearbyOtherAnimalListings);

/**
 * @route   GET /api/other-animals/listings
 * @desc    Get all other animal listings with filters and pagination
 * @access  Public
 */
router.get('/listings', otherAnimalListingController.getAllOtherAnimalListings);

/**
 * @route   GET /api/other-animals/listings/:id
 * @desc    Get single other animal listing by ID
 * @access  Public
 */
router.get('/listings/:id', otherAnimalListingController.getOtherAnimalListingById);

/**
 * @route   GET /api/other-animals/my-listings
 * @desc    Get user's own other animal listings
 * @access  Protected
 */
router.get('/my-listings', authMiddleware, otherAnimalListingController.getMyOtherAnimalListings);

/**
 * @route   PUT /api/other-animals/listings/:id
 * @desc    Update other animal listing (owner only)
 * @access  Protected
 */
router.put(
  '/listings/:id',
  authMiddleware,
  fileUploadConfig,
  otherAnimalListingController.updateOtherAnimalListing
);

/**
 * @route   DELETE /api/other-animals/listings/:id
 * @desc    Delete other animal listing (soft delete, owner only)
 * @access  Protected
 */
router.delete('/listings/:id', authMiddleware, otherAnimalListingController.deleteOtherAnimalListing);

/**
 * @route   PATCH /api/other-animals/listings/:id/sold
 * @desc    Mark other animal listing as sold (owner only)
 * @access  Protected
 */
router.patch('/listings/:id/sold', authMiddleware, otherAnimalListingController.markOtherAnimalAsSold);

module.exports = router;
