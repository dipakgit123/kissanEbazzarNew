'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('government_schemes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      department: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      government_level: {
        type: Sequelize.ENUM('central', 'state', 'district', 'other'),
        allowNull: false,
        defaultValue: 'central'
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM('loan', 'subsidy', 'insurance', 'training', 'health', 'general'),
        allowNull: false,
        defaultValue: 'general'
      },
      animal_category: {
        type: Sequelize.ENUM('farm', 'pet', 'both'),
        allowNull: false,
        defaultValue: 'both'
      },
      animal_types: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      short_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      translations: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      benefits: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      eligibility: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      required_documents: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      application_steps: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      amount_label: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      interest_rate: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      deadline: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      official_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      contact_info: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      image_public_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft'
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      views: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('government_schemes', ['slug']);
    await queryInterface.addIndex('government_schemes', ['status']);
    await queryInterface.addIndex('government_schemes', ['category']);
    await queryInterface.addIndex('government_schemes', ['animal_category']);
    await queryInterface.addIndex('government_schemes', ['is_featured']);
    await queryInterface.addIndex('government_schemes', ['published_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('government_schemes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_government_schemes_government_level";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_government_schemes_category";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_government_schemes_animal_category";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_government_schemes_status";');
  }
};
