'use strict';

const db = require('../models');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { Op, QueryTypes, UniqueConstraintError, ValidationError } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { getJwtSecret } = require('../config/jwt');

const buildServerErrorResponse = (message, error) => ({
  success: false,
  message,
  ...(process.env.NODE_ENV === 'development' && error ? { error: error.message } : {})
});

const PUBLIC_VET_LEAD_TYPES = new Set(['profile_view', 'whatsapp_click', 'call_click']);

const getClientIpAddress = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || req.connection?.remoteAddress || null;
};

const sanitizeSourcePage = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().slice(0, 100);
  return normalized || null;
};

const getIndiaDayBounds = (date = new Date()) => {
  const indiaOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const shifted = new Date(date.getTime() + indiaOffsetMs);
  const startOfShiftedDayUtcMs = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate()
  );
  const start = new Date(startOfShiftedDayUtcMs - indiaOffsetMs);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
};

const isMissingRelationError = (error, relationName) => {
  const relationPattern = relationName ? new RegExp(`relation ["']?${relationName}["']? does not exist`, 'i') : null;
  return Boolean(
    error?.original?.code === '42P01' ||
    error?.parent?.code === '42P01' ||
    (relationPattern && (
      relationPattern.test(error?.message || '') ||
      relationPattern.test(error?.original?.message || '') ||
      relationPattern.test(error?.parent?.message || '')
    ))
  );
};

const extractOptionalUserId = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded?.type === 'veterinarian') {
      return null;
    }

    return decoded?.userId || null;
  } catch (_error) {
    return null;
  }
};

const calculateProfileCompletion = (veterinarian) => {
  const checks = [
    Boolean(veterinarian?.full_name),
    Boolean(veterinarian?.phone_number),
    Boolean(veterinarian?.email),
    Boolean(veterinarian?.profile_photo),
    Boolean(veterinarian?.specialization),
    Number(veterinarian?.experience_years || 0) > 0,
    Boolean(veterinarian?.qualification),
    Array.isArray(veterinarian?.services) ? veterinarian.services.length > 0 : Boolean(veterinarian?.services),
    Boolean(veterinarian?.clinic_name),
    Boolean(veterinarian?.clinic_address),
    Boolean(veterinarian?.city),
    Boolean(veterinarian?.state),
    Boolean(veterinarian?.pincode),
    Boolean(veterinarian?.license_document),
    veterinarian?.available_hours && typeof veterinarian.available_hours === 'object'
      ? Object.keys(veterinarian.available_hours).length > 0
      : false
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
};

class VeterinarianController {

  constructor() {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Generate random password
   */
  generatePassword(email, fullName = '') {
    const fallbackWords = [
      'Animal', 'Health', 'Vet', 'Clinic', 'Care',
      'Doctor', 'Farm', 'Guardian', 'Trusted', 'Rescue'
    ];
    const symbols = ['!', '@', '#'];
    const pick = (items) => items[crypto.randomInt(items.length)];
    const normalizeWord = (word) => {
      if (!word) return '';
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      if (!cleanWord) return '';
      const clipped = cleanWord.slice(0, 10);
      return clipped.charAt(0).toUpperCase() + clipped.slice(1).toLowerCase();
    };

    const emailWords = String(email || '')
      .split('@')[0]
      .split(/[^a-zA-Z]+/)
      .map(normalizeWord)
      .filter((word) => word.length >= 3);

    const nameWords = String(fullName || '')
      .split(/[^a-zA-Z]+/)
      .map(normalizeWord)
      .filter((word) => word.length >= 3);

    const meaningfulWords = [...emailWords, ...nameWords].filter(Boolean);
    const primaryWord = meaningfulWords[0] || pick(fallbackWords);
    const secondaryWord = meaningfulWords[1] || 'Vet';
    const digits = String(crypto.randomInt(10, 100));

    return `${primaryWord}${secondaryWord}${digits}${pick(symbols)}`;
  }

  /**
   * Send welcome email with credentials
   */
  async sendCredentialsEmail(veterinarian, password) {
    const mailOptions = {
      from: `"Animal E Bazar" <${process.env.SMTP_USER || 'noreply@kissanebazzar.com'}>`,
      to: veterinarian.email,
      subject: 'Welcome to Animal E Bazar - Your Account is Verified!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #6366F1); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
            .btn { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome, Dr. ${veterinarian.full_name}!</h1>
              <p>Your account has been verified</p>
            </div>
            <div class="content">
              <p>Congratulations! Your registration as a veterinarian on Animal E Bazar has been approved.</p>

              <p>You can now access your dashboard and connect with farmers who need your services.</p>

              <div class="credentials">
                <h3>Your Login Credentials</h3>
                <p><strong>Email:</strong> ${veterinarian.email}</p>
                <p><strong>Password:</strong> ${password}</p>
              </div>

              <p><strong>Important:</strong> Please change your password after your first login for security.</p>

              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/veterinarian/login" class="btn">Login to Dashboard</a>

              <h3 style="margin-top: 30px;">What's Next?</h3>
              <ul>
                <li>Complete your profile with available hours</li>
                <li>Add your services and consultation fees</li>
                <li>Start receiving inquiries from farmers</li>
              </ul>

              <div class="footer">
                <p>If you have any questions, please contact our support team.</p>
                <p>&copy; ${new Date().getFullYear()} Animal E Bazar. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Credentials email sent to ${veterinarian.email}`);
      return true;
    } catch (error) {
      console.error('Error sending credentials email:', error);
      return false;
    }
  }

  getFrontendBaseUrl() {
    return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  }

  async sendPasswordResetEmail(veterinarian, resetToken) {
    const resetUrl = `${this.getFrontendBaseUrl()}/veterinarian/reset-password?token=${encodeURIComponent(resetToken)}`;
    const mailOptions = {
      from: `"Animal E Bazar" <${process.env.SMTP_USER || 'noreply@kissanebazzar.com'}>`,
      to: veterinarian.email,
      subject: 'Reset your Animal E Bazar veterinarian password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #6366F1); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .btn { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .notice { background: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin-top: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
              <p>Animal E Bazar Veterinarian Portal</p>
            </div>
            <div class="content">
              <p>Hello Dr. ${veterinarian.full_name},</p>
              <p>We received a request to reset your veterinarian dashboard password.</p>
              <p>Use the button below to set a new password. This link will expire in 1 hour.</p>
              <a href="${resetUrl}" class="btn">Reset Password</a>
              <div class="notice">
                If you did not request this reset, you can safely ignore this email. Your current password will keep working.
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  // ============ REGISTRATION & AUTH ============

  /**
   * Register a new veterinarian
   * POST /api/veterinarians/register
   */
  async register(req, res) {
    try {
      console.log('=== VET REGISTRATION REQUEST ===');
      console.log('Body keys:', Object.keys(req.body));
      console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
      console.log('Full Name:', req.body.full_name);
      console.log('Phone:', req.body.phone_number);
      console.log('License:', req.body.license_number);
      console.log('Location:', req.body.latitude, req.body.longitude);
      console.log('====================');

      const {
        full_name,
        phone_number,
        email,
        specialization,
        experience_years,
        qualification,
        services,
        consultation_fee,
        emergency_available,
        license_number,
        clinic_name,
        clinic_address,
        latitude,
        longitude,
        city,
        state,
        pincode
      } = req.body;
      const normalizedEmail = email ? email.trim().toLowerCase() : null;

      // Validate required fields
      if (!full_name || !phone_number || !normalizedEmail || !license_number || !latitude || !longitude || !city || !state || !pincode) {
        console.log('=== VALIDATION FAILED ===');
        console.log('Missing:', {
          full_name: !!full_name,
          phone_number: !!phone_number,
          email: !!normalizedEmail,
          license_number: !!license_number,
          latitude: !!latitude,
          longitude: !!longitude,
          city: !!city,
          state: !!state,
          pincode: !!pincode
        });
        console.log('====================');
        
        return res.status(400).json({
          success: false,
          message: 'Required fields: full_name, phone_number, email, license_number, latitude, longitude, city, state, pincode'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      // Check if phone number already exists
      const existingPhone = await db.Veterinarian.findByPhoneNumber(phone_number);
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          code: 'VET_PHONE_ALREADY_REGISTERED',
          field: 'phone_number',
          message: 'Phone number already registered. Please login instead or use a different phone number.'
        });
      }

      // Check if license number already exists
      const existingLicense = await db.Veterinarian.findOne({
        where: { license_number }
      });
      if (existingLicense) {
        return res.status(409).json({
          success: false,
          code: 'VET_LICENSE_ALREADY_REGISTERED',
          field: 'license_number',
          message: 'License number already registered. Please use a different license number or contact support.'
        });
      }

      const existingEmail = await db.Veterinarian.findOne({
        where: { email: normalizedEmail }
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          code: 'VET_EMAIL_ALREADY_REGISTERED',
          field: 'email',
          message: 'Email address already registered. Please login instead or use a different email address.'
        });
      }

      // Process file uploads
      const uploadedFiles = {};
      const uploadDocument = async (file, folder, resourceLabel) => {
        const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';

        try {
          return await uploadToCloudinary(file, folder, resourceType);
        } catch (error) {
          console.error(`Error uploading ${resourceLabel}:`, error);
          throw new Error(`Failed to upload ${resourceLabel}`);
        }
      };

      if (req.files) {
        if (!req.files.license_document || !req.files.license_document[0]) {
          return res.status(400).json({
            success: false,
            message: 'License document is required'
          });
        }

        const uploadTasks = [
          uploadDocument(
            req.files.license_document[0],
            'veterinarians/registration/license-documents',
            'license document'
          ).then((result) => {
            uploadedFiles.license_document = result.secure_url;
            uploadedFiles.license_document_public_id = result.public_id;
          })
        ];

        // Profile photo
        if (req.files.profile_photo && req.files.profile_photo[0]) {
          uploadTasks.push(
            uploadDocument(
              req.files.profile_photo[0],
              'veterinarians/registration/profile-photos',
              'profile photo'
            ).then((result) => {
              uploadedFiles.profile_photo = result.secure_url;
              uploadedFiles.profile_photo_public_id = result.public_id;
            })
          );
        }

        // Degree certificate
        if (req.files.degree_certificate && req.files.degree_certificate[0]) {
          uploadTasks.push(
            uploadDocument(
              req.files.degree_certificate[0],
              'veterinarians/registration/degree-certificates',
              'degree certificate'
            ).then((result) => {
              uploadedFiles.degree_certificate = result.secure_url;
              uploadedFiles.degree_certificate_public_id = result.public_id;
            })
          );
        }

        // Aadhar document
        if (req.files.aadhar_document && req.files.aadhar_document[0]) {
          uploadTasks.push(
            uploadDocument(
              req.files.aadhar_document[0],
              'veterinarians/registration/aadhar-documents',
              'aadhar document'
            ).then((result) => {
              uploadedFiles.aadhar_document = result.secure_url;
              uploadedFiles.aadhar_document_public_id = result.public_id;
            })
          );
        }

        try {
          await Promise.all(uploadTasks);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: error.message || 'Failed to upload registration documents'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'License document is required'
        });
      }

      // Parse services if it's a string
      let parsedServices = services;
      if (typeof services === 'string') {
        try {
          parsedServices = JSON.parse(services);
        } catch (e) {
          parsedServices = services.split(',').map(s => s.trim());
        }
      }

      // Create veterinarian
      const veterinarian = await db.Veterinarian.create({
        full_name,
        phone_number,
        email: normalizedEmail,
        specialization: specialization || 'general',
        experience_years: parseInt(experience_years) || 0,
        qualification: qualification || 'BVSc',
        services: parsedServices || [],
        consultation_fee: parseFloat(consultation_fee) || null,
        emergency_available: emergency_available === 'true' || emergency_available === true,
        license_number,
        clinic_name,
        clinic_address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        city,
        state,
        pincode,
        verification_status: 'pending',
        ...uploadedFiles
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful! Your profile is pending verification. You will be notified once approved.',
        data: {
          id: veterinarian.id,
          full_name: veterinarian.full_name,
          verification_status: veterinarian.verification_status
        }
      });
    } catch (error) {
      console.error('Veterinarian registration error:', error);

      if (error instanceof UniqueConstraintError) {
        const field = error.errors?.[0]?.path;
        const fieldMessages = {
          phone_number: 'Phone number already registered. Please login instead or use a different phone number.',
          license_number: 'License number already registered. Please use a different license number or contact support.',
          email: 'Email address already registered. Please login instead or use a different email address.'
        };
        const fieldCodes = {
          phone_number: 'VET_PHONE_ALREADY_REGISTERED',
          license_number: 'VET_LICENSE_ALREADY_REGISTERED',
          email: 'VET_EMAIL_ALREADY_REGISTERED'
        };

        return res.status(409).json({
          success: false,
          code: fieldCodes[field] || 'VET_DUPLICATE_REGISTRATION',
          field,
          message: fieldMessages[field] || 'A veterinarian with the same details already exists'
        });
      }

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Please check the submitted details'
        });
      }

      res.status(500).json(buildServerErrorResponse('Registration failed', error));
    }
  }

  /**
   * Send OTP for login
   * POST /api/veterinarians/send-otp
   */
  async sendOtp(req, res) {
    try {
      const { phone_number } = req.body;

      const veterinarian = await db.Veterinarian.findByPhoneNumber(phone_number);
      if (!veterinarian) {
        return res.status(404).json({
          success: false,
          message: 'Veterinarian not found. Please register first.'
        });
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Hash OTP
      const hashedOtp = await bcrypt.hash(otp, 10);

      await veterinarian.update({
        otp: hashedOtp,
        otp_expiry: otpExpiry
      });

      // TODO: Send OTP via SMS service
      console.log(`OTP for ${phone_number}: ${otp}`);

      res.json({
        success: true,
        message: 'OTP sent successfully',
        // Remove in production
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json(buildServerErrorResponse('Failed to send OTP', error));
    }
  }

  /**
   * Verify OTP and login
   * POST /api/veterinarians/verify-otp
   */
  async verifyOtp(req, res) {
    try {
      const { phone_number, otp } = req.body;

      const veterinarian = await db.Veterinarian.findByPhoneNumber(phone_number);
      if (!veterinarian) {
        return res.status(404).json({
          success: false,
          message: 'Veterinarian not found'
        });
      }

      // Check OTP expiry
      if (!veterinarian.isOtpValid()) {
        return res.status(400).json({
          success: false,
          message: 'OTP has expired'
        });
      }

      // Verify OTP
      const isValidOtp = await bcrypt.compare(otp, veterinarian.otp);
      if (!isValidOtp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      // Update verification status
      await veterinarian.update({
        otp: null,
        otp_expiry: null,
        is_phone_verified: true
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          id: veterinarian.id,
          phone_number: veterinarian.phone_number,
          type: 'veterinarian'
        },
        getJwtSecret(),
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          veterinarian: {
            id: veterinarian.id,
            full_name: veterinarian.full_name,
            phone_number: veterinarian.phone_number,
            verification_status: veterinarian.verification_status,
            is_active: veterinarian.is_active
          }
        }
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json(buildServerErrorResponse('Verification failed', error));
    }
  }

  /**
   * Login with email and password (for verified veterinarians)
   * POST /api/veterinarians/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find veterinarian by email
      const veterinarian = await db.Veterinarian.findOne({
        where: { email: email.toLowerCase() }
      });

      if (!veterinarian) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check verification status
      if (veterinarian.verification_status === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Your account is pending verification'
        });
      }

      if (veterinarian.verification_status === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been rejected'
        });
      }

      if (veterinarian.verification_status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended'
        });
      }

      // Check if password exists
      if (!veterinarian.password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Validate password
      const isValidPassword = await veterinarian.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: veterinarian.id,
          email: veterinarian.email,
          type: 'veterinarian'
        },
        getJwtSecret(),
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        veterinarian: veterinarian.toJSON()
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json(buildServerErrorResponse('Login failed', error));
    }
  }

  async requestPasswordReset(req, res) {
    try {
      const email = req.body?.email?.trim().toLowerCase();

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const genericResponse = {
        success: true,
        message: 'If an account exists for this email, a password reset link has been sent.'
      };

      const veterinarian = await db.Veterinarian.findOne({
        where: { email }
      });

      if (
        !veterinarian ||
        veterinarian.verification_status !== 'verified' ||
        !veterinarian.password
      ) {
        return res.json(genericResponse);
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      veterinarian.password_reset_token = hashedToken;
      veterinarian.password_reset_expires_at = new Date(Date.now() + 60 * 60 * 1000);
      await veterinarian.save();

      try {
        await this.sendPasswordResetEmail(veterinarian, resetToken);
      } catch (emailError) {
        console.error('Failed to send veterinarian password reset email:', emailError);
      }

      return res.json(genericResponse);
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process password reset request'
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const token = req.body?.token?.trim();
      const password = req.body?.password;

      if (!token || !password) {
        return res.status(400).json({
          success: false,
          message: 'Token and password are required'
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        });
      }

      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const veterinarian = await db.Veterinarian.findOne({
        where: {
          password_reset_token: hashedToken,
          password_reset_expires_at: {
            [Op.gt]: new Date()
          }
        }
      });

      if (!veterinarian) {
        return res.status(400).json({
          success: false,
          message: 'This password reset link is invalid or has expired'
        });
      }

      await veterinarian.setPassword(password);
      veterinarian.password_reset_token = null;
      veterinarian.password_reset_expires_at = null;
      await veterinarian.save();

      return res.json({
        success: true,
        message: 'Password reset successful. You can now sign in.'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to reset password'
      });
    }
  }

  // ============ PUBLIC ROUTES ============

  /**
   * Get nearby veterinarians (for farmers)
   * GET /api/veterinarians/nearby
   */
  async getNearbyVeterinarians(req, res) {
    try {
      const { latitude, longitude, radius = 50, specialization } = req.query;
      const parsedLatitude = Number.parseFloat(latitude);
      const parsedLongitude = Number.parseFloat(longitude);
      const parsedRadius = Number.parseFloat(radius);
      const validSpecializations = ['large_animal', 'small_animal', 'livestock', 'surgery', 'general', 'emergency', 'reproduction'];

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      if (
        !Number.isFinite(parsedLatitude) ||
        !Number.isFinite(parsedLongitude) ||
        parsedLatitude < -90 ||
        parsedLatitude > 90 ||
        parsedLongitude < -180 ||
        parsedLongitude > 180
      ) {
        return res.status(400).json({
          success: false,
          message: 'Please provide valid latitude and longitude coordinates'
        });
      }

      if (!Number.isFinite(parsedRadius) || parsedRadius <= 0 || parsedRadius > 500) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid nearby search radius'
        });
      }

      if (specialization && !validSpecializations.includes(specialization)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid veterinarian specialization filter'
        });
      }

      let veterinarians = await db.Veterinarian.findNearby(
        parsedLatitude,
        parsedLongitude,
        parsedRadius
      );

      // Filter by specialization if provided
      if (specialization) {
        veterinarians = veterinarians.filter(v => v.specialization === specialization);
      }

      // Remove sensitive fields
      const safeVets = veterinarians.map(vet => ({
        id: vet.id,
        full_name: vet.full_name,
        phone_number: vet.phone_number,
        email: vet.email,
        profile_photo: vet.profile_photo,
        specialization: vet.specialization,
        experience_years: vet.experience_years,
        qualification: vet.qualification,
        services: vet.services,
        consultation_fee: vet.consultation_fee,
        emergency_available: vet.emergency_available,
        clinic_name: vet.clinic_name,
        clinic_address: vet.clinic_address,
        city: vet.city,
        state: vet.state,
        rating: vet.rating,
        total_reviews: vet.total_reviews,
        distance: vet.distance
      }));

      res.json({
        success: true,
        data: safeVets,
        count: safeVets.length
      });
    } catch (error) {
      console.error('Get nearby veterinarians error:', error);
      res.status(500).json(buildServerErrorResponse('Failed to fetch veterinarians', error));
    }
  }

  /**
   * Get all verified veterinarians
   * GET /api/veterinarians
   */
  async getAllVeterinarians(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        city,
        state,
        specialization,
        sortBy = 'rating',
        order = 'DESC'
      } = req.query;
      const validSortFields = ['rating', 'total_reviews', 'consultation_fee', 'experience_years', 'created_at'];
      const validSpecializations = ['large_animal', 'small_animal', 'livestock', 'surgery', 'general', 'emergency', 'reproduction'];
      const sanitizedSortBy = validSortFields.includes(sortBy) ? sortBy : 'rating';
      const sanitizedOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const where = {
        verification_status: 'verified',
        is_active: true
      };

      if (city) where.city = { [Op.iLike]: `%${city}%` };
      if (state) where.state = { [Op.iLike]: `%${state}%` };
      if (specialization) {
        if (!validSpecializations.includes(specialization)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid veterinarian specialization filter'
          });
        }
        where.specialization = specialization;
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const veterinarians = await db.Veterinarian.findAndCountAll({
        where,
        attributes: [
          'id', 'full_name', 'phone_number', 'email', 'profile_photo',
          'specialization', 'experience_years', 'qualification', 'services',
          'consultation_fee', 'emergency_available', 'clinic_name', 'clinic_address',
          'city', 'state', 'rating', 'total_reviews'
        ],
        limit: parseInt(limit),
        offset,
        order: [[sanitizedSortBy, sanitizedOrder]]
      });

      res.json({
        success: true,
        data: {
          veterinarians: veterinarians.rows,
          totalCount: veterinarians.count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(veterinarians.count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get all veterinarians error:', error);
      res.status(500).json(buildServerErrorResponse('Failed to fetch veterinarians', error));
    }
  }

  /**
   * Get single veterinarian by ID
   * GET /api/veterinarians/:id
   */
  async getVeterinarianById(req, res) {
    try {
      const { id } = req.params;

      const veterinarian = await db.Veterinarian.findOne({
        where: {
          id,
          verification_status: 'verified',
          is_active: true
        },
        attributes: [
          'id', 'full_name', 'phone_number', 'email', 'profile_photo',
          'specialization', 'experience_years', 'qualification', 'services',
          'consultation_fee', 'available_hours', 'emergency_available',
          'clinic_name', 'clinic_address', 'city', 'state', 'pincode',
          'latitude', 'longitude', 'rating', 'total_reviews'
        ]
      });

      if (!veterinarian) {
        return res.status(404).json({
          success: false,
          message: 'Veterinarian not found'
        });
      }

      res.json({
        success: true,
        data: veterinarian
      });
    } catch (error) {
      console.error('Get veterinarian by ID error:', error);
      res.status(500).json(buildServerErrorResponse('Failed to fetch veterinarian', error));
    }
  }

  /**
   * Track public veterinarian interactions
   * POST /api/veterinarians/:id/track-interaction
   */
  async trackInteraction(req, res) {
    try {
      const { id } = req.params;
      const { leadType, sourcePage } = req.body || {};

      if (!PUBLIC_VET_LEAD_TYPES.has(leadType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid veterinarian interaction type'
        });
      }

      const veterinarian = await db.Veterinarian.findOne({
        where: {
          id,
          verification_status: 'verified',
          is_active: true
        },
        attributes: ['id']
      });

      if (!veterinarian) {
        return res.status(404).json({
          success: false,
          message: 'Veterinarian not found'
        });
      }

      const viewerUserId = extractOptionalUserId(req);
      const ipAddress = getClientIpAddress(req);
      const userAgent = req.headers['user-agent'] || null;
      const { start, end } = getIndiaDayBounds();
      const dedupeWhere = {
        veterinarian_id: veterinarian.id,
        lead_type: leadType,
        created_at: {
          [Op.gte]: start,
          [Op.lt]: end
        }
      };

      if (viewerUserId) {
        dedupeWhere.viewer_user_id = viewerUserId;
      } else if (ipAddress && userAgent) {
        dedupeWhere.ip_address = ipAddress;
        dedupeWhere.user_agent = userAgent;
      }

      const existingInteraction = await db.VetLeadLog.findOne({
        where: dedupeWhere,
        attributes: ['id']
      });

      if (existingInteraction) {
        return res.json({
          success: true,
          deduped: true,
          message: 'Interaction already tracked for today'
        });
      }

      await db.VetLeadLog.create({
        veterinarian_id: veterinarian.id,
        viewer_user_id: viewerUserId,
        lead_type: leadType,
        source_page: sanitizeSourcePage(sourcePage),
        ip_address: ipAddress,
        user_agent: userAgent
      });

      res.json({
        success: true,
        deduped: false,
        message: 'Interaction tracked successfully'
      });
    } catch (error) {
      if (isMissingRelationError(error, 'vet_lead_logs')) {
        console.warn('Vet lead tracking skipped because vet_lead_logs table is missing.');
        return res.status(202).json({
          success: true,
          message: 'Interaction accepted'
        });
      }

      console.error('Track veterinarian interaction error:', error);
      res.status(500).json(buildServerErrorResponse('Failed to track veterinarian interaction', error));
    }
  }

  // ============ PROTECTED ROUTES (Vet's own profile) ============

  /**
   * Get own profile
   * GET /api/veterinarians/profile
   */
  async getProfile(req, res) {
    try {
      const vetId = req.vet.id;

      const veterinarian = await db.Veterinarian.findByPk(vetId);
      if (!veterinarian) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      res.json({
        success: true,
        data: veterinarian
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json(buildServerErrorResponse('Failed to fetch profile', error));
    }
  }

  /**
   * Get dashboard data for veterinarian
   * GET /api/veterinarians/dashboard
   */
  async getDashboard(req, res) {
    try {
      const vetId = req.vet.id;

      const veterinarian = await db.Veterinarian.findByPk(vetId);
      if (!veterinarian) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      const now = new Date();
      const pad = (value) => String(value).padStart(2, '0');
      const formatDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      const daysAgo = (days) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
      const last30DaysStart = daysAgo(29);
      const weekStart = daysAgo(6);

      const latestReview = await db.VetReview.findOne({
        where: {
          veterinarian_id: vetId,
          is_visible: true
        },
        include: [{
          model: db.User,
          as: 'user',
          attributes: ['id', 'full_name', 'profile_photo']
        }],
        order: [['created_at', 'DESC']]
      });

      let totalProfileViews = 0;
      let whatsappClicks = 0;
      let callClicks = 0;
      let last30DaysViews = 0;
      let last30DaysLeads = 0;
      let recentLeadRows = [];
      let activityTrendRows = [];
      let leadSourceRows = [];

      try {
        [
          totalProfileViews,
          whatsappClicks,
          callClicks,
          last30DaysViews,
          last30DaysLeads,
          recentLeadRows,
          activityTrendRows,
          leadSourceRows
        ] = await Promise.all([
          db.VetLeadLog.count({
            where: {
              veterinarian_id: vetId,
              lead_type: 'profile_view'
            }
          }),
          db.VetLeadLog.count({
            where: {
              veterinarian_id: vetId,
              lead_type: 'whatsapp_click'
            }
          }),
          db.VetLeadLog.count({
            where: {
              veterinarian_id: vetId,
              lead_type: 'call_click'
            }
          }),
          db.VetLeadLog.count({
            where: {
              veterinarian_id: vetId,
              lead_type: 'profile_view',
              created_at: {
                [Op.gte]: last30DaysStart
              }
            }
          }),
          db.VetLeadLog.count({
            where: {
              veterinarian_id: vetId,
              lead_type: {
                [Op.in]: ['whatsapp_click', 'call_click']
              },
              created_at: {
                [Op.gte]: last30DaysStart
              }
            }
          }),
          db.VetLeadLog.findAll({
            where: {
              veterinarian_id: vetId,
              lead_type: {
                [Op.in]: ['whatsapp_click', 'call_click']
              }
            },
            include: [{
              model: db.User,
              as: 'viewer',
              attributes: ['id', 'full_name', 'phone_number']
            }],
            order: [['created_at', 'DESC']],
            limit: 10
          }),
          db.sequelize.query(`
            SELECT
              TO_CHAR(created_at::date, 'YYYY-MM-DD') AS day_key,
              COUNT(*) FILTER (WHERE lead_type = 'profile_view')::int AS profile_views,
              COUNT(*) FILTER (WHERE lead_type = 'whatsapp_click')::int AS whatsapp_clicks,
              COUNT(*) FILTER (WHERE lead_type = 'call_click')::int AS call_clicks
            FROM vet_lead_logs
            WHERE veterinarian_id = :vetId
              AND created_at >= :startDate
              AND created_at < :endDate
            GROUP BY 1
            ORDER BY 1 ASC
          `, {
            replacements: {
              vetId,
              startDate: weekStart,
              endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            },
            type: QueryTypes.SELECT
          }),
          db.sequelize.query(`
            SELECT
              lead_type,
              COUNT(*)::int AS total
            FROM vet_lead_logs
            WHERE veterinarian_id = :vetId
            GROUP BY lead_type
            ORDER BY total DESC, lead_type ASC
          `, {
            replacements: { vetId },
            type: QueryTypes.SELECT
          })
        ]);
      } catch (leadError) {
        if (isMissingRelationError(leadError, 'vet_lead_logs')) {
          console.warn('Vet dashboard lead metrics unavailable because vet_lead_logs table is missing.');
        } else {
          throw leadError;
        }
      }

      const weekKeys = Array.from({ length: 7 }, (_, index) =>
        formatDateKey(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index))
      );
      const activityTrendMap = new Map(activityTrendRows.map((row) => [row.day_key, row]));
      const activityTrend = weekKeys.map((dayKey) => {
        const row = activityTrendMap.get(dayKey);
        return {
          dayKey,
          profileViews: Number(row?.profile_views || 0),
          whatsappClicks: Number(row?.whatsapp_clicks || 0),
          callClicks: Number(row?.call_clicks || 0)
        };
      });

      const leadSourceBreakdown = leadSourceRows.map((row) => ({
        leadType: row.lead_type,
        value: Number(row.total || 0)
      }));

      const recentLeads = recentLeadRows.map((lead) => ({
        id: lead.id,
        leadType: lead.lead_type,
        sourcePage: lead.source_page,
        createdAt: lead.createdAt || lead.created_at,
        viewerName: lead.viewer?.full_name || 'Visitor',
        viewerPhone: lead.viewer?.phone_number || '',
        viewerId: lead.viewer?.id || null
      }));

      const profileCompletion = calculateProfileCompletion(veterinarian);
      const totalLeads = Number(whatsappClicks || 0) + Number(callClicks || 0);

      res.json({
        success: true,
        data: {
          profile: {
            ...veterinarian.toJSON(),
            profile_completion: profileCompletion
          },
          summary: {
            profileViews: Number(totalProfileViews || 0),
            whatsappClicks: Number(whatsappClicks || 0),
            callClicks: Number(callClicks || 0),
            totalLeads,
            averageRating: Number(veterinarian.rating || 0),
            totalReviews: Number(veterinarian.total_reviews || 0),
            profileCompletion,
            last30DaysViews: Number(last30DaysViews || 0),
            last30DaysLeads: Number(last30DaysLeads || 0)
          },
          charts: {
            activityTrend,
            leadSourceBreakdown
          },
          recentLeads,
          latestReview: latestReview ? {
            id: latestReview.id,
            rating: latestReview.rating,
            reviewText: latestReview.review_text,
            serviceType: latestReview.service_type,
            createdAt: latestReview.createdAt,
            userName: latestReview.user?.full_name || 'Farmer',
            userPhoto: latestReview.user?.profile_photo || null,
            vetResponse: latestReview.vet_response || null
          } : null
        }
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json(buildServerErrorResponse('Failed to fetch dashboard data', error));
    }
  }

  /**
   * Update own profile
   * PUT /api/veterinarians/profile
   */
  async updateProfile(req, res) {
    try {
      const vetId = req.vet.id;
      const updates = req.body;

      const veterinarian = await db.Veterinarian.findByPk(vetId);
      if (!veterinarian) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      // Fields that cannot be updated by the vet
      const protectedFields = [
        'id', 'phone_number', 'license_number', 'verification_status',
        'verified_by', 'verified_at', 'otp', 'otp_expiry', 'rating', 'total_reviews'
      ];
      protectedFields.forEach(field => delete updates[field]);

      // Handle file uploads
      if (req.files) {
        if (req.files.profile_photo && req.files.profile_photo[0]) {
          // Delete old photo
          if (veterinarian.profile_photo_public_id) {
            await deleteFromCloudinary(veterinarian.profile_photo_public_id);
          }
          const result = await uploadToCloudinary(req.files.profile_photo[0], 'veterinarians/account/profile-photos', 'image');
          updates.profile_photo = result.secure_url;
          updates.profile_photo_public_id = result.public_id;
        }
      }

      await veterinarian.update(updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: veterinarian
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json(buildServerErrorResponse('Failed to update profile', error));
    }
  }

  // ============ ADMIN ROUTES ============

  /**
   * Get pending verification requests
   * GET /api/admin/veterinarians/pending
   */
  async getPendingVerifications(req, res) {
    try {
      const veterinarians = await db.Veterinarian.findAll({
        where: { verification_status: 'pending' },
        order: [['created_at', 'ASC']]
      });

      res.json({
        success: true,
        data: veterinarians,
        count: veterinarians.length
      });
    } catch (error) {
      console.error('Get pending verifications error:', error);
      res.status(500).json(buildServerErrorResponse('Failed to fetch pending verifications', error));
    }
  }

  /**
   * Get all veterinarians for admin
   * GET /api/admin/veterinarians
   */
  async getAllForAdmin(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const validStatuses = ['pending', 'verified', 'rejected', 'suspended'];

      const where = {};
      if (status) {
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid veterinarian status filter'
          });
        }
        where.verification_status = status;
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const veterinarians = await db.Veterinarian.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          veterinarians: veterinarians.rows,
          totalCount: veterinarians.count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(veterinarians.count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get all for admin error:', error);
      res.status(500).json(buildServerErrorResponse('Failed to fetch veterinarians', error));
    }
  }

  /**
   * Verify/Approve a veterinarian
   * PATCH /api/admin/veterinarians/:id/verify
   */
  async verifyVeterinarian(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.admin.id;

      const veterinarian = await db.Veterinarian.findByPk(id);
      if (!veterinarian) {
        return res.status(404).json({
          success: false,
          message: 'Veterinarian not found'
        });
      }

      if (veterinarian.verification_status === 'verified' && veterinarian.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Veterinarian is already verified'
        });
      }

      // Check if email exists
      if (!veterinarian.email) {
        return res.status(400).json({
          success: false,
          message: 'Veterinarian does not have an email address. Cannot send credentials.'
        });
      }

      // Generate a random password
      const plainPassword = this.generatePassword(veterinarian.email, veterinarian.full_name);

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      // Update veterinarian status and password
      await veterinarian.update({
        verification_status: 'verified',
        is_active: true,
        verification_notes: notes,
        rejection_reason: null,
        verified_by: adminId,
        verified_at: new Date(),
        password: hashedPassword
      });

      // Send credentials email
      let emailSent = false;
      try {
        emailSent = await this.sendCredentialsEmail(veterinarian, plainPassword);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }

      res.json({
        success: true,
        message: emailSent
          ? 'Veterinarian verified successfully. Login credentials sent via email.'
          : 'Veterinarian verified successfully. Failed to send email - please manually share credentials.',
        emailSent,
        data: veterinarian
      });
    } catch (error) {
      console.error('Verify veterinarian error:', error);
      res.status(500).json(buildServerErrorResponse('Verification failed', error));
    }
  }

  /**
   * Reject a veterinarian
   * PATCH /api/admin/veterinarians/:id/reject
   */
  async rejectVeterinarian(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.admin.id;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const veterinarian = await db.Veterinarian.findByPk(id);
      if (!veterinarian) {
        return res.status(404).json({
          success: false,
          message: 'Veterinarian not found'
        });
      }

      await veterinarian.update({
        verification_status: 'rejected',
        rejection_reason: reason,
        verified_by: adminId,
        verified_at: new Date()
      });

      // TODO: Send notification to veterinarian with reason

      res.json({
        success: true,
        message: 'Veterinarian rejected',
        data: veterinarian
      });
    } catch (error) {
      console.error('Reject veterinarian error:', error);
      res.status(500).json(buildServerErrorResponse('Rejection failed', error));
    }
  }

  /**
   * Suspend a veterinarian
   * PATCH /api/admin/veterinarians/:id/suspend
   */
  async suspendVeterinarian(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const veterinarian = await db.Veterinarian.findByPk(id);
      if (!veterinarian) {
        return res.status(404).json({
          success: false,
          message: 'Veterinarian not found'
        });
      }

      await veterinarian.update({
        verification_status: 'suspended',
        is_active: false,
        verification_notes: reason
      });

      res.json({
        success: true,
        message: 'Veterinarian suspended',
        data: veterinarian
      });
    } catch (error) {
      console.error('Suspend veterinarian error:', error);
      res.status(500).json(buildServerErrorResponse('Suspension failed', error));
    }
  }

  /**
   * Get veterinarian stats for admin dashboard
   * GET /api/admin/veterinarians/stats
   */
  async getStats(req, res) {
    try {
      const [total, pending, verified, rejected, suspended] = await Promise.all([
        db.Veterinarian.count(),
        db.Veterinarian.count({ where: { verification_status: 'pending' } }),
        db.Veterinarian.count({ where: { verification_status: 'verified' } }),
        db.Veterinarian.count({ where: { verification_status: 'rejected' } }),
        db.Veterinarian.count({ where: { verification_status: 'suspended' } })
      ]);

      res.json({
        success: true,
        data: {
          total,
          pending,
          verified,
          rejected,
          suspended
        }
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json(buildServerErrorResponse('Failed to fetch stats', error));
    }
  }
}

module.exports = new VeterinarianController();
