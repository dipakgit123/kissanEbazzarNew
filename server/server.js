const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const locationRoutes = require('./src/routes/locationRoutes');
const animalListingRoutes = require('./src/routes/animalListingRoutes'); // NEW
const buffaloListingRoutes = require('./src/routes/buffaloListingRoutes'); // NEW
const horseListingRoutes = require('./src/routes/horseListingRoutes'); // NEW
const goatListingRoutes = require('./src/routes/goatListingRoutes'); // NEW
const catListingRoutes = require('./src/routes/catListingRoutes'); // NEW
const dogListingRoutes = require('./src/routes/dogListingRoutes'); // NEW
const combinedListingsRoutes = require('./src/routes/combinedListingsRoutes'); // Combined listings
const notificationRoutes = require('./src/routes/notificationRoutes'); // Notifications
const aiHealthRoutes = require('./src/routes/aiHealthRoutes'); // AI Health Check
const pregnancyRoutes = require('./src/routes/pregnancyRoutes'); // Pregnancy Calendar
const adminRoutes = require('./src/routes/adminRoutes'); // Admin Dashboard
const veterinarianRoutes = require('./src/routes/veterinarianRoutes'); // Veterinarian routes
const vetReviewRoutes = require('./src/routes/vetReviewRoutes'); // Veterinarian review routes
const vetReportRoutes = require('./src/routes/vetReportRoutes'); // Veterinarian report routes
const appointmentRoutes = require('./src/routes/appointmentRoutes'); // Appointment booking routes
const otpService = require('./src/services/otpService');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for IP address
app.set('trust proxy', true);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/animals', animalListingRoutes);  // NEW - Animal listing routes
app.use('/api/buffalos', buffaloListingRoutes);  // NEW - Buffalo listing routes
app.use('/api/horses', horseListingRoutes);  // NEW - Horse listing routes
app.use('/api/goats', goatListingRoutes);  // NEW - Goat listing routes
app.use('/api/cats', catListingRoutes);  // NEW - Cat listing routes
app.use('/api/dogs', dogListingRoutes);  // NEW - Dog listing routes
app.use('/api/listings', combinedListingsRoutes);  // Combined listings from all categories
app.use('/api/notifications', notificationRoutes);  // Notification routes
app.use('/api/health-check', aiHealthRoutes);  // AI Health Check routes
app.use('/api/pregnancy', pregnancyRoutes);  // Pregnancy Calendar routes
app.use('/api/admin', adminRoutes);  // Admin Dashboard routes
app.use('/api/veterinarians', veterinarianRoutes);  // Veterinarian routes
app.use('/api/vet-reviews', vetReviewRoutes);  // Veterinarian review routes
app.use('/api/vet-reports', vetReportRoutes);  // Veterinarian report routes
app.use('/api/appointments', appointmentRoutes);  // Appointment booking routes

// Serve static files for web frontend
app.use(express.static('public'));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await require('./src/models').sequelize.authenticate();
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
      location: {
        setFromCurrent: 'POST /api/location/set/current',
        setFromManual: 'POST /api/location/set/manual',
        update: 'PUT /api/location/update',
        getLocation: 'GET /api/location/me',
        checkStatus: 'GET /api/location/status',
        nearbyUsers: 'GET /api/location/nearby'
      },
      animals: {  // NEW - Animal listing endpoints
        create: 'POST /api/animals/listings (Auth Required)',
        getAll: 'GET /api/animals/listings (Public)',
        getSingle: 'GET /api/animals/listings/:id (Public)',
        getNearby: 'GET /api/animals/listings/nearby (Public)',
        update: 'PUT /api/animals/listings/:id (Auth Required)',
        delete: 'DELETE /api/animals/listings/:id (Auth Required)',
        myListings: 'GET /api/animals/my-listings (Auth Required)',
        markSold: 'PATCH /api/animals/listings/:id/sold (Auth Required)'
      },
      buffalos: {  // NEW - Buffalo listing endpoints
        create: 'POST /api/buffalos/listings (Auth Required)',
        getAll: 'GET /api/buffalos/listings (Public)',
        getSingle: 'GET /api/buffalos/listings/:id (Public)',
        getNearby: 'GET /api/buffalos/listings/nearby (Public)',
        update: 'PUT /api/buffalos/listings/:id (Auth Required)',
        delete: 'DELETE /api/buffalos/listings/:id (Auth Required)',
        myListings: 'GET /api/buffalos/my-listings (Auth Required)',
        markSold: 'PATCH /api/buffalos/listings/:id/sold (Auth Required)'
      },
      horses: {  // NEW - Horse listing endpoints
        create: 'POST /api/horses/listings (Auth Required)',
        getAll: 'GET /api/horses/listings (Public)',
        getSingle: 'GET /api/horses/listings/:id (Public)',
        getNearby: 'GET /api/horses/listings/nearby (Public)',
        update: 'PUT /api/horses/listings/:id (Auth Required)',
        delete: 'DELETE /api/horses/listings/:id (Auth Required)',
        myListings: 'GET /api/horses/my-listings (Auth Required)',
        markSold: 'PATCH /api/horses/listings/:id/sold (Auth Required)'
      },
      goats: {  // NEW - Goat listing endpoints
        create: 'POST /api/goats/listings (Auth Required)',
        getAll: 'GET /api/goats/listings (Public)',
        getSingle: 'GET /api/goats/listings/:id (Public)',
        getNearby: 'GET /api/goats/listings/nearby (Public)',
        update: 'PUT /api/goats/listings/:id (Auth Required)',
        delete: 'DELETE /api/goats/listings/:id (Auth Required)',
        myListings: 'GET /api/goats/my-listings (Auth Required)',
        markSold: 'PATCH /api/goats/listings/:id/sold (Auth Required)'
      },
      cats: {  // NEW - Cat listing endpoints
        create: 'POST /api/cats/listings (Auth Required)',
        getAll: 'GET /api/cats/listings (Public)',
        getSingle: 'GET /api/cats/listings/:id (Public)',
        getNearby: 'GET /api/cats/listings/nearby (Public)',
        update: 'PUT /api/cats/listings/:id (Auth Required)',
        delete: 'DELETE /api/cats/listings/:id (Auth Required)',
        myListings: 'GET /api/cats/my-listings (Auth Required)',
        markSold: 'PATCH /api/cats/listings/:id/sold (Auth Required)'
      },
      dogs: {  // NEW - Dog listing endpoints
        create: 'POST /api/dogs/listings (Auth Required)',
        getAll: 'GET /api/dogs/listings (Public)',
        getSingle: 'GET /api/dogs/listings/:id (Public)',
        getNearby: 'GET /api/dogs/listings/nearby (Public)',
        update: 'PUT /api/dogs/listings/:id (Auth Required)',
        delete: 'DELETE /api/dogs/listings/:id (Auth Required)',
        myListings: 'GET /api/dogs/my-listings (Auth Required)',
        markSold: 'PATCH /api/dogs/listings/:id/sold (Auth Required)'
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size limit exceeded'
    });
  }
  
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;

// Cleanup expired OTPs every 5 minutes
setInterval(async () => {
  try {
    await otpService.cleanupExpiredOTPs();
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 5 * 60 * 1000);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║   🚀 Server is running on port ${PORT}         ║
║   📱 WhatsApp OTP Service with Sequelize    ║
║   📍 Location Services Enabled               ║
║   🐄 Animal Marketplace Active              ║
║   🐃 Buffalo Marketplace Active             ║
║   🐴 Horse Marketplace Active               ║
║   ☁️  Cloudinary Integration Enabled        ║
║   🗄️  Database: PostgreSQL                   ║
║   🔐 Environment: ${process.env.NODE_ENV || 'development'}     ║
╚══════════════════════════════════════════════╝

Available endpoints:
  Auth:
    POST /api/auth/send-otp
    POST /api/auth/verify-otp
    POST /api/auth/resend-otp
    GET  /api/auth/profile

  Location:
    POST /api/location/set/current
    POST /api/location/set/manual
    PUT  /api/location/update
    GET  /api/location/me
    GET  /api/location/status
    GET  /api/location/nearby

  Animal Listings:
    POST /api/animals/listings        [Auth Required]
    GET  /api/animals/listings        [Public Access]
    GET  /api/animals/listings/nearby [Public Access]
    GET  /api/animals/listings/:id    [Public Access]
    PUT  /api/animals/listings/:id    [Auth Required]
    DELETE /api/animals/listings/:id  [Auth Required]
    GET  /api/animals/my-listings     [Auth Required]
    PATCH /api/animals/listings/:id/sold [Auth Required]

  Buffalo Listings:
    POST /api/buffalos/listings        [Auth Required]
    GET  /api/buffalos/listings        [Public Access]
    GET  /api/buffalos/listings/nearby [Public Access]
    GET  /api/buffalos/listings/:id    [Public Access]
    PUT  /api/buffalos/listings/:id    [Auth Required]
    DELETE /api/buffalos/listings/:id  [Auth Required]
    GET  /api/buffalos/my-listings     [Auth Required]
    PATCH /api/buffalos/listings/:id/sold [Auth Required]

  Horse Listings:
    POST /api/horses/listings        [Auth Required]
    GET  /api/horses/listings        [Public Access]
    GET  /api/horses/listings/nearby [Public Access]
    GET  /api/horses/listings/:id    [Public Access]
    PUT  /api/horses/listings/:id    [Auth Required]
    DELETE /api/horses/listings/:id  [Auth Required]
    GET  /api/horses/my-listings     [Auth Required]
    PATCH /api/horses/listings/:id/sold [Auth Required]

  Goat Listings:
    POST /api/goats/listings        [Auth Required]
    GET  /api/goats/listings        [Public Access]
    GET  /api/goats/listings/nearby [Public Access]
    GET  /api/goats/listings/:id    [Public Access]
    PUT  /api/goats/listings/:id    [Auth Required]
    DELETE /api/goats/listings/:id  [Auth Required]
    GET  /api/goats/my-listings     [Auth Required]
    PATCH /api/goats/listings/:id/sold [Auth Required]

  Cat Listings:
    POST /api/cats/listings        [Auth Required]
    GET  /api/cats/listings        [Public Access]
    GET  /api/cats/listings/nearby [Public Access]
    GET  /api/cats/listings/:id    [Public Access]
    PUT  /api/cats/listings/:id    [Auth Required]
    DELETE /api/cats/listings/:id  [Auth Required]
    GET  /api/cats/my-listings     [Auth Required]
    PATCH /api/cats/listings/:id/sold [Auth Required]

  Dog Listings:
    POST /api/dogs/listings        [Auth Required]
    GET  /api/dogs/listings        [Public Access]
    GET  /api/dogs/listings/nearby [Public Access]
    GET  /api/dogs/listings/:id    [Public Access]
    PUT  /api/dogs/listings/:id    [Auth Required]
    DELETE /api/dogs/listings/:id  [Auth Required]
    GET  /api/dogs/my-listings     [Auth Required]
    PATCH /api/dogs/listings/:id/sold [Auth Required]

  Health:
    GET  /health
    GET  /api

Notes:
  - Public endpoints allow viewing listings without authentication
  - Protected endpoints require Bearer token in Authorization header
  - File uploads support: Images (5MB) and Videos (25MB)
  - Cloudinary handles all media storage
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📛 Shutting down gracefully...');
  await require('./src/models').sequelize.close();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
  process.exit(1);
});