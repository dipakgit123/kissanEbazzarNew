'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('horse_listings', {
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

      // 1. Horse Details / घोड्याची माहिती
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
        allowNull: false
      },
      purpose: {
        type: Sequelize.ENUM('riding', 'racing', 'breeding'),
        allowNull: false
      },

      // 2. Physical Details / शारीरिक माहिती
      health_condition: {
        type: Sequelize.ENUM('excellent', 'good', 'average'),
        allowNull: false,
        defaultValue: 'good'
      },

      // 3. Price & Negotiation / किंमत आणि चर्चा
      expected_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      is_negotiable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },

      // 4. Photos & Videos / छायाचित्रे आणि व्हिडिओ
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
      full_body_photo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      full_body_photo_public_id: {
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

      // 5. Additional Information / अतिरिक्त माहिती
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
    await queryInterface.addIndex('horse_listings', ['user_id']);
    await queryInterface.addIndex('horse_listings', ['status']);
    await queryInterface.addIndex('horse_listings', ['city', 'state']);
    await queryInterface.addIndex('horse_listings', ['created_at']);
    await queryInterface.addIndex('horse_listings', ['latitude', 'longitude']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('horse_listings');
  }
};
