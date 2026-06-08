'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('pregnancy_records', 'ear_badge_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Ear badge / ear tag number for the animal'
    });

    await queryInterface.addIndex('pregnancy_records', ['user_id', 'ear_badge_number'], {
      name: 'pregnancy_records_user_ear_badge_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('pregnancy_records', 'pregnancy_records_user_ear_badge_idx');
    await queryInterface.removeColumn('pregnancy_records', 'ear_badge_number');
  }
};
