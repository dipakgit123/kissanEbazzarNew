'use strict';
module.exports = (sequelize, D) => sequelize.define('AnimalProfile', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: D.INTEGER, allowNull: false },
  animal_group: { type: D.STRING(8), allowNull: false, validate: { isIn: [['farm', 'pet']] } },
  archived: { type: D.BOOLEAN, allowNull: false, defaultValue: false },
  species: { type: D.STRING(50), allowNull: false },
  name: { type: D.STRING(100), allowNull: false },
  tag: D.STRING(100), breed: D.STRING(100), farmer_cow_id: D.INTEGER
}, { tableName: 'animal_profiles', underscored: true, createdAt: 'created_at', updatedAt: 'updated_at' });
