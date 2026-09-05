'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('veterinarians');
    if (table.password) return;

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
