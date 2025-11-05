'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cat_listings', {
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

      // 1. Cat Details / मांजराची माहिती
      cat_type: {
        type: Sequelize.ENUM('male', 'female'),
        allowNull: false
      },
      breed_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      age: {
        type: Sequelize.STRING,
        allowNull: false
      },
      color: {
        type: Sequelize.STRING,
        allowNull: false
      },
      weight: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      eye_color: {
        type: Sequelize.STRING,
        allowNull: false
      },
      fur_type: {
        type: Sequelize.ENUM('short', 'long', 'curly'),
        allowNull: false
      },
      vaccination_status: {
        type: Sequelize.ENUM('yes', 'no'),
        allowNull: false
      },
      health_condition: {
        type: Sequelize.ENUM('healthy', 'under_treatment'),
        allowNull: false
      },
      behavior: {
        type: Sequelize.ENUM('friendly', 'aggressive', 'calm'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      // 2. Images / छायाचित्रे
      photo_1: {
        type: Sequelize.STRING,
        allowNull: true
      },
      photo_1_public_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      photo_2: {
        type: Sequelize.STRING,
        allowNull: true
      },
      photo_2_public_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      photo_3: {
        type: Sequelize.STRING,
        allowNull: true
      },
      photo_3_public_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      photo_4: {
        type: Sequelize.STRING,
        allowNull: true
      },
      photo_4_public_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      photo_5: {
        type: Sequelize.STRING,
        allowNull: true
      },
      photo_5_public_id: {
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

      // 3. Pricing
      expected_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      is_negotiable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },

      // 4. Terms & Confirmation
      details_confirmed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      terms_accepted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    await queryInterface.addIndex('cat_listings', ['user_id']);
    await queryInterface.addIndex('cat_listings', ['status']);
    await queryInterface.addIndex('cat_listings', ['cat_type']);
    await queryInterface.addIndex('cat_listings', ['behavior']);
    await queryInterface.addIndex('cat_listings', ['city', 'state']);
    await queryInterface.addIndex('cat_listings', ['created_at']);
    await queryInterface.addIndex('cat_listings', ['latitude', 'longitude']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cat_listings');
  }
};
