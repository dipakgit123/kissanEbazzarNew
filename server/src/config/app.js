const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { generalLimiter } = require('./rateLimiter');
require('dotenv').config();

const parseTrustProxySetting = (value) => {
  if (value === undefined || value === null || value === '') {
    return false;
  }

  if (value === 'true') {
    console.warn('TRUST_PROXY=true is too permissive for IP-based rate limiting; defaulting to TRUST_PROXY=1.');
    return 1;
  }

  if (value === 'false') {
    return false;
  }

  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  return value;
};

const setupMiddleware = (app) => {
  // CORS configuration from environment
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:19006', 'exp://localhost:19000'];

  // Trust proxy must be explicitly configured for safe IP-based rate limiting.
  // Example: TRUST_PROXY=1 when running behind a single reverse proxy.
  app.set('trust proxy', parseTrustProxySetting(process.env.TRUST_PROXY));

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false // Disable CSP for development
  }));

  // CORS configuration
  app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }));

  app.use(morgan('combined'));

  // Rate limiting
  app.use('/api/', generalLimiter);

  // Body parsing middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  return corsOrigins;
};

module.exports = { setupMiddleware };
