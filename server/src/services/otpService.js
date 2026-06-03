const db = require('../models');
const twilioVerifyService = require('./twilioVerifyService');
const twilioService = require('./twilioService');
const messageCentralService = require('./messageCentralService');
const { checkBalanceSufficient } = require('../utils/twilioMonitor');
const { checkIPRateLimit, checkPhoneNumberRateLimit } = require('../utils/rateLimiter');
const { validatePhoneNumber, sanitizePhoneNumber } = require('../utils/phoneValidator');
const { generateOTP, hashOTP, verifyOTP: verifyLocalOTPCode } = require('../utils/otpGenerator');
const { withLock } = require('../utils/lock');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
require('dotenv').config();

class OTPService {
  getProvider() {
    return (process.env.OTP_PROVIDER || 'twilio-verify').toLowerCase();
  }

  getExpectedOtpLength() {
    if (this.isMessageCentralProvider()) {
      return Number(process.env.MESSAGE_CENTRAL_OTP_LENGTH || 4);
    }

    if (this.isMessageCentralSmsProvider()) {
      return Number(process.env.MESSAGE_CENTRAL_SMS_OTP_LENGTH || process.env.OTP_LENGTH || 4);
    }

    return Number(process.env.OTP_LENGTH) || 6;
  }

  isLocalProvider() {
    return this.getProvider() === 'local';
  }

  isMessageCentralProvider() {
    return this.getProvider() === 'messagecentral';
  }

  isMessageCentralSmsProvider() {
    return this.getProvider() === 'messagecentral-sms';
  }

  usesLocalOtpVerification() {
    return this.isLocalProvider() || this.isMessageCentralSmsProvider();
  }

  updatesOtpStateDuringSend() {
    return this.isLocalProvider() || this.isMessageCentralProvider() || this.isMessageCentralSmsProvider();
  }

  getDeliveryChannel() {
    if (this.isMessageCentralProvider() || this.isMessageCentralSmsProvider()) {
      return 'sms';
    }

    return (process.env.OTP_LOCAL_CHANNEL || process.env.TWILIO_VERIFY_DEFAULT_CHANNEL || 'whatsapp').toLowerCase();
  }

  shouldExposeDebugOtp() {
    if ((process.env.OTP_EXPOSE_IN_RESPONSE || '').toLowerCase() === 'true') {
      return true;
    }

    return process.env.NODE_ENV !== 'production' && this.isLocalProvider();
  }

  getProviderMetadata(user) {
    return user?.metadata || {};
  }

  getMessageCentralVerificationId(user) {
    return this.getProviderMetadata(user).messagecentral_verification_id || null;
  }

  clearMessageCentralMetadata(metadata = {}) {
    const cleanedMetadata = { ...metadata };
    delete cleanedMetadata.messagecentral_verification_id;
    delete cleanedMetadata.messagecentral_status;
    delete cleanedMetadata.messagecentral_channel;
    delete cleanedMetadata.messagecentral_sent_at;
    delete cleanedMetadata.messagecentral_timeout;
    return cleanedMetadata;
  }

  async startMessageCentralVerification(user, phoneNumber, transaction) {
    const deliveryResponse = await messageCentralService.sendOTP(phoneNumber);
    const existingMetadata = this.clearMessageCentralMetadata(this.getProviderMetadata(user));

    await user.update(
      {
        otp: null,
        otp_expiry: null,
        otp_attempts: 0,
        last_otp_sent_at: new Date(),
        metadata: {
          ...existingMetadata,
          messagecentral_verification_id: deliveryResponse.verificationId,
          messagecentral_status: deliveryResponse.status,
          messagecentral_channel: deliveryResponse.channel,
          messagecentral_sent_at: new Date().toISOString(),
          messagecentral_timeout: deliveryResponse.timeout,
        },
      },
      { transaction }
    );

    return {
      sid: deliveryResponse.messageSid || deliveryResponse.verificationId || null,
      status: deliveryResponse.status || 'OTP_SENT',
      channel: deliveryResponse.channel || this.getDeliveryChannel(),
      provider: deliveryResponse.provider || this.getProvider(),
      warning: deliveryResponse.warning,
    };
  }

  async startMessageCentralSmsVerification(user, phoneNumber, transaction) {
    const otp = generateOTP(this.getExpectedOtpLength());
    const otpExpiry = new Date(Date.now() + (Number(process.env.OTP_EXPIRY_MINUTES) || 5) * 60 * 1000);
    const hashedOtp = await hashOTP(otp);
    const existingMetadata = this.clearMessageCentralMetadata(this.getProviderMetadata(user));
    const deliveryResponse = await messageCentralService.sendCustomOTP(phoneNumber, otp);

    await user.update(
      {
        otp: hashedOtp,
        otp_expiry: otpExpiry,
        otp_attempts: 0,
        last_otp_sent_at: new Date(),
        metadata: existingMetadata,
      },
      { transaction }
    );

    return {
      sid: deliveryResponse.messageSid || null,
      status: deliveryResponse.status || 'sent',
      channel: deliveryResponse.channel || 'sms',
      provider: deliveryResponse.provider || this.getProvider(),
      warning: deliveryResponse.warning,
      debugOtp: this.shouldExposeDebugOtp() ? otp : undefined,
    };
  }

  async startLocalVerification(user, phoneNumber, transaction) {
    const otp = generateOTP(this.getExpectedOtpLength());
    const otpExpiry = new Date(Date.now() + (Number(process.env.OTP_EXPIRY_MINUTES) || 5) * 60 * 1000);
    const hashedOtp = await hashOTP(otp);
    const existingMetadata = this.clearMessageCentralMetadata(this.getProviderMetadata(user));

    await user.update(
      {
        otp: hashedOtp,
        otp_expiry: otpExpiry,
        otp_attempts: 0,
        last_otp_sent_at: new Date(),
        metadata: existingMetadata,
      },
      { transaction }
    );

    const preferredChannel = this.getDeliveryChannel();
    const deliveryResponse = preferredChannel === 'sms'
      ? await twilioService.sendSMSOTP(phoneNumber, otp)
      : await twilioService.sendWhatsAppOTP(phoneNumber, otp);

    return {
      sid: deliveryResponse.messageSid || null,
      status: deliveryResponse.status || 'sent',
      channel: deliveryResponse.channel || preferredChannel,
      provider: deliveryResponse.provider || this.getProvider(),
      warning: deliveryResponse.warning,
      debugOtp: this.shouldExposeDebugOtp() ? otp : undefined,
    };
  }

  async startProviderVerification(user, phoneNumber, transaction) {
    if (this.isMessageCentralProvider()) {
      return this.startMessageCentralVerification(user, phoneNumber, transaction);
    }

    if (this.isMessageCentralSmsProvider()) {
      return this.startMessageCentralSmsVerification(user, phoneNumber, transaction);
    }

    if (this.isLocalProvider()) {
      return this.startLocalVerification(user, phoneNumber, transaction);
    }

    return twilioVerifyService.startVerification(phoneNumber);
  }

  async checkLocalVerification(user, otp) {
    if (!user.otp || !user.otp_expiry) {
      return {
        sid: null,
        status: 'failed',
        valid: false,
        errorMessage: 'No active OTP found. Please request OTP first',
      };
    }

    if (!user.isOtpValid()) {
      return {
        sid: null,
        status: 'expired',
        valid: false,
        errorMessage: 'Invalid or expired OTP',
      };
    }

    const isValid = await verifyLocalOTPCode(otp, user.otp);
    return {
      sid: null,
      status: isValid ? 'approved' : 'failed',
      valid: isValid,
      errorMessage: isValid ? null : 'Invalid or expired OTP',
    };
  }

  async checkMessageCentralVerification(user, otp) {
    const verificationId = this.getMessageCentralVerificationId(user);

    if (!verificationId) {
      return {
        sid: null,
        status: 'FAILED',
        valid: false,
        errorMessage: 'No active OTP found. Please request OTP first',
      };
    }

    return messageCentralService.verifyOTP(verificationId, otp);
  }

  async checkProviderVerification(user, phoneNumber, otp) {
    if (this.isMessageCentralProvider()) {
      return this.checkMessageCentralVerification(user, otp);
    }

    if (this.usesLocalOtpVerification()) {
      return this.checkLocalVerification(user, otp);
    }

    return twilioVerifyService.checkVerification(phoneNumber, otp);
  }

  async sendOTP(phoneNumber, ipAddress = null, userAgent = null) {
    const { User, OtpLog, sequelize } = db;

    if (!User) {
      throw new Error('User model not found. Please check model initialization.');
    }

    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      throw new Error(phoneValidation.error);
    }
    phoneNumber = phoneValidation.cleaned;

    logger.log(`OTP request for ${sanitizePhoneNumber(phoneNumber)} from IP: ${ipAddress}`);

    const balanceCheck = await checkBalanceSufficient(1.0);
    if (!balanceCheck.sufficient) {
      throw new Error(balanceCheck.message);
    }

    if (ipAddress) {
      const ipLimit = checkIPRateLimit(ipAddress, 10, 60 * 60 * 1000);
      if (!ipLimit.allowed) {
        throw new Error(ipLimit.message);
      }
      logger.log(`IP rate limit check passed: ${ipAddress} (${ipLimit.remaining} remaining)`);
    }

    const phoneLimit = checkPhoneNumberRateLimit(phoneNumber, 5);
    if (!phoneLimit.allowed) {
      throw new Error(phoneLimit.message);
    }
    logger.log(`Phone number rate limit check passed: ${phoneNumber} (${phoneLimit.remaining} remaining today)`);

    const lockTimeout = Number(process.env.OTP_LOCK_TIMEOUT_MS) || 30000;

    return withLock(`otp:${phoneNumber}`, async () => {
      let user = null;
      const transaction = await sequelize.transaction();

      try {
        user = await User.findOne({
          where: { phone_number: phoneNumber },
          transaction,
        });

        if (user && user.is_blocked) {
          if (user.blocked_until && new Date() < new Date(user.blocked_until)) {
            await transaction.rollback();
            throw new Error(`Account is blocked until ${user.blocked_until}`);
          }

          await user.update(
            {
              is_blocked: false,
              blocked_until: null,
            },
            { transaction }
          );
        }

        if (user && user.last_otp_sent_at) {
          const timeDiff = Date.now() - new Date(user.last_otp_sent_at).getTime();
          const minutesDiff = timeDiff / (1000 * 60);

          if (minutesDiff < 1) {
            await transaction.rollback();
            throw new Error('Please wait 1 minute before requesting a new OTP');
          }
        }

        if (user) {
          await user.update(
            {
              otp: null,
              otp_expiry: null,
              otp_attempts: 0,
              last_otp_sent_at: this.updatesOtpStateDuringSend() ? user.last_otp_sent_at : new Date(),
              metadata: this.clearMessageCentralMetadata(this.getProviderMetadata(user)),
            },
            { transaction }
          );
        } else {
          user = await User.create(
            {
              phone_number: phoneNumber,
              otp: null,
              otp_expiry: null,
              last_otp_sent_at: new Date(),
              otp_attempts: 0,
              is_verified: false,
              metadata: this.clearMessageCentralMetadata({ is_new_user: true, profile_completed: false }),
            },
            { transaction }
          );
        }

        const otpResponse = await this.startProviderVerification(user, phoneNumber, transaction);

        if (OtpLog) {
          await OtpLog.create(
            {
              user_id: user.id,
              otp_code: '***',
              action: 'sent',
              ip_address: ipAddress,
              user_agent: userAgent,
              twilio_message_sid: otpResponse.sid,
              metadata: {
                status: otpResponse.status,
                channel: otpResponse.channel || this.getDeliveryChannel(),
                provider: otpResponse.provider || this.getProvider(),
                warning: otpResponse.warning,
              },
            },
            { transaction }
          );
        }

        await transaction.commit();

        return {
          success: true,
          message: `OTP sent successfully via ${otpResponse.channel || this.getDeliveryChannel()}`,
          expiresIn: `${process.env.OTP_EXPIRY_MINUTES || 5} minutes`,
          userId: user.id,
          phoneNumber,
          otpLength: this.getExpectedOtpLength(),
          channel: otpResponse.channel || this.getDeliveryChannel(),
          provider: otpResponse.provider || this.getProvider(),
          warning: otpResponse.warning,
          debugOtp: otpResponse.debugOtp,
        };
      } catch (error) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }

        if (db.OtpLog && user) {
          try {
            await db.OtpLog.create({
              user_id: user.id,
              otp_code: '***',
              action: 'failed',
              ip_address: ipAddress,
              user_agent: userAgent,
              error_message: error.message,
            });
          } catch (logError) {
            logger.error('Failed to log OTP error:', logError);
          }
        }

        throw error;
      }
    }, lockTimeout);
  }

  async verifyOTP(phoneNumber, otp, ipAddress = null, userAgent = null) {
    const { User, OtpLog, sequelize } = db;

    if (!User) {
      throw new Error('User model not found. Please check model initialization.');
    }

    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      throw new Error(phoneValidation.error);
    }
    phoneNumber = phoneValidation.cleaned;

    const transaction = await sequelize.transaction();

    try {
      const user = await User.findOne({
        where: { phone_number: phoneNumber },
        transaction,
      });

      if (!user) {
        await transaction.rollback();
        throw new Error('User not found. Please request OTP first');
      }

      if (user.otp_attempts >= 3) {
        const blockedUntil = new Date();
        blockedUntil.setMinutes(blockedUntil.getMinutes() + 30);

        await user.update(
          {
            is_blocked: true,
            blocked_until: blockedUntil,
          },
          { transaction }
        );

        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        throw new Error('Maximum OTP attempts exceeded. Account blocked for 30 minutes');
      }

      const provider = this.getProvider();
      const verificationResult = await this.checkProviderVerification(user, phoneNumber, otp);

      if (!verificationResult.valid) {
        const newAttempts = user.otp_attempts + 1;
        await user.update(
          {
            otp_attempts: newAttempts,
          },
          { transaction }
        );

        if (OtpLog) {
          await OtpLog.create(
            {
              user_id: user.id,
              otp_code: '***',
              action: 'failed',
              ip_address: ipAddress,
              user_agent: userAgent,
              error_message: verificationResult.errorMessage || 'Invalid or expired OTP',
              twilio_message_sid: verificationResult.sid,
              metadata: {
                status: verificationResult.status,
                channel: this.isMessageCentralProvider()
                  ? 'sms'
                  : this.isLocalProvider()
                    ? this.getDeliveryChannel()
                    : process.env.TWILIO_VERIFY_DEFAULT_CHANNEL || 'whatsapp',
                provider,
              },
            },
            { transaction }
          );
        }

        await transaction.commit();
        throw new Error(`Invalid or expired OTP. ${3 - newAttempts} attempts remaining`);
      }

      const hasProfile = Boolean(user.full_name && user.postal_code);
      const existingMetadata = user.metadata || {};
      const shouldUpdateProfileFlags =
        hasProfile && (existingMetadata.is_new_user === true || existingMetadata.profile_completed !== true);

      const updatePayload = {
        is_verified: true,
        verified_at: new Date(),
        otp: null,
        otp_expiry: null,
        otp_attempts: 0,
        metadata: this.clearMessageCentralMetadata(existingMetadata),
      };

      if (shouldUpdateProfileFlags) {
        updatePayload.metadata = {
          ...this.clearMessageCentralMetadata(existingMetadata),
          is_new_user: false,
          profile_completed: true,
          profile_completed_at: existingMetadata.profile_completed_at || new Date().toISOString(),
        };
      }

      await user.update(updatePayload, { transaction });

      if (OtpLog) {
        await OtpLog.create(
          {
            user_id: user.id,
            otp_code: '***',
            action: 'verified',
            ip_address: ipAddress,
            user_agent: userAgent,
            twilio_message_sid: verificationResult.sid,
            metadata: {
              status: verificationResult.status,
              channel: this.isMessageCentralProvider()
                ? 'sms'
                : this.isLocalProvider()
                  ? this.getDeliveryChannel()
                  : process.env.TWILIO_VERIFY_DEFAULT_CHANNEL || 'whatsapp',
              provider,
            },
          },
          { transaction }
        );
      }

      await transaction.commit();

      const userResponse = {
        id: user.id,
        phone_number: user.phone_number,
        full_name: user.full_name,
        postal_code: user.postal_code,
        city: user.city,
        state: user.state,
        country: user.country,
        latitude: user.latitude,
        longitude: user.longitude,
        profile_photo: user.profile_photo,
        metadata: user.metadata,
        is_verified: user.is_verified,
        verified_at: user.verified_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };

      return {
        success: true,
        message: 'Phone number verified successfully',
        user: userResponse,
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

    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      throw new Error(phoneValidation.error);
    }
    phoneNumber = phoneValidation.cleaned;

    const user = await User.findOne({
      where: { phone_number: phoneNumber },
    });

    if (!user) {
      throw new Error('User not found. Please request OTP first');
    }

    if (user.is_verified) {
      throw new Error('Phone number is already verified');
    }

    return this.sendOTP(phoneNumber, ipAddress, userAgent);
  }

  async getUserStats(phoneNumber) {
    const { User, OtpLog, sequelize } = db;

    if (!User) {
      throw new Error('User model not found');
    }

    const userQuery = {
      where: { phone_number: phoneNumber },
    };

    if (OtpLog) {
      userQuery.include = [
        {
          model: OtpLog,
          as: 'otpLogs',
          limit: 10,
          order: [['created_at', 'DESC']],
        },
      ];
    }

    const user = await User.findOne(userQuery);

    if (!user) {
      throw new Error('User not found');
    }

    let stats = [];
    if (OtpLog) {
      stats = await OtpLog.findAll({
        where: { user_id: user.id },
        attributes: ['action', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['action'],
      });
    }

    return {
      user: {
        id: user.id,
        phone_number: user.phone_number,
        is_verified: user.is_verified,
        verified_at: user.verified_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      stats,
    };
  }

  async cleanupExpiredOTPs() {
    const { User } = db;

    if (!User) {
      logger.log('User model not available for cleanup');
      return 0;
    }

    try {
      const result = await User.update(
        {
          otp: null,
          otp_expiry: null,
        },
        {
          where: {
            otp_expiry: {
              [Op.lt]: new Date(),
            },
          },
        }
      );

      logger.log(`Cleaned up ${result[0]} expired OTPs`);
      return result[0];
    } catch (error) {
      logger.error('Error cleaning up expired OTPs:', error);
      return 0;
    }
  }
}

module.exports = new OTPService();
