'use strict';
module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async transaction => {
      await q.createTable('ai_health_reports', {
        id: { type: S.UUID, primaryKey: true, allowNull: false },
        user_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
        cow_id: { type: S.INTEGER, references: { model: 'farmer_cows', key: 'id' }, onDelete: 'SET NULL' },
        request_id: { type: S.STRING(80), allowNull: false },
        context: { type: S.JSONB, allowNull: false }, analysis: { type: S.JSONB, allowNull: false },
        messages: { type: S.JSONB, allowNull: false, defaultValue: [] },
        created_at: { type: S.DATE, allowNull: false }, updated_at: { type: S.DATE, allowNull: false }
      }, { transaction });
      await q.addIndex('ai_health_reports', ['user_id', 'created_at'], { transaction });
      await q.addIndex('ai_health_reports', ['user_id', 'request_id'], { unique: true, transaction });
      await q.createTable('ai_health_usage', {
        user_id: { type: S.INTEGER, primaryKey: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
        day: { type: S.DATEONLY, allowNull: false }, requests: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
        lease: S.UUID, active_until: S.DATE
      }, { transaction });
    });
  },
  async down(q) {
    await q.sequelize.transaction(async transaction => {
      await q.dropTable('ai_health_usage', { transaction });
      await q.dropTable('ai_health_reports', { transaction });
    });
  }
};
