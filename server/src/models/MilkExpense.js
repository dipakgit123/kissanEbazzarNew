'use strict';
module.exports = (sequelize, D) => sequelize.define('MilkExpense', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: D.INTEGER, allowNull: false },
  cow_id: { type: D.INTEGER, allowNull: true },
  scope: { type: D.STRING(8), allowNull: false },
  cow_name: D.STRING, cow_tag: D.STRING, animal_type: D.STRING(16),
  expense_date: { type: D.DATEONLY, allowNull: false },
  category: { type: D.STRING(16), allowNull: false },
  kind: { type: D.STRING(16), allowNull: false, defaultValue: 'daily' },
  amount: { type: D.DECIMAL(10, 2), allowNull: false },
  notes: D.TEXT,
  request_id: { type: D.STRING(160), allowNull: false }
}, { tableName: 'milk_expenses', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
