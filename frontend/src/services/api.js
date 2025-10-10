import axios from 'axios';

const API_URL =  import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

export default api;