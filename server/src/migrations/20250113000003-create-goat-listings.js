'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('goat_listings', {
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

      // 1. Goat Details / शेळीची माहिती
      goat_type: {
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
      weight: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      color: {
        type: Sequelize.STRING,
        allowNull: false
      },
      horn_type: {
        type: Sequelize.ENUM('with_horns', 'without_horns'),
        allowNull: false
      },
      health_status: {
        type: Sequelize.ENUM('healthy', 'under_treatment', 'vaccinated'),
        allowNull: false
      },
      purpose: {
        type: Sequelize.ENUM('milk', 'meat', 'breeding', 'pet'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      // 2. Production Info (for female goats) / उत्पादन माहिती
      milk_capacity: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      last_delivery_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      number_of_kids_delivered: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      // 3. Images / छायाचित्रे
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

      // 4. Pricing
      expected_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      is_negotiable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },

      // 5. Terms & Confirmation
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
    await queryInterface.addIndex('goat_listings', ['user_id']);
    await queryInterface.addIndex('goat_listings', ['status']);
    await queryInterface.addIndex('goat_listings', ['goat_type']);
    await queryInterface.addIndex('goat_listings', ['purpose']);
    await queryInterface.addIndex('goat_listings', ['city', 'state']);
    await queryInterface.addIndex('goat_listings', ['created_at']);
    await queryInterface.addIndex('goat_listings', ['latitude', 'longitude']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('goat_listings');
  }
};
