// src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const db = require('../models');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header required.'
      });
    }

    // Check if header follows Bearer token format
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Use: Bearer <token>'
      });
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_change_this');

    // Check if user exists
    const { User } = db;
    if (User) {
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.is_verified) {
        return res.status(401).json({
          success: false,
          message: 'Phone number not verified'
        });
      }

      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        phoneNumber: decoded.phoneNumber,
        isVerified: decoded.isVerified
      };
    } else {
      // If User model not available, just attach decoded token
      req.user = decoded;
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = authMiddleware;