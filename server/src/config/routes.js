const authRoutes = require('../routes/authRoutes');
const locationRoutes = require('../routes/locationRoutes');
const animalListingRoutes = require('../routes/animalListingRoutes');
const buffaloListingRoutes = require('../routes/buffaloListingRoutes');
const horseListingRoutes = require('../routes/horseListingRoutes');
const goatListingRoutes = require('../routes/goatListingRoutes');
const catListingRoutes = require('../routes/catListingRoutes');
const dogListingRoutes = require('../routes/dogListingRoutes');
const otherAnimalListingRoutes = require('../routes/otherAnimalListingRoutes');
const combinedListingsRoutes = require('../routes/combinedListingsRoutes');
const callLogRoutes = require('../routes/callLogRoutes');
const notificationRoutes = require('../routes/notificationRoutes');
const aiHealthRoutes = require('../routes/aiHealthRoutes');
const pregnancyRoutes = require('../routes/pregnancyRoutes');
const milkReportRoutes = require('../routes/milkReportRoutes');
const adminRoutes = require('../routes/adminRoutes');
const veterinarianRoutes = require('../routes/veterinarianRoutes');
const vetReviewRoutes = require('../routes/vetReviewRoutes');
const vetReportRoutes = require('../routes/vetReportRoutes');
const appointmentRoutes = require('../routes/appointmentRoutes');
const wishlistRoutes = require('../routes/wishlistRoutes');
const blogRoutes = require('../routes/blogRoutes');

const setupRoutes = (app) => {
  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/location', locationRoutes);
  app.use('/api/animals', animalListingRoutes);
  app.use('/api/buffalos', buffaloListingRoutes);
  app.use('/api/horses', horseListingRoutes);
  app.use('/api/goats', goatListingRoutes);
  app.use('/api/cats', catListingRoutes);
  app.use('/api/dogs', dogListingRoutes);
  app.use('/api/other-animals', otherAnimalListingRoutes);
  app.use('/api/listings', combinedListingsRoutes);
  app.use('/api/call-logs', callLogRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/health-check', aiHealthRoutes);
  app.use('/api/pregnancy', pregnancyRoutes);
  app.use('/api/milk-reports', milkReportRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/veterinarians', veterinarianRoutes);
  app.use('/api/vet-reviews', vetReviewRoutes);
  app.use('/api/vet-reports', vetReportRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/blogs', blogRoutes);

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      await require('../models').sequelize.authenticate();
      res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        database: 'Connected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'ERROR',
        message: 'Database connection failed',
        error: error.message
      });
    }
  });

  // API documentation endpoint
  app.get('/api', (req, res) => {
    res.json({
      success: true,
      message: 'WhatsApp OTP Authentication API with Location Services & Animal Marketplace',
      version: '1.0.0',
      endpoints: {
        auth: {
          sendOTP: 'POST /api/auth/send-otp',
          verifyOTP: 'POST /api/auth/verify-otp',
          resendOTP: 'POST /api/auth/resend-otp',
          profile: 'GET /api/auth/profile'
        },
        health: {
          status: 'GET /health'
        }
      },
      notes: {
        authentication: 'Protected endpoints require Bearer token in Authorization header',
        publicAccess: 'Animal, Buffalo, Horse, Goat, Cat, and Dog listings can be viewed without authentication',
        fileUploads: 'Use multipart/form-data for image and video uploads',
        imageLimits: 'Max 5MB per image (JPEG, PNG, WebP)',
        videoLimits: 'Max 25MB per video (MP4, MOV, AVI, WebM)'
      }
    });
  });
};

module.exports = { setupRoutes };
