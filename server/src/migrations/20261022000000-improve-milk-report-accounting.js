'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      // Animal identity is cow_id; species-scoped tags are allowed at registration.
      // Existing individual-day and herd-day unique indexes remain in place.
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS milk_reports_user_tag_date_unique', { transaction });
      for (const field of ['morning_sold_liters', 'afternoon_sold_liters', 'morning_price_per_liter', 'afternoon_price_per_liter', 'amount_received']) {
        await queryInterface.addColumn('milk_reports', field, { type: Sequelize.DECIMAL(10, 2), allowNull: true }, { transaction });
      }
      for (const field of ['home_liters', 'calf_liters', 'discarded_liters']) {
        await queryInterface.addColumn('milk_reports', field, { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }, { transaction });
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      // Fail rather than delete legitimate cross-species reports if old uniqueness cannot be restored.
      await queryInterface.addIndex('milk_reports', ['user_id', 'cow_tag', 'report_date'], { unique: true, name: 'milk_reports_user_tag_date_unique', transaction });
      for (const field of ['morning_sold_liters', 'afternoon_sold_liters', 'morning_price_per_liter', 'afternoon_price_per_liter', 'amount_received', 'home_liters', 'calf_liters', 'discarded_liters']) {
        await queryInterface.removeColumn('milk_reports', field, { transaction });
      }
    });
  }
};
