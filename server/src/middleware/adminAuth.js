'use strict';

const jwt = require('jsonwebtoken');
const models = require('../models');
const { getJwtSecret } = require('../config/jwt');

const buildServerErrorResponse = (message, error) => ({
  success: false,
  message,
  ...(process.env.NODE_ENV === 'development' && error ? { error: error.message } : {})
});

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, getJwtSecret());

    if (!decoded.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Not an admin token.'
      });
    }

    const admin = await models.Admin.findByPk(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.admin = {
      id: admin.id,
      username: admin.username,
      role: admin.role
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

    console.error('Admin auth error:', error);
    res.status(500).json(buildServerErrorResponse('Authentication failed', error));
  }
};

module.exports = adminAuth;
