const jwt = require('jsonwebtoken');
const db = require('../models');
const { getJwtSecret } = require('../config/jwt');
require('dotenv').config();

const vetAuthMiddleware = async (req, res, next) => {
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

    if (decoded.type !== 'veterinarian') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Veterinarian account required.'
      });
    }

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

    console.error('Veterinarian auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = vetAuthMiddleware;
