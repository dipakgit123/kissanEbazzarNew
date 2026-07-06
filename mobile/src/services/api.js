import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';

const API_PORT = '5000';

const getHostFromUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    if (value.startsWith('exp://') || value.startsWith('exps://')) {
      return value.replace(/^exps?:\/\//, '').split(/[/:?]/)[0] || null;
    }

    return new URL(value).hostname || null;
  } catch (error) {
    return value.replace(/^exps?:\/\//, '').replace(/^https?:\/\//, '').split(/[/:?]/)[0] || null;
  }
};

const getBundledHost = () => {
  const hostCandidates = [
    NativeModules.SourceCode?.scriptURL,
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.manifest2?.extra?.expoClient?.hostUri,
    Constants.linkingUri,
  ];

  for (const candidate of hostCandidates) {
    const host = getHostFromUrl(candidate);
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  return null;
};

const resolveDefaultApiUrl = () => {
  const bundledHost = getBundledHost();

  if (bundledHost) {
    return `http://${bundledHost}:${API_PORT}`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
};

const DEFAULT_API_URL = resolveDefaultApiUrl();
const CONFIGURED_API_URL = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;
const API_URL = (CONFIGURED_API_URL || DEFAULT_API_URL).trim().replace(/\/+$/, '');

// Export API_URL for use in other services
export { API_URL };

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds timeout for large file uploads
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    // Check for both user token and vet token
    let token = await AsyncStorage.getItem('token');
    
    // If no user token, check for vet token
    if (!token) {
      token = await AsyncStorage.getItem('vetToken');
    }
    
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
      // Clear both user and vet tokens on 401
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('vetToken');
      await AsyncStorage.removeItem('veterinarianData');
      DeviceEventEmitter.emit('auth:unauthorized');
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
  },

  markListingAsSold: async (animalType, id) => {
    try {
      const response = await api.patch(`/api/listings/${animalType}/${id}/sold`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getListingInsights: async (animalType, id) => {
    try {
      const response = await api.get(`/api/listings/${animalType}/${id}/insights`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export const listingReportService = {
  createReport: async (reportData) => {
    try {
      const response = await api.post('/api/listing-reports', reportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getMyReports: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/api/listing-reports/my-reports', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export const petMatingService = {
  getProfiles: async (params = {}) => {
    try {
      const response = await api.get('/api/pet-mating', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getProfile: async (id) => {
    try {
      const response = await api.get(`/api/pet-mating/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getMyProfiles: async () => {
    try {
      const response = await api.get('/api/pet-mating/my-profiles');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createProfile: async (formData) => {
    try {
      const response = await api.post('/api/pet-mating', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
        transformRequest: (data) => data,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateProfile: async (id, formData) => {
    try {
      const response = await api.put(`/api/pet-mating/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
        transformRequest: (data) => data,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  markMatched: async (id) => {
    try {
      const response = await api.patch(`/api/pet-mating/${id}/matched`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteProfile: async (id) => {
    try {
      const response = await api.delete(`/api/pet-mating/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  trackContact: async (id) => {
    try {
      const response = await api.post(`/api/pet-mating/${id}/contact`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  reportProfile: async (id, reportData) => {
    try {
      const response = await api.post(`/api/pet-mating/${id}/report`, reportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
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

  getMyListings: async () => {
    try {
      const response = await api.get('/api/listings/my-listings');
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
      // Get file extension from URI
      const fileExtension = photoUri.split('.').pop().toLowerCase();
      const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: mimeType,
        name: `profile_photo.${fileExtension}`,
      });

      const token = await AsyncStorage.getItem('token');
      
      const response = await api.post('/api/auth/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 60000, // 60 seconds for image upload
        transformRequest: (data, headers) => {
          // Don't transform FormData
          return data;
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

// Milk Report Service
export const milkReportService = {
  getCows: async (params = {}) => {
    try {
      const response = await api.get('/api/milk-reports/cows', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createCow: async (data) => {
    try {
      const response = await api.post('/api/milk-reports/cows', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateCow: async (id, data) => {
    try {
      const response = await api.put(`/api/milk-reports/cows/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteCow: async (id) => {
    try {
      const response = await api.delete(`/api/milk-reports/cows/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getReports: async (params = {}) => {
    try {
      const response = await api.get('/api/milk-reports/reports', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createReport: async (data) => {
    try {
      const response = await api.post('/api/milk-reports/reports', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateReport: async (id, data) => {
    try {
      const response = await api.put(`/api/milk-reports/reports/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteReport: async (id) => {
    try {
      const response = await api.delete(`/api/milk-reports/reports/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getStats: async (params = {}) => {
    try {
      const response = await api.get('/api/milk-reports/stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// Government Schemes Service
export const governmentSchemeService = {
  getSchemes: async (params = {}) => {
    try {
      const response = await api.get('/api/government-schemes', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getFeatured: async (limit = 6) => {
    try {
      const response = await api.get('/api/government-schemes/featured', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getBySlug: async (slug, trackView = true) => {
    try {
      const response = await api.get(`/api/government-schemes/${slug}`, {
        params: { trackView },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
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
      const response = await api.post(`/api/${endpoint}/listings`, listingData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file upload
      });
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

  resendOTP: async (phoneNumber) => {
    try {
      const response = await api.post('/api/veterinarians/send-otp', { phone_number: phoneNumber });
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

  // Get dashboard data for veterinarian
  getDashboard: async () => {
    try {
      const response = await api.get('/api/veterinarians/dashboard');
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
  // Get call history (all, made, or received)
  getCallLogs: async (filter = 'all') => {
    try {
      let endpoint = '/api/call-logs/history';
      if (filter === 'received') {
        endpoint = '/api/call-logs/received';
      } else if (filter === 'made') {
        endpoint = '/api/call-logs/made';
      }
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  // Log a new call
  logCall: async (callData) => {
    try {
      const response = await api.post('/api/call-logs', callData);
      DeviceEventEmitter.emit('callHistory:updated');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  // Delete a call log
  deleteCallLog: async (logId) => {
    try {
      const response = await api.delete(`/api/call-logs/${logId}`);
      DeviceEventEmitter.emit('callHistory:updated');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  // Get call statistics
  getCallStats: async () => {
    try {
      const response = await api.get('/api/call-logs/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  // Get calls for a specific listing
  getListingCalls: async (listingType, listingId) => {
    try {
      const response = await api.get(`/api/call-logs/listing/${listingType}/${listingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// Wishlist Service
export const wishlistService = {
  getWishlist: async () => {
    const response = await api.get('/api/wishlist');
    return response.data;
  },
  addToWishlist: async (animalType, animalId) => {
    const response = await api.post('/api/wishlist/add', {
      animal_type: animalType,
      animal_id: animalId,
    });
    return response.data;
  },
  removeFromWishlist: async (animalType, animalId) => {
    const response = await api.post('/api/wishlist/remove', {
      animal_type: animalType,
      animal_id: animalId,
    });
    return response.data;
  },
  checkWishlist: async (animalType, animalId) => {
    const response = await api.get('/api/wishlist/check', {
      params: {
        animal_type: animalType,
        animal_id: animalId,
      },
    });
    return response.data;
  },
  clearWishlist: async () => {
    const response = await api.delete('/api/wishlist/clear');
    return response.data;
  },
};

// Appointment Service
export const appointmentService = {
  // Create new appointment (for users)
  createAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/api/appointments', appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user's appointments
  getMyAppointments: async (filter = 'all') => {
    try {
      const response = await api.get('/api/appointments/my-appointments', {
        params: { filter }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get veterinarian's appointments
  getVetAppointments: async (filter = 'all') => {
    try {
      const response = await api.get('/api/appointments/vet-appointments', {
        params: { filter }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get appointment by ID
  getAppointmentById: async (appointmentId) => {
    try {
      const response = await api.get(`/api/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update appointment status (for vets)
  updateAppointmentStatus: async (appointmentId, status, notes = null) => {
    try {
      const response = await api.patch(`/api/appointments/${appointmentId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cancel appointment (for users)
  cancelAppointment: async (appointmentId) => {
    try {
      const response = await api.patch(`/api/appointments/${appointmentId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reschedule appointment
  rescheduleAppointment: async (appointmentId, newDate, newTime) => {
    try {
      const response = await api.patch(`/api/appointments/${appointmentId}/reschedule`, {
        appointment_date: newDate,
        appointment_time: newTime
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get appointment statistics (for vets)
  getAppointmentStats: async () => {
    try {
      const response = await api.get('/api/appointments/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get available time slots for a vet
  getAvailableSlots: async (vetId, date) => {
    try {
      const response = await api.get(`/api/appointments/available-slots/${vetId}`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default api;
