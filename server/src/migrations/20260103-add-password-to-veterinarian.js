'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('veterinarians', 'password', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'verified_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('veterinarians', 'password');
  }
};
