'use strict';

const addIndexIfMissing = async (queryInterface, tableName, fields, options = {}) => {
  try {
    await queryInterface.addIndex(tableName, fields, options);
  } catch (error) {
    if (error?.parent?.code !== '42P07' && !/already exists|duplicate/i.test(error.message)) {
      throw error;
    }
  }
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('vet_reports', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      veterinarian_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'veterinarians',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      report_type: {
        type: Sequelize.ENUM(
          'fake_profile',
          'inappropriate_behavior',
          'unprofessional_conduct',
          'fraud',
          'wrong_information',
          'harassment',
          'other'
        ),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      evidence_urls: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of URLs to uploaded evidence images'
      },
      status: {
        type: Sequelize.ENUM('pending', 'under_review', 'resolved', 'dismissed'),
        defaultValue: 'pending'
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resolved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await addIndexIfMissing(queryInterface, 'vet_reports', ['veterinarian_id']);
    await addIndexIfMissing(queryInterface, 'vet_reports', ['user_id']);
    await addIndexIfMissing(queryInterface, 'vet_reports', ['status']);
    await addIndexIfMissing(queryInterface, 'vet_reports', ['report_type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('vet_reports');
  }
};
