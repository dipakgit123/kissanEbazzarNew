'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'profile_photo', {
      type: Sequelize.STRING(500),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'profile_photo_public_id', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'profile_photo');
    await queryInterface.removeColumn('users', 'profile_photo_public_id');
  }
};
