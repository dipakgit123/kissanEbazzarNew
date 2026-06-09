const axios = require('axios');

class GeocodingService {
  async searchNominatim(params) {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params,
      headers: {
        'User-Agent': 'KissanEBazzar/1.0'
      },
      timeout: 5000
    });

    if (!response.data || response.data.length === 0) {
      return null;
    }

    const result = response.data[0];
    const address = result.address || {};

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      city: address.city || address.town || address.village || address.county || null,
      state: address.state || null,
      country: address.country || null,
      postal_code: address.postcode || null,
      address: result.display_name || null,
      location_type: 'manual'
    };
  }

  /**
   * Fetch location details from postal code using multiple geocoding APIs
   * @param {string} postalCode - The postal code to lookup
   * @param {string} country - Country code (default: 'IN' for India)
   * @returns {Promise<Object>} Location details
   */
  async getLocationFromPostalCode(postalCode, country = 'IN') {
    try {
      let indiaResult = null;

      // Try India Post API first (for Indian pincodes)
      if (country === 'IN' && /^\d{6}$/.test(postalCode)) {
        indiaResult = await this.getIndianPostalCode(postalCode);
      }

      // Try to resolve usable coordinates with Nominatim.
      const nominatimResult = await this.getNominatimLocation(postalCode, country, indiaResult);
      if (nominatimResult) {
        return {
          ...indiaResult,
          ...nominatimResult,
          postal_code: postalCode
        };
      }

      if (indiaResult) {
        return indiaResult;
      }

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
  async getNominatimLocation(postalCode, country, indiaResult = null) {
    try {
      const queries = [
        {
          postalcode: postalCode,
          country,
          format: 'json',
          addressdetails: 1,
          limit: 1
        }
      ];

      if (indiaResult?.city || indiaResult?.state) {
        queries.push({
          q: [postalCode, indiaResult.city, indiaResult.state, country === 'IN' ? 'India' : country]
            .filter(Boolean)
            .join(', '),
          format: 'json',
          addressdetails: 1,
          limit: 1
        });

        queries.push({
          q: [indiaResult.city, indiaResult.state, country === 'IN' ? 'India' : country]
            .filter(Boolean)
            .join(', '),
          format: 'json',
          addressdetails: 1,
          limit: 1
        });
      }

      for (const params of queries) {
        const result = await this.searchNominatim(params);
        if (result) {
          return {
            ...result,
            city: result.city || indiaResult?.city,
            state: result.state || indiaResult?.state,
            country: result.country || indiaResult?.country,
            postal_code: postalCode,
            address: result.address || indiaResult?.address,
            location_type: 'manual'
          };
        }
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

  async getLocationFromPlace({ city, state, country = 'India' }) {
    try {
      const queries = [
        [city, state, country].filter(Boolean).join(', '),
        [city, country].filter(Boolean).join(', ')
      ].filter(Boolean);

      for (const query of queries) {
        const result = await this.searchNominatim({
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 1
        });

        if (result) {
          return {
            ...result,
            city: result.city || city || null,
            state: result.state || state || null,
            country: result.country || country || null
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Place geocoding error:', error.message);
      return null;
    }
  }
}

module.exports = new GeocodingService();
