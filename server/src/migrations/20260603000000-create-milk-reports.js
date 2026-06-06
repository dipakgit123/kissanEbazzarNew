'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('milk_reports', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
      report_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      cow_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cow_tag: {
        type: Sequelize.STRING,
        allowNull: true
      },
      morning_liters: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      afternoon_liters: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      price_per_liter: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      feed_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      medicine_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      labor_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      other_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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

    await queryInterface.addIndex('milk_reports', ['user_id']);
    await queryInterface.addIndex('milk_reports', ['report_date']);
    await queryInterface.addIndex('milk_reports', ['user_id', 'cow_name']);
    await queryInterface.addIndex('milk_reports', ['user_id', 'cow_tag']);
    await queryInterface.addIndex('milk_reports', ['user_id', 'cow_tag', 'report_date'], {
      unique: true,
      name: 'milk_reports_user_tag_date_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('milk_reports');
  }
};
