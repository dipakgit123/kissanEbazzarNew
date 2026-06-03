'use strict';

const db = require('../models');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { Op, UniqueConstraintError, ValidationError } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { getJwtSecret } = require('../config/jwt');

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
      if (!full_name || !phone_number || !license_number || !latitude || !longitude || !city || !state || !pincode) {
        console.log('=== VALIDATION FAILED ===');
        console.log('Missing:', {
          full_name: !!full_name,
          phone_number: !!phone_number,
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
          message: 'Required fields: full_name, phone_number, license_number, latitude, longitude, city, state, pincode'
        });
      }

      // Check if phone number already exists
      const existingPhone = await db.Veterinarian.findByPhoneNumber(phone_number);
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already registered'
        });
      }

      // Check if license number already exists
      const existingLicense = await db.Veterinarian.findOne({
        where: { license_number }
      });
      if (existingLicense) {
        return res.status(400).json({
          success: false,
          message: 'License number already registered'
        });
      }

      if (normalizedEmail) {
        const existingEmail = await db.Veterinarian.findOne({
          where: { email: normalizedEmail }
        });

        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: 'Email address already registered'
          });
        }
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
            'veterinarians/license-documents',
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
              'veterinarians/profile-photos',
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
              'veterinarians/degree-certificates',
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
              'veterinarians/aadhar-documents',
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
          phone_number: 'Phone number already registered',
          license_number: 'License number already registered',
          email: 'Email address already registered'
        };

        return res.status(400).json({
          success: false,
          message: fieldMessages[field] || 'A veterinarian with the same details already exists'
        });
      }

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Please check the submitted details'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
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
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP',
        error: error.message
      });
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
      res.status(500).json({
        success: false,
        message: 'Verification failed',
        error: error.message
      });
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
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
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

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      let veterinarians = await db.Veterinarian.findNearby(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius)
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
      res.status(500).json({
        success: false,
        message: 'Failed to fetch veterinarians',
        error: error.message
      });
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
      res.status(500).json({
        success: false,
        message: 'Failed to fetch veterinarians',
        error: error.message
      });
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
          'latitude', 'longitude', 'rating', 'total_reviews', 'total_patients'
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
      res.status(500).json({
        success: false,
        message: 'Failed to fetch veterinarian',
        error: error.message
      });
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
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message
      });
    }
  }

  /**
   * Get dashboard data for veterinarian
   * GET /api/veterinarians/dashboard
   */
  async getDashboard(req, res) {
    try {
      const vetId = req.vet.id;

      // Get veterinarian profile
      const veterinarian = await db.Veterinarian.findByPk(vetId);
      if (!veterinarian) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      // Get appointment statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [totalAppointments, todayAppointments, pendingAppointments, recentAppointments] = await Promise.all([
        // Total appointments
        db.Appointment.count({
          where: { veterinarian_id: vetId }
        }),
        // Today's appointments
        db.Appointment.count({
          where: {
            veterinarian_id: vetId,
            appointment_date: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        }),
        // Pending appointments
        db.Appointment.count({
          where: {
            veterinarian_id: vetId,
            status: 'pending'
          }
        }),
        // Recent appointments
        db.Appointment.findAll({
          where: { veterinarian_id: vetId },
          include: [{
            model: db.User,
            as: 'user',
            attributes: ['id', 'full_name', 'phone_number']
          }],
          order: [['appointment_date', 'DESC'], ['appointment_time', 'DESC']],
          limit: 5
        })
      ]);

      // Format recent appointments
      const formattedAppointments = recentAppointments.map(apt => ({
        id: apt.id,
        userName: apt.user?.full_name || 'User',
        userPhone: apt.user?.phone_number || '',
        date: apt.appointment_date,
        time: apt.appointment_time,
        animalType: apt.animal_type,
        reason: apt.reason,
        status: apt.status
      }));

      res.json({
        success: true,
        stats: {
          totalAppointments,
          todayAppointments,
          pendingAppointments,
          totalEarnings: 0 // TODO: Calculate from completed appointments
        },
        recentAppointments: formattedAppointments
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message
      });
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
          const result = await uploadToCloudinary(req.files.profile_photo[0], 'image');
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
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
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
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending verifications',
        error: error.message
      });
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
      res.status(500).json({
        success: false,
        message: 'Failed to fetch veterinarians',
        error: error.message
      });
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
      res.status(500).json({
        success: false,
        message: 'Verification failed',
        error: error.message
      });
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
      res.status(500).json({
        success: false,
        message: 'Rejection failed',
        error: error.message
      });
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
      res.status(500).json({
        success: false,
        message: 'Suspension failed',
        error: error.message
      });
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
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stats',
        error: error.message
      });
    }
  }
}

module.exports = new VeterinarianController();
