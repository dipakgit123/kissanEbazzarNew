const db = require('../models');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

/**
 * Create a new goat listing
 * POST /api/goats/listings
 * Protected route - requires authentication
 */
exports.createGoatListing = async (req, res) => {
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
      goatType,
      breedName,
      age,
      weight,
      color,
      hornType,
      healthStatus,
      purpose,
      description,
      milkCapacity,
      lastDeliveryDate,
      numberOfKidsDelivered,
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

    // Create goat listing
    const goatListing = await db.GoatListing.create({
      user_id: userId,
      goatType,
      breedName,
      age,
      weight: parseFloat(weight),
      color,
      hornType,
      healthStatus,
      purpose,
      description,
      milkCapacity: milkCapacity ? parseFloat(milkCapacity) : null,
      lastDeliveryDate: lastDeliveryDate || null,
      numberOfKidsDelivered: numberOfKidsDelivered ? parseInt(numberOfKidsDelivered) : null,
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
      message: 'Goat listing created successfully',
      data: goatListing
    });
  } catch (error) {
    console.error('Error creating goat listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create goat listing',
      error: error.message
    });
  }
};

/**
 * Get all goat listings (with filters and pagination)
 * GET /api/goats/listings
 * Public route
 */
exports.getAllGoatListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      state,
      minPrice,
      maxPrice,
      goatType,
      purpose,
      healthStatus,
      hornType,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    // Build filter conditions
    const where = { status: 'active' };

    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (state) where.state = { [Op.iLike]: `%${state}%` };
    if (minPrice) where.expectedPrice = { ...where.expectedPrice, [Op.gte]: parseFloat(minPrice) };
    if (maxPrice) where.expectedPrice = { ...where.expectedPrice, [Op.lte]: parseFloat(maxPrice) };
    if (goatType) where.goatType = goatType;
    if (purpose) where.purpose = purpose;
    if (healthStatus) where.healthStatus = healthStatus;
    if (hornType) where.hornType = hornType;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: listings, count: total } = await db.GoatListing.findAndCountAll({
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
    console.error('Error fetching goat listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch goat listings',
      error: error.message
    });
  }
};

/**
 * Get single goat listing by ID
 * GET /api/goats/listings/:id
 * Public route
 */
exports.getGoatListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await db.GoatListing.findOne({
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
        message: 'Goat listing not found'
      });
    }

    // Increment view count
    await listing.incrementViews();

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Error fetching goat listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch goat listing',
      error: error.message
    });
  }
};

/**
 * Get goat listings by location (nearby)
 * GET /api/goats/listings/nearby
 * Public route
 */
exports.getNearbyGoatListings = async (req, res) => {
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
    const listings = await db.GoatListing.findAll({
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
    console.error('Error fetching nearby goat listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby goat listings',
      error: error.message
    });
  }
};

/**
 * Get user's own goat listings
 * GET /api/goats/my-listings
 * Protected route
 */
exports.getMyGoatListings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'active' } = req.query;

    const where = { user_id: userId };
    if (status !== 'all') {
      where.status = status;
    }

    const listings = await db.GoatListing.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    console.error('Error fetching user goat listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your goat listings',
      error: error.message
    });
  }
};

/**
 * Update goat listing
 * PUT /api/goats/listings/:id
 * Protected route - only owner can update
 */
exports.updateGoatListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.GoatListing.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Goat listing not found'
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
      message: 'Goat listing updated successfully',
      data: listing
    });
  } catch (error) {
    console.error('Error updating goat listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update goat listing',
      error: error.message
    });
  }
};

/**
 * Delete goat listing (soft delete)
 * DELETE /api/goats/listings/:id
 * Protected route - only owner can delete
 */
exports.deleteGoatListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.GoatListing.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Goat listing not found'
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
      message: 'Goat listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting goat listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete goat listing',
      error: error.message
    });
  }
};

/**
 * Mark goat listing as sold
 * PATCH /api/goats/listings/:id/sold
 * Protected route - only owner can mark as sold
 */
exports.markGoatAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await db.GoatListing.findOne({
      where: { id, status: 'active' }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Goat listing not found'
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
      message: 'Goat listing marked as sold',
      data: listing
    });
  } catch (error) {
    console.error('Error marking goat as sold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark goat as sold',
      error: error.message
    });
  }
};
