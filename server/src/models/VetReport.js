'use strict';

module.exports = (sequelize, DataTypes) => {
  const VetReport = sequelize.define('VetReport', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    veterinarian_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'veterinarians',
        key: 'id'
      },
      field: 'veterinarian_id'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    report_type: {
      type: DataTypes.ENUM(
        'fake_profile',
        'inappropriate_behavior',
        'unprofessional_conduct',
        'fraud',
        'wrong_information',
        'harassment',
        'other'
      ),
      allowNull: false,
      field: 'report_type'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    evidence_urls: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'evidence_urls',
      comment: 'Array of URLs to uploaded evidence images'
    },
    status: {
      type: DataTypes.ENUM('pending', 'under_review', 'resolved', 'dismissed'),
      defaultValue: 'pending'
    },
    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_notes'
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at'
    },
    resolved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'resolved_by'
    }
  }, {
    sequelize,
    modelName: 'VetReport',
    tableName: 'vet_reports',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['veterinarian_id'] },
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['report_type'] }
    ]
  });

  // Associations
  VetReport.associate = function(models) {
    VetReport.belongsTo(models.Veterinarian, {
      foreignKey: 'veterinarian_id',
      as: 'veterinarian'
    });
    VetReport.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'reporter'
    });
    VetReport.belongsTo(models.User, {
      foreignKey: 'resolved_by',
      as: 'resolver'
    });
  };

  return VetReport;
};
