const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const locationRoutes = require('./src/routes/locationRoutes');
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
app.use('/api/location', locationRoutes);  // Added location routes

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
    message: 'WhatsApp OTP Authentication API with Location Services',
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
      health: {
        status: 'GET /health'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
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

  Health:
    GET  /health
    GET  /api
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