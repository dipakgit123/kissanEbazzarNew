'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      // Duplicate existing records deliberately fail the migration rather than deleting business data.
      await queryInterface.sequelize.query(`CREATE UNIQUE INDEX appointments_unique_active_slot
        ON appointments (veterinarian_id, appointment_date, appointment_time)
        WHERE status IN ('pending', 'confirmed')`, { transaction });
      await queryInterface.sequelize.query(`CREATE UNIQUE INDEX milk_reports_unique_cow_day
        ON milk_reports (user_id, report_date, cow_id) WHERE report_type = 'individual' AND cow_id IS NOT NULL`, { transaction });
      await queryInterface.sequelize.query(`CREATE UNIQUE INDEX milk_reports_unique_herd_day
        ON milk_reports (user_id, report_date) WHERE report_type = 'overall'`, { transaction });
      await queryInterface.sequelize.query(`CREATE UNIQUE INDEX farmer_cows_unique_tag
        ON farmer_cows (user_id, animal_type, cow_tag) WHERE cow_tag IS NOT NULL`, { transaction });
      await queryInterface.sequelize.query(`CREATE UNIQUE INDEX farmer_cows_unique_untagged_name
        ON farmer_cows (user_id, animal_type, cow_name) WHERE cow_tag IS NULL`, { transaction });
      await queryInterface.createTable('vet_review_helpful_votes', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
        review_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'vet_reviews', key: 'id' }, onDelete: 'CASCADE' },
        user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      }, { transaction });
      await queryInterface.addIndex('vet_review_helpful_votes', ['review_id', 'user_id'], { unique: true, transaction });
      await queryInterface.addColumn('call_logs', 'caller_deleted_at', { type: Sequelize.DATE, allowNull: true }, { transaction });
      await queryInterface.addColumn('call_logs', 'receiver_deleted_at', { type: Sequelize.DATE, allowNull: true }, { transaction });
      await queryInterface.addColumn('notifications', 'push_delivered_at', { type: Sequelize.DATE, allowNull: true }, { transaction });
      await queryInterface.addColumn('veterinarians', 'otp_attempts', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }, { transaction });
      await queryInterface.addColumn('veterinarians', 'last_otp_sent_at', { type: Sequelize.DATE, allowNull: true }, { transaction });
      await queryInterface.addColumn('veterinarians', 'otp_blocked_until', { type: Sequelize.DATE, allowNull: true }, { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      for (const name of ['appointments_unique_active_slot', 'milk_reports_unique_cow_day', 'milk_reports_unique_herd_day', 'farmer_cows_unique_tag', 'farmer_cows_unique_untagged_name']) {
        await queryInterface.sequelize.query(`DROP INDEX IF EXISTS ${name}`, { transaction });
      }
      await queryInterface.dropTable('vet_review_helpful_votes', { transaction });
      await queryInterface.removeColumn('call_logs', 'caller_deleted_at', { transaction });
      await queryInterface.removeColumn('call_logs', 'receiver_deleted_at', { transaction });
      await queryInterface.removeColumn('notifications', 'push_delivered_at', { transaction });
      for (const column of ['otp_attempts', 'last_otp_sent_at', 'otp_blocked_until']) await queryInterface.removeColumn('veterinarians', column, { transaction });
    });
  },
};
