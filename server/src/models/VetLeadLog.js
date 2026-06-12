'use strict';

module.exports = (sequelize, DataTypes) => {
  const VetLeadLog = sequelize.define('VetLeadLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    veterinarian_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'veterinarian_id'
    },
    viewer_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'viewer_user_id'
    },
    lead_type: {
      type: DataTypes.ENUM('profile_view', 'whatsapp_click', 'call_click'),
      allowNull: false,
      field: 'lead_type'
    },
    source_page: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'source_page'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    }
  }, {
    tableName: 'vet_lead_logs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['veterinarian_id'] },
      { fields: ['viewer_user_id'] },
      { fields: ['lead_type'] },
      { fields: ['created_at'] }
    ]
  });

  VetLeadLog.associate = (models) => {
    if (models.Veterinarian) {
      VetLeadLog.belongsTo(models.Veterinarian, {
        foreignKey: 'veterinarian_id',
        as: 'veterinarian'
      });
    }

    if (models.User) {
      VetLeadLog.belongsTo(models.User, {
        foreignKey: 'viewer_user_id',
        as: 'viewer'
      });
    }
  };

  return VetLeadLog;
};
