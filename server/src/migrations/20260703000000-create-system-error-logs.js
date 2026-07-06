'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('system_error_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      source: {
        type: Sequelize.ENUM('api', 'process', 'startup', 'background'),
        allowNull: false,
        defaultValue: 'api'
      },
      severity: {
        type: Sequelize.ENUM('warning', 'error', 'fatal'),
        allowNull: false,
        defaultValue: 'error'
      },
      error_name: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      stack: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      method: {
        type: Sequelize.STRING(12),
        allowNull: true
      },
      route: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      status_code: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      admin_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      ip_address: {
        type: Sequelize.STRING(80),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      request_params: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      request_query: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      request_body: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      request_headers: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('system_error_logs', ['source']);
    await queryInterface.addIndex('system_error_logs', ['severity']);
    await queryInterface.addIndex('system_error_logs', ['status_code']);
    await queryInterface.addIndex('system_error_logs', ['user_id']);
    await queryInterface.addIndex('system_error_logs', ['admin_id']);
    await queryInterface.addIndex('system_error_logs', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('system_error_logs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_system_error_logs_source";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_system_error_logs_severity";');
  }
};
