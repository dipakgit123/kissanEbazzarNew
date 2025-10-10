'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('otp_logs', {
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      otp_code: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      action: {
        type: Sequelize.ENUM('sent', 'verified', 'failed', 'expired'),
        allowNull: false
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      twilio_message_sid: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      error_message: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex('otp_logs', ['user_id'], {
      name: 'otp_logs_user_id_index'
    });
    
    await queryInterface.addIndex('otp_logs', ['action'], {
      name: 'otp_logs_action_index'
    });
    
    await queryInterface.addIndex('otp_logs', ['created_at'], {
      name: 'otp_logs_created_at_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('otp_logs');
  }
};