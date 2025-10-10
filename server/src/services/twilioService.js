const twilioClient = require('../config/twilio');
require('dotenv').config();

class TwilioService {
  async sendWhatsAppOTP(phoneNumber, otp) {
    try {
      const message = await twilioClient.messages.create({
        body: `Your verification code is: ${otp}\n\nThis code will expire in ${process.env.OTP_EXPIRY_MINUTES} minutes.`,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${phoneNumber}`
      });

      return {
        success: true,
        messageSid: message.sid,
        status: message.status
      };
    } catch (error) {
      console.error('Twilio WhatsApp error:', error);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  async sendWhatsAppMessage(phoneNumber, messageBody) {
    try {
      const message = await twilioClient.messages.create({
        body: messageBody,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${phoneNumber}`
      });

      return {
        success: true,
        messageSid: message.sid
      };
    } catch (error) {
      console.error('Twilio WhatsApp error:', error);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }
}

module.exports = new TwilioService();