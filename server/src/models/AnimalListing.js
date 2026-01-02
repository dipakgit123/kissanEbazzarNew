'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnimalListing = sequelize.define('AnimalListing', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    breedName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'breed_name'
    },
    age: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false
    },
    milkCapacity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'milk_capacity'
    },
    pregnancyStatus: {
      type: DataTypes.ENUM('pregnant', 'not_pregnant', 'recently_delivered'),
      allowNull: false,
      field: 'pregnancy_status'
    },
    hasHorns: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'has_horns'
    },
    healthCondition: {
      type: DataTypes.ENUM('excellent', 'good', 'average'),
      allowNull: false,
      field: 'health_condition'
    },
    expectedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'expected_price'
    },
    isNegotiable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_negotiable'
    },
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
    vaccinationDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'vaccination_details'
    },
    deliveryAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'delivery_available'
    },
    additionalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'additional_notes'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
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
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'sold', 'expired', 'deleted'),
      defaultValue: 'active'
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'animal_listings',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  AnimalListing.associate = (models) => {
    if (models.User) {
      AnimalListing.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'seller'
      });
    }
  };

  // Instance methods
  AnimalListing.prototype.incrementViews = async function() {
    this.views += 1;
    await this.save();
  };

  AnimalListing.prototype.markAsSold = async function() {
    this.status = 'sold';
    await this.save();
  };

  return AnimalListing
};