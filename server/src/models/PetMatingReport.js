'use strict';

module.exports = (sequelize, DataTypes) => {
  const PetMatingReport = sequelize.define('PetMatingReport', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reporter_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    reason: {
      type: DataTypes.ENUM('fake', 'inappropriate', 'wrong_information', 'spam', 'animal_welfare', 'other'),
      allowNull: false,
      defaultValue: 'other'
    },
    description: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('open', 'reviewed', 'dismissed'),
      allowNull: false,
      defaultValue: 'open'
    }
  }, {
    tableName: 'pet_mating_reports',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['profile_id'] },
      { fields: ['reporter_id'] },
      { fields: ['reason'] },
      { fields: ['status'] }
    ]
  });

  PetMatingReport.associate = (models) => {
    if (models.PetMatingProfile) {
      PetMatingReport.belongsTo(models.PetMatingProfile, {
        foreignKey: 'profile_id',
        as: 'profile'
      });
    }

    if (models.User) {
      PetMatingReport.belongsTo(models.User, {
        foreignKey: 'reporter_id',
        as: 'reporter'
      });
    }
  };

  return PetMatingReport;
};
