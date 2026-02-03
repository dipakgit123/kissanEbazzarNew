const otpService = require('../services/otpService');
const geocodingService = require('../services/geocodingService');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
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
      const isNewUserFlag = result.user.metadata && result.user.metadata.is_new_user === true;
      const isProfileIncomplete = !result.user.full_name || !result.user.postal_code;
      const isFirstTimeLogin = isNewUserFlag && isProfileIncomplete;

      res.status(200).json({
        success: true,
        message: result.message,
        user: {
          id: result.user.id,
          phone_number: result.user.phone_number,
          full_name: result.user.full_name,
          postal_code: result.user.postal_code,
          city: result.user.city,
          state: result.user.state,
          country: result.user.country,
          latitude: result.user.latitude,
          longitude: result.user.longitude,
          profile_photo: result.user.profile_photo,
          metadata: result.user.metadata,
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

      // Prepare safe user object with all profile fields
      const userResponse = {
        id: user.id,
        phone_number: user.phone_number,
        full_name: user.full_name,
        email: user.email,
        address: user.address,
        postal_code: user.postal_code,
        city: user.city,
        state: user.state,
        country: user.country,
        latitude: user.latitude,
        longitude: user.longitude,
        profile_photo: user.profile_photo,
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
      const existingMetadata = user.metadata || {};
      const updatedMetadata = {
        ...existingMetadata,
        is_new_user: false,
        profile_completed: true,
        profile_completed_at: new Date().toISOString()
      };

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
        location_set_at: new Date(),
        metadata: updatedMetadata
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

  async updateProfile(req, res) {
    try {
      const { User } = db;
      const userId = req.user?.userId; // From JWT middleware
      const { full_name, email, address, postal_code, city, state } = req.body;

      console.log('Update profile request:', { userId, full_name, email, address, postal_code, city, state });

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User ID not found in request'
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

      // Validate inputs
      if (full_name && full_name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters'
        });
      }

      if (email && email.trim()) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
          });
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({ 
          where: { 
            email: email.trim(),
            id: { [require('sequelize').Op.ne]: userId }
          } 
        });
        
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email is already registered to another user'
          });
        }
      }

      if (postal_code && postal_code.trim() && postal_code.trim().length !== 6) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 6-digit pincode'
        });
      }

      // Build update object
      const updateData = {};

      if (full_name !== undefined) {
        updateData.full_name = full_name.trim();
      }

      if (email !== undefined) {
        updateData.email = email.trim() || null;
      }

      if (address !== undefined) {
        updateData.address = address.trim() || null;
      }

      if (city !== undefined) {
        updateData.city = city.trim() || null;
      }

      if (state !== undefined) {
        updateData.state = state.trim() || null;
      }

      // If postal code is being updated, fetch location data
      if (postal_code && postal_code.trim() && postal_code.trim() !== user.postal_code) {
        updateData.postal_code = postal_code.trim();

        try {
          const locationData = await geocodingService.getLocationFromPostalCode(
            postal_code.trim(),
            'IN'
          );
          console.log('Location fetched from postal code:', locationData);

          if (locationData.latitude) updateData.latitude = locationData.latitude;
          if (locationData.longitude) updateData.longitude = locationData.longitude;
          if (locationData.city) updateData.city = locationData.city;
          if (locationData.state) updateData.state = locationData.state;
          if (locationData.country) updateData.country = locationData.country || 'India';
          updateData.location_type = 'manual'; // Use 'manual' instead of 'geocoded'
          updateData.location_set_at = new Date();
        } catch (error) {
          console.error('Geocoding error:', error.message);
          // Continue without location data if geocoding fails
          // Keep the manually entered city and state
          if (postal_code.trim()) {
            updateData.location_type = 'manual';
            updateData.location_set_at = new Date();
          }
        }
      }

      console.log('Update data:', updateData);

      // Update user profile
      if (Object.keys(updateData).length > 0) {
        await user.update(updateData);
      }

      // Reload user to get updated data
      await user.reload();

      console.log('Updated user:', {
        full_name: user.full_name,
        email: user.email,
        address: user.address,
        postal_code: user.postal_code,
        city: user.city,
        state: user.state
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          phone_number: user.phone_number,
          full_name: user.full_name,
          email: user.email,
          address: user.address,
          postal_code: user.postal_code,
          city: user.city,
          state: user.state,
          country: user.country,
          latitude: user.latitude,
          longitude: user.longitude,
          profile_photo: user.profile_photo,
          is_verified: user.is_verified
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  }

  async uploadProfilePhoto(req, res) {
    try {
      const { User } = db;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User ID not found in request'
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No photo file provided'
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

      // Delete old photo from Cloudinary if exists
      if (user.profile_photo_public_id) {
        try {
          await deleteFromCloudinary(user.profile_photo_public_id, 'image');
          console.log('Old profile photo deleted:', user.profile_photo_public_id);
        } catch (error) {
          console.error('Error deleting old profile photo:', error);
        }
      }

      // Upload new photo to Cloudinary
      const result = await uploadToCloudinary(req.file, 'image');
      console.log('Profile photo uploaded:', result.secure_url);

      // Update user with new photo URL
      await user.update({
        profile_photo: result.secure_url,
        profile_photo_public_id: result.public_id
      });

      // Reload user to get complete data
      await user.reload();

      res.status(200).json({
        success: true,
        message: 'Profile photo uploaded successfully',
        user: {
          id: user.id,
          phone_number: user.phone_number,
          full_name: user.full_name,
          email: user.email,
          address: user.address,
          postal_code: user.postal_code,
          city: user.city,
          state: user.state,
          country: user.country,
          latitude: user.latitude,
          longitude: user.longitude,
          profile_photo: user.profile_photo,
          is_verified: user.is_verified
        }
      });
    } catch (error) {
      console.error('Upload profile photo error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload profile photo'
      });
    }
  }

  async deleteProfilePhoto(req, res) {
    try {
      const { User } = db;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User ID not found in request'
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

      // Delete photo from Cloudinary if exists
      if (user.profile_photo_public_id) {
        try {
          await deleteFromCloudinary(user.profile_photo_public_id, 'image');
          console.log('Profile photo deleted:', user.profile_photo_public_id);
        } catch (error) {
          console.error('Error deleting profile photo from Cloudinary:', error);
        }
      }

      // Update user to remove photo
      await user.update({
        profile_photo: null,
        profile_photo_public_id: null
      });

      // Reload user to get complete data
      await user.reload();

      res.status(200).json({
        success: true,
        message: 'Profile photo deleted successfully',
        user: {
          id: user.id,
          phone_number: user.phone_number,
          full_name: user.full_name,
          email: user.email,
          address: user.address,
          postal_code: user.postal_code,
          city: user.city,
          state: user.state,
          country: user.country,
          latitude: user.latitude,
          longitude: user.longitude,
          profile_photo: user.profile_photo,
          is_verified: user.is_verified
        }
      });
    } catch (error) {
      console.error('Delete profile photo error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete profile photo'
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
