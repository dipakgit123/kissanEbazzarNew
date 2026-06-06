'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('farmer_cows', 'animal_type', {
      type: Sequelize.ENUM('cow', 'buffalo'),
      allowNull: false,
      defaultValue: 'cow'
    });

    await queryInterface.addIndex('farmer_cows', ['user_id', 'animal_type'], {
      name: 'farmer_cows_user_animaltype_idx'
    });

    await queryInterface.addColumn('milk_reports', 'animal_type', {
      type: Sequelize.ENUM('cow', 'buffalo'),
      allowNull: true,
      defaultValue: 'cow'
    });

    await queryInterface.addIndex('milk_reports', ['user_id', 'animal_type', 'report_date'], {
      name: 'milk_reports_user_animaltype_date_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('milk_reports', 'milk_reports_user_animaltype_date_idx');
    await queryInterface.removeColumn('milk_reports', 'animal_type');

    await queryInterface.removeIndex('farmer_cows', 'farmer_cows_user_animaltype_idx');
    await queryInterface.removeColumn('farmer_cows', 'animal_type');

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_farmer_cows_animal_type";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_milk_reports_animal_type";');
    }
  }
};
