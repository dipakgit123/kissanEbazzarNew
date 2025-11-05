'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CatListing = sequelize.define('CatListing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },

  // 1. Cat Details / मांजराची माहिती
  catType: {
    type: DataTypes.ENUM('male', 'female'),
    allowNull: false,
    field: 'cat_type',
    validate: {
      isIn: {
        args: [['male', 'female']],
        msg: 'Cat type must be either male or female'
      }
    }
  },
  breedName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'breed_name',
    validate: {
      notEmpty: { msg: 'Breed name is required' }
    }
  },
  age: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Age is required' }
    }
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Color is required' }
    }
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Weight must be positive' },
      max: { args: [50], msg: 'Weight seems unrealistic for a cat' }
    }
  },
  eyeColor: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'eye_color',
    validate: {
      notEmpty: { msg: 'Eye color is required' }
    }
  },
  furType: {
    type: DataTypes.ENUM('short', 'long', 'curly'),
    allowNull: false,
    field: 'fur_type',
    validate: {
      isIn: {
        args: [['short', 'long', 'curly']],
        msg: 'Fur type must be short, long, or curly'
      }
    }
  },
  vaccinationStatus: {
    type: DataTypes.ENUM('yes', 'no'),
    allowNull: false,
    field: 'vaccination_status',
    validate: {
      isIn: {
        args: [['yes', 'no']],
        msg: 'Vaccination status must be yes or no'
      }
    }
  },
  healthCondition: {
    type: DataTypes.ENUM('healthy', 'under_treatment'),
    allowNull: false,
    field: 'health_condition',
    validate: {
      isIn: {
        args: [['healthy', 'under_treatment']],
        msg: 'Health condition must be healthy or under_treatment'
      }
    }
  },
  behavior: {
    type: DataTypes.ENUM('friendly', 'aggressive', 'calm'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['friendly', 'aggressive', 'calm']],
        msg: 'Behavior must be friendly, aggressive, or calm'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // 2. Images / छायाचित्रे
  photo1: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'photo_1'
  },
  photo1PublicId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'photo_1_public_id'
  },
  photo2: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'photo_2'
  },
  photo2PublicId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'photo_2_public_id'
  },
  photo3: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'photo_3'
  },
  photo3PublicId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'photo_3_public_id'
  },
  photo4: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'photo_4'
  },
  photo4PublicId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'photo_4_public_id'
  },
  photo5: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'photo_5'
  },
  photo5PublicId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'photo_5_public_id'
  },
  video: {
    type: DataTypes.STRING,
    allowNull: true
  },
  videoPublicId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'video_public_id'
  },

  // 3. Pricing
  expectedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'expected_price',
    validate: {
      min: { args: [0], msg: 'Price must be positive' }
    }
  },
  isNegotiable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'is_negotiable',
    defaultValue: true
  },

  // 4. Terms & Confirmation
  detailsConfirmed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'details_confirmed',
    defaultValue: false
  },
  termsAccepted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'terms_accepted',
    defaultValue: false
  },

  // Location fields
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
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },

  // Status and metadata
  status: {
    type: DataTypes.ENUM('active', 'sold', 'expired', 'deleted'),
    defaultValue: 'active',
    allowNull: false
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  tableName: 'cat_listings',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['cat_type']
    },
    {
      fields: ['behavior']
    },
    {
      fields: ['city', 'state']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['latitude', 'longitude']
    }
  ]
});

  // Instance methods
  CatListing.prototype.incrementViews = async function() {
    this.views += 1;
    await this.save();
  };

  CatListing.prototype.markAsSold = async function() {
    this.status = 'sold';
    await this.save();
  };

  CatListing.prototype.isOwner = function(userId) {
    return this.user_id === userId;
  };

  // Calculate distance from a given point (Haversine formula)
  CatListing.prototype.getDistanceFrom = function(lat, lon) {
    if (!this.latitude || !this.longitude) return null;

    const R = 6371; // Earth's radius in km
    const dLat = (lat - this.latitude) * Math.PI / 180;
    const dLon = (lon - this.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Associate with User model
  CatListing.associate = (models) => {
    if (models.User) {
      CatListing.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  };

  return CatListing;
};
