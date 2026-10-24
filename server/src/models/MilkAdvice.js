'use strict';
module.exports = (sequelize, D) => sequelize.define('MilkAdvice', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true }, user_id: { type: D.INTEGER, allowNull: false },
  cow_id: { type: D.INTEGER, allowNull: false }, fingerprint: { type: D.STRING(64), allowNull: false, unique: true },
  result: { type: D.JSONB, allowNull: false }, created_at: { type: D.DATE, allowNull: false, defaultValue: D.NOW }
}, { tableName: 'milk_advice', timestamps: false });
