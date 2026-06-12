'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vet_lead_logs', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
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
      viewer_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      lead_type: {
        type: Sequelize.ENUM('profile_view', 'whatsapp_click', 'call_click'),
        allowNull: false
      },
      source_page: {
        type: Sequelize.STRING(100),
        allowNull: true
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
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('vet_lead_logs', ['veterinarian_id']);
    await queryInterface.addIndex('vet_lead_logs', ['viewer_user_id']);
    await queryInterface.addIndex('vet_lead_logs', ['lead_type']);
    await queryInterface.addIndex('vet_lead_logs', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vet_lead_logs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_vet_lead_logs_lead_type";');
  }
};
