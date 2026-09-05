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
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('veterinarians', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      full_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true
      },
      profile_photo: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      profile_photo_public_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      specialization: {
        type: Sequelize.ENUM(
          'large_animal',
          'small_animal',
          'livestock',
          'surgery',
          'general',
          'emergency',
          'reproduction'
        ),
        allowNull: false,
        defaultValue: 'general'
      },
      experience_years: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      qualification: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      services: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      consultation_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      available_hours: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      emergency_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      license_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      license_document: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      license_document_public_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      degree_certificate: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      degree_certificate_public_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      aadhar_document: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      aadhar_document_public_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      clinic_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      clinic_address: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      pincode: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      verification_status: {
        type: Sequelize.ENUM('pending', 'verified', 'rejected', 'suspended'),
        defaultValue: 'pending',
        allowNull: false
      },
      verification_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      verified_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      otp: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      otp_expiry: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      rating: {
        type: Sequelize.DECIMAL(2, 1),
        defaultValue: 0
      },
      total_reviews: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_patients: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await addIndexIfMissing(queryInterface, 'veterinarians', ['phone_number'], { unique: true });
    await addIndexIfMissing(queryInterface, 'veterinarians', ['license_number'], { unique: true });
    await addIndexIfMissing(queryInterface, 'veterinarians', ['email'], { unique: true });
    await addIndexIfMissing(queryInterface, 'veterinarians', ['verification_status']);
    await addIndexIfMissing(queryInterface, 'veterinarians', ['specialization']);
    await addIndexIfMissing(queryInterface, 'veterinarians', ['city']);
    await addIndexIfMissing(queryInterface, 'veterinarians', ['state']);
    await addIndexIfMissing(queryInterface, 'veterinarians', ['latitude', 'longitude']);
    await addIndexIfMissing(queryInterface, 'veterinarians', ['is_active']);
    await addIndexIfMissing(queryInterface, 'veterinarians', ['rating']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('veterinarians');
  }
};
