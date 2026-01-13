'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('call_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      
      // Caller Information
      caller_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'User who made the call'
      },
      
      // Receiver Information
      receiver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'User who received the call'
      },
      
      // Call Context
      call_type: {
        type: Sequelize.ENUM('animal_listing', 'veterinarian', 'direct'),
        allowNull: false,
        defaultValue: 'direct',
        comment: 'Context of the call'
      },
      
      listing_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID of the animal listing if call_type is animal_listing'
      },
      
      listing_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Type of listing: cow, buffalo, cat, dog, goat, horse, other'
      },
      
      veterinarian_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'veterinarians',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'ID of veterinarian if call_type is veterinarian'
      },
      
      // Call Details
      receiver_phone_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Phone number that was called'
      },
      
      call_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duration of call in seconds (if tracked)'
      },
      
      call_status: {
        type: Sequelize.ENUM('initiated', 'answered', 'missed', 'busy', 'failed'),
        allowNull: false,
        defaultValue: 'initiated'
      },
      
      // Location Information
      caller_latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      
      caller_longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      
      // Metadata
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Browser/Device information'
      },
      
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes or context'
      },
      
      // Timestamps
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

    // Add indexes for performance
    await queryInterface.addIndex('call_logs', ['caller_id']);
    await queryInterface.addIndex('call_logs', ['receiver_id']);
    await queryInterface.addIndex('call_logs', ['call_type']);
    await queryInterface.addIndex('call_logs', ['listing_id', 'listing_type']);
    await queryInterface.addIndex('call_logs', ['veterinarian_id']);
    await queryInterface.addIndex('call_logs', ['created_at']);
    await queryInterface.addIndex('call_logs', ['caller_id', 'created_at']);
    await queryInterface.addIndex('call_logs', ['receiver_id', 'created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('call_logs');
  }
};
