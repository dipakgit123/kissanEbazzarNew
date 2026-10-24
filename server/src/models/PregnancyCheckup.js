'use strict';
const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Checkup = sequelize.define('PregnancyCheckup', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pregnancy_record_id: { type: DataTypes.INTEGER, allowNull: false },
    recorded_by: { type: DataTypes.INTEGER, allowNull: false },
    checked_on: { type: DataTypes.DATEONLY, allowNull: false },
    result: { type: DataTypes.STRING(20), allowNull: false },
    estimated_age_value: DataTypes.DECIMAL(6, 2),
    estimated_age_unit: DataTypes.STRING(10),
    next_check_date: DataTypes.DATEONLY,
    doctor_name: DataTypes.STRING(100),
    notes: DataTypes.TEXT,
    request_id: { type: DataTypes.UUID, allowNull: false },
  }, { tableName: 'pregnancy_checkups', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  Checkup.associate = models => Checkup.belongsTo(models.PregnancyRecord, { foreignKey: 'pregnancy_record_id', as: 'pregnancy' });
  return Checkup;
};
