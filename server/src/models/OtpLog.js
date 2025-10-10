'use strict';

module.exports = (sequelize, DataTypes) => {
  const OtpLog = sequelize.define('OtpLog', {
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
    otp_code: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    action: {
      type: DataTypes.ENUM('sent', 'verified', 'failed', 'expired', 'resent'),
      allowNull: false
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    twilio_message_sid: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    error_message: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'OtpLog',
    tableName: 'otp_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['action']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Associations
  OtpLog.associate = function(models) {
    // Only create association if User model exists
    if (models.User) {
      OtpLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  };

  return OtpLog;
};