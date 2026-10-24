'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // PostgreSQL enum values must be committed before they are used as defaults.
    await queryInterface.sequelize.query(`ALTER TYPE "enum_pregnancy_records_status" ADD VALUE IF NOT EXISTS 'pending_confirmation'`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_pregnancy_records_status" ADD VALUE IF NOT EXISTS 'not_pregnant'`);
    await queryInterface.sequelize.transaction(async transaction => {
      const options = { transaction };
      await queryInterface.addColumn('pregnancy_records', 'confirmation_source', { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'legacy_unrecorded' }, options);
      await queryInterface.addColumn('pregnancy_records', 'confirmed_on', { type: Sequelize.DATEONLY, allowNull: true }, options);
      await queryInterface.addColumn('pregnancy_records', 'last_check_result', { type: Sequelize.STRING(20), allowNull: true }, options);
      await queryInterface.addColumn('pregnancy_records', 'next_check_date', { type: Sequelize.DATEONLY, allowNull: true }, options);
      await queryInterface.addColumn('pregnancy_records', 'date_corrections', { type: Sequelize.JSONB, allowNull: false, defaultValue: [] }, options);
      await queryInterface.sequelize.query(`ALTER TABLE pregnancy_records ALTER COLUMN status SET DEFAULT 'pending_confirmation', ALTER COLUMN confirmation_source SET DEFAULT 'breeding_recorded'`, options);
      await queryInterface.createTable('pregnancy_checkups', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        pregnancy_record_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'pregnancy_records', key: 'id' }, onDelete: 'CASCADE' },
        recorded_by: { type: Sequelize.INTEGER, allowNull: false },
        checked_on: { type: Sequelize.DATEONLY, allowNull: false },
        result: { type: Sequelize.STRING(20), allowNull: false },
        estimated_age_value: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
        estimated_age_unit: { type: Sequelize.STRING(10), allowNull: true },
        next_check_date: { type: Sequelize.DATEONLY, allowNull: true },
        doctor_name: { type: Sequelize.STRING(100), allowNull: true },
        notes: { type: Sequelize.TEXT, allowNull: true },
        request_id: { type: Sequelize.UUID, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, options);
      await queryInterface.addIndex('pregnancy_checkups', ['pregnancy_record_id', 'request_id'], { ...options, unique: true });
      await queryInterface.addIndex('pregnancy_records', ['next_check_date'], options);
    });
  },
  async down() {
    // A rollback must not silently erase examination or correction history.
    throw new Error('This migration preserves pregnancy history. Restore a reviewed backup to roll back.');
  },
};
