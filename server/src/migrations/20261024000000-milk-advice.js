'use strict';
module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async transaction => {
      const owner = () => ({ type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' });
      const cow = () => ({ type: S.INTEGER, allowNull: false, references: { model: 'farmer_cows', key: 'id' }, onDelete: 'CASCADE' });
      await q.createTable('milk_feeding_routines', {
        id: { type: S.INTEGER, primaryKey: true, autoIncrement: true }, user_id: owner(), cow_id: cow(),
        routine: { type: S.JSONB, allowNull: false }, created_at: { type: S.DATE, allowNull: false }
      }, { transaction });
      await q.addIndex('milk_feeding_routines', ['user_id', 'cow_id', 'id'], { transaction });
      await q.createTable('milk_advice', {
        id: { type: S.INTEGER, primaryKey: true, autoIncrement: true }, user_id: owner(), cow_id: cow(),
        fingerprint: { type: S.STRING(64), allowNull: false, unique: true },
        result: { type: S.JSONB, allowNull: false }, created_at: { type: S.DATE, allowNull: false }
      }, { transaction });
      await q.createTable('milk_advice_usage', {
        user_id: { ...owner(), primaryKey: true }, day: { type: S.DATEONLY, allowNull: false },
        requests: { type: S.INTEGER, allowNull: false, defaultValue: 0 }, lease: S.STRING(36), active_until: S.DATE
      }, { transaction });
    });
  },
  async down(q) {
    await q.sequelize.transaction(async transaction => {
      for (const table of ['milk_advice_usage', 'milk_advice', 'milk_feeding_routines']) await q.dropTable(table, { transaction });
    });
  }
};
