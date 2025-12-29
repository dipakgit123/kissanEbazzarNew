const otpService = require('../services/otpService');
const geocodingService = require('../services/geocodingService');
const jwt = require('jsonwebtoken');
const db = require('../models');
require('dotenv').config();

class AuthController {
  async sendOTP(req, res) {
    try {
      const { phoneNumber } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent') || 'Unknown';
      
      console.log(`Sending OTP to: ${phoneNumber}`);
      
      const result = await otpService.sendOTP(phoneNumber, ipAddress, userAgent);
      
      res.status(200).json({
        success: true,
        message: result.message,
        expiresIn: result.expiresIn
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send OTP'
      });
    }
  }

  async verifyOTP(req, res) {
    try {
      const { phoneNumber, otp } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent') || 'Unknown';
      
      console.log(`Verifying OTP for: ${phoneNumber}`);
      
      const result = await otpService.verifyOTP(phoneNumber, otp, ipAddress, userAgent);
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: result.user.id, 
          phoneNumber: result.user.phone_number,
          isVerified: true
        },
        process.env.JWT_SECRET || 'default_secret_change_this',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );
  
      // Check if user has location and profile completed
      const hasLocation = result.user.latitude !== null && result.user.longitude !== null;
      const isFirstTimeLogin = !result.user.full_name || !result.user.postal_code;

      res.status(200).json({
        success: true,
        message: result.message,
        user: {
          id: result.user.id,
          phone_number: result.user.phone_number,
          full_name: result.user.full_name,
          is_verified: result.user.is_verified,
          hasLocation: hasLocation,
          isFirstTimeLogin: isFirstTimeLogin
        },
        token,
        requiresProfileCompletion: isFirstTimeLogin,
        requiresLocation: !hasLocation && !isFirstTimeLogin
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to verify OTP'
      });
    }
  }

  async resendOTP(req, res) {
    try {
      const { phoneNumber } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent') || 'Unknown';
      
      console.log(`Resending OTP to: ${phoneNumber}`);
      
      const result = await otpService.resendOTP(phoneNumber, ipAddress, userAgent);
      
      res.status(200).json({
        success: true,
        message: result.message,
        expiresIn: result.expiresIn
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to resend OTP'
      });
    }
  }

  async getUserProfile(req, res) {
    try {
      const { User } = db;
      
      if (!User) {
        return res.status(500).json({
          success: false,
          message: 'User model not available'
        });
      }
      
      const userId = req.user?.userId; // From JWT middleware
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User ID not found in request'
        });
      }
      
      const user = await User.findByPk(userId, {
        attributes: { 
          exclude: ['otp', 'otp_expiry', 'otp_attempts'] 
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prepare safe user object
      const userResponse = {
        id: user.id,
        phone_number: user.phone_number,
        email: user.email,
        is_verified: user.is_verified,
        verified_at: user.verified_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      res.status(200).json({
        success: true,
        user: userResponse
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getUserStats(req, res) {
    try {
      const { phoneNumber } = req.params;
      
      console.log(`Getting stats for: ${phoneNumber}`);
      
      const result = await otpService.getUserStats(phoneNumber);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get user stats'
      });
    }
  }

  async completeProfile(req, res) {
    try {
      const { User } = db;
      const userId = req.user?.userId; // From JWT middleware
      const { full_name, postal_code } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User ID not found in request'
        });
      }

      if (!full_name || full_name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid full name (at least 2 characters)'
        });
      }

      if (!postal_code || postal_code.trim().length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid postal code'
        });
      }

      // Find user
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Fetch location from postal code
      let locationData = {};
      try {
        locationData = await geocodingService.getLocationFromPostalCode(
          postal_code.trim(),
          'IN' // Default to India, can be made dynamic
        );
        console.log('Location fetched from postal code:', locationData);
      } catch (error) {
        console.error('Geocoding error:', error.message);
        // Continue with manual postal code entry if geocoding fails
        locationData = {
          postal_code: postal_code.trim(),
          location_type: 'manual'
        };
      }

      // Update user profile
      await user.update({
        full_name: full_name.trim(),
        postal_code: locationData.postal_code || postal_code.trim(),
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country || 'India',
        address: locationData.address,
        location_type: locationData.location_type || 'manual',
        location_set_at: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Profile completed successfully',
        location: {
          city: user.city,
          state: user.state,
          country: user.country,
          postal_code: user.postal_code,
          hasLocation: user.latitude !== null && user.longitude !== null
        }
      });
    } catch (error) {
      console.error('Complete profile error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to complete profile'
      });
    }
  }

  async checkHealth(req, res) {
    try {
      const { sequelize } = db;

      // Test database connection
      await sequelize.authenticate();

      // Check if models are loaded
      const modelsLoaded = Object.keys(db).filter(key =>
        key !== 'sequelize' && key !== 'Sequelize'
      );

      res.status(200).json({
        success: true,
        status: 'healthy',
        database: 'connected',
        models: modelsLoaded,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new AuthController();