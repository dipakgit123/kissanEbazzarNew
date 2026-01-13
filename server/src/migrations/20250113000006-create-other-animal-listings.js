'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('other_animal_listings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },

      // 1. Animal Type & Details
      animal_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Type of animal: sheep, pig, rabbit, chicken, camel, etc.'
      },
      breed_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      age: {
        type: Sequelize.STRING,
        allowNull: false
      },
      gender: {
        type: Sequelize.ENUM('male', 'female'),
        allowNull: false,
        defaultValue: 'male'
      },

      // 2. Physical Details
      weight: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
        comment: 'Weight in kilograms'
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Color or appearance description'
      },
      health_condition: {
        type: Sequelize.ENUM('excellent', 'good', 'average'),
        allowNull: false,
        defaultValue: 'good'
      },

      // 3. Special Features
      is_trained_for_work: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether trained for work or specific tasks'
      },
      special_skills: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Any special skills or abilities'
      },
      temperament: {
        type: Sequelize.ENUM('friendly', 'calm', 'energetic', 'protective', 'independent'),
        allowNull: false,
        defaultValue: 'friendly'
      },

      // 4. Price & Negotiation
      expected_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      is_negotiable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },

      // 5. Photos & Videos
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
      additional_photo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      additional_photo_public_id: {
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

      // 6. Additional Information
      vaccination_details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      delivery_available: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      additional_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      // Location fields
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
        type: Sequelize.STRING(10),
        allowNull: true
      },

      // Status and metadata
      status: {
        type: Sequelize.ENUM('active', 'sold', 'expired', 'deleted'),
        defaultValue: 'active',
        allowNull: false
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('other_animal_listings', ['user_id']);
    await queryInterface.addIndex('other_animal_listings', ['animal_type']);
    await queryInterface.addIndex('other_animal_listings', ['status']);
    await queryInterface.addIndex('other_animal_listings', ['city', 'state']);
    await queryInterface.addIndex('other_animal_listings', ['created_at']);
    await queryInterface.addIndex('other_animal_listings', ['latitude', 'longitude']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('other_animal_listings');
  }
};
