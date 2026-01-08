'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('appointments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      veterinarian_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'veterinarians',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      animal_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      animal_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      animal_age: {
        type: Sequelize.STRING,
        allowNull: true
      },
      animal_breed: {
        type: Sequelize.STRING,
        allowNull: true
      },
      appointment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      appointment_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      appointment_type: {
        type: Sequelize.ENUM('consultation', 'emergency', 'vaccination', 'surgery', 'checkup', 'other'),
        defaultValue: 'consultation'
      },
      symptoms: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no-show'),
        defaultValue: 'pending'
      },
      contact_preference: {
        type: Sequelize.ENUM('call', 'visit', 'both'),
        defaultValue: 'both'
      },
      farmer_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      farmer_phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      farmer_address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      farmer_latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      farmer_longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      consultation_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      vet_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      cancelled_by: {
        type: Sequelize.ENUM('user', 'veterinarian', 'system'),
        allowNull: true
      },
      cancellation_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      confirmed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.addIndex('appointments', ['user_id']);
    await queryInterface.addIndex('appointments', ['veterinarian_id']);
    await queryInterface.addIndex('appointments', ['status']);
    await queryInterface.addIndex('appointments', ['appointment_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('appointments');
  }
};
