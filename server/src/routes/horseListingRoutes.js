const express = require('express');
const router = express.Router();
const horseListingController = require('../controllers/horseListingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

// Validation rules
const horseValidationRules = [
  body('breedName')
    .trim()
    .notEmpty().withMessage('Breed name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Breed name must be between 2 and 100 characters'),

  body('age')
    .trim()
    .notEmpty().withMessage('Age is required'),

  body('gender')
    .isIn(['male', 'female'])
    .withMessage('Gender must be either male or female'),

  body('purpose')
    .isIn(['riding', 'racing', 'breeding'])
    .withMessage('Purpose must be riding, racing, or breeding'),

  body('healthCondition')
    .isIn(['excellent', 'good', 'average'])
    .withMessage('Invalid health condition'),

  body('expectedPrice')
    .notEmpty().withMessage('Expected price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('isNegotiable')
    .notEmpty().withMessage('Negotiable status is required')
    .isBoolean().withMessage('Negotiable must be true or false'),

  body('deliveryAvailable')
    .notEmpty().withMessage('Delivery availability is required')
    .isBoolean().withMessage('Delivery available must be true or false')
];

// Multer configuration for file uploads
const upload = require('multer')({ storage: require('multer').memoryStorage() });

const fileUploadConfig = upload.fields([
  { name: 'frontPhoto', maxCount: 1 },
  { name: 'sidePhoto', maxCount: 1 },
  { name: 'fullBodyPhoto', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

// Public routes - no authentication required
/**
 * @route   GET /api/horses/listings
 * @desc    Get all horse listings with filters and pagination
 * @access  Public
 */
router.get('/listings', horseListingController.getAllHorseListings);

/**
 * @route   GET /api/horses/listings/nearby
 * @desc    Get nearby horse listings based on location
 * @access  Public
 */
router.get('/listings/nearby', horseListingController.getNearbyHorseListings);

/**
 * @route   GET /api/horses/listings/:id
 * @desc    Get single horse listing by ID
 * @access  Public
 */
router.get('/listings/:id', horseListingController.getHorseListingById);

// Protected routes - authentication required
/**
 * @route   POST /api/horses/listings
 * @desc    Create a new horse listing
 * @access  Protected
 */
router.post(
  '/listings',
  authMiddleware,
  fileUploadConfig,
  horseValidationRules,
  horseListingController.createHorseListing
);

/**
 * @route   GET /api/horses/my-listings
 * @desc    Get user's own horse listings
 * @access  Protected
 */
router.get('/my-listings', authMiddleware, horseListingController.getMyHorseListings);

/**
 * @route   PUT /api/horses/listings/:id
 * @desc    Update horse listing (owner only)
 * @access  Protected
 */
router.put(
  '/listings/:id',
  authMiddleware,
  fileUploadConfig,
  horseListingController.updateHorseListing
);

/**
 * @route   DELETE /api/horses/listings/:id
 * @desc    Delete horse listing (soft delete, owner only)
 * @access  Protected
 */
router.delete('/listings/:id', authMiddleware, horseListingController.deleteHorseListing);

/**
 * @route   PATCH /api/horses/listings/:id/sold
 * @desc    Mark horse listing as sold (owner only)
 * @access  Protected
 */
router.patch('/listings/:id/sold', authMiddleware, horseListingController.markHorseAsSold);

module.exports = router;
