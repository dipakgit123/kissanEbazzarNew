'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('vet_reviews', {
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
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      review_text: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      service_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'e.g., General Checkup, Surgery, Vaccination'
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Admin verified review'
      },
      is_visible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      helpful_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      vet_response: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      vet_response_at: {
        type: Sequelize.DATE,
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

    // Add indexes
    await queryInterface.addIndex('vet_reviews', ['veterinarian_id']);
    await queryInterface.addIndex('vet_reviews', ['user_id']);
    await queryInterface.addIndex('vet_reviews', ['rating']);
    await queryInterface.addIndex('vet_reviews', ['is_visible']);

    // Add unique constraint - one review per user per veterinarian
    await queryInterface.addIndex('vet_reviews', ['veterinarian_id', 'user_id'], {
      unique: true,
      name: 'unique_vet_user_review'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('vet_reviews');
  }
};
