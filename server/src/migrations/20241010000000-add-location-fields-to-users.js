'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add location fields to users table
    await queryInterface.addColumn('users', 'latitude', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'longitude', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'address', {
      type: Sequelize.STRING(500),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'city', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'state', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'country', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'postal_code', {
      type: Sequelize.STRING(20),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'location_type', {
      type: Sequelize.ENUM('current', 'manual'),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'location_set_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add indexes for location queries
    await queryInterface.addIndex('users', ['latitude', 'longitude']);
    await queryInterface.addIndex('users', ['city']);
    await queryInterface.addIndex('users', ['state']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'latitude');
    await queryInterface.removeColumn('users', 'longitude');
    await queryInterface.removeColumn('users', 'address');
    await queryInterface.removeColumn('users', 'city');
    await queryInterface.removeColumn('users', 'state');
    await queryInterface.removeColumn('users', 'country');
    await queryInterface.removeColumn('users', 'postal_code');
    await queryInterface.removeColumn('users', 'location_type');
    await queryInterface.removeColumn('users', 'location_set_at');
  }
};