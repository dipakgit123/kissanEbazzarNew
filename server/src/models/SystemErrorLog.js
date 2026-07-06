'use strict';

module.exports = (sequelize, DataTypes) => {
  const SystemErrorLog = sequelize.define('SystemErrorLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    source: {
      type: DataTypes.ENUM('api', 'process', 'startup', 'background'),
      allowNull: false,
      defaultValue: 'api'
    },
    severity: {
      type: DataTypes.ENUM('warning', 'error', 'fatal'),
      allowNull: false,
      defaultValue: 'error'
    },
    error_name: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'error_name'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    stack: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    method: {
      type: DataTypes.STRING(12),
      allowNull: true
    },
    route: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status_code: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'status_code'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id'
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'admin_id'
    },
    ip_address: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: 'ip_address'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    request_params: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'request_params'
    },
    request_query: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'request_query'
    },
    request_body: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'request_body'
    },
    request_headers: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'request_headers'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    modelName: 'SystemErrorLog',
    tableName: 'system_error_logs',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['source'] },
      { fields: ['severity'] },
      { fields: ['status_code'] },
      { fields: ['user_id'] },
      { fields: ['admin_id'] },
      { fields: ['created_at'] }
    ]
  });

  SystemErrorLog.associate = function(models) {
    SystemErrorLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    SystemErrorLog.belongsTo(models.Admin, {
      foreignKey: 'admin_id',
      as: 'admin'
    });
  };

  return SystemErrorLog;
};
