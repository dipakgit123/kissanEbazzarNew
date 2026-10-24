'use strict';
module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async transaction => {
      await q.addColumn('milk_reports', 'expense_status', { type: S.STRING(16), allowNull: false, defaultValue: 'unknown' }, { transaction });
      await q.createTable('milk_expenses', {
        id: { type: S.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        user_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
        cow_id: { type: S.INTEGER, allowNull: true, references: { model: 'farmer_cows', key: 'id' }, onDelete: 'SET NULL' },
        scope: { type: S.STRING(8), allowNull: false },
        cow_name: { type: S.STRING, allowNull: true },
        cow_tag: { type: S.STRING, allowNull: true },
        animal_type: { type: S.STRING(16), allowNull: true },
        expense_date: { type: S.DATEONLY, allowNull: false },
        category: { type: S.STRING(16), allowNull: false },
        kind: { type: S.STRING(16), allowNull: false, defaultValue: 'daily' },
        amount: { type: S.DECIMAL(10, 2), allowNull: false },
        notes: { type: S.TEXT, allowNull: true },
        request_id: { type: S.STRING(160), allowNull: false },
        created_at: { type: S.DATE, allowNull: false },
        updated_at: { type: S.DATE, allowNull: false }
      }, { transaction });
      await q.addIndex('milk_expenses', ['user_id', 'expense_date'], { transaction });
      await q.addIndex('milk_expenses', ['user_id', 'request_id'], { unique: true, transaction });
    });
  },
  async down(q) {
    await q.sequelize.transaction(async transaction => {
      await q.dropTable('milk_expenses', { transaction });
      await q.removeColumn('milk_reports', 'expense_status', { transaction });
    });
  }
};
