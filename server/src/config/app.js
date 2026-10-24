const { mediaLifecycle } = require('../utils/mediaLifecycle');
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
  const jsonBodyLimit = process.env.JSON_BODY_LIMIT || '1mb';
  const formBodyLimit = process.env.FORM_BODY_LIMIT || '256kb';

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

  app.use('/api/', (req, res, next) => {
    for (const [key, maximum] of [['limit', 100], ['page', 10000], ['radius', 500], ['radiusKm', 500]]) {
      if (req.query[key] === undefined) continue;
      const value = Number(req.query[key]);
      if (typeof req.query[key] !== 'string' || !Number.isFinite(value) || value <= 0 || (['page', 'limit'].includes(key) && !Number.isInteger(value))) {
        return res.status(400).json({ success: false, message: 'Invalid pagination or radius parameter' });
      }
      req.query[key] = String(Math.min(value, maximum));
    }
    next();
  });

  // Rate limiting
  app.use('/api/', generalLimiter);

  app.use(mediaLifecycle);
  app.use((req, res, next) => {
    const json = res.json;
    res.json = function (body) {
      if (process.env.NODE_ENV === 'production' && this.statusCode >= 500 && !this.locals.healthPublicError) {
        // Preserve documented public codes, never provider messages or payloads.
        const publicCodes = { AI_NOT_CONFIGURED: 503, AI_UNAVAILABLE: 503, AI_INVALID_RESPONSE: 502, MILK_ADVICE_ERROR: 500 };
        const code = body?.code;
        body = { success: false, message: 'Unable to complete request. Please try again later.',
          ...(Object.hasOwn(publicCodes, code) && publicCodes[code] === this.statusCode ? { code } : {}) };
      }
      return json.call(this, body);
    };
    next();
  });

  // Body parsing middleware
  app.use(express.json({ limit: jsonBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: formBodyLimit }));

  return corsOrigins;
};

module.exports = { setupMiddleware };
