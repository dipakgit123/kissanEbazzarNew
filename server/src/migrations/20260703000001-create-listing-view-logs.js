'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('listing_view_logs', {
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
      seller_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      viewer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      viewer_ip: {
        type: Sequelize.STRING(80),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('listing_view_logs', ['listing_id', 'listing_type']);
    await queryInterface.addIndex('listing_view_logs', ['seller_id']);
    await queryInterface.addIndex('listing_view_logs', ['viewer_id']);
    await queryInterface.addIndex('listing_view_logs', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('listing_view_logs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_listing_view_logs_listing_type";');
  }
};
