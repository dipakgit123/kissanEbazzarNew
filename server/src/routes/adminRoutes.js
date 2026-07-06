'use strict';

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const governmentSchemeController = require('../controllers/governmentSchemeController');
const petMatingController = require('../controllers/petMatingController');
const { createUploadFields } = require('../config/cloudinary');
const { authLimiter } = require('../config/rateLimiter');
const { uploadLimiter } = require('../config/rateLimiter');

const schemeUploadFields = createUploadFields([
  { name: 'image', maxCount: 1 }
], {
  maxFileSizeBytes: 5 * 1024 * 1024,
  fieldTypeMap: {
    image: ['image']
  }
});

const requireAdminInitSecret = (req, res, next) => {
  const configuredSecret = process.env.ADMIN_INIT_SECRET;
  if (!configuredSecret) {
    return res.status(403).json({
      success: false,
      message: 'Admin bootstrap is disabled.'
    });
  }

  const providedSecret = req.get('x-admin-init-secret') || req.body?.initSecret;
  if (!providedSecret) {
    return res.status(401).json({
      success: false,
      message: 'Admin bootstrap secret is required.'
    });
  }

  const expected = Buffer.from(configuredSecret, 'utf8');
  const provided = Buffer.from(String(providedSecret), 'utf8');
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid admin bootstrap secret.'
    });
  }

  next();
};

// Public routes
router.post('/login', authLimiter, adminController.login);
router.post('/init', authLimiter, requireAdminInitSecret, adminController.initSuperAdmin); // One-time setup with explicit secret

// Protected routes - require admin authentication
router.use(adminAuth);

// Profile
router.get('/profile', adminController.getProfile);

// Dashboard & Analytics
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/user-growth', adminController.getUserGrowth);
router.get('/dashboard/listings-growth', adminController.getListingsGrowth);
router.get('/dashboard/sales', adminController.getSalesData);
router.get('/dashboard/top-sellers', adminController.getTopSellers);
router.get('/dashboard/location-stats', adminController.getLocationStats);
router.get('/dashboard/activity', adminController.getRecentActivity);

// User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/block', adminController.toggleUserBlock);

// Listing Management
router.get('/listings', adminController.getListings);
router.delete('/listings/:animalType/:listingId', adminController.deleteListing);

// Government Scheme Management
router.get('/government-schemes/stats', governmentSchemeController.getSchemeStats.bind(governmentSchemeController));
router.get('/government-schemes', governmentSchemeController.getSchemes.bind(governmentSchemeController));
router.post(
  '/government-schemes',
  uploadLimiter,
  schemeUploadFields,
  governmentSchemeController.createScheme.bind(governmentSchemeController)
);
router.get('/government-schemes/:id', governmentSchemeController.getSchemeById.bind(governmentSchemeController));
router.put(
  '/government-schemes/:id',
  uploadLimiter,
  schemeUploadFields,
  governmentSchemeController.updateScheme.bind(governmentSchemeController)
);
router.delete('/government-schemes/:id', governmentSchemeController.deleteScheme.bind(governmentSchemeController));
router.patch('/government-schemes/:id/status', governmentSchemeController.updateSchemeStatus.bind(governmentSchemeController));

// Pet Mating Management
router.get('/pet-mating', petMatingController.adminGetProfiles.bind(petMatingController));
router.get('/pet-mating/reports', petMatingController.adminGetReports.bind(petMatingController));
router.patch('/pet-mating/:id/status', petMatingController.adminUpdateStatus.bind(petMatingController));

// Veterinarian Management
const veterinarianController = require('../controllers/veterinarianController');
router.get('/veterinarians/stats', veterinarianController.getStats);
router.get('/veterinarians/pending', veterinarianController.getPendingVerifications);
router.get('/veterinarians', veterinarianController.getAllForAdmin);
router.patch('/veterinarians/:id/verify', veterinarianController.verifyVeterinarian.bind(veterinarianController));
router.patch('/veterinarians/:id/reject', veterinarianController.rejectVeterinarian.bind(veterinarianController));
router.patch('/veterinarians/:id/suspend', veterinarianController.suspendVeterinarian.bind(veterinarianController));

// Admin Management (super admin only)
router.post('/admins', adminController.createAdmin);

module.exports = router;
