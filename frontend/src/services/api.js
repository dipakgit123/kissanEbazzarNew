import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// OTP Services
export const otpService = {
  // Send OTP to phone number
  sendOTP: async (phoneNumber) => {
    try {
      const response = await api.post('/api/auth/send-otp', { phoneNumber });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Verify OTP
  verifyOTP: async (phoneNumber, otp) => {
    try {
      const response = await api.post('/api/auth/verify-otp', { phoneNumber, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Resend OTP
  resendOTP: async (phoneNumber) => {
    try {
      const response = await api.post('/api/auth/resend-otp', { phoneNumber });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// Animal Listing Services
export const animalListingService = {
  // Get all animals by category
  getAnimalsByCategory: async (endpoint, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/${endpoint}/listings${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get nearby animals based on user location
  getNearbyAnimals: async (endpoint, radius = 50, params = {}) => {
    try {
      const queryString = new URLSearchParams({ ...params, radius }).toString();
      const url = `/api/${endpoint}/listings/nearby${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single animal listing
  getAnimalById: async (endpoint, id) => {
    try {
      const response = await api.get(`/api/${endpoint}/listings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search across all animal types
  searchAllAnimals: async (searchQuery) => {
    try {
      const endpoints = ['animals', 'buffalos', 'goats', 'horses', 'dogs', 'cats'];
      const promises = endpoints.map(endpoint =>
        api.get(`/api/${endpoint}/listings?search=${searchQuery}`).catch(() => ({ data: { data: { listings: [] } } }))
      );
      const results = await Promise.all(promises);
      const allListings = results.flatMap(r => r.data?.data?.listings || []);
      return { success: true, data: { listings: allListings } };
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export const locationService = {
  async checkStatus() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/location/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to check location status');
    }
    
    return response.json();
  },

  async setCurrentLocation(latitude, longitude) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/location/set/current`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ latitude, longitude })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to set location');
    }
    
    return response.json();
  },

  async setManualLocation(addressData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/location/set/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(addressData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to set location');
    }
    
    return response.json();
  },

  async updateLocation(type, locationData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/location/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, ...locationData })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update location');
    }
    
    return response.json();
  },

  async getUserLocation() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/location/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get location');
    }
    
    return response.json();
  },

  async getNearbyUsers(radius = 10) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/location/nearby?radius=${radius}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get nearby users');
    }

    return response.json();
  },

  async lookupPincode(postalCode) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/location/lookup/pincode/${encodeURIComponent(postalCode)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to lookup pincode');
    }

    return response.json();
  }
};

// Listings Service - Combined listings from all categories
export const listingsService = {
  // Get nearby listings from all animal categories (sorted by distance)
  getNearbyListings: async (latitude, longitude, radius = 100, limit = 20, options = {}) => {
    try {
      const response = await api.get(`/api/listings/nearby`, {
        params: {
          latitude,
          longitude,
          radius,
          limit,
          ...(options.postalCode ? { postalCode: options.postalCode } : {})
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get featured listings (most recent from all categories)
  getFeaturedListings: async (limit = 20, options = {}) => {
    try {
      const response = await api.get(`/api/listings/featured`, {
        params: {
          limit,
          ...(options.latitude !== undefined && options.latitude !== null ? { latitude: options.latitude } : {}),
          ...(options.longitude !== undefined && options.longitude !== null ? { longitude: options.longitude } : {}),
          ...(options.postalCode ? { postalCode: options.postalCode } : {})
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single listing by animal type and ID
  getListingById: async (animalType, id) => {
    try {
      const response = await api.get(`/api/listings/${animalType}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getListingsByType: async (animalType, limit = 20, options = {}) => {
    try {
      const response = await api.get(`/api/listings/type/${animalType}`, {
        params: {
          limit,
          ...(options.latitude !== undefined && options.latitude !== null ? { latitude: options.latitude } : {}),
          ...(options.longitude !== undefined && options.longitude !== null ? { longitude: options.longitude } : {}),
          ...(options.postalCode ? { postalCode: options.postalCode } : {})
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search listings across all categories
  searchListings: async (query, options = {}) => {
    try {
      const { animalType, minPrice, maxPrice, limit = 50, latitude, longitude, postalCode } = options;
      const response = await api.get(`/api/listings/search`, {
        params: {
          query,
          animalType,
          minPrice,
          maxPrice,
          limit,
          ...(latitude !== undefined && latitude !== null ? { latitude } : {}),
          ...(longitude !== undefined && longitude !== null ? { longitude } : {}),
          ...(postalCode ? { postalCode } : {})
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  // Get user's own listings
  getMyListings: async () => {
    try {
      const response = await api.get('/api/listings/my-listings');
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
  }
};

// Pregnancy Calendar Service
export const pregnancyService = {
  // Get pregnancy durations for all animal types
  getDurations: async () => {
    try {
      const response = await api.get('/api/pregnancy/durations');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user's animals eligible for pregnancy tracking
  getMyAnimals: async () => {
    try {
      const response = await api.get('/api/pregnancy/my-animals');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all pregnancy records
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

  // Get single pregnancy record
  getRecord: async (id) => {
    try {
      const response = await api.get(`/api/pregnancy/records/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create pregnancy record
  createRecord: async (data) => {
    try {
      const response = await api.post('/api/pregnancy/records', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update pregnancy record
  updateRecord: async (id, data) => {
    try {
      const response = await api.put(`/api/pregnancy/records/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete pregnancy record
  deleteRecord: async (id) => {
    try {
      const response = await api.delete(`/api/pregnancy/records/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark as delivered
  markDelivered: async (id, deliveryData) => {
    try {
      const response = await api.patch(`/api/pregnancy/records/${id}/deliver`, deliveryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update status
  updateStatus: async (id, status, notes = null) => {
    try {
      const response = await api.patch(`/api/pregnancy/records/${id}/status`, { status, notes });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get calendar view
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

  // Get statistics
  getStats: async () => {
    try {
      const response = await api.get('/api/pregnancy/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

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

  getReport: async (id) => {
    try {
      const response = await api.get(`/api/milk-reports/reports/${id}`);
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
  }
};

// User Profile Services
export const userService = {
  // Complete user profile (first-time login)
  completeProfile: async (profileData) => {
    try {
      const response = await api.post('/api/auth/complete-profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/auth/update-profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Upload profile photo
  uploadProfilePhoto: async (photoFile) => {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

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

  // Delete profile photo
  deleteProfilePhoto: async () => {
    try {
      const response = await api.delete('/api/auth/delete-photo');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export const contactService = {
  submitInquiry: async (data) => {
    try {
      const response = await api.post('/api/contact', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default api;
