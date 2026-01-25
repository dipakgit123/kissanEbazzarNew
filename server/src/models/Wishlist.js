'use strict';

module.exports = (sequelize, DataTypes) => {
  const Wishlist = sequelize.define('Wishlist', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    animal_type: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'animal_type',
      validate: {
        isIn: [['cow', 'buffalo', 'horse', 'goat', 'cat', 'dog', 'other']]
      }
    },
    animal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'animal_id'
    }
  }, {
    tableName: 'wishlists',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'animal_type', 'animal_id']
      }
    ]
  });

  Wishlist.associate = function(models) {
    Wishlist.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Wishlist;
};
