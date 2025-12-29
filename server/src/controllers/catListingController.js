const db = require('../models');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

/**
 * Create a new cat listing
 * POST /api/cats/listings
 * Protected route - requires authentication
 */
exports.createCatListing = async (req, res) => {
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
      catType,
      breedName,
      age,
      color,
      weight,
      eyeColor,
      furType,
      vaccinationStatus,
      healthCondition,
      behavior,
      description,
      expectedPrice,
      isNegotiable,
      detailsConfirmed,
      termsAccepted
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

    // Upload photos to Cloudinary (up to 5 photos)
    const photoData = {};

    if (req.files) {
      for (let i = 1; i <= 5; i++) {
        const fieldName = `photo${i}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          try {
            const result = await uploadToCloudinary(
              req.files[fieldName][0],
              'image'
            );
            photoData[fieldName] = result.secure_url;
            photoData[`${fieldName}PublicId`] = result.public_id;
          } catch (error) {
            console.error(`Error uploading ${fieldName}:`, error);
          }
        }
      }

      // Upload video
      if (req.files.video && req.files.video[0]) {
        try {
          const result = await uploadToCloudinary(
            req.files.video[0],
            'video'
          );
          photoData.video = result.secure_url;
          photoData.videoPublicId = result.public_id;
        } catch (error) {
          console.error('Error uploading video:', error);
        }
      }
    }

    // Create cat listing
    const catListing = await db.CatListing.create({
      user_id: userId,
      catType,
      breedName,
      age,
      color,
      weight: parseFloat(weight),
      eyeColor,
      furType,
      vaccinationStatus,
      healthCondition,
      behavior,
      description,
      expectedPrice: parseFloat(expectedPrice),
      isNegotiable: isNegotiable === 'true' || isNegotiable === true,
      detailsConfirmed: detailsConfirmed === 'true' || detailsConfirmed === true,
      termsAccepted: termsAccepted === 'true' || termsAccepted === true,
      ...photoData,
      latitude,
      longitude,
      city,
      state,
      pincode,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Cat listing created successfully',
      data: catListing
    });
  } catch (error) {
    console.error('Error creating cat listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create cat listing',
      error: error.message
    });
  }
};

/**
 * Get all cat listings (with filters and pagination)
 * GET /api/cats/listings
 * Public route
 */
exports.getAllCatListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      state,
      minPrice,
      maxPrice,
      catType,
      behavior,
      healthCondition,
      furType,
      vaccinationStatus,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    // Build filter conditions
    const where = { status: 'active' };

    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (state) where.state = { [Op.iLike]: `%${state}%` };
    if (minPrice) where.expectedPrice = { ...where.expectedPrice, [Op.gte]: parseFloat(minPrice) };
    if (maxPrice) where.expectedPrice = { ...where.expectedPrice, [Op.lte]: parseFloat(maxPrice) };
    if (catType) where.catType = catType;
    if (behavior) where.behavior = behavior;
    if (healthCondition) where.healthCondition = healthCondition;
    if (furType) where.furType = furType;
    if (vaccinationStatus) where.vaccinationStatus = vaccinationStatus;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: listings, count: total } = await db.CatListing.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
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
    console.error('Error fetching cat listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cat listings',
      error: error.message
    });
  }
};

/**
 * Get single cat listing by ID
 * GET /api/cats/listings/:id
 * Public route
 */
exports.getCatListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await db.CatListing.findOne({
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
        message: 'Cat listing not found'
      });
    }

    // Increment view count
    await listing.incrementViews();

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Error fetching cat listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cat listing',
      error: error.message
    });
  }
};

/**
 * Get cat listings by location (nearby)
 * GET /api/cats/listings/nearby
 * Public route
 */
exports.getNearbyCatListings = async (req, res) => {
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
    const listings = await db.CatListing.findAll({
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
    console.error('Error fetching nearby cat listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby cat listings',
      error: error.message
    });
  }
};

/**
 * Get user's own cat listings
 * GET /api/cats/my-listings
 * Protected route
 */
exports.getMyCatListings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'active' } = req.query;

    const where = { user_id: userId };
    if (status !== 'all') {
      where.status = status;
    }

    const listings = await db.CatListing.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    console.error('Error fetching user cat listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your cat listings',
      error: error.message
    });
  }
};

/**
 * Update cat listing
 * PUT /api/cats/listings/:id
 * Protected route - only owner can update
 */
exports.updateCatListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.CatListing.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Cat listing not found'
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
      // Handle photos (up to 5)
      for (let i = 1; i <= 5; i++) {
        const fieldName = `photo${i}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          // Delete old photo
          const publicIdField = `${fieldName}PublicId`;
          if (listing[publicIdField]) {
            await deleteFromCloudinary(listing[publicIdField]);
          }

          // Upload new photo
          const result = await uploadToCloudinary(
            req.files[fieldName][0].buffer,
            'cat-listings/images'
          );
          updateData[fieldName] = result.secure_url;
          updateData[publicIdField] = result.public_id;
        }
      }

      // Handle video update
      if (req.files.video && req.files.video[0]) {
        // Delete old video
        if (listing.videoPublicId) {
          await deleteFromCloudinary(listing.videoPublicId);
        }

        // Upload new video
        const result = await uploadToCloudinary(
          req.files.video[0].buffer,
          'cat-listings/videos',
          'video'
        );
        updateData.video = result.secure_url;
        updateData.videoPublicId = result.public_id;
      }
    }

    // Update listing
    await listing.update(updateData);

    res.json({
      success: true,
      message: 'Cat listing updated successfully',
      data: listing
    });
  } catch (error) {
    console.error('Error updating cat listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cat listing',
      error: error.message
    });
  }
};

/**
 * Delete cat listing (soft delete)
 * DELETE /api/cats/listings/:id
 * Protected route - only owner can delete
 */
exports.deleteCatListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.CatListing.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Cat listing not found'
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
      message: 'Cat listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cat listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cat listing',
      error: error.message
    });
  }
};

/**
 * Mark cat listing as sold
 * PATCH /api/cats/listings/:id/sold
 * Protected route - only owner can mark as sold
 */
exports.markCatAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.CatListing.findOne({
      where: { id, status: 'active' }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Cat listing not found'
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
      message: 'Cat listing marked as sold',
      data: listing
    });
  } catch (error) {
    console.error('Error marking cat as sold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark cat as sold',
      error: error.message
    });
  }
};
