'use strict';

const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const adminAuth = require('../middleware/adminAuth');
const { createUploadFields } = require('../config/cloudinary');
const { uploadLimiter } = require('../config/rateLimiter');

const uploadFields = createUploadFields([
  { name: 'featured_image', maxCount: 1 }
], {
  maxFileSizeBytes: 5 * 1024 * 1024,
  fieldTypeMap: {
    featured_image: ['image']
  }
});

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/slug/:slug', blogController.getBlogBySlug);
router.get('/categories', blogController.getCategories);
router.get('/featured', blogController.getFeaturedBlogs);

// Admin only routes - protected
router.use(adminAuth);

// Blog CRUD operations
router.post('/', uploadLimiter, uploadFields, blogController.createBlog);
router.get('/admin/all', blogController.getAllBlogs); // Get all blogs including drafts
router.get('/admin/stats', blogController.getBlogStats);
router.get('/admin/:id', blogController.getBlogById);
router.patch('/:id', uploadLimiter, uploadFields, blogController.updateBlog);
router.delete('/:id', blogController.deleteBlog);
router.patch('/:id/toggle-featured', blogController.toggleFeatured);

module.exports = router;
