'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('milk_reports', 'report_type', {
      type: Sequelize.ENUM('individual', 'overall'),
      allowNull: false,
      defaultValue: 'individual'
    });

    await queryInterface.addIndex('milk_reports', ['user_id', 'report_type', 'report_date'], {
      name: 'milk_reports_user_reporttype_date_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('milk_reports', 'milk_reports_user_reporttype_date_idx');
    await queryInterface.removeColumn('milk_reports', 'report_type');

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_milk_reports_report_type";');
    }
  }
};
