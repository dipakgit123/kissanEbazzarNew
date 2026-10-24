'use strict';
const db = require('../models');
const bcrypt = require('bcrypt');
const { generateOTP } = require('../utils/otpGenerator');
const { validatePhoneNumber } = require('../utils/phoneValidator');
const twilio = require('./twilioService');
const failure = (status, message) => ({ status, body: { success: false, message } });
const processOtp = async (phone, code, send = false) => {
  const validation = validatePhoneNumber(phone);
  if (!validation.valid) return failure(400, validation.error);
  return db.sequelize.transaction(async transaction => {
    const vet = await db.Veterinarian.findOne({ where: { phone_number: validation.cleaned }, transaction, lock: transaction.LOCK.UPDATE });
    if (!vet) return failure(404, 'Veterinarian not found');
    if (!vet.is_active || vet.verification_status !== 'verified') return failure(403, 'Veterinarian account is not approved');
    if (vet.otp_blocked_until && new Date(vet.otp_blocked_until) > new Date()) return failure(429, 'Too many OTP attempts. Please try again later.');
    if (send) {
      if (vet.last_otp_sent_at && Date.now() - new Date(vet.last_otp_sent_at).getTime() < 60000) return failure(429, 'Please wait one minute before requesting another OTP');
      const otp = generateOTP(6);
      const hashed = await bcrypt.hash(otp, 10);
      await twilio.sendSMSOTP(validation.cleaned, otp);
      await vet.update({ otp: hashed, otp_expiry: new Date(Date.now() + 600000), otp_attempts: 0, otp_blocked_until: null, last_otp_sent_at: new Date() }, { transaction });
      return { status: 200, body: { success: true, message: 'OTP sent successfully' } };
    }
    if (!/^\d{6}$/.test(String(code || '')) || !vet.isOtpValid() || !(await bcrypt.compare(String(code), vet.otp))) {
      const attempts = vet.otp_attempts + 1;
      await vet.update({ otp_attempts: attempts, ...(attempts >= 5 ? { otp_blocked_until: new Date(Date.now() + 1800000) } : {}) }, { transaction });
      return failure(400, 'Invalid or expired OTP');
    }
    await vet.update({ otp: null, otp_expiry: null, otp_attempts: 0, is_phone_verified: true }, { transaction });
    return { status: 200, veterinarian: vet };
  });
};
module.exports = { sendOtp: phone => processOtp(phone, null, true), verifyOtp: (phone, code) => processOtp(phone, code) };
