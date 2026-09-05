const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DeviceToken = sequelize.define('DeviceToken', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    recipient_type: {
      type: DataTypes.ENUM('user', 'veterinarian'),
      allowNull: false,
      defaultValue: 'user',
    },
    recipient_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    token: {
      type: DataTypes.STRING(2048),
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'expo',
    },
    platform: {
      type: DataTypes.ENUM('android', 'ios', 'web'),
      allowNull: false,
      defaultValue: 'android',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    device_id: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    app_version: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    last_seen_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failure_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    last_error: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  }, {
    tableName: 'device_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return DeviceToken;
};
