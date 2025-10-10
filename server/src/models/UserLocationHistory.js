'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserLocationHistory = sequelize.define('UserLocationHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: {
        min: -90,
        max: 90
      }
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      validate: {
        min: -180,
        max: 180
      }
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    location_type: {
      type: DataTypes.ENUM('auto', 'manual', 'ip_based'),
      allowNull: false
    },
    accuracy: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'UserLocationHistory',
    tableName: 'user_location_history',
    timestamps: true,
    underscored: true
  });

  UserLocationHistory.associate = function(models) {
    UserLocationHistory.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return UserLocationHistory;
};