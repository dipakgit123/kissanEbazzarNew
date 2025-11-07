const db = require('../models');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

/**
 * Create a new dog listing
 * POST /api/dogs/listings
 * Protected route - requires authentication
 */
exports.createDogListing = async (req, res) => {
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
      dogType,
      breedName,
      age,
      color,
      weight,
      height,
      vaccinationStatus,
      healthCondition,
      trained,
      behavior,
      purpose,
      description,
      expectedPrice,
      isNegotiable,
      detailsConfirmed,
      termsAccepted,
      latitude,
      longitude,
      city,
      state,
      pincode
    } = req.body;

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

    // Create dog listing
    const dogListing = await db.DogListing.create({
      user_id: userId,
      dogType,
      breedName,
      age,
      color,
      weight: parseFloat(weight),
      height: parseFloat(height),
      vaccinationStatus,
      healthCondition,
      trained,
      behavior,
      purpose,
      description,
      expectedPrice: parseFloat(expectedPrice),
      isNegotiable: isNegotiable === 'true' || isNegotiable === true,
      detailsConfirmed: detailsConfirmed === 'true' || detailsConfirmed === true,
      termsAccepted: termsAccepted === 'true' || termsAccepted === true,
      ...photoData,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      city,
      state,
      pincode,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Dog listing created successfully',
      data: dogListing
    });
  } catch (error) {
    console.error('Error creating dog listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dog listing',
      error: error.message
    });
  }
};

/**
 * Get all dog listings (with filters and pagination)
 * GET /api/dogs/listings
 * Public route
 */
exports.getAllDogListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      state,
      minPrice,
      maxPrice,
      dogType,
      purpose,
      behavior,
      healthCondition,
      trained,
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
    if (dogType) where.dogType = dogType;
    if (purpose) where.purpose = purpose;
    if (behavior) where.behavior = behavior;
    if (healthCondition) where.healthCondition = healthCondition;
    if (trained) where.trained = trained;
    if (vaccinationStatus) where.vaccinationStatus = vaccinationStatus;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: listings, count: total } = await db.DogListing.findAndCountAll({
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
    console.error('Error fetching dog listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dog listings',
      error: error.message
    });
  }
};

/**
 * Get single dog listing by ID
 * GET /api/dogs/listings/:id
 * Public route
 */
exports.getDogListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await db.DogListing.findOne({
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
        message: 'Dog listing not found'
      });
    }

    // Increment view count
    await listing.incrementViews();

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Error fetching dog listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dog listing',
      error: error.message
    });
  }
};

/**
 * Get dog listings by location (nearby)
 * GET /api/dogs/listings/nearby
 * Public route
 */
exports.getNearbyDogListings = async (req, res) => {
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
    const listings = await db.DogListing.findAll({
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
    console.error('Error fetching nearby dog listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby dog listings',
      error: error.message
    });
  }
};

/**
 * Get user's own dog listings
 * GET /api/dogs/my-listings
 * Protected route
 */
exports.getMyDogListings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'active' } = req.query;

    const where = { user_id: userId };
    if (status !== 'all') {
      where.status = status;
    }

    const listings = await db.DogListing.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    console.error('Error fetching user dog listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your dog listings',
      error: error.message
    });
  }
};

/**
 * Update dog listing
 * PUT /api/dogs/listings/:id
 * Protected route - only owner can update
 */
exports.updateDogListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.DogListing.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Dog listing not found'
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
            req.files[fieldName][0],
            'image'
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
          req.files.video[0],
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
      message: 'Dog listing updated successfully',
      data: listing
    });
  } catch (error) {
    console.error('Error updating dog listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dog listing',
      error: error.message
    });
  }
};

/**
 * Delete dog listing (soft delete)
 * DELETE /api/dogs/listings/:id
 * Protected route - only owner can delete
 */
exports.deleteDogListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.DogListing.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Dog listing not found'
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
      message: 'Dog listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dog listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete dog listing',
      error: error.message
    });
  }
};

/**
 * Mark dog listing as sold
 * PATCH /api/dogs/listings/:id/sold
 * Protected route - only owner can mark as sold
 */
exports.markDogAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.DogListing.findOne({
      where: { id, status: 'active' }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Dog listing not found'
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
      message: 'Dog listing marked as sold',
      data: listing
    });
  } catch (error) {
    console.error('Error marking dog as sold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark dog as sold',
      error: error.message
    });
  }
};
