'use strict';
module.exports = (sequelize, D) => sequelize.define('MilkAdviceUsage', {
  user_id: { type: D.INTEGER, primaryKey: true }, day: { type: D.DATEONLY, allowNull: false },
  requests: { type: D.INTEGER, allowNull: false, defaultValue: 0 }, lease: D.STRING(36), active_until: D.DATE
}, { tableName: 'milk_advice_usage', timestamps: false });
