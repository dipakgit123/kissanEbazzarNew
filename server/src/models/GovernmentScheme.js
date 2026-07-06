'use strict';

module.exports = (sequelize, DataTypes) => {
  const GovernmentScheme = sequelize.define('GovernmentScheme', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    department: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    government_level: {
      type: DataTypes.ENUM('central', 'state', 'district', 'other'),
      allowNull: false,
      defaultValue: 'central',
      field: 'government_level'
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('loan', 'subsidy', 'insurance', 'training', 'health', 'general'),
      allowNull: false,
      defaultValue: 'general'
    },
    animal_category: {
      type: DataTypes.ENUM('farm', 'pet', 'both'),
      allowNull: false,
      defaultValue: 'both',
      field: 'animal_category'
    },
    animal_types: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'animal_types'
    },
    short_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'short_description'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    translations: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    benefits: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    eligibility: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    required_documents: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'required_documents'
    },
    application_steps: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'application_steps'
    },
    amount_label: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'amount_label'
    },
    interest_rate: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'interest_rate'
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    official_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'official_url'
    },
    contact_info: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'contact_info'
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'image_url'
    },
    image_public_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'image_public_id'
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_featured'
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by'
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'updated_by'
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at'
    }
  }, {
    tableName: 'government_schemes',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['slug'] },
      { fields: ['status'] },
      { fields: ['category'] },
      { fields: ['animal_category'] },
      { fields: ['is_featured'] },
      { fields: ['published_at'] }
    ]
  });

  GovernmentScheme.associate = (models) => {
    if (models.Admin) {
      GovernmentScheme.belongsTo(models.Admin, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      GovernmentScheme.belongsTo(models.Admin, {
        foreignKey: 'updated_by',
        as: 'updater'
      });
    }
  };

  GovernmentScheme.generateSlug = function(title) {
    return String(title || '')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `scheme-${Date.now()}`;
  };

  GovernmentScheme.prototype.incrementViews = async function() {
    this.views += 1;
    await this.save();
  };

  return GovernmentScheme;
};
