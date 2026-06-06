'use strict';

module.exports = (sequelize, DataTypes) => {
  const FarmerCow = sequelize.define('FarmerCow', {
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
    animal_type: {
      type: DataTypes.ENUM('cow', 'buffalo'),
      allowNull: false,
      defaultValue: 'cow',
      field: 'animal_type'
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
    breed_name: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'breed_name'
    },
    age_years: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
      field: 'age_years'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'farmer_cows',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  FarmerCow.associate = (models) => {
    if (models.User) {
      FarmerCow.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }

    if (models.MilkReport) {
      FarmerCow.hasMany(models.MilkReport, {
        foreignKey: 'cow_id',
        as: 'milkReports'
      });
    }
  };

  return FarmerCow;
};
