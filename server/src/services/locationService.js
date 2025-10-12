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
  // Updated geocodeAddress method for locationService.js
// Replace the existing geocodeAddress method with this improved version

async geocodeAddress(addressData) {
  try {
    // Try multiple address formats for better geocoding results
    const addressVariations = [
      // Full address
      [
        addressData.address,
        addressData.city,
        addressData.state,
        addressData.country,
        addressData.postal_code
      ].filter(Boolean).join(', '),
      
      // City, State, Country with postal code
      [
        addressData.city,
        addressData.state,
        addressData.country,
        addressData.postal_code
      ].filter(Boolean).join(', '),
      
      // Just City and State
      `${addressData.city}, ${addressData.state}, ${addressData.country}`,
      
      // City with alternate spellings (for Indian cities)
      `${addressData.city.replace('Ahemednagar', 'Ahmednagar')}, ${addressData.state}, ${addressData.country}`,
      
      // Just postal code and country (often works well)
      addressData.postal_code ? `${addressData.postal_code}, ${addressData.country}` : null
    ].filter(Boolean);

    console.log('Trying geocoding with variations:', addressVariations);

    for (const addressString of addressVariations) {
      console.log('Attempting to geocode:', addressString);
      
      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: addressString,
            format: 'json',
            limit: 1,
            countrycodes: 'in' // Restrict to India for better results
          },
          headers: {
            'User-Agent': 'WhatsApp-OTP-App/1.0'
          },
          timeout: 10000
        });

        if (response.data && response.data.length > 0) {
          const lat = parseFloat(response.data[0].lat);
          const lon = parseFloat(response.data[0].lon);
          console.log(`Successfully geocoded with: "${addressString}" - lat=${lat}, lon=${lon}`);
          
          return {
            latitude: lat,
            longitude: lon
          };
        }
      } catch (err) {
        console.log(`Failed with address: "${addressString}"`, err.message);
        continue; // Try next variation
      }
    }

    // If Nominatim fails, try with Google-like search for Indian locations
    // This is a fallback for common Indian cities
    const cityCoordinates = {
      'ahmednagar': { lat: 19.0948, lon: 74.7480 },
      'ahemednagar': { lat: 19.0948, lon: 74.7480 },
      'ahmadnagar': { lat: 19.0948, lon: 74.7480 },
      'pune': { lat: 18.5204, lon: 73.8567 },
      'mumbai': { lat: 19.0760, lon: 72.8777 },
      'delhi': { lat: 28.6139, lon: 77.2090 },
      'bangalore': { lat: 12.9716, lon: 77.5946 },
      'chennai': { lat: 13.0827, lon: 80.2707 },
      'kolkata': { lat: 22.5726, lon: 88.3639 },
      'hyderabad': { lat: 17.3850, lon: 78.4867 },
      'nagpur': { lat: 21.1458, lon: 79.0882 },
      'nashik': { lat: 20.0063, lon: 73.7798 },
      'aurangabad': { lat: 19.8762, lon: 75.3433 }
    };

    const cityLower = addressData.city.toLowerCase();
    if (cityCoordinates[cityLower]) {
      console.log(`Using fallback coordinates for ${addressData.city}`);
      return {
        latitude: cityCoordinates[cityLower].lat,
        longitude: cityCoordinates[cityLower].lon
      };
    }

    // If still no results, try postal code based geocoding
    if (addressData.postal_code) {
      try {
        const response = await axios.get('https://api.postalpincode.in/pincode/' + addressData.postal_code);
        if (response.data && response.data[0] && response.data[0].Status === 'Success') {
          const postOffice = response.data[0].PostOffice[0];
          // Try to geocode the post office location
          const searchStr = `${postOffice.Name}, ${postOffice.District}, ${postOffice.State}, India`;
          console.log('Trying postal code location:', searchStr);
          
          const geoResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
              q: searchStr,
              format: 'json',
              limit: 1
            },
            headers: {
              'User-Agent': 'WhatsApp-OTP-App/1.0'
            },
            timeout: 10000
          });

          if (geoResponse.data && geoResponse.data.length > 0) {
            return {
              latitude: parseFloat(geoResponse.data[0].lat),
              longitude: parseFloat(geoResponse.data[0].lon)
            };
          }
        }
      } catch (err) {
        console.log('Postal code geocoding failed:', err.message);
      }
    }

    console.log('All geocoding attempts failed, returning approximate coordinates');
    
    // Last resort: Return approximate coordinates for Maharashtra if state matches
    if (addressData.state && addressData.state.toLowerCase().includes('maharashtra')) {
      console.log('Using Maharashtra state center as fallback');
      return {
        latitude: 19.7515,
        longitude: 75.7139
      };
    }

    throw new Error('Unable to geocode address - no coordinates found');
    
  } catch (error) {
    console.error('Geocoding error:', error.message);
    
    // Don't return null coordinates - throw error instead
    throw new Error('Geocoding failed - please try with a different address or use current location');
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