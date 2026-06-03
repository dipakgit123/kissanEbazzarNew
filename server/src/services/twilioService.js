const twilioClient = require('../config/twilio');
const logger = require('../utils/logger');
require('dotenv').config();

class TwilioService {
  getWhatsAppFrom() {
    const sender = process.env.TWILIO_WHATSAPP_SENDER || process.env.TWILIO_WHATSAPP_NUMBER;

    if (!sender) {
      throw new Error('Twilio WhatsApp sender is not configured');
    }

    return sender.startsWith('whatsapp:') ? sender : `whatsapp:${sender}`;
  }

  getWhatsAppTo(phoneNumber) {
    return phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;
  }

  buildOtpBody(otp) {
    const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 5;
    return `Your verification code is: ${otp}\n\nThis code will expire in ${expiryMinutes} minutes.`;
  }

  getOtpTemplatePayload(otp) {
    const contentSid = process.env.TWILIO_WHATSAPP_OTP_CONTENT_SID;
    if (!contentSid) {
      return null;
    }

    const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 5;
    return {
      contentSid,
      contentVariables: JSON.stringify({
        1: otp,
        2: `${expiryMinutes} minutes`,
      }),
    };
  }

  /**
   * Send OTP via a live WhatsApp sender.
   * Uses a WhatsApp template when TWILIO_WHATSAPP_OTP_CONTENT_SID is configured.
   * Falls back to SMS if WhatsApp delivery fails.
   */
  async sendWhatsAppOTP(phoneNumber, otp) {
    try {
      const from = this.getWhatsAppFrom();
      const to = this.getWhatsAppTo(phoneNumber);
      const templatePayload = this.getOtpTemplatePayload(otp);

      const message = await twilioClient.messages.create(
        templatePayload
          ? {
              from,
              to,
              contentSid: templatePayload.contentSid,
              contentVariables: templatePayload.contentVariables,
            }
          : {
              from,
              to,
              body: this.buildOtpBody(otp),
            }
      );

      logger.log(`WhatsApp OTP sent to ${phoneNumber}: ${message.sid}`);

      return {
        success: true,
        messageSid: message.sid,
        status: message.status,
        channel: 'whatsapp',
        templateBased: Boolean(templatePayload),
      };
    } catch (error) {
      logger.error(`WhatsApp failed for ${phoneNumber}: ${error.message}`);

      if (!process.env.TWILIO_PHONE_NUMBER) {
        throw new Error(`Failed to send WhatsApp OTP: ${error.message}`);
      }

      logger.log(`Falling back to SMS for ${phoneNumber}`);
      return this.sendSMSOTP(phoneNumber, otp);
    }
  }

  async sendSMSOTP(phoneNumber, otp) {
    try {
      if (!process.env.TWILIO_PHONE_NUMBER) {
        throw new Error('Twilio SMS number not configured');
      }

      const message = await twilioClient.messages.create({
        body: this.buildOtpBody(otp),
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      logger.log(`SMS OTP sent to ${phoneNumber}: ${message.sid}`);

      return {
        success: true,
        messageSid: message.sid,
        status: message.status,
        channel: 'sms',
        warning: 'Delivered via SMS (WhatsApp delivery unavailable)',
      };
    } catch (error) {
      logger.error('Twilio SMS error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  async sendWhatsAppMessage(phoneNumber, messageBody) {
    try {
      const message = await twilioClient.messages.create({
        body: messageBody,
        from: this.getWhatsAppFrom(),
        to: this.getWhatsAppTo(phoneNumber),
      });

      return {
        success: true,
        messageSid: message.sid,
      };
    } catch (error) {
      console.error('Twilio WhatsApp error:', error);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }
}

module.exports = new TwilioService();
