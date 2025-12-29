const axios = require('axios');

class GeocodingService {
  /**
   * Fetch location details from postal code using multiple geocoding APIs
   * @param {string} postalCode - The postal code to lookup
   * @param {string} country - Country code (default: 'IN' for India)
   * @returns {Promise<Object>} Location details
   */
  async getLocationFromPostalCode(postalCode, country = 'IN') {
    try {
      // Try India Post API first (for Indian pincodes)
      if (country === 'IN' && /^\d{6}$/.test(postalCode)) {
        const indiaResult = await this.getIndianPostalCode(postalCode);
        if (indiaResult) return indiaResult;
      }

      // Fallback to Nominatim (OpenStreetMap)
      const nominatimResult = await this.getNominatimLocation(postalCode, country);
      if (nominatimResult) return nominatimResult;

      throw new Error('Location not found for the provided postal code');
    } catch (error) {
      console.error('Geocoding error:', error.message);
      throw new Error(`Failed to fetch location: ${error.message}`);
    }
  }

  /**
   * Fetch Indian postal code details using India Post API
   * @param {string} pincode - 6-digit Indian pincode
   */
  async getIndianPostalCode(pincode) {
    try {
      // Using India Post API
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`, {
        timeout: 5000
      });

      if (response.data && response.data[0] && response.data[0].Status === 'Success') {
        const postOffice = response.data[0].PostOffice[0];

        return {
          latitude: null, // India Post API doesn't provide coordinates
          longitude: null,
          city: postOffice.District || postOffice.Block,
          state: postOffice.State,
          country: 'India',
          postal_code: pincode,
          address: `${postOffice.Name}, ${postOffice.District}, ${postOffice.State}`,
          location_type: 'manual'
        };
      }

      return null;
    } catch (error) {
      console.error('India Post API error:', error.message);
      return null;
    }
  }

  /**
   * Fetch location using Nominatim (OpenStreetMap) API
   * @param {string} postalCode - Postal code
   * @param {string} country - Country code
   */
  async getNominatimLocation(postalCode, country) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          postalcode: postalCode,
          country: country,
          format: 'json',
          addressdetails: 1,
          limit: 1
        },
        headers: {
          'User-Agent': 'KissanEBazzar/1.0'
        },
        timeout: 5000
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const address = result.address || {};

        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          city: address.city || address.town || address.village || address.county,
          state: address.state,
          country: address.country,
          postal_code: postalCode,
          address: result.display_name,
          location_type: 'manual'
        };
      }

      return null;
    } catch (error) {
      console.error('Nominatim API error:', error.message);
      return null;
    }
  }

  /**
   * Get detailed location from coordinates (reverse geocoding)
   * @param {number} latitude
   * @param {number} longitude
   */
  async getLocationFromCoordinates(latitude, longitude) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'KissanEBazzar/1.0'
        },
        timeout: 5000
      });

      if (response.data && response.data.address) {
        const address = response.data.address;

        return {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          city: address.city || address.town || address.village || address.county,
          state: address.state,
          country: address.country,
          postal_code: address.postcode,
          address: response.data.display_name,
          location_type: 'current'
        };
      }

      throw new Error('Unable to fetch location details');
    } catch (error) {
      console.error('Reverse geocoding error:', error.message);
      throw new Error(`Failed to fetch location from coordinates: ${error.message}`);
    }
  }
}

module.exports = new GeocodingService();
