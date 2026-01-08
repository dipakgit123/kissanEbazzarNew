'use strict';

const jwt = require('jsonwebtoken');
const models = require('../models');
const AnalyticsService = require('../services/analyticsService');

const analyticsService = new AnalyticsService(models);

// Admin Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const admin = await models.Admin.findOne({
      where: { username }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isValidPassword = await admin.validatePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update login info
    await admin.updateLoginInfo();

    // Generate token
    const token = jwt.sign(
      { id: admin.id, role: admin.role, isAdmin: true },
      process.env.JWT_SECRET || 'admin-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: admin.toJSON()
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get current admin profile
exports.getProfile = async (req, res) => {
  try {
    const admin = await models.Admin.findByPk(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: admin.toJSON()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
      error: error.message
    });
  }
};

// Get user growth chart data
exports.getUserGrowth = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const data = await analyticsService.getUserGrowth(parseInt(days));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('User growth error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user growth data',
      error: error.message
    });
  }
};

// Get listings growth chart data
exports.getListingsGrowth = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const data = await analyticsService.getListingsGrowth(parseInt(days));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Listings growth error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get listings growth data',
      error: error.message
    });
  }
};

// Get sales data
exports.getSalesData = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const data = await analyticsService.getSalesData(parseInt(days));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Sales data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sales data',
      error: error.message
    });
  }
};

// Get top sellers
exports.getTopSellers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const data = await analyticsService.getTopSellers(parseInt(limit));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Top sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top sellers',
      error: error.message
    });
  }
};

// Get location stats
exports.getLocationStats = async (req, res) => {
  try {
    const data = await analyticsService.getLocationStats();

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Location stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location stats',
      error: error.message
    });
  }
};

// Get recent activity
exports.getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const data = await analyticsService.getRecentActivity(parseInt(limit));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activity',
      error: error.message
    });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', verified, state } = req.query;
    const filters = {};

    if (verified !== undefined) {
      filters.verified = verified === 'true';
    }
    if (state) {
      filters.state = state;
    }

    const data = await analyticsService.getUsers(
      parseInt(page),
      parseInt(limit),
      search,
      filters
    );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
};

// Get all listings
exports.getListings = async (req, res) => {
  try {
    const { page = 1, limit = 20, animalType = 'all', status = 'all', search = '' } = req.query;

    const data = await analyticsService.getListings(
      parseInt(page),
      parseInt(limit),
      animalType,
      status,
      search
    );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get listings',
      error: error.message
    });
  }
};

// Block/Unblock user
exports.toggleUserBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    const { blocked, reason } = req.body;

    const user = await models.User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.is_blocked = blocked;
    if (blocked) {
      user.blocked_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    } else {
      user.blocked_until = null;
    }
    await user.save();

    res.json({
      success: true,
      message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Toggle user block error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

// Delete listing
exports.deleteListing = async (req, res) => {
  try {
    const { animalType, listingId } = req.params;

    const modelMap = {
      cow: models.AnimalListing,
      buffalo: models.BuffaloListing,
      goat: models.GoatListing,
      horse: models.HorseListing,
      dog: models.DogListing,
      cat: models.CatListing
    };

    const Model = modelMap[animalType];

    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid animal type'
      });
    }

    const listing = await Model.findByPk(listingId);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    listing.status = 'deleted';
    await listing.save();

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete listing',
      error: error.message
    });
  }
};

// Create new admin (super admin only)
exports.createAdmin = async (req, res) => {
  try {
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can create new admins'
      });
    }

    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required'
      });
    }

    const existingAdmin = await models.Admin.findOne({
      where: {
        [models.Sequelize.Op.or]: [{ username }, { email }]
      }
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this username or email already exists'
      });
    }

    const admin = await models.Admin.create({
      username,
      email,
      password,
      full_name,
      role: role || 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: admin.toJSON()
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin',
      error: error.message
    });
  }
};

// Initialize default super admin
exports.initSuperAdmin = async (req, res) => {
  try {
    const existingAdmin = await models.Admin.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      // Reset the password for existing admin
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      existingAdmin.password = hashedPassword;
      existingAdmin.is_active = true;
      await existingAdmin.save({ hooks: false }); // Skip hooks to avoid double hashing

      return res.status(200).json({
        success: true,
        message: 'Admin password reset successfully. Username: admin, Password: admin123',
        data: existingAdmin.toJSON()
      });
    }

    const admin = await models.Admin.create({
      username: 'admin',
      email: 'admin@kissanebazzar.com',
      password: 'admin123', // Change this in production!
      full_name: 'Super Admin',
      role: 'super_admin'
    });

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully. Username: admin, Password: admin123',
      data: admin.toJSON()
    });
  } catch (error) {
    console.error('Init super admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize super admin',
      error: error.message
    });
  }
};
