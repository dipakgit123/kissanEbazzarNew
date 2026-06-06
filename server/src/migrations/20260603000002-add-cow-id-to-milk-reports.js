'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('milk_reports', 'cow_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'farmer_cows',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('milk_reports', ['cow_id']);
    await queryInterface.addIndex('milk_reports', ['user_id', 'cow_id', 'report_date'], {
      unique: true,
      name: 'milk_reports_user_cowid_date_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('milk_reports', 'milk_reports_user_cowid_date_unique');
    await queryInterface.removeIndex('milk_reports', ['cow_id']);
    await queryInterface.removeColumn('milk_reports', 'cow_id');
  }
};
