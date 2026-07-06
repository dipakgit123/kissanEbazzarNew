'use strict';

module.exports = (sequelize, DataTypes) => {
  const PetMatingProfile = sequelize.define('PetMatingProfile', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pet_type: {
      type: DataTypes.ENUM('dog', 'cat'),
      allowNull: false
    },
    pet_name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    breed: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: false
    },
    age_months: DataTypes.INTEGER,
    color: DataTypes.STRING(100),
    weight_kg: DataTypes.DECIMAL(7, 2),
    photos: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    photo_public_ids: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    video_url: DataTypes.STRING(500),
    video_public_id: DataTypes.STRING(255),
    vaccination_status: {
      type: DataTypes.ENUM('unknown', 'not_vaccinated', 'partial', 'up_to_date'),
      allowNull: false,
      defaultValue: 'unknown'
    },
    last_vaccination_date: DataTypes.DATEONLY,
    deworming_status: {
      type: DataTypes.ENUM('unknown', 'not_done', 'done'),
      allowNull: false,
      defaultValue: 'unknown'
    },
    last_deworming_date: DataTypes.DATEONLY,
    health_certificate_url: DataTypes.STRING(500),
    pedigree_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    registered_with: DataTypes.STRING(160),
    temperament: DataTypes.STRING(200),
    mating_experience: {
      type: DataTypes.ENUM('first_time', 'experienced', 'unknown'),
      allowNull: false,
      defaultValue: 'unknown'
    },
    fee_type: {
      type: DataTypes.ENUM('free', 'paid', 'negotiable'),
      allowNull: false,
      defaultValue: 'negotiable'
    },
    fee_amount: DataTypes.DECIMAL(12, 2),
    preferred_breed: DataTypes.STRING(160),
    preferred_gender: {
      type: DataTypes.ENUM('male', 'female', 'any'),
      allowNull: false,
      defaultValue: 'any'
    },
    available_from: DataTypes.DATEONLY,
    available_to: DataTypes.DATEONLY,
    description: DataTypes.TEXT,
    medical_notes: DataTypes.TEXT,
    owner_name: DataTypes.STRING(160),
    owner_phone: DataTypes.STRING(30),
    city: DataTypes.STRING(120),
    state: DataTypes.STRING(120),
    postal_code: DataTypes.STRING(20),
    latitude: DataTypes.DECIMAL(10, 8),
    longitude: DataTypes.DECIMAL(11, 8),
    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    contact_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    report_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'paused', 'matched', 'rejected', 'removed'),
      allowNull: false,
      defaultValue: 'active'
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    admin_notes: DataTypes.TEXT,
    published_at: DataTypes.DATE
  }, {
    tableName: 'pet_mating_profiles',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['pet_type'] },
      { fields: ['breed'] },
      { fields: ['gender'] },
      { fields: ['city'] },
      { fields: ['status'] },
      { fields: ['is_featured'] },
      { fields: ['published_at'] }
    ]
  });

  PetMatingProfile.associate = (models) => {
    if (models.User) {
      PetMatingProfile.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'owner'
      });
    }

    if (models.PetMatingReport) {
      PetMatingProfile.hasMany(models.PetMatingReport, {
        foreignKey: 'profile_id',
        as: 'reports'
      });
    }
  };

  return PetMatingProfile;
};
