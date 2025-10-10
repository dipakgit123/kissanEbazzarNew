// src/controllers/locationController.js

const locationService = require('../services/locationService');
const db = require('../models');

class LocationController {
  /**
   * Set location from current coordinates (one-time setup)
   */
  setLocationFromCurrent = async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Validate coordinates
      if (!locationService.validateCoordinates(latitude, longitude)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates provided'
        });
      }

      const result = await locationService.setLocationFromCoordinates(
        userId,
        latitude,
        longitude
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Set location error:', error);
      
      // Handle specific error for already set location
      if (error.message.includes('already set')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          hasLocation: true
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to set location'
      });
    }
  }

  /**
   * Set location from manual address (one-time setup)
   */
  setLocationFromManual = async (req, res) => {
    try {
      const { address, city, state, country, postal_code } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const addressData = {
        address,
        city,
        state,
        country,
        postal_code
      };

      // Validate address data
      const validation = locationService.validateAddressData(addressData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      const result = await locationService.setLocationFromAddress(
        userId,
        addressData
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Set manual location error:', error);
      
      // Handle specific error for already set location
      if (error.message.includes('already set')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          hasLocation: true
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to set location'
      });
    }
  }

  /**
   * Update existing location
   */
  updateLocation = async (req, res) => {
    try {
      const { type, ...locationData } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!['current', 'manual'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location type. Must be "current" or "manual"'
        });
      }

      // Validate based on type
      if (type === 'current') {
        if (!locationService.validateCoordinates(locationData.latitude, locationData.longitude)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid coordinates provided'
          });
        }
      } else {
        const validation = locationService.validateAddressData(locationData);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            message: validation.message
          });
        }
      }

      const result = await locationService.updateUserLocation(
        userId,
        type,
        locationData
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update location'
      });
    }
  }

  /**
   * Get current user location
   */
  getUserLocation = async (req, res) => {
    try {
      const { User } = db;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const user = await User.findByPk(userId, {
        attributes: [
          'latitude', 'longitude', 'address', 'city', 
          'state', 'country', 'postal_code', 'location_type',
          'location_set_at'
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const hasLocation = user.latitude !== null && user.longitude !== null;

      res.status(200).json({
        success: true,
        hasLocation,
        location: hasLocation ? {
          latitude: user.latitude,
          longitude: user.longitude,
          address: user.address,
          city: user.city,
          state: user.state,
          country: user.country,
          postal_code: user.postal_code,
          location_type: user.location_type,
          set_at: user.location_set_at
        } : null
      });
    } catch (error) {
      console.error('Get location error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get location'
      });
    }
  }

  /**
   * Get nearby users
   */
  getNearbyUsers = async (req, res) => {
    try {
      const { radius = 10 } = req.query;
      const userId = req.user?.userId;
      const { User } = db;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get current user's location
      const currentUser = await User.findByPk(userId, {
        attributes: ['latitude', 'longitude']
      });

      if (!currentUser || !currentUser.hasLocation()) {
        return res.status(400).json({
          success: false,
          message: 'Please set your location first to find nearby users'
        });
      }

      const users = await locationService.getUsersNearby(
        parseFloat(currentUser.latitude),
        parseFloat(currentUser.longitude),
        parseFloat(radius)
      );

      // Filter out current user
      const nearbyUsers = users.filter(u => u.id !== userId);

      res.status(200).json({
        success: true,
        count: nearbyUsers.length,
        radius: parseFloat(radius),
        users: nearbyUsers
      });
    } catch (error) {
      console.error('Get nearby users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get nearby users'
      });
    }
  }

  /**
   * Check if user has location set
   */
  checkLocationStatus = async (req, res) => {
    try {
      const { User } = db;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const user = await User.findByPk(userId, {
        attributes: ['latitude', 'longitude', 'location_set_at']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        hasLocation: user.hasLocation(),
        locationSetAt: user.location_set_at
      });
    } catch (error) {
      console.error('Check location status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check location status'
      });
    }
  }
}

module.exports = new LocationController();