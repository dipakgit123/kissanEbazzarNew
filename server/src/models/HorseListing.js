'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HorseListing = sequelize.define('HorseListing', {
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

  // 1. Horse Details / घोड्याची माहिती
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
  gender: {
    type: DataTypes.ENUM('male', 'female'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['male', 'female']],
        msg: 'Gender must be either male or female'
      }
    }
  },
  purpose: {
    type: DataTypes.ENUM('riding', 'racing', 'breeding'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['riding', 'racing', 'breeding']],
        msg: 'Purpose must be riding, racing, or breeding'
      }
    }
  },

  // 2. Physical Details / शारीरिक माहिती
  healthCondition: {
    type: DataTypes.ENUM('excellent', 'good', 'average'),
    allowNull: false,
    field: 'health_condition',
    defaultValue: 'good'
  },

  // 3. Price & Negotiation / किंमत आणि चर्चा
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

  // 4. Photos & Videos / छायाचित्रे आणि व्हिडिओ
  frontPhoto: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'front_photo'
  },
  frontPhotoPublicId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'front_photo_public_id'
  },
  sidePhoto: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'side_photo'
  },
  sidePhotoPublicId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'side_photo_public_id'
  },
  fullBodyPhoto: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'full_body_photo'
  },
  fullBodyPhotoPublicId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'full_body_photo_public_id'
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

  // 5. Additional Information / अतिरिक्त माहिती
  vaccinationDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'vaccination_details'
  },
  deliveryAvailable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'delivery_available',
    defaultValue: false
  },
  additionalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'additional_notes'
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
  tableName: 'horse_listings',
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
  HorseListing.prototype.incrementViews = async function() {
    this.views += 1;
    await this.save();
  };

  HorseListing.prototype.markAsSold = async function() {
    this.status = 'sold';
    await this.save();
  };

  HorseListing.prototype.isOwner = function(userId) {
    return this.user_id === userId;
  };

  // Calculate distance from a given point (Haversine formula)
  HorseListing.prototype.getDistanceFrom = function(lat, lon) {
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
  HorseListing.associate = (models) => {
    if (models.User) {
      HorseListing.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  };

  return HorseListing;
};
