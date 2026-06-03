/**
 * TWILIO DELIVERY WEBHOOK HANDLER
 * Receives delivery status updates from Twilio
 */

const logger = require('../utils/logger');
const db = require('../models');

/**
 * Handle Twilio webhook for message delivery status
 * POST /webhooks/twilio
 */
async function handleTwilioWebhook(req, res) {
  try {
    const {
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage,
      To,
      From
    } = req.body;

    logger.log(`📬 Twilio webhook: ${MessageSid} - Status: ${MessageStatus}`);

    // Update delivery status in database (if OtpLog exists)
    if (db.OtpLog) {
      try {
        await db.OtpLog.update(
          {
            delivery_status: MessageStatus,
            error_code: ErrorCode,
            error_message: ErrorMessage,
            delivered_at: MessageStatus === 'delivered' ? new Date() : null
          },
          {
            where: { twilio_message_sid: MessageSid }
          }
        );

        logger.log(`✅ Updated delivery status for ${MessageSid}: ${MessageStatus}`);
      } catch (dbError) {
        logger.error('Error updating OtpLog delivery status:', dbError);
      }
    }

    // Handle specific statuses
    if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
      logger.error(`❌ Message delivery failed: ${MessageSid} - ${ErrorMessage || ErrorCode}`);

      // TODO: Could implement retry logic or alert user here
      // For now, just log it
    } else if (MessageStatus === 'delivered') {
      logger.log(`✅ Message delivered successfully: ${MessageSid}`);
    }

    // Always return 200 to Twilio (even if we had errors processing)
    // Twilio will retry if we don't respond
    res.status(200).send('<Response></Response>');
  } catch (error) {
    logger.error('Error processing Twilio webhook:', error);

    // Still return 200 to avoid retries from Twilio
    res.status(200).send('<Response></Response>');
  }
}

/**
 * Verify webhook request is from Twilio
 * Uses Twilio's signature validation
 */
function verifyTwilioSignature(url, payload, signature) {
  // TODO: Implement signature verification
  // This requires the twilio library's requestValidator
  // For now, we trust the request (should be secured in production)

  const crypto = require('crypto');
  const urlWithQuery = url + payload;

  // This is a placeholder - implement proper verification
  return true;
}

module.exports = {
  handleTwilioWebhook
};
