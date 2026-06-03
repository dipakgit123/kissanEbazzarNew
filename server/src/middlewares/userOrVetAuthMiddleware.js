const jwt = require('jsonwebtoken');
const db = require('../models');
const { getJwtSecret } = require('../config/jwt');
require('dotenv').config();

const userOrVetAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret());

    if (decoded.type === 'veterinarian') {
      const veterinarian = await db.Veterinarian.findByPk(decoded.id);
      if (!veterinarian) {
        return res.status(401).json({
          success: false,
          message: 'Veterinarian not found'
        });
      }

      if (!veterinarian.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Veterinarian account is inactive'
        });
      }

      if (veterinarian.verification_status !== 'verified') {
        const statusMessages = {
          pending: 'Veterinarian account is pending verification',
          rejected: 'Veterinarian account has been rejected',
          suspended: 'Veterinarian account has been suspended'
        };

        return res.status(403).json({
          success: false,
          message: statusMessages[veterinarian.verification_status] || 'Veterinarian account is not allowed to access this resource'
        });
      }

      const vetContext = {
        id: veterinarian.id,
        email: veterinarian.email,
        phone_number: veterinarian.phone_number,
        type: 'veterinarian'
      };

      req.vet = vetContext;
      req.veterinarian = vetContext;
      return next();
    }

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user token'
      });
    }

    const user = await db.User.findByPk(decoded.userId);
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

    if (user.is_blocked) {
      const blockedUntil = user.blocked_until ? new Date(user.blocked_until) : null;
      const isTemporaryBlockActive = blockedUntil && new Date() < blockedUntil;
      const isIndefiniteBlock = !blockedUntil;

      if (isTemporaryBlockActive || isIndefiniteBlock) {
        return res.status(403).json({
          success: false,
          message: isTemporaryBlockActive
            ? `Account is blocked until ${blockedUntil.toISOString()}`
            : 'Account is blocked'
        });
      }

      await user.update({
        is_blocked: false,
        blocked_until: null
      });
    }

    req.user = {
      id: user.id,
      userId: user.id,
      phoneNumber: user.phone_number,
      isVerified: true
    };

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

    console.error('User or veterinarian auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = userOrVetAuthMiddleware;
