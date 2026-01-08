'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pregnancy_records', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      // Reference to the animal listing (optional - user can add custom animals too)
      listing_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      listing_type: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'cow, buffalo, goat, horse, dog, cat'
      },
      // Animal details (for custom animals or copied from listing)
      animal_type: {
        type: Sequelize.ENUM('cow', 'buffalo', 'goat', 'sheep', 'horse', 'dog', 'cat', 'pig', 'other'),
        allowNull: false
      },
      animal_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Custom name given by the user'
      },
      breed_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      animal_photo: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      // Pregnancy dates
      mating_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Date when mating occurred'
      },
      expected_delivery_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Calculated based on animal type pregnancy duration'
      },
      actual_delivery_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Filled when delivery happens'
      },
      // Pregnancy details
      pregnancy_duration_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Standard pregnancy duration for this animal type'
      },
      bull_sire_details: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Details about the male used for mating'
      },
      mating_type: {
        type: Sequelize.ENUM('natural', 'artificial_insemination'),
        defaultValue: 'natural'
      },
      // Health and status
      status: {
        type: Sequelize.ENUM('pregnant', 'delivered', 'miscarriage', 'false_pregnancy', 'cancelled'),
        defaultValue: 'pregnant'
      },
      health_status: {
        type: Sequelize.ENUM('healthy', 'needs_attention', 'critical'),
        defaultValue: 'healthy'
      },
      // Offspring details (filled after delivery)
      offspring_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'Number of babies born'
      },
      offspring_gender: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Gender of offspring: male, female, or mixed'
      },
      offspring_details: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Details about the offspring'
      },
      // Reminders and notes
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      vet_checkup_dates: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of scheduled/completed vet checkup dates'
      },
      vaccination_dates: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of vaccination dates during pregnancy'
      },
      // Notifications
      reminder_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_reminder_sent: {
        type: Sequelize.DATE,
        allowNull: true
      },
      // Timestamps
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for faster queries
    await queryInterface.addIndex('pregnancy_records', ['user_id']);
    await queryInterface.addIndex('pregnancy_records', ['status']);
    await queryInterface.addIndex('pregnancy_records', ['animal_type']);
    await queryInterface.addIndex('pregnancy_records', ['expected_delivery_date']);
    await queryInterface.addIndex('pregnancy_records', ['mating_date']);
    await queryInterface.addIndex('pregnancy_records', ['listing_id', 'listing_type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pregnancy_records');
  }
};
