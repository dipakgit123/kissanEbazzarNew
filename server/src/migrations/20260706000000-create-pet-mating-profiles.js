'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pet_mating_profiles', {
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
      pet_type: {
        type: Sequelize.ENUM('dog', 'cat'),
        allowNull: false
      },
      pet_name: {
        type: Sequelize.STRING(120),
        allowNull: false
      },
      breed: {
        type: Sequelize.STRING(160),
        allowNull: false
      },
      gender: {
        type: Sequelize.ENUM('male', 'female'),
        allowNull: false
      },
      age_months: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      color: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      weight_kg: {
        type: Sequelize.DECIMAL(7, 2),
        allowNull: true
      },
      photos: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      photo_public_ids: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      video_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      video_public_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      vaccination_status: {
        type: Sequelize.ENUM('unknown', 'not_vaccinated', 'partial', 'up_to_date'),
        allowNull: false,
        defaultValue: 'unknown'
      },
      last_vaccination_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      deworming_status: {
        type: Sequelize.ENUM('unknown', 'not_done', 'done'),
        allowNull: false,
        defaultValue: 'unknown'
      },
      last_deworming_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      health_certificate_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      pedigree_available: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      registered_with: {
        type: Sequelize.STRING(160),
        allowNull: true
      },
      temperament: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      mating_experience: {
        type: Sequelize.ENUM('first_time', 'experienced', 'unknown'),
        allowNull: false,
        defaultValue: 'unknown'
      },
      fee_type: {
        type: Sequelize.ENUM('free', 'paid', 'negotiable'),
        allowNull: false,
        defaultValue: 'negotiable'
      },
      fee_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      preferred_breed: {
        type: Sequelize.STRING(160),
        allowNull: true
      },
      preferred_gender: {
        type: Sequelize.ENUM('male', 'female', 'any'),
        allowNull: false,
        defaultValue: 'any'
      },
      available_from: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      available_to: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      medical_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      owner_name: {
        type: Sequelize.STRING(160),
        allowNull: true
      },
      owner_phone: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      views: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      contact_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      report_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'paused', 'matched', 'rejected', 'removed'),
        allowNull: false,
        defaultValue: 'active'
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('NOW')
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

    await queryInterface.addIndex('pet_mating_profiles', ['user_id']);
    await queryInterface.addIndex('pet_mating_profiles', ['pet_type']);
    await queryInterface.addIndex('pet_mating_profiles', ['breed']);
    await queryInterface.addIndex('pet_mating_profiles', ['gender']);
    await queryInterface.addIndex('pet_mating_profiles', ['city']);
    await queryInterface.addIndex('pet_mating_profiles', ['status']);
    await queryInterface.addIndex('pet_mating_profiles', ['is_featured']);
    await queryInterface.addIndex('pet_mating_profiles', ['published_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pet_mating_profiles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pet_mating_profiles_pet_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pet_mating_profiles_gender";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pet_mating_profiles_vaccination_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pet_mating_profiles_deworming_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pet_mating_profiles_mating_experience";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pet_mating_profiles_fee_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pet_mating_profiles_preferred_gender";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pet_mating_profiles_status";');
  }
};
