'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GoatListing = sequelize.define('GoatListing', {
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

  // 1. Goat Details / शेळीची माहिती
  goatType: {
    type: DataTypes.ENUM('male', 'female'),
    allowNull: false,
    field: 'goat_type',
    validate: {
      isIn: {
        args: [['male', 'female']],
        msg: 'Goat type must be either male or female'
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
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Weight must be positive' },
      max: { args: [200], msg: 'Weight seems unrealistic' }
    }
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Color is required' }
    }
  },
  hornType: {
    type: DataTypes.ENUM('with_horns', 'without_horns'),
    allowNull: false,
    field: 'horn_type',
    validate: {
      isIn: {
        args: [['with_horns', 'without_horns']],
        msg: 'Horn type must be with_horns or without_horns'
      }
    }
  },
  healthStatus: {
    type: DataTypes.ENUM('healthy', 'under_treatment', 'vaccinated'),
    allowNull: false,
    field: 'health_status',
    validate: {
      isIn: {
        args: [['healthy', 'under_treatment', 'vaccinated']],
        msg: 'Invalid health status'
      }
    }
  },
  purpose: {
    type: DataTypes.ENUM('milk', 'meat', 'breeding', 'pet'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['milk', 'meat', 'breeding', 'pet']],
        msg: 'Purpose must be milk, meat, breeding, or pet'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // 2. Production Info (for female goats) / उत्पादन माहिती
  milkCapacity: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'milk_capacity',
    validate: {
      min: { args: [0], msg: 'Milk capacity must be positive' }
    }
  },
  lastDeliveryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'last_delivery_date'
  },
  numberOfKidsDelivered: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'number_of_kids_delivered',
    validate: {
      min: { args: [0], msg: 'Number of kids must be positive' }
    }
  },

  // 3. Images / छायाचित्रे
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

  // 4. Pricing
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

  // 5. Terms & Confirmation
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
  tableName: 'goat_listings',
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
      fields: ['goat_type']
    },
    {
      fields: ['purpose']
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
  GoatListing.prototype.incrementViews = async function() {
    this.views += 1;
    await this.save();
  };

  GoatListing.prototype.markAsSold = async function() {
    this.status = 'sold';
    await this.save();
  };

  GoatListing.prototype.isOwner = function(userId) {
    return this.user_id === userId;
  };

  // Calculate distance from a given point (Haversine formula)
  GoatListing.prototype.getDistanceFrom = function(lat, lon) {
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
  GoatListing.associate = (models) => {
    if (models.User) {
      GoatListing.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  };

  return GoatListing;
};
