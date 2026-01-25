'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class OtherAnimalListing extends Model {
    static associate(models) {
      // Association with User model
      OtherAnimalListing.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'seller'
      });
    }

    // Instance method to get listing with seller info
    async getWithSeller() {
      return await OtherAnimalListing.findByPk(this.id, {
        include: [{
          model: sequelize.models.User,
          as: 'seller',
          attributes: ['id', 'full_name', 'phone_number', 'city', 'state']
        }]
      });
    }

    // Instance method to increment views
    async incrementViews() {
      this.views += 1;
      await this.save();
      return this;
    }

    // Instance method to mark as sold
    async markAsSold() {
      this.status = 'sold';
      await this.save();
      return this;
    }

    // Instance method to soft delete
    async softDelete() {
      this.status = 'deleted';
      await this.save();
      return this;
    }
  }

  OtherAnimalListing.init({
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
      field: 'user_id'
    },

    // 1. Animal Type & Details
    animalType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'animal_type',
      validate: {
        notEmpty: true,
        isIn: [['sheep', 'pig', 'rabbit', 'chicken', 'duck', 'turkey', 'camel', 'donkey', 'mule', 'exotic', 'other']]
      }
    },
    breedName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'breed_name',
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    age: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: false,
      defaultValue: 'male'
    },

    // 2. Physical Details
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 99999.99
      }
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true
    },
    healthCondition: {
      type: DataTypes.ENUM('excellent', 'good', 'average'),
      allowNull: false,
      defaultValue: 'good',
      field: 'health_condition'
    },

    // 3. Special Features
    isTrainedForWork: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_trained_for_work'
    },
    specialSkills: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'special_skills'
    },
    temperament: {
      type: DataTypes.ENUM('friendly', 'calm', 'energetic', 'protective', 'independent'),
      allowNull: false,
      defaultValue: 'friendly'
    },

    // 4. Price & Negotiation
    expectedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'expected_price',
      validate: {
        min: 0
      }
    },
    isNegotiable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_negotiable'
    },

    // 5. Photos & Videos
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
    additionalPhoto: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'additional_photo'
    },
    additionalPhotoPublicId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'additional_photo_public_id'
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

    // 6. Additional Information
    vaccinationDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'vaccination_details'
    },
    deliveryAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'delivery_available'
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
    sequelize,
    modelName: 'OtherAnimalListing',
    tableName: 'other_animal_listings',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['animal_type'] },
      { fields: ['status'] },
      { fields: ['city', 'state'] },
      { fields: ['created_at'] },
      { fields: ['latitude', 'longitude'] }
    ]
  });

  // Class methods
  
  // Find all active listings
  OtherAnimalListing.findActive = async function(options = {}) {
    return await this.findAll({
      where: { status: 'active' },
      include: [{
        model: sequelize.models.User,
        as: 'seller',
        attributes: ['id', 'full_name', 'phone_number', 'city', 'state']
      }],
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  // Find by animal type
  OtherAnimalListing.findByAnimalType = async function(animalType, options = {}) {
    return await this.findAll({
      where: { 
        animal_type: animalType,
        status: 'active'
      },
      include: [{
        model: sequelize.models.User,
        as: 'seller',
        attributes: ['id', 'full_name', 'phone_number', 'city', 'state']
      }],
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  // Find by user
  OtherAnimalListing.findByUser = async function(userId) {
    return await this.findAll({
      where: { 
        user_id: userId,
        status: { [sequelize.Sequelize.Op.ne]: 'deleted' }
      },
      order: [['created_at', 'DESC']]
    });
  };

  // Search with filters
  OtherAnimalListing.search = async function(filters = {}) {
    const where = { status: 'active' };
    
    if (filters.animalType) {
      where.animal_type = filters.animalType;
    }
    
    if (filters.minPrice) {
      where.expected_price = { [sequelize.Sequelize.Op.gte]: filters.minPrice };
    }
    
    if (filters.maxPrice) {
      where.expected_price = where.expected_price || {};
      where.expected_price[sequelize.Sequelize.Op.lte] = filters.maxPrice;
    }
    
    if (filters.city) {
      where.city = { [sequelize.Sequelize.Op.like]: `%${filters.city}%` };
    }
    
    if (filters.state) {
      where.state = filters.state;
    }

    if (filters.gender) {
      where.gender = filters.gender;
    }

    if (filters.healthCondition) {
      where.health_condition = filters.healthCondition;
    }

    if (filters.temperament) {
      where.temperament = filters.temperament;
    }
    
    return await this.findAll({
      where,
      include: [{
        model: sequelize.models.User,
        as: 'seller',
        attributes: ['id', 'full_name', 'phone_number', 'city', 'state']
      }],
      order: [['created_at', 'DESC']],
      limit: filters.limit || 50,
      offset: filters.offset || 0
    });
  };

  // Find nearby listings (within radius)
  OtherAnimalListing.findNearby = async function(latitude, longitude, radiusKm = 50) {
    const listings = await this.findAll({
      where: {
        status: 'active',
        latitude: { [sequelize.Sequelize.Op.ne]: null },
        longitude: { [sequelize.Sequelize.Op.ne]: null }
      },
      include: [{
        model: sequelize.models.User,
        as: 'seller',
        attributes: ['id', 'full_name', 'phone_number', 'city', 'state']
      }]
    });

    // Filter by distance using Haversine formula
    const nearbyListings = listings.filter(listing => {
      const distance = calculateDistance(
        latitude, 
        longitude, 
        parseFloat(listing.latitude), 
        parseFloat(listing.longitude)
      );
      return distance <= radiusKm;
    });

    return nearbyListings;
  };

  return OtherAnimalListing;
};

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
