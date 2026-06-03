const twilioClient = require('../config/twilio');
const logger = require('./logger');
require('dotenv').config();

/**
 * WhatsApp Reactivation Utility
 * Keeps Twilio WhatsApp number active by sending periodic messages
 * Prevents deactivation due to inactivity
 */

let lastReactivationTime = null;
const REACTIVATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Reactivate WhatsApp by sending a test message
 * This prevents Twilio from deactivating your WhatsApp number
 *
 * @param {string} testPhoneNumber - Phone number to send test message to (your own number)
 * @returns {Promise<{success: boolean, message: string, time: string}>}
 */
async function reactivateWhatsApp(testPhoneNumber = null) {
  try {
    // ✅ Use your own phone number from env or parameter
    const phoneNumber = testPhoneNumber || process.env.ADMIN_PHONE_NUMBER;

    if (!phoneNumber) {
      return {
        success: false,
        message: 'No test phone number configured. Set ADMIN_PHONE_NUMBER in .env'
      };
    }

    if (!process.env.TWILIO_WHATSAPP_NUMBER) {
      return {
        success: false,
        message: 'TWILIO_WHATSAPP_NUMBER not configured'
      };
    }

    logger.log('🔄 Attempting WhatsApp reactivation...');

    // Send test message to reactivate WhatsApp
    const message = await twilioClient.messages.create({
      body: '🔄 Kissan E-Bazzar - WhatsApp Reactivation Test\n\nThis is an automatic test message to keep your WhatsApp service active. You can ignore this message.',
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phoneNumber}`
    });

    lastReactivationTime = new Date();

    logger.log(`✅ WhatsApp reactivation successful: ${message.sid}`);
    logger.log(`📱 Test message sent to: ${phoneNumber}`);

    return {
      success: true,
      message: 'WhatsApp reactivation successful',
      messageSid: message.sid,
      sentTo: phoneNumber,
      time: lastReactivationTime.toISOString()
    };

  } catch (error) {
    logger.error(`❌ WhatsApp reactivation failed: ${error.message}`);

    return {
      success: false,
      message: `Reactivation failed: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Check if reactivation is needed
 * @returns {boolean}
 */
function needsReactivation() {
  if (!lastReactivationTime) {
    return true; // Never reactivated before
  }

  const timeSinceLastReactivation = Date.now() - new Date(lastReactivationTime).getTime();
  return timeSinceLastReactivation >= REACTIVATION_INTERVAL;
}

/**
 * Auto-reactivate WhatsApp if needed
 * Call this periodically (e.g., every hour) from a cron job
 */
async function autoReactivateWhatsApp() {
  if (needsReactivation()) {
    logger.log('⚠️ WhatsApp reactivation needed (24+ hours since last reactivation)');
    return await reactivateWhatsApp();
  } else {
    const hoursSinceLast = ((Date.now() - new Date(lastReactivationTime).getTime()) / (1000 * 60 * 60)).toFixed(1);
    logger.log(`✅ WhatsApp active (${hoursSinceLast}h since last reactivation)`);

    return {
      success: true,
      message: `WhatsApp active, no reactivation needed (${hoursSinceLast}h since last)`,
      lastReactivation: lastReactivationTime,
      needsReactivation: false
    };
  }
}

/**
 * Start automatic reactivation scheduler
 * Runs every hour and reactivates if 24+ hours have passed
 *
 * @param {number} checkIntervalMinutes - How often to check (default: 60 minutes)
 */
function startAutoReactivation(checkIntervalMinutes = 60) {
  const intervalMs = checkIntervalMinutes * 60 * 1000;

  logger.log(`🔄 WhatsApp auto-reactivation started`);
  logger.log(`⏰ Check interval: Every ${checkIntervalMinutes} minutes`);
  logger.log(`⏰ Reactivation interval: Every 24 hours`);

  // Initial reactivation on server start
  reactivateWhatsApp().then(result => {
    if (result.success) {
      logger.log(`✅ Initial WhatsApp reactivation completed`);
    } else {
      logger.log(`⚠️ Initial reactivation failed: ${result.message}`);
    }
  });

  // Schedule periodic reactivation checks
  setInterval(async () => {
    logger.log('🔍 Checking if WhatsApp reactivation needed...');
    const result = await autoReactivateWhatsApp();

    if (result.success && result.needsReactivation === false) {
      // No reactivation needed, just status check
    } else if (result.success && result.needsReactivation !== false) {
      logger.log(`✅ Scheduled reactivation completed`);
    } else {
      logger.log(`❌ Scheduled reactivation failed: ${result.message}`);
    }
  }, intervalMs);
}

/**
 * Manual reactivation - can be called via API endpoint
 * Useful for admin panel or manual trigger
 */
async function manualReactivation(req, res) {
  const { phoneNumber } = req.body;

  logger.log('🔄 Manual WhatsApp reactivation requested');

  const result = await reactivateWhatsApp(phoneNumber);

  if (result.success) {
    return res.json({
      success: true,
      message: 'WhatsApp reactivated successfully',
      ...result
    });
  } else {
    return res.status(500).json({
      success: false,
      message: 'WhatsApp reactivation failed',
      ...result
    });
  }
}

/**
 * Get reactivation status
 */
function getReactivationStatus() {
  return {
    lastReactivation: lastReactivationTime,
    timeSinceLastReactivation: lastReactivationTime ? Date.now() - new Date(lastReactivationTime).getTime() : null,
    hoursSinceLastReactivation: lastReactivationTime
      ? ((Date.now() - new Date(lastReactivationTime).getTime()) / (1000 * 60 * 60)).toFixed(2)
      : null,
    needsReactivation: needsReactivation(),
    reactivationInterval: REACTIVATION_INTERVAL
  };
}

module.exports = {
  reactivateWhatsApp,
  autoReactivateWhatsApp,
  startAutoReactivation,
  manualReactivation,
  getReactivationStatus,
  needsReactivation
};
