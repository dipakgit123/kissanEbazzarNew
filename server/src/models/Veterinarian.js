'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Veterinarian = sequelize.define('Veterinarian', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // Basic Information
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'full_name'
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        is: {
          args: /^\+[1-9]\d{1,14}$/,
          msg: 'Phone number must be in E.164 format'
        }
      },
      field: 'phone_number'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Must be a valid email address'
        }
      }
    },
    profile_photo: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'profile_photo'
    },
    profile_photo_public_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'profile_photo_public_id'
    },

    // Professional Information
    specialization: {
      type: DataTypes.ENUM(
        'large_animal',      // Cows, Buffalos, Horses
        'small_animal',      // Dogs, Cats, Goats
        'livestock',         // Farm animals
        'surgery',           // Surgical specialist
        'general',           // General practice
        'emergency',         // Emergency care
        'reproduction'       // Breeding & pregnancy
      ),
      allowNull: false,
      defaultValue: 'general'
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'experience_years'
    },
    qualification: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'e.g., BVSc, MVSc, PhD'
    },
    services: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of services offered: vaccination, surgery, checkup, etc.'
    },
    consultation_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'consultation_fee'
    },
    available_hours: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      field: 'available_hours',
      comment: 'Working hours for each day'
    },
    emergency_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'emergency_available'
    },

    // Verification Documents
    license_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'license_number',
      comment: 'State Veterinary Council Registration Number'
    },
    license_document: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'license_document',
      comment: 'Cloudinary URL for license document'
    },
    license_document_public_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'license_document_public_id'
    },
    degree_certificate: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'degree_certificate',
      comment: 'Cloudinary URL for degree certificate'
    },
    degree_certificate_public_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'degree_certificate_public_id'
    },
    aadhar_document: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'aadhar_document',
      comment: 'Cloudinary URL for Aadhar card (optional)'
    },
    aadhar_document_public_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'aadhar_document_public_id'
    },

    // Clinic Information
    clinic_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'clinic_name'
    },
    clinic_address: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'clinic_address'
    },

    // Location (for nearby search)
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: {
        min: -90,
        max: 90
      }
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      validate: {
        min: -180,
        max: 180
      }
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: false
    },

    // Verification Status
    verification_status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected', 'suspended'),
      defaultValue: 'pending',
      allowNull: false,
      field: 'verification_status'
    },
    verification_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'verification_notes',
      comment: 'Admin notes during verification'
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason'
    },
    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'verified_by',
      comment: 'Admin ID who verified'
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at'
    },

    // Authentication
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Hashed password - set after admin verification'
    },
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_reset_token'
    },
    password_reset_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_expires_at'
    },
    otp: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    otp_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'otp_expiry'
    },
    is_phone_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_phone_verified'
    },

    // Status & Stats
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    total_reviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_reviews'
    },
    total_patients: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_patients'
    }
  }, {
    sequelize,
    modelName: 'Veterinarian',
    tableName: 'veterinarians',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['phone_number']
      },
      {
        unique: true,
        fields: ['license_number']
      },
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['verification_status']
      },
      {
        fields: ['specialization']
      },
      {
        fields: ['city']
      },
      {
        fields: ['state']
      },
      {
        fields: ['latitude', 'longitude']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['rating']
      }
    ]
  });

  // Instance methods
  Veterinarian.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.otp;
    delete values.otp_expiry;
    delete values.password;
    delete values.password_reset_token;
    delete values.password_reset_expires_at;
    return values;
  };

  Veterinarian.prototype.isOtpValid = function() {
    if (!this.otp_expiry) return false;
    return new Date() < new Date(this.otp_expiry);
  };

  Veterinarian.prototype.isVerified = function() {
    return this.verification_status === 'verified';
  };

  Veterinarian.prototype.canPractice = function() {
    return this.verification_status === 'verified' && this.is_active;
  };

  // Validate password
  Veterinarian.prototype.validatePassword = async function(password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
  };

  // Set password (hash it)
  Veterinarian.prototype.setPassword = async function(password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(password, salt);
    await this.save();
  };

  // Class methods - Find nearby veterinarians
  Veterinarian.findNearby = async function(latitude, longitude, radiusKm = 50) {
    const query = `
      SELECT *,
        (6371 * acos(
          LEAST(1.0,
            cos(radians(:lat)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(:lon)) +
            sin(radians(:lat)) * sin(radians(latitude))
          )
        )) AS distance
      FROM veterinarians
      WHERE verification_status = 'verified'
        AND is_active = true
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND (6371 * acos(
          LEAST(1.0,
            cos(radians(:lat)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(:lon)) +
            sin(radians(:lat)) * sin(radians(latitude))
          )
        )) < :radius
      ORDER BY distance
      LIMIT 50;
    `;

    return await sequelize.query(query, {
      replacements: {
        lat: parseFloat(latitude),
        lon: parseFloat(longitude),
        radius: radiusKm
      },
      type: sequelize.QueryTypes.SELECT
    });
  };

  // Find by phone
  Veterinarian.findByPhoneNumber = async function(phoneNumber) {
    return await this.findOne({ where: { phone_number: phoneNumber } });
  };

  // Get pending verifications
  Veterinarian.getPendingVerifications = async function() {
    return await this.findAll({
      where: { verification_status: 'pending' },
      order: [['created_at', 'ASC']]
    });
  };

  // Associations
  Veterinarian.associate = function(models) {
    if (models.Admin) {
      Veterinarian.belongsTo(models.Admin, {
        foreignKey: 'verified_by',
        as: 'verifier'
      });
    }
    if (models.VetReview) {
      Veterinarian.hasMany(models.VetReview, {
        foreignKey: 'veterinarian_id',
        as: 'reviews'
      });
    }
    if (models.VetReport) {
      Veterinarian.hasMany(models.VetReport, {
        foreignKey: 'veterinarian_id',
        as: 'reports'
      });
    }
    if (models.VetLeadLog) {
      Veterinarian.hasMany(models.VetLeadLog, {
        foreignKey: 'veterinarian_id',
        as: 'lead_logs'
      });
    }
  };

  return Veterinarian;
};
