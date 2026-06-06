'use strict';

const toNumber = (value) => {
  const parsed = Number.parseFloat(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
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

  MilkReport.prototype.getTotalLiters = function() {
    return toNumber(this.morning_liters) + toNumber(this.afternoon_liters);
  };

  MilkReport.prototype.getTotalRevenue = function() {
    return this.getTotalLiters() * toNumber(this.price_per_liter);
  };

  MilkReport.prototype.getTotalCost = function() {
    return (
      toNumber(this.feed_cost) +
      toNumber(this.medicine_cost) +
      toNumber(this.labor_cost) +
      toNumber(this.other_cost)
    );
  };

  MilkReport.prototype.getProfitOrLoss = function() {
    return this.getTotalRevenue() - this.getTotalCost();
  };

  MilkReport.prototype.getProfitStatus = function() {
    const difference = this.getProfitOrLoss();

    if (difference > 0) {
      return 'profit';
    }

    if (difference < 0) {
      return 'loss';
    }

    return 'break_even';
  };

  return MilkReport;
};
