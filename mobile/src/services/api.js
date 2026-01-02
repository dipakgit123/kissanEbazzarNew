import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
// For development: Use your computer's IP address with port 80 (Nginx)
// For production: Use your domain name or server IP
const DEV_API_URL = 'http://192.168.119.146'; // Nginx on port 80 (no port needed)
const PROD_API_URL = 'http://192.168.119.146'; // Replace with your production URL/domain

// Set to true for production build
const IS_PRODUCTION = false;

const API_URL = IS_PRODUCTION ? PROD_API_URL : DEV_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// OTP Services
export const otpService = {
  sendOTP: async (phoneNumber) => {
    try {
      const response = await api.post('/api/auth/send-otp', { phoneNumber });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  verifyOTP: async (phoneNumber, otp) => {
    try {
      const response = await api.post('/api/auth/verify-otp', { phoneNumber, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  resendOTP: async (phoneNumber) => {
    try {
      const response = await api.post('/api/auth/resend-otp', { phoneNumber });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// Listings Service
export const listingsService = {
  getNearbyListings: async (latitude, longitude, radius = 100, limit = 20) => {
    try {
      const response = await api.get('/api/listings/nearby', {
        params: { latitude, longitude, radius, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getFeaturedListings: async (limit = 20) => {
    try {
      const response = await api.get('/api/listings/featured', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getListingById: async (animalType, id) => {
    try {
      const response = await api.get(`/api/listings/${animalType}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getListingsByType: async (animalType, limit = 50) => {
    try {
      const response = await api.get(`/api/listings/type/${animalType}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  searchListings: async (query, filters = {}) => {
    try {
      const response = await api.get('/api/listings/search', {
        params: { query, ...filters }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// User Service
export const userService = {
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/auth/update-profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  completeProfile: async (profileData) => {
    try {
      const response = await api.post('/api/auth/complete-profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  uploadProfilePhoto: async (photoUri) => {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'profile_photo.jpg',
      });

      const response = await api.post('/api/auth/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteProfilePhoto: async () => {
    try {
      const response = await api.delete('/api/auth/delete-photo');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Health Check Service
export const healthCheckService = {
  uploadAndAnalyze: async (formData) => {
    try {
      const response = await api.post('/api/health-check/upload-and-analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for AI analysis
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  analyzeWithUrl: async (imageUrl, animalType, options = {}) => {
    try {
      const response = await api.post('/api/health-check/analyze', {
        imageUrl,
        animalType,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getCommonIssues: async (animalType) => {
    try {
      const response = await api.get(`/api/health-check/common-issues/${animalType}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getEmergencySymptoms: async () => {
    try {
      const response = await api.get('/api/health-check/emergency-symptoms');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getVaccinationSchedule: async (animalType) => {
    try {
      const response = await api.get(`/api/health-check/vaccination/${animalType}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getDewormingSchedule: async (animalType) => {
    try {
      const response = await api.get(`/api/health-check/deworming/${animalType}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// Animal Listing Service (for creating listings)
export const animalListingService = {
  createListing: async (endpoint, listingData) => {
    try {
      const response = await api.post(`/api/${endpoint}/listings`, listingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  uploadListingPhotos: async (endpoint, listingId, photos) => {
    try {
      const formData = new FormData();
      photos.forEach((photo, index) => {
        formData.append(`photo${index + 1}`, {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `photo_${index + 1}.jpg`,
        });
      });

      const response = await api.post(`/api/${endpoint}/listings/${listingId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getMyListings: async () => {
    try {
      const response = await api.get('/api/animals/my-listings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default api;
