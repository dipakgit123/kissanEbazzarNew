'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('farmer_cows', {
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
      cow_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cow_tag: {
        type: Sequelize.STRING,
        allowNull: true
      },
      breed_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      age_years: {
        type: Sequelize.DECIMAL(4, 1),
        allowNull: true
      },
      notes: {
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

    await queryInterface.addIndex('farmer_cows', ['user_id']);
    await queryInterface.addIndex('farmer_cows', ['user_id', 'cow_name']);
    await queryInterface.addIndex('farmer_cows', ['user_id', 'cow_tag']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('farmer_cows');
  }
};
