'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Blog = sequelize.define('Blog', {
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
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    featured_image: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'featured_image'
    },
    featured_image_public_id: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'featured_image_public_id'
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'general'
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const tagsValue = this.getDataValue('tags');
        return tagsValue ? JSON.parse(tagsValue) : [];
      },
      set(value) {
        this.setDataValue('tags', JSON.stringify(value || []));
      }
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'author_id',
      references: {
        model: 'admins',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft'
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at'
    },
    meta_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'meta_description'
    },
    meta_keywords: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'meta_keywords'
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_featured'
    },
    reading_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reading_time',
      comment: 'Reading time in minutes'
    }
  }, {
    tableName: 'blogs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['slug']
      },
      {
        fields: ['status']
      },
      {
        fields: ['category']
      },
      {
        fields: ['published_at']
      },
      {
        fields: ['is_featured']
      }
    ]
  });

  Blog.associate = (models) => {
    if (models.Admin) {
      Blog.belongsTo(models.Admin, {
        foreignKey: 'author_id',
        as: 'author'
      });
    }
  };

  // Instance methods
  Blog.prototype.incrementViews = async function() {
    this.views += 1;
    await this.save();
  };

  Blog.prototype.publish = async function() {
    this.status = 'published';
    this.published_at = new Date();
    await this.save();
  };

  Blog.prototype.unpublish = async function() {
    this.status = 'draft';
    this.published_at = null;
    await this.save();
  };

  // Calculate reading time (average 200 words per minute)
  Blog.prototype.calculateReadingTime = function() {
    const wordCount = this.content.split(/\s+/).length;
    this.reading_time = Math.ceil(wordCount / 200) || 1;
  };

  // Generate slug from title
  Blog.generateSlug = function(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };

  return Blog;
};
