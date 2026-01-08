'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ContactLog = sequelize.define('ContactLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    viewer_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'viewer_user_id'
    },
    seller_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'seller_user_id'
    },
    listing_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'listing_id'
    },
    listing_type: {
      type: DataTypes.ENUM('cow', 'buffalo', 'goat', 'horse', 'dog', 'cat'),
      allowNull: false,
      field: 'listing_type'
    },
    contact_type: {
      type: DataTypes.ENUM('phone_view', 'whatsapp_click', 'call_click'),
      allowNull: false,
      field: 'contact_type'
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
    tableName: 'contact_logs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['viewer_user_id'] },
      { fields: ['seller_user_id'] },
      { fields: ['listing_id'] },
      { fields: ['listing_type'] },
      { fields: ['contact_type'] },
      { fields: ['created_at'] }
    ]
  });

  // Associations
  ContactLog.associate = (models) => {
    if (models.User) {
      ContactLog.belongsTo(models.User, {
        foreignKey: 'viewer_user_id',
        as: 'viewer'
      });
      ContactLog.belongsTo(models.User, {
        foreignKey: 'seller_user_id',
        as: 'seller'
      });
    }
  };

  return ContactLog;
};
