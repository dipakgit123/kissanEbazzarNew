'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pet_mating_reports', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      profile_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'pet_mating_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reporter_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reason: {
        type: Sequelize.ENUM('fake', 'inappropriate', 'wrong_information', 'spam', 'animal_welfare', 'other'),
        allowNull: false,
        defaultValue: 'other'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('open', 'reviewed', 'dismissed'),
        allowNull: false,
        defaultValue: 'open'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('pet_mating_reports', ['profile_id']);
    await queryInterface.addIndex('pet_mating_reports', ['reporter_id']);
    await queryInterface.addIndex('pet_mating_reports', ['reason']);
    await queryInterface.addIndex('pet_mating_reports', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pet_mating_reports');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pet_mating_reports_reason";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pet_mating_reports_status";');
  }
};
