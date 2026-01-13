const db = require('../models');
const { validationResult } = require('express-validator');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

const OtherAnimalListing = db.OtherAnimalListing;
const User = db.User;

/**
 * Create a new other animal listing
 */
exports.createOtherAnimalListing = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;

    // Prepare listing data
    const listingData = {
      user_id: userId,
      animalType: req.body.animalType,
      breedName: req.body.breedName,
      age: req.body.age,
      gender: req.body.gender || 'male',
      weight: req.body.weight || null,
      color: req.body.color || null,
      healthCondition: req.body.healthCondition || 'good',
      isTrainedForWork: req.body.isTrainedForWork === 'true' || req.body.isTrainedForWork === true,
      specialSkills: req.body.specialSkills || null,
      temperament: req.body.temperament || 'friendly',
      expectedPrice: req.body.expectedPrice,
      isNegotiable: req.body.isNegotiable === 'true' || req.body.isNegotiable === true,
      vaccinationDetails: req.body.vaccinationDetails || null,
      deliveryAvailable: req.body.deliveryAvailable === 'true' || req.body.deliveryAvailable === true,
      additionalNotes: req.body.additionalNotes || null,
      latitude: req.body.latitude || null,
      longitude: req.body.longitude || null,
      city: req.body.city || null,
      state: req.body.state || null,
      pincode: req.body.pincode || null,
      status: 'active',
      views: 0
    };

    // Handle file uploads to Cloudinary
    if (req.files) {
      // Front Photo
      if (req.files.frontPhoto && req.files.frontPhoto[0]) {
        const frontPhotoResult = await uploadToCloudinary(
          req.files.frontPhoto[0].buffer,
          'other-animals/front-photos'
        );
        listingData.frontPhoto = frontPhotoResult.secure_url;
        listingData.frontPhotoPublicId = frontPhotoResult.public_id;
      }

      // Side Photo
      if (req.files.sidePhoto && req.files.sidePhoto[0]) {
        const sidePhotoResult = await uploadToCloudinary(
          req.files.sidePhoto[0].buffer,
          'other-animals/side-photos'
        );
        listingData.sidePhoto = sidePhotoResult.secure_url;
        listingData.sidePhotoPublicId = sidePhotoResult.public_id;
      }

      // Additional Photo
      if (req.files.additionalPhoto && req.files.additionalPhoto[0]) {
        const additionalPhotoResult = await uploadToCloudinary(
          req.files.additionalPhoto[0].buffer,
          'other-animals/additional-photos'
        );
        listingData.additionalPhoto = additionalPhotoResult.secure_url;
        listingData.additionalPhotoPublicId = additionalPhotoResult.public_id;
      }

      // Video
      if (req.files.video && req.files.video[0]) {
        const videoResult = await uploadToCloudinary(
          req.files.video[0].buffer,
          'other-animals/videos',
          'video'
        );
        listingData.video = videoResult.secure_url;
        listingData.videoPublicId = videoResult.public_id;
      }
    }

    // Create listing
    const listing = await OtherAnimalListing.create(listingData);

    // Fetch the listing with seller info
    const listingWithSeller = await OtherAnimalListing.findByPk(listing.id, {
      include: [{
        model: User,
        as: 'seller',
        attributes: ['id', 'full_name', 'phone_number', 'city', 'state']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Other animal listing created successfully',
      data: listingWithSeller
    });

  } catch (error) {
    console.error('Error creating other animal listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create listing',
      error: error.message
    });
  }
};

/**
 * Get all other animal listings with filters and pagination
 */
exports.getAllOtherAnimalListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      animalType,
      minPrice,
      maxPrice,
      city,
      state,
      gender,
      healthCondition,
      temperament,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      animalType,
      minPrice,
      maxPrice,
      city,
      state,
      gender,
      healthCondition,
      temperament
    };

    const listings = await OtherAnimalListing.search(filters);
    const totalCount = await OtherAnimalListing.count({
      where: { status: 'active' }
    });

    res.json({
      success: true,
      data: listings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching other animal listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listings',
      error: error.message
    });
  }
};

/**
 * Get nearby other animal listings based on location
 */
exports.getNearbyOtherAnimalListings = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const listings = await OtherAnimalListing.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius)
    );

    res.json({
      success: true,
      data: listings,
      count: listings.length
    });

  } catch (error) {
    console.error('Error fetching nearby other animal listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby listings',
      error: error.message
    });
  }
};

/**
 * Get single other animal listing by ID
 */
exports.getOtherAnimalListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await OtherAnimalListing.findOne({
      where: { 
        id,
        status: { [db.Sequelize.Op.ne]: 'deleted' }
      },
      include: [{
        model: User,
        as: 'seller',
        attributes: ['id', 'full_name', 'phone_number', 'city', 'state', 'profile_photo']
      }]
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Increment views
    await listing.incrementViews();

    res.json({
      success: true,
      data: listing
    });

  } catch (error) {
    console.error('Error fetching other animal listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listing',
      error: error.message
    });
  }
};

/**
 * Get user's own other animal listings
 */
exports.getMyOtherAnimalListings = async (req, res) => {
  try {
    const userId = req.user.id;

    const listings = await OtherAnimalListing.findByUser(userId);

    res.json({
      success: true,
      data: listings,
      count: listings.length
    });

  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your listings',
      error: error.message
    });
  }
};

/**
 * Update other animal listing (owner only)
 */
exports.updateOtherAnimalListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find listing
    const listing = await OtherAnimalListing.findByPk(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check ownership
    if (listing.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing'
      });
    }

    // Prepare update data
    const updateData = {};
    const allowedFields = [
      'animalType', 'breedName', 'age', 'gender', 'weight', 'color',
      'healthCondition', 'isTrainedForWork', 'specialSkills', 'temperament',
      'expectedPrice', 'isNegotiable', 'vaccinationDetails',
      'deliveryAvailable', 'additionalNotes', 'city', 'state', 'pincode'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle file updates
    if (req.files) {
      // Front Photo
      if (req.files.frontPhoto && req.files.frontPhoto[0]) {
        // Delete old photo from Cloudinary
        if (listing.frontPhotoPublicId) {
          await deleteFromCloudinary(listing.frontPhotoPublicId);
        }
        const frontPhotoResult = await uploadToCloudinary(
          req.files.frontPhoto[0].buffer,
          'other-animals/front-photos'
        );
        updateData.frontPhoto = frontPhotoResult.secure_url;
        updateData.frontPhotoPublicId = frontPhotoResult.public_id;
      }

      // Side Photo
      if (req.files.sidePhoto && req.files.sidePhoto[0]) {
        if (listing.sidePhotoPublicId) {
          await deleteFromCloudinary(listing.sidePhotoPublicId);
        }
        const sidePhotoResult = await uploadToCloudinary(
          req.files.sidePhoto[0].buffer,
          'other-animals/side-photos'
        );
        updateData.sidePhoto = sidePhotoResult.secure_url;
        updateData.sidePhotoPublicId = sidePhotoResult.public_id;
      }

      // Additional Photo
      if (req.files.additionalPhoto && req.files.additionalPhoto[0]) {
        if (listing.additionalPhotoPublicId) {
          await deleteFromCloudinary(listing.additionalPhotoPublicId);
        }
        const additionalPhotoResult = await uploadToCloudinary(
          req.files.additionalPhoto[0].buffer,
          'other-animals/additional-photos'
        );
        updateData.additionalPhoto = additionalPhotoResult.secure_url;
        updateData.additionalPhotoPublicId = additionalPhotoResult.public_id;
      }

      // Video
      if (req.files.video && req.files.video[0]) {
        if (listing.videoPublicId) {
          await deleteFromCloudinary(listing.videoPublicId);
        }
        const videoResult = await uploadToCloudinary(
          req.files.video[0].buffer,
          'other-animals/videos',
          'video'
        );
        updateData.video = videoResult.secure_url;
        updateData.videoPublicId = videoResult.public_id;
      }
    }

    // Update listing
    await listing.update(updateData);

    // Fetch updated listing with seller info
    const updatedListing = await OtherAnimalListing.findByPk(id, {
      include: [{
        model: User,
        as: 'seller',
        attributes: ['id', 'full_name', 'phone_number', 'city', 'state']
      }]
    });

    res.json({
      success: true,
      message: 'Listing updated successfully',
      data: updatedListing
    });

  } catch (error) {
    console.error('Error updating other animal listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update listing',
      error: error.message
    });
  }
};

/**
 * Delete other animal listing (soft delete, owner only)
 */
exports.deleteOtherAnimalListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await OtherAnimalListing.findByPk(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check ownership
    if (listing.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this listing'
      });
    }

    // Soft delete
    await listing.softDelete();

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting other animal listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete listing',
      error: error.message
    });
  }
};

/**
 * Mark other animal listing as sold (owner only)
 */
exports.markOtherAnimalAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await OtherAnimalListing.findByPk(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check ownership
    if (listing.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing'
      });
    }

    // Mark as sold
    await listing.markAsSold();

    res.json({
      success: true,
      message: 'Listing marked as sold',
      data: listing
    });

  } catch (error) {
    console.error('Error marking other animal as sold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark listing as sold',
      error: error.message
    });
  }
};

module.exports = exports;
