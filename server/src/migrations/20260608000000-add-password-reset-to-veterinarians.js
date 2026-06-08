'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('veterinarians', 'password_reset_token', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('veterinarians', 'password_reset_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('veterinarians', 'password_reset_expires_at');
    await queryInterface.removeColumn('veterinarians', 'password_reset_token');
  }
};
