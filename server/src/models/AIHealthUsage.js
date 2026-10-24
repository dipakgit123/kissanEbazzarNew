'use strict';
module.exports = (sequelize, D) => sequelize.define('AIHealthUsage', {
  user_id: { type: D.INTEGER, primaryKey: true },
  day: { type: D.DATEONLY, allowNull: false },
  requests: { type: D.INTEGER, allowNull: false, defaultValue: 0 },
  lease: D.UUID,
  active_until: D.DATE
}, { tableName: 'ai_health_usage', timestamps: false });
