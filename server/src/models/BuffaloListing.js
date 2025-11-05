'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BuffaloListing = sequelize.define('BuffaloListing', {
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

  // 1. Buffalo Details / म्हशीची माहिती
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
  milkCapacity: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'milk_capacity',
    validate: {
      min: { args: [0], msg: 'Milk capacity must be positive' },
      max: { args: [100], msg: 'Milk capacity seems unrealistic' }
    }
  },
  pregnancyStatus: {
    type: DataTypes.ENUM('pregnant', 'not_pregnant', 'recently_delivered', 'unknown'),
    allowNull: false,
    field: 'pregnancy_status',
    defaultValue: 'unknown'
  },

  // 2. Physical Details / शारीरिक माहिती
  hasHorns: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'has_horns',
    defaultValue: true
  },
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
  milkScenePhoto: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'milk_scene_photo'
  },
  milkScenePhotoPublicId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'milk_scene_photo_public_id'
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
  tableName: 'buffalo_listings',
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
  BuffaloListing.prototype.incrementViews = async function() {
    this.views += 1;
    await this.save();
  };

  BuffaloListing.prototype.markAsSold = async function() {
    this.status = 'sold';
    await this.save();
  };

  BuffaloListing.prototype.isOwner = function(userId) {
    return this.user_id === userId;
  };

  // Calculate distance from a given point (Haversine formula)
  BuffaloListing.prototype.getDistanceFrom = function(lat, lon) {
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
  BuffaloListing.associate = (models) => {
    if (models.User) {
      BuffaloListing.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  };

  return BuffaloListing;
};
