import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
// For development: Use your computer's IP address with port 5000
// For production: Use your domain name or server IP
const DEV_API_URL = 'http://192.168.119.146:5000'; // Backend server on port 5000
const PROD_API_URL = 'http://192.168.119.146:5000'; // Replace with your production URL/domain

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

// Pregnancy Calendar Service
export const pregnancyService = {
  getRecords: async (status = null, animalType = null) => {
    try {
      const params = {};
      if (status) params.status = status;
      if (animalType) params.animal_type = animalType;
      const response = await api.get('/api/pregnancy/records', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getRecord: async (id) => {
    try {
      const response = await api.get(`/api/pregnancy/records/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createRecord: async (data) => {
    try {
      const response = await api.post('/api/pregnancy/records', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateRecord: async (id, data) => {
    try {
      const response = await api.put(`/api/pregnancy/records/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteRecord: async (id) => {
    try {
      const response = await api.delete(`/api/pregnancy/records/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  markDelivered: async (id, deliveryData) => {
    try {
      const response = await api.patch(`/api/pregnancy/records/${id}/deliver`, deliveryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateStatus: async (id, status, notes = null) => {
    try {
      const response = await api.patch(`/api/pregnancy/records/${id}/status`, { status, notes });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getCalendar: async (month = null, year = null) => {
    try {
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;
      const response = await api.get('/api/pregnancy/calendar', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/api/pregnancy/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getMyAnimals: async () => {
    try {
      const response = await api.get('/api/pregnancy/my-animals');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getDurations: async () => {
    try {
      const response = await api.get('/api/pregnancy/durations');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Animal Listing Service (for creating listings)
export const animalListingService = {
  // Get all animal listings
  getAllListings: async (params = {}) => {
    try {
      const response = await api.get('/api/listings/featured', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

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

// Veterinarian Service
export const veterinarianService = {
  // Registration
  register: async (formData) => {
    try {
      const response = await api.post('/api/veterinarians/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file uploads
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Send OTP for login
  sendOTP: async (phoneNumber) => {
    try {
      const response = await api.post('/api/veterinarians/send-otp', { phone_number: phoneNumber });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Verify OTP
  verifyOTP: async (phoneNumber, otp) => {
    try {
      const response = await api.post('/api/veterinarians/verify-otp', { phone_number: phoneNumber, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Login with email and password
  login: async (credentials) => {
    try {
      const response = await api.post('/api/veterinarians/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/veterinarians/profile/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/veterinarians/profile/me', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get nearby veterinarians (for farmers)
  getNearby: async (latitude, longitude, radius = 50, specialization = null) => {
    try {
      const params = { latitude, longitude, radius };
      if (specialization) params.specialization = specialization;
      const response = await api.get('/api/veterinarians/nearby', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all veterinarians
  getAll: async (page = 1, limit = 10, filters = {}) => {
    try {
      const response = await api.get('/api/veterinarians', {
        params: { page, limit, ...filters }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get veterinarian by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/veterinarians/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// Vet Review Service
export const vetReviewService = {
  // Get reviews for a veterinarian
  getVetReviews: async (veterinarianId, page = 1, limit = 10, sort = 'newest') => {
    try {
      const response = await api.get(`/api/vet-reviews/veterinarian/${veterinarianId}`, {
        params: { page, limit, sort }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create a review
  createReview: async (reviewData) => {
    try {
      const response = await api.post('/api/vet-reviews', reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user's own review for a vet
  getMyReview: async (veterinarianId) => {
    try {
      const response = await api.get(`/api/vet-reviews/my-review/${veterinarianId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update review
  updateReview: async (reviewId, reviewData) => {
    try {
      const response = await api.put(`/api/vet-reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete review
  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/api/vet-reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark review as helpful
  markHelpful: async (reviewId) => {
    try {
      const response = await api.post(`/api/vet-reviews/${reviewId}/helpful`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// Vet Report Service
export const vetReportService = {
  // Create a report
  createReport: async (reportData) => {
    try {
      const response = await api.post('/api/vet-reports', reportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user's reports
  getMyReports: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/api/vet-reports/my-reports', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// Call Log Service
export const callLogService = {
  getCallLogs: async (filter = 'all') => {
    const response = await api.get(`/call-logs?filter=${filter}`);
    return response.data;
  },
  logCall: async (callData) => {
    const response = await api.post('/call-logs', callData);
    return response.data;
  },
  deleteCallLog: async (logId) => {
    const response = await api.delete(`/call-logs/${logId}`);
    return response.data;
  },
};

export default api;
