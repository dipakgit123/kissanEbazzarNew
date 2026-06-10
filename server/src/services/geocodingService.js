const axios = require('axios');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const NEGATIVE_CACHE_TTL_MS = 10 * 60 * 1000;
const RATE_LIMIT_BACKOFF_MS = 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

class GeocodingService {
  constructor() {
    this.cache = new Map();
    this.inFlight = new Map();
    this.nominatimBackoffUntil = 0;
  }

  getCachedValue(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  setCachedValue(key, value, ttlMs = CACHE_TTL_MS) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  async getOrSetCache(key, fetcher, { negativeTtlMs = NEGATIVE_CACHE_TTL_MS } = {}) {
    const cached = this.getCachedValue(key);
    if (cached !== undefined) {
      return cached;
    }

    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    const pending = (async () => {
      try {
        const result = await fetcher();
        this.setCachedValue(
          key,
          result,
          result ? CACHE_TTL_MS : negativeTtlMs
        );
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, pending);
    return pending;
  }

  shouldSkipNominatim() {
    return Date.now() < this.nominatimBackoffUntil;
  }

  applyNominatimBackoff() {
    this.nominatimBackoffUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
  }

  async searchNominatim(params) {
    if (this.shouldSkipNominatim()) {
      return null;
    }

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params,
      headers: {
        'User-Agent': 'KissanEBazzar/1.0'
      },
      timeout: REQUEST_TIMEOUT_MS
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
    const normalizedPostalCode = String(postalCode || '').trim();
    const normalizedCountry = String(country || 'IN').trim().toUpperCase();
    const cacheKey = `postal:${normalizedCountry}:${normalizedPostalCode}`;

    return this.getOrSetCache(cacheKey, async () => {
      try {
        let indiaResult = null;

        if (normalizedCountry === 'IN' && /^\d{6}$/.test(normalizedPostalCode)) {
          indiaResult = await this.getIndianPostalCode(normalizedPostalCode);
        }

        const nominatimResult = await this.getNominatimLocation(
          normalizedPostalCode,
          normalizedCountry,
          indiaResult
        );
        if (nominatimResult) {
          return {
            ...indiaResult,
            ...nominatimResult,
            postal_code: normalizedPostalCode
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
    });
  }

  /**
   * Fetch Indian postal code details using India Post API
   * @param {string} pincode - 6-digit Indian pincode
   */
  async getIndianPostalCode(pincode) {
    const normalizedPincode = String(pincode || '').trim();
    const cacheKey = `india-post:${normalizedPincode}`;

    return this.getOrSetCache(cacheKey, async () => {
    try {
      // Using India Post API
      const response = await axios.get(`https://api.postalpincode.in/pincode/${normalizedPincode}`, {
        timeout: REQUEST_TIMEOUT_MS
      });

      if (response.data && response.data[0] && response.data[0].Status === 'Success') {
        const postOffice = response.data[0].PostOffice[0];

        return {
          latitude: null, // India Post API doesn't provide coordinates
          longitude: null,
          city: postOffice.District || postOffice.Block,
          state: postOffice.State,
          country: 'India',
          postal_code: normalizedPincode,
          address: `${postOffice.Name}, ${postOffice.District}, ${postOffice.State}`,
          location_type: 'manual'
        };
      }

      return null;
    } catch (error) {
      console.error('India Post API error:', error.message);
      return null;
    }
    });
  }

  /**
   * Fetch location using Nominatim (OpenStreetMap) API
   * @param {string} postalCode - Postal code
   * @param {string} country - Country code
   */
  async getNominatimLocation(postalCode, country, indiaResult = null) {
    const cacheKey = `nominatim-postal:${String(country || '').trim().toUpperCase()}:${String(postalCode || '').trim()}`;

    return this.getOrSetCache(cacheKey, async () => {
    try {
      if (this.shouldSkipNominatim()) {
        return null;
      }

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
      if (error.response?.status === 429 || error.code === 'ECONNABORTED') {
        this.applyNominatimBackoff();
      }
      console.error('Nominatim API error:', error.message);
      return null;
    }
    });
  }

  /**
   * Get detailed location from coordinates (reverse geocoding)
   * @param {number} latitude
   * @param {number} longitude
   */
  async getLocationFromCoordinates(latitude, longitude) {
    const cacheKey = `reverse:${Number(latitude).toFixed(6)}:${Number(longitude).toFixed(6)}`;

    return this.getOrSetCache(cacheKey, async () => {
    try {
      if (this.shouldSkipNominatim()) {
        throw new Error('Geocoding temporarily paused due to rate limiting');
      }

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
        timeout: REQUEST_TIMEOUT_MS
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
      if (error.response?.status === 429 || error.code === 'ECONNABORTED') {
        this.applyNominatimBackoff();
      }
      console.error('Reverse geocoding error:', error.message);
      throw new Error(`Failed to fetch location from coordinates: ${error.message}`);
    }
    });
  }

  async getLocationFromPlace({ city, state, country = 'India' }) {
    const normalizedCity = String(city || '').trim().toLowerCase();
    const normalizedState = String(state || '').trim().toLowerCase();
    const normalizedCountry = String(country || 'India').trim().toLowerCase();
    const cacheKey = `place:${normalizedCity}|${normalizedState}|${normalizedCountry}`;

    return this.getOrSetCache(cacheKey, async () => {
      try {
        if (this.shouldSkipNominatim()) {
          return null;
        }

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
        if (error.response?.status === 429 || error.code === 'ECONNABORTED') {
          this.applyNominatimBackoff();
        }
        console.error('Place geocoding error:', error.message);
        return null;
      }
    });
  }
}

module.exports = new GeocodingService();
