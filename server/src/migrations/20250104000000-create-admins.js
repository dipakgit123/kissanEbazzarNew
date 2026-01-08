'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('admins', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      full_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('super_admin', 'admin', 'moderator'),
        defaultValue: 'admin'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      login_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    // Create contact_logs table
    await queryInterface.createTable('contact_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      viewer_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      seller_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      listing_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      listing_type: {
        type: Sequelize.ENUM('cow', 'buffalo', 'goat', 'horse', 'dog', 'cat'),
        allowNull: false
      },
      contact_type: {
        type: Sequelize.ENUM('phone_view', 'whatsapp_click', 'call_click'),
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
    await queryInterface.addIndex('contact_logs', ['viewer_user_id']);
    await queryInterface.addIndex('contact_logs', ['seller_user_id']);
    await queryInterface.addIndex('contact_logs', ['listing_id']);
    await queryInterface.addIndex('contact_logs', ['listing_type']);
    await queryInterface.addIndex('contact_logs', ['contact_type']);
    await queryInterface.addIndex('contact_logs', ['created_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('contact_logs');
    await queryInterface.dropTable('admins');
  }
};
