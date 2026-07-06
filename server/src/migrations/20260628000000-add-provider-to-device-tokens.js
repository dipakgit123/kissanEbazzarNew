'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('device_tokens', 'token', {
      type: Sequelize.STRING(2048),
      allowNull: false
    });

    await queryInterface.addColumn('device_tokens', 'provider', {
      type: Sequelize.STRING(40),
      allowNull: false,
      defaultValue: 'expo'
    });

    await queryInterface.addIndex('device_tokens', ['provider'], {
      name: 'device_tokens_provider_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('device_tokens', 'device_tokens_provider_index');
    await queryInterface.removeColumn('device_tokens', 'provider');

    await queryInterface.changeColumn('device_tokens', 'token', {
      type: Sequelize.STRING(500),
      allowNull: false
    });
  }
};
