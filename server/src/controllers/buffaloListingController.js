const db = require('../models');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

/**
 * Create a new buffalo listing
 * POST /api/buffalos/listings
 * Protected route - requires authentication
 */
exports.createBuffaloListing = async (req, res) => {
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
      milkCapacity,
      pregnancyStatus,
      hasHorns,
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
    const latitude = user.latitude ? parseFloat(user.latitude) : null;
    const longitude = user.longitude ? parseFloat(user.longitude) : null;
    const city = user.city;
    const state = user.state;
    const pincode = user.postal_code;

    // Upload photos to Cloudinary
    let frontPhotoData = null;
    let sidePhotoData = null;
    let milkScenePhotoData = null;
    let videoData = null;

    if (req.files) {
      if (req.files.frontPhoto) {
        frontPhotoData = await uploadToCloudinary(
          req.files.frontPhoto[0],
          'listings/buffalos/images',
          'image'
        );
      }

      if (req.files.sidePhoto) {
        sidePhotoData = await uploadToCloudinary(
          req.files.sidePhoto[0],
          'listings/buffalos/images',
          'image'
        );
      }

      if (req.files.milkScenePhoto) {
        milkScenePhotoData = await uploadToCloudinary(
          req.files.milkScenePhoto[0],
          'listings/buffalos/images',
          'image'
        );
      }

      if (req.files.video) {
        videoData = await uploadToCloudinary(
          req.files.video[0],
          'listings/buffalos/videos',
          'video'
        );
      }
    }

    // Create buffalo listing
    const buffaloListing = await db.BuffaloListing.create({
      user_id: userId,
      breedName,
      age,
      milkCapacity: parseFloat(milkCapacity),
      pregnancyStatus,
      hasHorns: hasHorns === 'true' || hasHorns === true,
      healthCondition,
      expectedPrice: parseFloat(expectedPrice),
      isNegotiable: isNegotiable === 'true' || isNegotiable === true,
      frontPhoto: frontPhotoData?.secure_url,
      frontPhotoPublicId: frontPhotoData?.public_id,
      sidePhoto: sidePhotoData?.secure_url,
      sidePhotoPublicId: sidePhotoData?.public_id,
      milkScenePhoto: milkScenePhotoData?.secure_url,
      milkScenePhotoPublicId: milkScenePhotoData?.public_id,
      video: videoData?.secure_url,
      videoPublicId: videoData?.public_id,
      vaccinationDetails,
      deliveryAvailable: deliveryAvailable === 'true' || deliveryAvailable === true,
      additionalNotes,
      latitude,
      longitude,
      city,
      state,
      pincode,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Buffalo listing created successfully',
      data: buffaloListing
    });
  } catch (error) {
    console.error('Error creating buffalo listing:', error);

    // Handle storage configuration errors
    if (error.http_code === 404) {
      return res.status(500).json({
        success: false,
        message: 'Media upload failed - Invalid storage credentials or configuration',
        error: 'Please check AWS S3 configuration'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create buffalo listing',
      error: error.message
    });
  }
};

/**
 * Get all buffalo listings (with filters and pagination)
 * GET /api/buffalos/listings
 * Public route
 */
exports.getAllBuffaloListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      state,
      minPrice,
      maxPrice,
      pregnancyStatus,
      healthCondition,
      hasHorns,
      deliveryAvailable,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    const validPregnancyStatuses = ['pregnant', 'not_pregnant', 'recently_delivered', 'unknown'];
    const validHealthConditions = ['excellent', 'good', 'average'];
    const validSortFields = ['created_at', 'updated_at', 'expectedPrice', 'views'];
    const sanitizedSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sanitizedSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    if (pregnancyStatus && !validPregnancyStatuses.includes(pregnancyStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pregnancy status filter'
      });
    }

    if (healthCondition && !validHealthConditions.includes(healthCondition)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid health condition filter'
      });
    }

    // Build filter conditions
    const where = { status: 'active' };

    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (state) where.state = { [Op.iLike]: `%${state}%` };
    if (minPrice) where.expectedPrice = { ...where.expectedPrice, [Op.gte]: parseFloat(minPrice) };
    if (maxPrice) where.expectedPrice = { ...where.expectedPrice, [Op.lte]: parseFloat(maxPrice) };
    if (pregnancyStatus) where.pregnancyStatus = pregnancyStatus;
    if (healthCondition) where.healthCondition = healthCondition;
    if (hasHorns !== undefined) where.hasHorns = hasHorns === 'true';
    if (deliveryAvailable !== undefined) where.deliveryAvailable = deliveryAvailable === 'true';

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: listings, count: total } = await db.BuffaloListing.findAndCountAll({
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
    console.error('Error fetching buffalo listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buffalo listings',
      error: error.message
    });
  }
};

/**
 * Get single buffalo listing by ID
 * GET /api/buffalos/listings/:id
 * Public route
 */
exports.getBuffaloListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await db.BuffaloListing.findOne({
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
        message: 'Buffalo listing not found'
      });
    }

    // Increment view count
    await listing.incrementViews();

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Error fetching buffalo listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buffalo listing',
      error: error.message
    });
  }
};

/**
 * Get buffalo listings by location (nearby)
 * GET /api/buffalos/listings/nearby
 * Public route
 */
exports.getNearbyBuffaloListings = async (req, res) => {
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
    const listings = await db.BuffaloListing.findAll({
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
    console.error('Error fetching nearby buffalo listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby buffalo listings',
      error: error.message
    });
  }
};

/**
 * Get user's own buffalo listings
 * GET /api/buffalos/my-listings
 * Protected route
 */
exports.getMyBuffaloListings = async (req, res) => {
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

    const listings = await db.BuffaloListing.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    console.error('Error fetching user buffalo listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your buffalo listings',
      error: error.message
    });
  }
};

/**
 * Update buffalo listing
 * PUT /api/buffalos/listings/:id
 * Protected route - only owner can update
 */
exports.updateBuffaloListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.BuffaloListing.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Buffalo listing not found'
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
          'listings/buffalos/images',
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
          'listings/buffalos/images',
          'image'
        );
        updateData.sidePhoto = photoData.secure_url;
        updateData.sidePhotoPublicId = photoData.public_id;
      }

      if (req.files.milkScenePhoto) {
        if (listing.milkScenePhotoPublicId) {
          await deleteFromCloudinary(listing.milkScenePhotoPublicId);
        }
        const photoData = await uploadToCloudinary(
          req.files.milkScenePhoto[0],
          'listings/buffalos/images',
          'image'
        );
        updateData.milkScenePhoto = photoData.secure_url;
        updateData.milkScenePhotoPublicId = photoData.public_id;
      }

      if (req.files.video) {
        if (listing.videoPublicId) {
          await deleteFromCloudinary(listing.videoPublicId, 'video');
        }
        const videoData = await uploadToCloudinary(
          req.files.video[0],
          'listings/buffalos/videos',
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
      message: 'Buffalo listing updated successfully',
      data: listing
    });
  } catch (error) {
    console.error('Error updating buffalo listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update buffalo listing',
      error: error.message
    });
  }
};

/**
 * Delete buffalo listing (soft delete)
 * DELETE /api/buffalos/listings/:id
 * Protected route - only owner can delete
 */
exports.deleteBuffaloListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.BuffaloListing.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Buffalo listing not found'
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

    // Optionally delete media from Cloudinary
    // if (listing.frontPhotoPublicId) await deleteFromCloudinary(listing.frontPhotoPublicId);
    // if (listing.sidePhotoPublicId) await deleteFromCloudinary(listing.sidePhotoPublicId);
    // if (listing.milkScenePhotoPublicId) await deleteFromCloudinary(listing.milkScenePhotoPublicId);
    // if (listing.videoPublicId) await deleteFromCloudinary(listing.videoPublicId);

    res.json({
      success: true,
      message: 'Buffalo listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting buffalo listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete buffalo listing',
      error: error.message
    });
  }
};

/**
 * Mark buffalo listing as sold
 * PATCH /api/buffalos/listings/:id/sold
 * Protected route - only owner can mark as sold
 */
exports.markBuffaloAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.BuffaloListing.findOne({
      where: { id, status: 'active' }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Buffalo listing not found'
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
      message: 'Buffalo listing marked as sold',
      data: listing
    });
  } catch (error) {
    console.error('Error marking buffalo as sold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark buffalo as sold',
      error: error.message
    });
  }
};
