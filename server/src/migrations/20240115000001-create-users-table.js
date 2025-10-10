'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true
      },
      otp: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      otp_expiry: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      otp_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      last_otp_sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_blocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      blocked_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
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
    await queryInterface.addIndex('users', ['phone_number'], {
      unique: true,
      name: 'users_phone_number_unique'
    });
    
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'users_email_unique'
    });
    
    await queryInterface.addIndex('users', ['is_verified'], {
      name: 'users_is_verified_index'
    });
    
    await queryInterface.addIndex('users', ['created_at'], {
      name: 'users_created_at_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};