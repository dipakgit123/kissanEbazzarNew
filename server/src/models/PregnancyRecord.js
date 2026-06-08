'use strict';

const { DataTypes } = require('sequelize');

// Pregnancy duration in days for different animal types
const PREGNANCY_DURATION = {
  cow: 280,      // ~9 months
  buffalo: 310,  // ~10 months (305-315 days)
  goat: 150,     // ~5 months (145-155 days)
  sheep: 150,    // ~5 months (145-155 days)
  horse: 340,    // ~11 months (335-345 days)
  dog: 63,       // ~2 months (58-68 days)
  cat: 65,       // ~2 months (63-67 days)
  pig: 114,      // ~4 months (112-115 days)
  other: 150     // Fallback when custom duration is not provided
};

module.exports = (sequelize) => {
  const PregnancyRecord = sequelize.define('PregnancyRecord', {
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
    listing_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'listing_id'
    },
    listing_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'listing_type'
    },
    animal_type: {
      type: DataTypes.ENUM('cow', 'buffalo', 'goat', 'sheep', 'horse', 'dog', 'cat', 'pig', 'other'),
      allowNull: false,
      field: 'animal_type'
    },
    animal_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'animal_name'
    },
    ear_badge_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'ear_badge_number'
    },
    breed_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'breed_name'
    },
    animal_photo: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'animal_photo'
    },
    mating_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'mating_date'
    },
    expected_delivery_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'expected_delivery_date'
    },
    actual_delivery_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'actual_delivery_date'
    },
    pregnancy_duration_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'pregnancy_duration_days'
    },
    bull_sire_details: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'bull_sire_details'
    },
    mating_type: {
      type: DataTypes.ENUM('natural', 'artificial_insemination'),
      defaultValue: 'natural',
      field: 'mating_type'
    },
    status: {
      type: DataTypes.ENUM('pregnant', 'delivered', 'miscarriage', 'false_pregnancy', 'cancelled'),
      defaultValue: 'pregnant'
    },
    health_status: {
      type: DataTypes.ENUM('healthy', 'needs_attention', 'critical'),
      defaultValue: 'healthy',
      field: 'health_status'
    },
    offspring_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'offspring_count'
    },
    offspring_gender: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'offspring_gender'
    },
    offspring_details: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'offspring_details'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    vet_checkup_dates: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'vet_checkup_dates',
      get() {
        const value = this.getDataValue('vet_checkup_dates');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('vet_checkup_dates', value ? JSON.stringify(value) : null);
      }
    },
    vaccination_dates: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'vaccination_dates',
      get() {
        const value = this.getDataValue('vaccination_dates');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('vaccination_dates', value ? JSON.stringify(value) : null);
      }
    },
    reminder_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'reminder_enabled'
    },
    last_reminder_sent: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_reminder_sent'
    }
  }, {
    tableName: 'pregnancy_records',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Associations
  PregnancyRecord.associate = (models) => {
    if (models.User) {
      PregnancyRecord.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'owner'
      });
    }
  };

  // Static method to get pregnancy duration for animal type
  PregnancyRecord.getPregnancyDuration = function(animalType, customDurationDays) {
    const normalizedType = animalType?.toLowerCase();
    const parsedCustomDuration = Number(customDurationDays);

    if (normalizedType === 'other' && Number.isFinite(parsedCustomDuration) && parsedCustomDuration > 0) {
      return Math.round(parsedCustomDuration);
    }

    return PREGNANCY_DURATION[normalizedType] || PREGNANCY_DURATION.other;
  };

  // Static method to calculate expected delivery date
  PregnancyRecord.calculateExpectedDeliveryDate = function(matingDate, animalType, customDurationDays) {
    const duration = this.getPregnancyDuration(animalType, customDurationDays);
    const date = new Date(matingDate);
    date.setDate(date.getDate() + duration);
    return date.toISOString().split('T')[0];
  };

  // Static method to get all pregnancy durations
  PregnancyRecord.getAllPregnancyDurations = function() {
    return PREGNANCY_DURATION;
  };

  // Instance method to calculate days remaining
  PregnancyRecord.prototype.getDaysRemaining = function() {
    if (this.status !== 'pregnant') return 0;
    const today = new Date();
    const expectedDate = new Date(this.expected_delivery_date);
    const diffTime = expectedDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Instance method to calculate pregnancy progress percentage
  PregnancyRecord.prototype.getProgressPercentage = function() {
    if (this.status !== 'pregnant') return 100;
    const matingDate = new Date(this.mating_date);
    const today = new Date();
    const daysPassed = Math.floor((today - matingDate) / (1000 * 60 * 60 * 24));
    const percentage = Math.min(100, Math.max(0, (daysPassed / this.pregnancy_duration_days) * 100));
    return Math.round(percentage);
  };

  // Instance method to get current trimester
  PregnancyRecord.prototype.getCurrentTrimester = function() {
    const progress = this.getProgressPercentage();
    if (progress <= 33) return 1;
    if (progress <= 66) return 2;
    return 3;
  };

  // Instance method to mark as delivered
  PregnancyRecord.prototype.markAsDelivered = async function(deliveryData) {
    this.status = 'delivered';
    this.actual_delivery_date = deliveryData.deliveryDate || new Date().toISOString().split('T')[0];
    if (deliveryData.offspringCount) this.offspring_count = deliveryData.offspringCount;
    if (deliveryData.offspringGender) this.offspring_gender = deliveryData.offspringGender;
    if (deliveryData.offspringDetails) this.offspring_details = deliveryData.offspringDetails;
    await this.save();
  };

  // Instance method to get pregnancy milestones
  PregnancyRecord.prototype.getMilestones = function() {
    const duration = this.pregnancy_duration_days;
    const matingDate = new Date(this.mating_date);

    const milestones = [
      { day: 0, name: 'Mating/Conception', date: matingDate.toISOString().split('T')[0] },
      { day: Math.round(duration * 0.25), name: 'First Trimester End', date: null },
      { day: Math.round(duration * 0.5), name: 'Mid-Pregnancy', date: null },
      { day: Math.round(duration * 0.75), name: 'Third Trimester Start', date: null },
      { day: Math.round(duration * 0.9), name: 'Prepare for Delivery', date: null },
      { day: duration, name: 'Expected Delivery', date: this.expected_delivery_date }
    ];

    // Calculate dates for milestones
    milestones.forEach(milestone => {
      if (!milestone.date) {
        const date = new Date(matingDate);
        date.setDate(date.getDate() + milestone.day);
        milestone.date = date.toISOString().split('T')[0];
      }

      // Check if milestone is passed
      milestone.passed = new Date(milestone.date) <= new Date();
    });

    return milestones;
  };

  return PregnancyRecord;
};
