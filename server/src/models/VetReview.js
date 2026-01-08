'use strict';

module.exports = (sequelize, DataTypes) => {
  const VetReview = sequelize.define('VetReview', {
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    review_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'review_text'
    },
    service_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'service_type',
      comment: 'e.g., General Checkup, Surgery, Vaccination'
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified',
      comment: 'Admin verified review'
    },
    is_visible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_visible'
    },
    helpful_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'helpful_count'
    },
    vet_response: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'vet_response'
    },
    vet_response_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'vet_response_at'
    }
  }, {
    sequelize,
    modelName: 'VetReview',
    tableName: 'vet_reviews',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['veterinarian_id'] },
      { fields: ['user_id'] },
      { fields: ['rating'] },
      { fields: ['is_visible'] },
      {
        unique: true,
        fields: ['veterinarian_id', 'user_id'],
        name: 'unique_vet_user_review'
      }
    ]
  });

  // Associations
  VetReview.associate = function(models) {
    VetReview.belongsTo(models.Veterinarian, {
      foreignKey: 'veterinarian_id',
      as: 'veterinarian'
    });
    VetReview.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return VetReview;
};
