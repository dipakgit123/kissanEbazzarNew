'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('wishlists', {
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
      animal_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Type of animal listing: cow, buffalo, horse, goat, cat, dog, other'
      },
      animal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID of the animal in the respective animal_listings table'
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

    // Add composite unique index to prevent duplicate entries
    await queryInterface.addIndex('wishlists', ['user_id', 'animal_type', 'animal_id'], {
      unique: true,
      name: 'wishlists_user_animal_unique'
    });

    // Add index for faster queries
    await queryInterface.addIndex('wishlists', ['user_id'], {
      name: 'wishlists_user_id_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('wishlists');
  }
};
