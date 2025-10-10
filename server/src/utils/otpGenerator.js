const crypto = require('crypto');

const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
};

const hashOTP = async (otp) => {
  const bcrypt = require('bcrypt');
  return await bcrypt.hash(otp, 10);
};

const verifyOTP = async (plainOTP, hashedOTP) => {
  const bcrypt = require('bcrypt');
  return await bcrypt.compare(plainOTP, hashedOTP);
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP
};