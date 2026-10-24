'use strict';
module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async transaction => {
      const opts = { transaction };
      await q.createTable('notification_jobs', {
        id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
        dedupe_key: { type: S.STRING(255), allowNull: false, unique: true },
        kind: { type: S.STRING(32), allowNull: false },
        payload: { type: S.JSONB, allowNull: false },
        status: { type: S.STRING(24), allowNull: false, defaultValue: 'pending' },
        attempts: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
        next_attempt_at: { type: S.DATE, allowNull: false, defaultValue: S.NOW },
        locked_until: S.DATE, lease: S.UUID,
        expires_at: { type: S.DATE, allowNull: false }, last_error: S.STRING(255),
        created_at: { type: S.DATE, allowNull: false, defaultValue: S.NOW },
        updated_at: { type: S.DATE, allowNull: false, defaultValue: S.NOW },
      }, opts);
      await q.addIndex('notification_jobs', ['status', 'next_attempt_at'], opts);
      await q.addColumn('notifications', 'push_status', { type: S.STRING(24), allowNull: false, defaultValue: 'not_requested' }, opts);
      await q.addColumn('notification_preferences', 'language', { type: S.STRING(8), allowNull: false, defaultValue: 'en' }, opts);
      for (const [name, enabled] of Object.entries({ health_enabled: true, pet_mating_enabled: true, content_enabled: false, milk_reminders_enabled: false })) {
        await q.addColumn('notification_preferences', name, { type: S.BOOLEAN, allowNull: false, defaultValue: enabled }, opts);
      }
    });
  },
  async down(q) {
    await q.sequelize.transaction(async transaction => {
      await q.dropTable('notification_jobs', { transaction });
      await q.removeColumn('notifications', 'push_status', { transaction });
      for (const key of ['language', 'health_enabled', 'pet_mating_enabled', 'content_enabled', 'milk_reminders_enabled']) await q.removeColumn('notification_preferences', key, { transaction });
    });
  },
};
