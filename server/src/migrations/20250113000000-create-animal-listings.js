'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('animal_listings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
        // No foreign key constraint to avoid errors
      },
      breed_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      age: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: false
      },
      milk_capacity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      pregnancy_status: {
        type: Sequelize.ENUM('pregnant', 'not_pregnant', 'recently_delivered'),
        allowNull: false
      },
      has_horns: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      health_condition: {
        type: Sequelize.ENUM('excellent', 'good', 'average'),
        allowNull: false
      },
      expected_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      is_negotiable: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      front_photo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      front_photo_public_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      side_photo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      side_photo_public_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      milk_scene_photo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      milk_scene_photo_public_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      video: {
        type: Sequelize.STRING,
        allowNull: true
      },
      video_public_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      vaccination_details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      delivery_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      additional_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      pincode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'sold', 'expired', 'deleted'),
        defaultValue: 'active'
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
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

    // Add indexes
    await queryInterface.addIndex('animal_listings', ['user_id']);
    await queryInterface.addIndex('animal_listings', ['status']);
    await queryInterface.addIndex('animal_listings', ['breed_name']);
    await queryInterface.addIndex('animal_listings', ['city']);
    await queryInterface.addIndex('animal_listings', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('animal_listings');
  }
};