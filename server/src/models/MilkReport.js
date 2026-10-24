'use strict';

const { calculate } = require('../utils/milkReportMath');

module.exports = (sequelize, DataTypes) => {
  const MilkReport = sequelize.define('MilkReport', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    cow_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'cow_id'
    },
    report_type: {
      type: DataTypes.ENUM('individual', 'overall'),
      allowNull: false,
      defaultValue: 'individual',
      field: 'report_type'
    },
    animal_type: {
      type: DataTypes.ENUM('cow', 'buffalo'),
      allowNull: true,
      field: 'animal_type'
    },
    report_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'report_date'
    },
    cow_name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'cow_name'
    },
    cow_tag: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'cow_tag'
    },
    morning_liters: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'morning_liters'
    },
    afternoon_liters: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'afternoon_liters'
    },
    price_per_liter: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'price_per_liter'
    },
    feed_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'feed_cost'
    },
    medicine_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'medicine_cost'
    },
    labor_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'labor_cost'
    },
    other_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'other_cost'
    },
    morning_sold_liters: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    afternoon_sold_liters: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    morning_price_per_liter: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    afternoon_price_per_liter: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    amount_received: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    home_liters: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    calf_liters: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    discarded_liters: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expense_status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'unknown' }
  }, {
    tableName: 'milk_reports',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  MilkReport.associate = (models) => {
    if (models.User) {
      MilkReport.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }

    if (models.FarmerCow) {
      MilkReport.belongsTo(models.FarmerCow, {
        foreignKey: 'cow_id',
        as: 'cow'
      });
    }
  };

  for (const [method, field] of Object.entries({ getTotalLiters: 'total_liters', getTotalRevenue: 'total_revenue', getTotalCost: 'total_cost', getProfitOrLoss: 'profit_or_loss', getProfitStatus: 'profit_status' })) {
    MilkReport.prototype[method] = function() { return calculate(this)[field]; };
  }

  return MilkReport;
};
