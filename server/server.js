const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./src/config/database');
const { setupMiddleware } = require('./src/config/app');
const { setupRoutes } = require('./src/config/routes');
const { setupSocketIO } = require('./src/config/socket');
const { errorHandler, notFoundHandler } = require('./src/config/errors');
const { getJwtSecret } = require('./src/config/jwt');
const otpService = require('./src/services/otpService');
const { startBalanceMonitoring, usesTwilioProvider } = require('./src/utils/twilioMonitor');
const { startAutoReactivation } = require('./src/utils/whatsappReactivate');
const logger = require('./src/utils/logger');
const { logSystemError } = require('./src/utils/systemErrorLogger');
require('./src/services/scheduledNotifications'); // Start scheduled notification jobs
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const fatalLogTimeoutMs = 1500;

const logFatalAndExit = (error, metadata) => {
  Promise.race([
    logSystemError(error, {
      source: 'process',
      severity: 'fatal',
      metadata
    }),
    new Promise((resolve) => setTimeout(resolve, fatalLogTimeoutMs))
  ]).finally(() => process.exit(1));
};

// Setup middleware and get CORS origins
const corsOrigins = setupMiddleware(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Setup Socket.IO connection handling
setupSocketIO(io);

// Setup routes
setupRoutes(app);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Cleanup expired OTPs every 5 minutes
setInterval(async () => {
  try {
    await otpService.cleanupExpiredOTPs();
  } catch (error) {
    logger.error('Cleanup error:', error);
    await logSystemError(error, {
      source: 'background',
      severity: 'error',
      metadata: { job: 'cleanupExpiredOTPs' }
    });
  }
}, 5 * 60 * 1000);

// ✅ FIXED: Start Twilio balance monitoring
// Check every 60 minutes, alert when balance < $5
if (usesTwilioProvider() && process.env.TWILIO_ACCOUNT_SID) {
  startBalanceMonitoring(60, 5.00);
  logger.log('✅ Twilio balance monitoring started');
}

// ✅ NEW: Start WhatsApp auto-reactivation
// Sends test message every 24 hours to keep WhatsApp active
// Prevents deactivation due to inactivity
if (
  ['local', 'twilio-whatsapp'].includes(otpService.getProvider())
  && process.env.TWILIO_ACCOUNT_SID
  && process.env.TWILIO_WHATSAPP_NUMBER
) {
  if (process.env.ADMIN_PHONE_NUMBER) {
    startAutoReactivation(60); // Check every 60 minutes, reactivate every 24 hours
    logger.log('✅ WhatsApp auto-reactivation started');
  } else {
    logger.log('⚠️ WhatsApp auto-reactivation disabled: ADMIN_PHONE_NUMBER not set in .env');
    logger.log('⚠️ Add ADMIN_PHONE_NUMBER to enable automatic WhatsApp reactivation');
  }
}

// Start server
const startServer = async () => {
  try {
    getJwtSecret();
    await connectDB();

    server.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║   🚀 Server is running on port ${PORT}         ║
║   📱 OTP Service with Sequelize             ║
║   📍 Location Services Enabled               ║
║   🐄 Animal Marketplace Active              ║
║   🐃 Buffalo Marketplace Active             ║
║   🐴 Horse Marketplace Active               ║
║   ☁️  AWS S3 Media Storage Enabled          ║
║   🗄️  Database: PostgreSQL                   ║
║   🔐 Environment: ${process.env.NODE_ENV || 'development'}     ║
║   🔌 Socket.IO Real-time Notifications      ║
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
  - AWS S3 handles all media storage
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await logSystemError(error, {
      source: 'startup',
      severity: 'fatal'
    });
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
  logFatalAndExit(error, { event: 'uncaughtException' });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
  logFatalAndExit(error, { event: 'unhandledRejection' });
});
