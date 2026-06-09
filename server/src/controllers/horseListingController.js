const db = require('../models');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const listingLocationService = require('../services/listingLocationService');

/**
 * Create a new horse listing
 * POST /api/horses/listings
 * Protected route - requires authentication
 */
exports.createHorseListing = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const {
      breedName,
      age,
      gender,
      purpose,
      healthCondition,
      expectedPrice,
      isNegotiable,
      vaccinationDetails,
      deliveryAvailable,
      additionalNotes
    } = req.body;

    // Fetch user's location from the User table
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Use location from user's profile
    const locationData = await listingLocationService.resolveLocationFromUser(user);

    // Upload photos to Cloudinary
    let frontPhotoData = null;
    let sidePhotoData = null;
    let fullBodyPhotoData = null;
    let videoData = null;

    if (req.files) {
      if (req.files.frontPhoto) {
        frontPhotoData = await uploadToCloudinary(
          req.files.frontPhoto[0],
          'listings/horses/images',
          'image'
        );
      }

      if (req.files.sidePhoto) {
        sidePhotoData = await uploadToCloudinary(
          req.files.sidePhoto[0],
          'listings/horses/images',
          'image'
        );
      }

      if (req.files.fullBodyPhoto) {
        fullBodyPhotoData = await uploadToCloudinary(
          req.files.fullBodyPhoto[0],
          'listings/horses/images',
          'image'
        );
      }

      if (req.files.video) {
        videoData = await uploadToCloudinary(
          req.files.video[0],
          'listings/horses/videos',
          'video'
        );
      }
    }

    // Create horse listing
    const horseListing = await db.HorseListing.create({
      user_id: userId,
      breedName,
      age,
      gender,
      purpose,
      healthCondition,
      expectedPrice: parseFloat(expectedPrice),
      isNegotiable: isNegotiable === 'true' || isNegotiable === true,
      frontPhoto: frontPhotoData?.secure_url,
      frontPhotoPublicId: frontPhotoData?.public_id,
      sidePhoto: sidePhotoData?.secure_url,
      sidePhotoPublicId: sidePhotoData?.public_id,
      fullBodyPhoto: fullBodyPhotoData?.secure_url,
      fullBodyPhotoPublicId: fullBodyPhotoData?.public_id,
      video: videoData?.secure_url,
      videoPublicId: videoData?.public_id,
      vaccinationDetails,
      deliveryAvailable: deliveryAvailable === 'true' || deliveryAvailable === true,
      additionalNotes,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      city: locationData.city,
      state: locationData.state,
      pincode: locationData.pincode,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Horse listing created successfully',
      data: horseListing
    });
  } catch (error) {
    console.error('Error creating horse listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create horse listing',
      error: error.message
    });
  }
};

/**
 * Get all horse listings (with filters and pagination)
 * GET /api/horses/listings
 * Public route
 */
exports.getAllHorseListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      state,
      minPrice,
      maxPrice,
      gender,
      purpose,
      healthCondition,
      deliveryAvailable,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    const validSortFields = ['created_at', 'updated_at', 'expectedPrice', 'views'];
    const sanitizedSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sanitizedSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build filter conditions
    const where = { status: 'active' };

    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (state) where.state = { [Op.iLike]: `%${state}%` };
    if (minPrice) where.expectedPrice = { ...where.expectedPrice, [Op.gte]: parseFloat(minPrice) };
    if (maxPrice) where.expectedPrice = { ...where.expectedPrice, [Op.lte]: parseFloat(maxPrice) };
    if (gender) where.gender = gender;
    if (purpose) where.purpose = purpose;
    if (healthCondition) where.healthCondition = healthCondition;
    if (deliveryAvailable !== undefined) where.deliveryAvailable = deliveryAvailable === 'true';

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: listings, count: total } = await db.HorseListing.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sanitizedSortBy, sanitizedSortOrder]],
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['id', 'phone_number', 'city', 'state']
      }]
    });

    res.json({
      success: true,
      data: {
        listings,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching horse listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch horse listings',
      error: error.message
    });
  }
};

/**
 * Get single horse listing by ID
 * GET /api/horses/listings/:id
 * Public route
 */
exports.getHorseListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await db.HorseListing.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } },
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['id', 'phone_number', 'city', 'state']
      }]
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Horse listing not found'
      });
    }

    // Increment view count
    await listing.incrementViews();

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Error fetching horse listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch horse listing',
      error: error.message
    });
  }
};

/**
 * Get horse listings by location (nearby)
 * GET /api/horses/listings/nearby
 * Public route
 */
exports.getNearbyHorseListings = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50, limit = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseFloat(radius);

    // Get all active listings with location
    const listings = await db.HorseListing.findAll({
      where: {
        status: 'active',
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null }
      },
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['id', 'phone_number', 'city', 'state']
      }]
    });

    // Calculate distance and filter
    const nearbyListings = listings
      .map(listing => {
        const distance = listing.getDistanceFrom(lat, lon);
        return { ...listing.toJSON(), distance };
      })
      .filter(listing => listing.distance <= rad)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: nearbyListings
    });
  } catch (error) {
    console.error('Error fetching nearby horse listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby horse listings',
      error: error.message
    });
  }
};

/**
 * Get user's own horse listings
 * GET /api/horses/my-listings
 * Protected route
 */
exports.getMyHorseListings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'active' } = req.query;
    const validStatuses = ['all', 'active', 'sold', 'expired', 'deleted'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing status filter'
      });
    }

    const where = { user_id: userId };
    if (status !== 'all') {
      where.status = status;
    }

    const listings = await db.HorseListing.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    console.error('Error fetching user horse listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your horse listings',
      error: error.message
    });
  }
};

/**
 * Update horse listing
 * PUT /api/horses/listings/:id
 * Protected route - only owner can update
 */
exports.updateHorseListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.HorseListing.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Horse listing not found'
      });
    }

    // Check ownership
    if (!listing.isOwner(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing'
      });
    }

    const updateData = { ...req.body };

    // Handle file uploads if present
    if (req.files) {
      if (req.files.frontPhoto) {
        // Delete old photo
        if (listing.frontPhotoPublicId) {
          await deleteFromCloudinary(listing.frontPhotoPublicId);
        }
        // Upload new photo
        const photoData = await uploadToCloudinary(
          req.files.frontPhoto[0],
          'listings/horses/images',
          'image'
        );
        updateData.frontPhoto = photoData.secure_url;
        updateData.frontPhotoPublicId = photoData.public_id;
      }

      if (req.files.sidePhoto) {
        if (listing.sidePhotoPublicId) {
          await deleteFromCloudinary(listing.sidePhotoPublicId);
        }
        const photoData = await uploadToCloudinary(
          req.files.sidePhoto[0],
          'listings/horses/images',
          'image'
        );
        updateData.sidePhoto = photoData.secure_url;
        updateData.sidePhotoPublicId = photoData.public_id;
      }

      if (req.files.fullBodyPhoto) {
        if (listing.fullBodyPhotoPublicId) {
          await deleteFromCloudinary(listing.fullBodyPhotoPublicId);
        }
        const photoData = await uploadToCloudinary(
          req.files.fullBodyPhoto[0],
          'listings/horses/images',
          'image'
        );
        updateData.fullBodyPhoto = photoData.secure_url;
        updateData.fullBodyPhotoPublicId = photoData.public_id;
      }

      if (req.files.video) {
        if (listing.videoPublicId) {
          await deleteFromCloudinary(listing.videoPublicId);
        }
        const videoData = await uploadToCloudinary(
          req.files.video[0],
          'listings/horses/videos',
          'video'
        );
        updateData.video = videoData.secure_url;
        updateData.videoPublicId = videoData.public_id;
      }
    }

    // Update listing
    await listing.update(updateData);

    res.json({
      success: true,
      message: 'Horse listing updated successfully',
      data: listing
    });
  } catch (error) {
    console.error('Error updating horse listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update horse listing',
      error: error.message
    });
  }
};

/**
 * Delete horse listing (soft delete)
 * DELETE /api/horses/listings/:id
 * Protected route - only owner can delete
 */
exports.deleteHorseListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.HorseListing.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Horse listing not found'
      });
    }

    // Check ownership
    if (!listing.isOwner(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this listing'
      });
    }

    // Soft delete
    await listing.update({ status: 'deleted' });

    res.json({
      success: true,
      message: 'Horse listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting horse listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete horse listing',
      error: error.message
    });
  }
};

/**
 * Mark horse listing as sold
 * PATCH /api/horses/listings/:id/sold
 * Protected route - only owner can mark as sold
 */
exports.markHorseAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.HorseListing.findOne({
      where: { id, status: 'active' }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Horse listing not found'
      });
    }

    // Check ownership
    if (!listing.isOwner(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing'
      });
    }

    await listing.markAsSold();

    res.json({
      success: true,
      message: 'Horse listing marked as sold',
      data: listing
    });
  } catch (error) {
    console.error('Error marking horse as sold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark horse as sold',
      error: error.message
    });
  }
};
