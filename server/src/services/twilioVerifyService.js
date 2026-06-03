const twilioClient = require('../config/twilio');
const logger = require('../utils/logger');
require('dotenv').config();

class TwilioVerifyService {
  getServiceSid() {
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!serviceSid) {
      throw new Error('Twilio Verify service SID is not configured');
    }

    return serviceSid;
  }

  getPreferredChannel() {
    return (process.env.TWILIO_VERIFY_DEFAULT_CHANNEL || 'whatsapp').toLowerCase();
  }

  getFallbackChannel() {
    const configuredFallback = process.env.TWILIO_VERIFY_FALLBACK_CHANNEL;
    if (!configuredFallback) {
      return null;
    }

    const fallbackChannel = configuredFallback.toLowerCase();
    return fallbackChannel === this.getPreferredChannel() ? null : fallbackChannel;
  }

  async sendVerification(to, channel = this.getPreferredChannel()) {
    const serviceSid = this.getServiceSid();
    const verification = await twilioClient.verify.v2
      .services(serviceSid)
      .verifications.create({
        to,
        channel,
      });

    return {
      sid: verification.sid,
      status: verification.status,
      channel,
    };
  }

  async startVerification(to) {
    try {
      return await this.sendVerification(to, this.getPreferredChannel());
    } catch (error) {
      logger.error(`Twilio Verify ${this.getPreferredChannel()} failed for ${to}: ${error.message}`);

      const fallbackChannel = this.getFallbackChannel();
      if (!fallbackChannel) {
        throw error;
      }

      logger.log(`Falling back to Twilio Verify ${fallbackChannel} for ${to}`);
      return this.sendVerification(to, fallbackChannel);
    }
  }

  async checkVerification(to, code) {
    try {
      const serviceSid = this.getServiceSid();
      const verificationCheck = await twilioClient.verify.v2
        .services(serviceSid)
        .verificationChecks.create({
          to,
          code,
        });

      return {
        sid: verificationCheck.sid,
        status: verificationCheck.status,
        valid: verificationCheck.status === 'approved',
      };
    } catch (error) {
      logger.error(`Twilio Verify check failed for ${to}: ${error.message}`);

      if (/expired|invalid|max check attempts|verification check/i.test(error.message || '')) {
        return {
          sid: null,
          status: 'failed',
          valid: false,
          errorMessage: error.message,
        };
      }

      throw error;
    }
  }
}

module.exports = new TwilioVerifyService();
