'use strict';

module.exports = (sequelize, DataTypes) => {
  const ListingReport = sequelize.define('ListingReport', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    listing_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'listing_id'
    },
    listing_type: {
      type: DataTypes.ENUM('cow', 'buffalo', 'goat', 'horse', 'dog', 'cat', 'other'),
      allowNull: false,
      field: 'listing_type'
    },
    reporter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'reporter_id'
    },
    seller_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'seller_id'
    },
    report_type: {
      type: DataTypes.ENUM(
        'fraud',
        'wrong_information',
        'already_sold',
        'inappropriate_content',
        'suspicious_price',
        'seller_not_responding',
        'animal_welfare',
        'other'
      ),
      allowNull: false,
      field: 'report_type'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'under_review', 'resolved', 'dismissed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    listing_snapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'listing_snapshot'
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
        model: 'admins',
        key: 'id'
      },
      field: 'resolved_by'
    }
  }, {
    sequelize,
    modelName: 'ListingReport',
    tableName: 'listing_reports',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['listing_id', 'listing_type'] },
      { fields: ['reporter_id'] },
      { fields: ['seller_id'] },
      { fields: ['status'] },
      { fields: ['report_type'] }
    ]
  });

  ListingReport.associate = function(models) {
    ListingReport.belongsTo(models.User, {
      foreignKey: 'reporter_id',
      as: 'reporter'
    });
    ListingReport.belongsTo(models.User, {
      foreignKey: 'seller_id',
      as: 'seller'
    });
    ListingReport.belongsTo(models.Admin, {
      foreignKey: 'resolved_by',
      as: 'resolver'
    });
  };

  return ListingReport;
};
