// src/services/locationService.js - COMPLETE VERSION

const db = require('../models');
const axios = require('axios');
require('dotenv').config();

class LocationService {
  constructor() {
    this.geocodingApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GEOCODING_API_KEY;
  }

  /**
   * Set user location from current coordinates (one-time)
   */
  async setLocationFromCoordinates(userId, latitude, longitude) {
    const { User, sequelize } = db;
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(userId, { transaction });
      
      if (!user) {
        throw new Error('User not found');
      }

      // Check if location is already set
      if (user.hasLocation() && user.location_set_at) {
        await transaction.rollback();
        throw new Error('Location already set. Use update endpoint to change location.');
      }

      // Try to reverse geocode to get address details
      let addressDetails = {
        formatted_address: null,
        city: null,
        state: null,
        country: null,
        postal_code: null
      };

      try {
        addressDetails = await this.reverseGeocode(latitude, longitude);
      } catch (error) {
        console.log('Reverse geocoding failed, continuing with coordinates only');
      }

      // Set user location (one-time)
      await user.update({
        latitude,
        longitude,
        address: addressDetails.formatted_address,
        city: addressDetails.city,
        state: addressDetails.state,
        country: addressDetails.country,
        postal_code: addressDetails.postal_code,
        location_type: 'current',
        location_set_at: new Date()
      }, { transaction });

      await transaction.commit();

      return {
        success: true,
        message: 'Location set successfully',
        location: {
          latitude,
          longitude,
          address: addressDetails.formatted_address,
          city: addressDetails.city,
          state: addressDetails.state,
          country: addressDetails.country,
          postal_code: addressDetails.postal_code
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Set user location from manual address (one-time)
   */
  async setLocationFromAddress(userId, addressData) {
    const { User, sequelize } = db;
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(userId, { transaction });
      
      if (!user) {
        throw new Error('User not found');
      }

      // Check if location is already set
      if (user.hasLocation() && user.location_set_at) {
        await transaction.rollback();
        throw new Error('Location already set. Use update endpoint to change location.');
      }

      // Try to geocode the address to get coordinates
      let coordinates = { latitude: null, longitude: null };
      
      try {
        coordinates = await this.geocodeAddress(addressData);
      } catch (error) {
        console.log('Geocoding failed, storing address without coordinates');
      }

      // Set user location (one-time)
      await user.update({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        address: addressData.address || `${addressData.city}, ${addressData.state || addressData.country}`,
        city: addressData.city,
        state: addressData.state,
        country: addressData.country,
        postal_code: addressData.postal_code,
        location_type: 'manual',
        location_set_at: new Date()
      }, { transaction });

      await transaction.commit();

      return {
        success: true,
        message: 'Location set successfully',
        location: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          ...addressData
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update existing user location
   */
  async updateUserLocation(userId, locationType, locationData) {
    const { User, sequelize } = db;
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(userId, { transaction });
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.hasLocation()) {
        await transaction.rollback();
        throw new Error('No existing location to update. Please set location first.');
      }

      let updateData = {
        location_type: locationType,
        location_set_at: new Date()
      };

      if (locationType === 'current') {
        // Update from coordinates
        const { latitude, longitude } = locationData;
        
        let addressDetails = {
          formatted_address: null,
          city: null,
          state: null,
          country: null,
          postal_code: null
        };

        try {
          addressDetails = await this.reverseGeocode(latitude, longitude);
        } catch (error) {
          console.log('Reverse geocoding failed');
        }
        
        updateData = {
          ...updateData,
          latitude,
          longitude,
          address: addressDetails.formatted_address,
          city: addressDetails.city,
          state: addressDetails.state,
          country: addressDetails.country,
          postal_code: addressDetails.postal_code
        };
      } else {
        // Update from address
        let coordinates = { latitude: null, longitude: null };
        
        try {
          coordinates = await this.geocodeAddress(locationData);
        } catch (error) {
          console.log('Geocoding failed');
        }
        
        updateData = {
          ...updateData,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          address: locationData.address || `${locationData.city}, ${locationData.state || locationData.country}`,
          city: locationData.city,
          state: locationData.state,
          country: locationData.country,
          postal_code: locationData.postal_code
        };
      }

      await user.update(updateData, { transaction });
      await transaction.commit();

      return {
        success: true,
        message: 'Location updated successfully',
        location: {
          latitude: updateData.latitude,
          longitude: updateData.longitude,
          address: updateData.address,
          city: updateData.city,
          state: updateData.state,
          country: updateData.country,
          postal_code: updateData.postal_code
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to get address (using free service)
   */
  async reverseGeocode(latitude, longitude) {
    try {
      // Use Nominatim (OpenStreetMap) - free service
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json'
        },
        headers: {
          'User-Agent': 'WhatsApp-OTP-App/1.0'
        }
      });

      if (response.data) {
        return {
          formatted_address: response.data.display_name,
          city: response.data.address?.city || 
                response.data.address?.town || 
                response.data.address?.village ||
                response.data.address?.municipality,
          state: response.data.address?.state || response.data.address?.province,
          country: response.data.address?.country,
          postal_code: response.data.address?.postcode
        };
      }

      throw new Error('No data received from geocoding service');
    } catch (error) {
      console.error('Reverse geocoding error:', error.message);
      // Return empty details on error
      return {
        formatted_address: null,
        city: null,
        state: null,
        country: null,
        postal_code: null
      };
    }
  }

  /**
   * Geocode address to get coordinates (using free service)
   */
  async geocodeAddress(addressData) {
    try {
      const addressString = [
        addressData.address,
        addressData.city,
        addressData.state,
        addressData.country,
        addressData.postal_code
      ].filter(Boolean).join(', ');
  
      console.log('Geocoding address:', addressString);
  
      // Use Nominatim (OpenStreetMap) - free service
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: addressString,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'WhatsApp-OTP-App/1.0'
        },
        timeout: 10000 // 10 second timeout
      });
  
      console.log('Geocoding response:', response.data);
  
      if (response.data && response.data.length > 0) {
        const lat = parseFloat(response.data[0].lat);
        const lon = parseFloat(response.data[0].lon);
        console.log(`Geocoded coordinates: lat=${lat}, lon=${lon}`);
        
        return {
          latitude: lat,
          longitude: lon
        };
      }
  
      console.log('No geocoding results found for address:', addressString);
      
      // Try with just city and country if full address fails
      if (addressData.address) {
        const simplifiedAddress = `${addressData.city}, ${addressData.country}`;
        console.log('Trying simplified address:', simplifiedAddress);
        
        const retryResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: simplifiedAddress,
            format: 'json',
            limit: 1
          },
          headers: {
            'User-Agent': 'WhatsApp-OTP-App/1.0'
          },
          timeout: 10000
        });
  
        if (retryResponse.data && retryResponse.data.length > 0) {
          const lat = parseFloat(retryResponse.data[0].lat);
          const lon = parseFloat(retryResponse.data[0].lon);
          console.log(`Geocoded with simplified address: lat=${lat}, lon=${lon}`);
          
          return {
            latitude: lat,
            longitude: lon
          };
        }
      }
  
      throw new Error('Unable to geocode address');
    } catch (error) {
      console.error('Geocoding error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      });
      
      // Return null coordinates on error
      return {
        latitude: null,
        longitude: null
      };
    }
  }
  /**
   * Get users within radius
   */
 // Update the getUsersNearby method in your locationService.js

async getUsersNearby(latitude, longitude, radiusKm = 10) {
    const { User } = db;
    
    try {
      // Use the fallback method that works with PostgreSQL
      // Get all users with location
      const users = await User.findAll({
        where: {
          latitude: { [db.Sequelize.Op.ne]: null },
          longitude: { [db.Sequelize.Op.ne]: null }
        },
        attributes: ['id', 'phone_number', 'latitude', 'longitude', 'city', 'state']
      });
  
      const nearbyUsers = [];
      
      for (const user of users) {
        const distance = this.calculateDistance(
          latitude, 
          longitude, 
          parseFloat(user.latitude), 
          parseFloat(user.longitude)
        );
        
        if (distance <= radiusKm) {
          nearbyUsers.push({
            id: user.id,
            phone_number: user.phone_number,
            distance: parseFloat(distance.toFixed(2)),
            city: user.city,
            state: user.state
          });
        }
      }
  
      // Sort by distance
      nearbyUsers.sort((a, b) => a.distance - b.distance);
      
      return nearbyUsers;
    } catch (error) {
      console.error('Get nearby users error:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      return false;
    }
    
    if (lat < -90 || lat > 90) {
      return false;
    }
    
    if (lon < -180 || lon > 180) {
      return false;
    }
    
    return true;
  }

  /**
   * Validate address data
   */
  validateAddressData(addressData) {
    if (!addressData.city || !addressData.country) {
      return {
        isValid: false,
        message: 'City and country are required fields'
      };
    }

    if (addressData.city.length < 2 || addressData.city.length > 100) {
      return {
        isValid: false,
        message: 'City name must be between 2 and 100 characters'
      };
    }

    if (addressData.country.length < 2 || addressData.country.length > 100) {
      return {
        isValid: false,
        message: 'Country name must be between 2 and 100 characters'
      };
    }

    if (addressData.postal_code && !/^[A-Za-z0-9\s-]{3,10}$/.test(addressData.postal_code)) {
      return {
        isValid: false,
        message: 'Invalid postal code format'
      };
    }

    return { isValid: true };
  }
}

// Export instance
module.exports = new LocationService();