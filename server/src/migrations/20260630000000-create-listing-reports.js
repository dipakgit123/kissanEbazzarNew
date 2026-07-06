'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('listing_reports', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      listing_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      listing_type: {
        type: Sequelize.ENUM('cow', 'buffalo', 'goat', 'horse', 'dog', 'cat', 'other'),
        allowNull: false
      },
      reporter_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      seller_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      report_type: {
        type: Sequelize.ENUM(
          'fraud',
          'wrong_information',
          'already_sold',
          'inappropriate_content',
          'suspicious_price',
          'seller_not_responding',
          'animal_welfare',
          'other'
        ),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'under_review', 'resolved', 'dismissed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      listing_snapshot: {
        type: Sequelize.JSON,
        allowNull: true
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
          model: 'admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    await queryInterface.addIndex('listing_reports', ['listing_id', 'listing_type']);
    await queryInterface.addIndex('listing_reports', ['reporter_id']);
    await queryInterface.addIndex('listing_reports', ['seller_id']);
    await queryInterface.addIndex('listing_reports', ['status']);
    await queryInterface.addIndex('listing_reports', ['report_type']);
    await queryInterface.addIndex('listing_reports', ['reporter_id', 'listing_id', 'listing_type'], {
      name: 'listing_reports_reporter_listing_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('listing_reports');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_listing_reports_listing_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_listing_reports_report_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_listing_reports_status";');
  }
};
