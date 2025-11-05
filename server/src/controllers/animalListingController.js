'use strict';

const db = require('../models');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { Op } = require('sequelize');

class AnimalListingController {
  // CREATE - Requires authentication
  async createListing(req, res) {
    try {
      // Get user ID from auth middleware
      const userId = req.user.userId || req.user.id;
      const userIdInt = parseInt(userId);
      
      const {
        breedName, age, milkCapacity, pregnancyStatus,
        hasHorns, healthCondition, expectedPrice, isNegotiable,
        vaccinationDetails, deliveryAvailable, additionalNotes
      } = req.body;

      // Validation
      if (!breedName || !age || !milkCapacity || !pregnancyStatus || !healthCondition || !expectedPrice) {
        return res.status(400).json({
          success: false,
          message: 'Required fields missing: breedName, age, milkCapacity, pregnancyStatus, healthCondition, expectedPrice'
        });
      }

      // Get user's location if available
      let locationData = {};
      if (db.Location) {
        const userLocation = await db.Location.findOne({ 
          where: { user_id: userIdInt } 
        });
        if (userLocation) {
          locationData = {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            city: userLocation.city,
            state: userLocation.state,
            pincode: userLocation.pincode
          };
        }
      }

      // Process uploaded files
      const uploadedFiles = {};
      
      if (req.files) {
        // Upload images
        const imageFields = ['frontPhoto', 'sidePhoto', 'milkScenePhoto'];
        for (const field of imageFields) {
          if (req.files[field] && req.files[field][0]) {
            try {
              const result = await uploadToCloudinary(req.files[field][0], 'image');
              uploadedFiles[field] = result.secure_url;
              uploadedFiles[`${field}PublicId`] = result.public_id;
            } catch (error) {
              console.error(`Error uploading ${field}:`, error);
            }
          }
        }

        // Upload video
        if (req.files.video && req.files.video[0]) {
          try {
            const result = await uploadToCloudinary(req.files.video[0], 'video');
            uploadedFiles.video = result.secure_url;
            uploadedFiles.videoPublicId = result.public_id;
          } catch (error) {
            console.error('Error uploading video:', error);
          }
        }
      }

      // Create listing
      const listing = await db.AnimalListing.create({
        user_id: userIdInt,
        breedName,
        age: parseFloat(age),
        milkCapacity: parseFloat(milkCapacity),
        pregnancyStatus,
        hasHorns: hasHorns === 'true' || hasHorns === true,
        healthCondition,
        expectedPrice: parseFloat(expectedPrice),
        isNegotiable: isNegotiable === 'true' || isNegotiable === true,
        vaccinationDetails,
        deliveryAvailable: deliveryAvailable === 'true' || deliveryAvailable === true,
        additionalNotes,
        ...uploadedFiles,
        ...locationData
      });

      res.status(201).json({
        success: true,
        message: 'Listing created successfully',
        data: listing
      });
    } catch (error) {
      console.error('Create listing error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create listing', 
        error: error.message 
      });
    }
  }

  // GET ALL - No authentication required
  async getAllListings(req, res) {
    try {
      const {
        page = 1, 
        limit = 10, 
        breedName, 
        minPrice, 
        maxPrice,
        pregnancyStatus, 
        healthCondition, 
        city, 
        state, 
        sortBy = 'created_at',
        order = 'DESC'
      } = req.query;

      // Build where clause
      const where = { status: 'active' };

      if (breedName) {
        where.breed_name = { 
          [Op.iLike]: `%${breedName}%` 
        };
      }
      if (pregnancyStatus) {
        where.pregnancy_status = pregnancyStatus;
      }
      if (healthCondition) {
        where.health_condition = healthCondition;
      }
      if (city) {
        where.city = { 
          [Op.iLike]: `%${city}%` 
        };
      }
      if (state) {
        where.state = { 
          [Op.iLike]: `%${state}%` 
        };
      }
      
      // Price range
      if (minPrice || maxPrice) {
        where.expected_price = {};
        if (minPrice) where.expected_price[Op.gte] = parseFloat(minPrice);
        if (maxPrice) where.expected_price[Op.lte] = parseFloat(maxPrice);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const listings = await db.AnimalListing.findAndCountAll({
        where,
        include: [{
          model: db.User,
          as: 'seller',
          attributes: ['id', 'name', 'phone', 'created_at']
        }],
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, order]]
      });

      res.json({
        success: true,
        data: {
          listings: listings.rows,
          totalCount: listings.count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(listings.count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get listings error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch listings', 
        error: error.message 
      });
    }
  }

  // GET SINGLE - No authentication required
  async getSingleListing(req, res) {
    try {
      const { id } = req.params;

      const listing = await db.AnimalListing.findOne({
        where: { id, status: 'active' },
        include: [{
          model: db.User,
          as: 'seller',
          attributes: ['id', 'name', 'phone', 'created_at']
        }]
      });

      if (!listing) {
        return res.status(404).json({ 
          success: false, 
          message: 'Listing not found' 
        });
      }

      // Increment views
      await listing.increment('views');

      res.json({ 
        success: true, 
        data: listing 
      });
    } catch (error) {
      console.error('Get single listing error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch listing', 
        error: error.message 
      });
    }
  }

  // UPDATE - Requires authentication
  async updateListing(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId || req.user.id;
      const userIdInt = parseInt(userId);

      const listing = await db.AnimalListing.findOne({
        where: { 
          id, 
          user_id: userIdInt, 
          status: 'active' 
        }
      });

      if (!listing) {
        return res.status(404).json({ 
          success: false, 
          message: 'Listing not found or unauthorized' 
        });
      }

      // Process updates
      const updates = { ...req.body };
      
      // Convert string booleans
      if (updates.hasHorns !== undefined) {
        updates.hasHorns = updates.hasHorns === 'true' || updates.hasHorns === true;
      }
      if (updates.isNegotiable !== undefined) {
        updates.isNegotiable = updates.isNegotiable === 'true' || updates.isNegotiable === true;
      }
      if (updates.deliveryAvailable !== undefined) {
        updates.deliveryAvailable = updates.deliveryAvailable === 'true' || updates.deliveryAvailable === true;
      }

      // Handle file updates
      if (req.files) {
        const imageFields = ['frontPhoto', 'sidePhoto', 'milkScenePhoto'];
        
        for (const field of imageFields) {
          if (req.files[field] && req.files[field][0]) {
            // Delete old photo from Cloudinary
            const publicIdField = `${field}PublicId`;
            if (listing[publicIdField]) {
              await deleteFromCloudinary(listing[publicIdField]);
            }
            
            // Upload new photo
            const result = await uploadToCloudinary(req.files[field][0], 'image');
            updates[field] = result.secure_url;
            updates[publicIdField] = result.public_id;
          }
        }

        // Handle video update
        if (req.files.video && req.files.video[0]) {
          // Delete old video
          if (listing.videoPublicId) {
            await deleteFromCloudinary(listing.videoPublicId, 'video');
          }
          
          // Upload new video
          const result = await uploadToCloudinary(req.files.video[0], 'video');
          updates.video = result.secure_url;
          updates.videoPublicId = result.public_id;
        }
      }

      await listing.update(updates);

      res.json({ 
        success: true, 
        message: 'Listing updated successfully', 
        data: listing 
      });
    } catch (error) {
      console.error('Update listing error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update listing', 
        error: error.message 
      });
    }
  }

  // DELETE - Requires authentication
  async deleteListing(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId || req.user.id;
      const userIdInt = parseInt(userId);

      const listing = await db.AnimalListing.findOne({
        where: { 
          id, 
          user_id: userIdInt 
        }
      });

      if (!listing) {
        return res.status(404).json({ 
          success: false, 
          message: 'Listing not found or unauthorized' 
        });
      }

      // Soft delete - just change status
      await listing.update({ status: 'deleted' });

      res.json({ 
        success: true, 
        message: 'Listing deleted successfully' 
      });
    } catch (error) {
      console.error('Delete listing error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete listing', 
        error: error.message 
      });
    }
  }

  // GET USER'S LISTINGS - Requires authentication
  async getUserListings(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const userIdInt = parseInt(userId);
      const { status = 'all', page = 1, limit = 10 } = req.query;

      const where = { user_id: userIdInt };
      
      // Filter by status if specified
      if (status !== 'all') {
        where.status = status;
      } else {
        where.status = { [Op.ne]: 'deleted' };
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const listings = await db.AnimalListing.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']]
      });

      res.json({ 
        success: true, 
        data: {
          listings: listings.rows,
          totalCount: listings.count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(listings.count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get user listings error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch user listings', 
        error: error.message 
      });
    }
  }

  // MARK AS SOLD - Requires authentication
  async markAsSold(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId || req.user.id;
      const userIdInt = parseInt(userId);

      const listing = await db.AnimalListing.findOne({
        where: { 
          id, 
          user_id: userIdInt, 
          status: 'active' 
        }
      });

      if (!listing) {
        return res.status(404).json({ 
          success: false, 
          message: 'Listing not found or unauthorized' 
        });
      }

      await listing.update({ status: 'sold' });

      res.json({ 
        success: true, 
        message: 'Listing marked as sold', 
        data: listing 
      });
    } catch (error) {
      console.error('Mark as sold error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to mark listing as sold', 
        error: error.message 
      });
    }
  }

  // GET NEARBY LISTINGS - No authentication required
  async getNearbyListings(req, res) {
    try {
      const { latitude, longitude, radius = 50 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      // Use Haversine formula for distance calculation
      const listings = await db.sequelize.query(`
        SELECT *, 
        (6371 * acos(cos(radians(:lat)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(:lng)) + 
        sin(radians(:lat)) * sin(radians(latitude)))) AS distance 
        FROM animal_listings 
        WHERE status = 'active' 
        HAVING distance < :radius 
        ORDER BY distance 
        LIMIT 20;
      `, {
        replacements: { 
          lat: parseFloat(latitude), 
          lng: parseFloat(longitude), 
          radius: parseFloat(radius) 
        },
        type: db.sequelize.QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: listings
      });
    } catch (error) {
      console.error('Get nearby listings error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch nearby listings', 
        error: error.message 
      });
    }
  }

  // GET STATISTICS - Requires authentication (optional)
  async getUserStatistics(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const userIdInt = parseInt(userId);

      const stats = await db.AnimalListing.findAll({
        where: { user_id: userIdInt },
        attributes: [
          'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('status')), 'count'],
          [db.sequelize.fn('SUM', db.sequelize.col('views')), 'totalViews']
        ],
        group: ['status']
      });

      const totalListings = await db.AnimalListing.count({
        where: { user_id: userIdInt }
      });

      res.json({
        success: true,
        data: {
          totalListings,
          statistics: stats
        }
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch statistics', 
        error: error.message 
      });
    }
  }
}

module.exports = new AnimalListingController();