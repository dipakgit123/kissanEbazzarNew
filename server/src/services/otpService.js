const db = require('../models');
const { generateOTP, hashOTP, verifyOTP } = require('../utils/otpGenerator');
const twilioService = require('./twilioService');
const { Op } = require('sequelize');
require('dotenv').config();

class OTPService {
 // src/services/otpService.js - Fixed sendOTP method

async sendOTP(phoneNumber, ipAddress = null, userAgent = null) {
  const { User, OtpLog, sequelize } = db;
  
  // Validate models exist
  if (!User) {
    throw new Error('User model not found. Please check model initialization.');
  }
  
  let user = null; // Declare user in outer scope
  const transaction = await sequelize.transaction();
  
  try {
    // Find or create user using Sequelize
    user = await User.findOne({ 
      where: { phone_number: phoneNumber },
      transaction 
    });
    
    // Check if user is blocked
    if (user && user.is_blocked) {
      if (user.blocked_until && new Date() < new Date(user.blocked_until)) {
        await transaction.rollback();
        throw new Error(`Account is blocked until ${user.blocked_until}`);
      } else {
        // Unblock if time has passed
        await user.update({ 
          is_blocked: false, 
          blocked_until: null 
        }, { transaction });
      }
    }

    // Rate limiting check
    if (user && user.last_otp_sent_at) {
      const timeDiff = Date.now() - new Date(user.last_otp_sent_at).getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      if (minutesDiff < 1) {
        await transaction.rollback();
        throw new Error('Please wait 1 minute before requesting a new OTP');
      }
    }

    // Generate OTP
    const otp = generateOTP(parseInt(process.env.OTP_LENGTH) || 6);
    const hashedOTP = await hashOTP(otp);
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + parseInt(process.env.OTP_EXPIRY_MINUTES || 5));

    // Create or update user
    if (user) {
      await user.update({
        otp: hashedOTP,
        otp_expiry: otpExpiry,
        otp_attempts: 0,
        last_otp_sent_at: new Date()
      }, { transaction });
    } else {
      user = await User.create({
        phone_number: phoneNumber,
        otp: hashedOTP,
        otp_expiry: otpExpiry,
        last_otp_sent_at: new Date(),
        otp_attempts: 0,
        is_verified: false
      }, { transaction });
    }

    // Send OTP via WhatsApp
    const twilioResponse = await twilioService.sendWhatsAppOTP(phoneNumber, otp);

    // Log OTP sent (if OtpLog model exists)
    if (OtpLog) {
      await OtpLog.create({
        user_id: user.id,
        otp_code: otp.substring(0, 3) + '***', // Partial OTP for security
        action: 'sent',
        ip_address: ipAddress,
        user_agent: userAgent,
        twilio_message_sid: twilioResponse.messageSid,
        metadata: { status: twilioResponse.status }
      }, { transaction });
    }

    await transaction.commit();

    return {
      success: true,
      message: 'OTP sent successfully to WhatsApp',
      expiresIn: `${process.env.OTP_EXPIRY_MINUTES || 5} minutes`,
      userId: user.id
    };
  } catch (error) {
    await transaction.rollback();
    
    // Log failed attempt if OtpLog exists and user exists
    // FIXED: Now user is defined in outer scope
    if (db.OtpLog && user) {
      try {
        await db.OtpLog.create({
          user_id: user.id,
          otp_code: 'N/A',
          action: 'failed',
          ip_address: ipAddress,
          user_agent: userAgent,
          error_message: error.message
        });
      } catch (logError) {
        console.error('Failed to log OTP error:', logError);
      }
    }
    
    throw error;
  }
}

  async verifyOTP(phoneNumber, otp, ipAddress = null, userAgent = null) {
    const { User, OtpLog, sequelize } = db;
    
    if (!User) {
      throw new Error('User model not found. Please check model initialization.');
    }
    
    const transaction = await sequelize.transaction();
    
    try {
      // Find user
      const user = await User.findOne({ 
        where: { phone_number: phoneNumber },
        transaction
      });

      if (!user) {
        await transaction.rollback();
        throw new Error('User not found. Please request OTP first');
      }

      // Check OTP attempts
      if (user.otp_attempts >= 3) {
        // Block user for 30 minutes after 3 failed attempts
        const blockedUntil = new Date();
        blockedUntil.setMinutes(blockedUntil.getMinutes() + 30);
        
        await user.update({
          is_blocked: true,
          blocked_until: blockedUntil
        }, { transaction });
        
        await transaction.rollback();
        throw new Error('Maximum OTP attempts exceeded. Account blocked for 30 minutes');
      }

      // Check OTP expiry
      if (!user.otp_expiry || new Date() > new Date(user.otp_expiry)) {
        if (OtpLog) {
          await OtpLog.create({
            user_id: user.id,
            otp_code: 'N/A',
            action: 'expired',
            ip_address: ipAddress,
            user_agent: userAgent
          }, { transaction });
        }
        
        await transaction.rollback();
        throw new Error('OTP has expired. Please request a new one');
      }

      // Verify OTP
      const isValid = await verifyOTP(otp, user.otp);

      if (!isValid) {
        const newAttempts = user.otp_attempts + 1;
        await user.update({
          otp_attempts: newAttempts
        }, { transaction });
        
        if (OtpLog) {
          await OtpLog.create({
            user_id: user.id,
            otp_code: otp.substring(0, 3) + '***',
            action: 'failed',
            ip_address: ipAddress,
            user_agent: userAgent,
            error_message: 'Invalid OTP'
          }, { transaction });
        }
        
        await transaction.commit();
        throw new Error(`Invalid OTP. ${3 - newAttempts} attempts remaining`);
      }

      // Mark user as verified
      await user.update({
        is_verified: true,
        verified_at: new Date(),
        otp: null,
        otp_expiry: null,
        otp_attempts: 0
      }, { transaction });

      // Log successful verification
      if (OtpLog) {
        await OtpLog.create({
          user_id: user.id,
          otp_code: otp.substring(0, 3) + '***',
          action: 'verified',
          ip_address: ipAddress,
          user_agent: userAgent
        }, { transaction });
      }

      await transaction.commit();

      // Send success message via WhatsApp
      try {
        await twilioService.sendWhatsAppMessage(
          phoneNumber,
          '✅ Congratulations! Your phone number has been verified successfully.'
        );
      } catch (twilioError) {
        console.error('Failed to send success message:', twilioError);
        // Don't throw error here as verification was successful
      }

      // Prepare safe user object for response
      const userResponse = {
        id: user.id,
        phone_number: user.phone_number,
        is_verified: user.is_verified,
        verified_at: user.verified_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      return {
        success: true,
        message: 'Phone number verified successfully',
        user: userResponse
      };
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  async resendOTP(phoneNumber, ipAddress = null, userAgent = null) {
    const { User } = db;
    
    if (!User) {
      throw new Error('User model not found. Please check model initialization.');
    }
    
    try {
      const user = await User.findOne({ 
        where: { phone_number: phoneNumber } 
      });

      if (!user) {
        throw new Error('User not found. Please request OTP first');
      }

      if (user.is_verified) {
        throw new Error('Phone number is already verified');
      }

      return await this.sendOTP(phoneNumber, ipAddress, userAgent);
    } catch (error) {
      throw error;
    }
  }

  async getUserStats(phoneNumber) {
    const { User, OtpLog, sequelize } = db;
    
    if (!User) {
      throw new Error('User model not found');
    }
    
    try {
      const userQuery = {
        where: { phone_number: phoneNumber }
      };
      
      // Add OtpLog association only if it exists
      if (OtpLog) {
        userQuery.include = [{
          model: OtpLog,
          as: 'otpLogs',
          limit: 10,
          order: [['created_at', 'DESC']]
        }];
      }
      
      const user = await User.findOne(userQuery);

      if (!user) {
        throw new Error('User not found');
      }

      let stats = null;
      
      // Get stats only if OtpLog model exists
      if (OtpLog) {
        stats = await OtpLog.findAll({
          where: { user_id: user.id },
          attributes: [
            'action',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['action']
        });
      }

      // Prepare safe user object
      const userResponse = {
        id: user.id,
        phone_number: user.phone_number,
        is_verified: user.is_verified,
        verified_at: user.verified_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      return {
        user: userResponse,
        stats: stats || []
      };
    } catch (error) {
      throw error;
    }
  }

  async cleanupExpiredOTPs() {
    const { User } = db;
    
    if (!User) {
      console.log('User model not available for cleanup');
      return 0;
    }
    
    try {
      const result = await User.update(
        {
          otp: null,
          otp_expiry: null
        },
        {
          where: {
            otp_expiry: {
              [Op.lt]: new Date()
            }
          }
        }
      );

      console.log(`Cleaned up ${result[0]} expired OTPs`);
      return result[0];
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      return 0;
    }
  }
}

module.exports = new OTPService();