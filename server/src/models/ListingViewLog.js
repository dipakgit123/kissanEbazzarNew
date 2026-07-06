'use strict';

module.exports = (sequelize, DataTypes) => {
  const ListingViewLog = sequelize.define('ListingViewLog', {
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
    seller_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'seller_id'
    },
    viewer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'viewer_id'
    },
    viewer_ip: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: 'viewer_ip'
    },
    view_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'view_date'
    },
    viewer_key: {
      type: DataTypes.STRING(140),
      allowNull: false,
      field: 'viewer_key'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    modelName: 'ListingViewLog',
    tableName: 'listing_view_logs',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['listing_id', 'listing_type'] },
      { fields: ['seller_id'] },
      { fields: ['viewer_id'] },
      { fields: ['view_date'] },
      { fields: ['created_at'] },
      {
        unique: true,
        fields: ['listing_id', 'listing_type', 'view_date', 'viewer_key'],
        name: 'listing_view_logs_unique_daily_viewer'
      }
    ]
  });

  ListingViewLog.associate = function(models) {
    ListingViewLog.belongsTo(models.User, {
      foreignKey: 'seller_id',
      as: 'seller'
    });
    ListingViewLog.belongsTo(models.User, {
      foreignKey: 'viewer_id',
      as: 'viewer'
    });
  };

  return ListingViewLog;
};
