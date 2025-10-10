'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedOtp = await bcrypt.hash('123456', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        phone_number: '+1234567890',
        email: 'demo1@example.com',
        is_verified: true,
        verified_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        phone_number: '+9876543210',
        email: 'demo2@example.com',
        otp: hashedOtp,
        otp_expiry: new Date(Date.now() + 5 * 60 * 1000),
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};