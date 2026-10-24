'use strict';
module.exports = (sequelize, D) => sequelize.define('AIHealthReport', {
  animal_group: { type: D.STRING(8), allowNull: true },
  animal_profile_id: D.INTEGER,
  id: { type: D.UUID, primaryKey: true, defaultValue: D.UUIDV4 },
  user_id: { type: D.INTEGER, allowNull: false },
  cow_id: D.INTEGER,
  request_id: { type: D.STRING(80), allowNull: false },
  context: { type: D.JSONB, allowNull: false },
  analysis: { type: D.JSONB, allowNull: false },
  messages: { type: D.JSONB, allowNull: false, defaultValue: [] }
}, { tableName: 'ai_health_reports', underscored: true, createdAt: 'created_at', updatedAt: 'updated_at' });
