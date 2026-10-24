const { DataTypes: D } = require('sequelize');
module.exports = sequelize => sequelize.define('NotificationJob', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  dedupe_key: { type: D.STRING(255), allowNull: false, unique: true },
  kind: { type: D.STRING(32), allowNull: false },
  payload: { type: D.JSONB, allowNull: false },
  status: { type: D.STRING(24), allowNull: false, defaultValue: 'pending' },
  attempts: { type: D.INTEGER, allowNull: false, defaultValue: 0 },
  next_attempt_at: { type: D.DATE, allowNull: false, defaultValue: D.NOW },
  locked_until: D.DATE,
  lease: D.UUID,
  expires_at: { type: D.DATE, allowNull: false },
  last_error: D.STRING(255),
}, { tableName: 'notification_jobs', underscored: true });
