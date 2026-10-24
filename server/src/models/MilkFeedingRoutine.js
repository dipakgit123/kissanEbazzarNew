'use strict';
module.exports = (sequelize, D) => sequelize.define('MilkFeedingRoutine', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true }, user_id: { type: D.INTEGER, allowNull: false },
  cow_id: { type: D.INTEGER, allowNull: false }, routine: { type: D.JSONB, allowNull: false },
  created_at: { type: D.DATE, allowNull: false, defaultValue: D.NOW }
}, { tableName: 'milk_feeding_routines', timestamps: false });
