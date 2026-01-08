'use strict';

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

// Public routes
router.post('/login', adminController.login);
router.post('/init', adminController.initSuperAdmin); // One-time setup

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
