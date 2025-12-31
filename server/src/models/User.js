'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
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
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'full_name'
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
    otp: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    otp_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'otp_expiry'
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_verified'
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at'
    },
    otp_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'otp_attempts'
    },
    last_otp_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_otp_sent_at'
    },
    is_blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_blocked'
    },
    blocked_until: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'blocked_until'
    },
    // Location fields - stored once
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: -90,
        max: 90
      }
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      validate: {
        min: -180,
        max: 180
      }
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'postal_code'
    },
    location_type: {
      type: DataTypes.ENUM('current', 'manual'),
      allowNull: true,
      field: 'location_type'
    },
    location_set_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'location_set_at'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    // Profile photo fields
    profile_photo: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'profile_photo'
    },
    profile_photo_public_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'profile_photo_public_id'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['phone_number']
      },
      {
        fields: ['is_verified']
      },
      {
        fields: ['latitude', 'longitude']
      },
      {
        fields: ['city']
      },
      {
        fields: ['state']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeCreate: (user) => {
        console.log('Creating new user:', user.phone_number);
      },
      afterCreate: (user) => {
        console.log('User created:', user.id);
      }
    },
    scopes: {
      verified: {
        where: {
          is_verified: true
        }
      },
      unverified: {
        where: {
          is_verified: false
        }
      },
      active: {
        where: {
          is_blocked: false
        }
      },
      withLocation: {
        where: sequelize.and(
          sequelize.where(sequelize.col('latitude'), '!=', null),
          sequelize.where(sequelize.col('longitude'), '!=', null)
        )
      }
    }
  });

  // Instance methods
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.otp;
    delete values.otp_expiry;
    return values;
  };

  User.prototype.isOtpValid = function() {
    if (!this.otp_expiry) return false;
    return new Date() < new Date(this.otp_expiry);
  };

  User.prototype.canRequestOtp = function() {
    if (!this.last_otp_sent_at) return true;
    const timeDiff = Date.now() - new Date(this.last_otp_sent_at).getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    return minutesDiff >= 1;
  };

  User.prototype.hasLocation = function() {
    return this.latitude !== null && this.longitude !== null;
  };

  User.prototype.getDistanceFrom = function(lat, lon) {
    if (!this.hasLocation()) return null;
    
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat - this.latitude) * Math.PI / 180;
    const dLon = (lon - this.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Class methods
  User.findByPhoneNumber = async function(phoneNumber) {
    return await this.findOne({ where: { phone_number: phoneNumber } });
  };

  User.getVerifiedUsers = async function() {
    return await this.scope('verified').findAll();
  };

// Update the findNearby method in your User.js model

User.findNearby = async function(latitude, longitude, radiusKm = 10) {
  // PostgreSQL-compatible query using subquery
  const query = `
    SELECT * FROM (
      SELECT *, 
        (6371 * acos(
          LEAST(1.0, 
            cos(radians(:lat)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(:lon)) + 
            sin(radians(:lat)) * sin(radians(latitude))
          )
        )) AS distance 
      FROM users 
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL
    ) AS users_with_distance
    WHERE distance < :radius
    ORDER BY distance;
  `;
  
  return await sequelize.query(query, {
    replacements: { 
      lat: latitude, 
      lon: longitude, 
      radius: radiusKm 
    },
    type: sequelize.QueryTypes.SELECT,
    model: this,
    mapToModel: true
  });
};

  // Associations
  User.associate = function(models) {
    // Only create associations if the models exist
    if (models.OtpLog) {
      User.hasMany(models.OtpLog, {
        foreignKey: 'user_id',
        as: 'otpLogs'
      });
    }
    
    if (models.UserLocationHistory) {
      User.hasMany(models.UserLocationHistory, {
        foreignKey: 'user_id',
        as: 'locationHistory'
      });
    }
  };

  return User;
};