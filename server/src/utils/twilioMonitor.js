/**
 * TWILIO BALANCE MONITORING
 * Monitor Twilio account balance and send alerts when low
 */

const twilioClient = require('../config/twilio');
const logger = require('./logger');

function getOtpProvider() {
  return (process.env.OTP_PROVIDER || 'twilio-sms').toLowerCase();
}

function usesTwilioProvider() {
  return ['twilio-verify', 'local', 'twilio-sms', 'twilio-whatsapp'].includes(getOtpProvider());
}

/**
 * Get current Twilio account balance
 * @returns {Promise<{balance: number, currency: string}>}
 */
async function getTwilioBalance() {
  try {
    const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();

    return {
      balance: parseFloat(account.balance),
      currency: account.currency
    };
  } catch (error) {
    logger.error('Error fetching Twilio balance:', error);
    throw error;
  }
}

/**
 * Check if balance is sufficient for sending OTP
 * @param {number} minBalance - Minimum required balance (default: $1.00)
 * @returns {Promise<{sufficient: boolean, balance: number}>}
 */
async function checkBalanceSufficient(minBalance = 1.00) {
  if (!usesTwilioProvider()) {
    return {
      sufficient: true,
      skipped: true,
      provider: getOtpProvider()
    };
  }

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return {
      sufficient: true,
      skipped: true,
      provider: getOtpProvider(),
      warning: 'Twilio credentials not configured'
    };
  }

  try {
    const { balance } = await getTwilioBalance();

    if (balance < minBalance) {
      logger.error(`⚠️ Twilio balance is low: $${balance.toFixed(2)} (minimum: $${minBalance.toFixed(2)})`);
      return {
        sufficient: false,
        balance,
        message: 'Service temporarily unavailable due to low balance. Please try again later.'
      };
    }

    return {
      sufficient: true,
      balance
    };
  } catch (error) {
    logger.error('Error checking Twilio balance:', error);
    // If we can't check balance, allow but log error
    return {
      sufficient: true,
      balance: 0,
      warning: 'Could not verify balance'
    };
  }
}

/**
 * Start periodic balance monitoring
 * Alerts when balance falls below threshold
 * @param {number} checkIntervalMinutes - How often to check (default: 60 minutes)
 * @param {number} alertThreshold - Alert when balance below this (default: $5.00)
 */
function startBalanceMonitoring(checkIntervalMinutes = 60, alertThreshold = 5.00) {
  const checkIntervalMs = checkIntervalMinutes * 60 * 1000;

  logger.log(`✅ Twilio balance monitoring started (checks every ${checkIntervalMinutes} minutes, alerts at $${alertThreshold})`);

  // Check immediately on start
  checkAndAlert(alertThreshold);

  // Schedule periodic checks
  const intervalId = setInterval(async () => {
    await checkAndAlert(alertThreshold);
  }, checkIntervalMs);

  return intervalId;
}

/**
 * Check balance and send alert if low
 */
async function checkAndAlert(alertThreshold) {
  try {
    const { balance, currency } = await getTwilioBalance();

    logger.log(`💰 Twilio balance: ${currency} ${balance.toFixed(2)}`);

    if (balance < alertThreshold) {
      const alertMessage = `
🚨 TWILIO BALANCE ALERT 🚨
Current Balance: ${currency} ${balance.toFixed(2)}
Alert Threshold: ${currency} ${alertThreshold.toFixed(2)}
Status: ${balance < 1.00 ? 'CRITICAL' : 'LOW'}

Action Required: Add funds to your Twilio account immediately!
Link: https://www.twilio.com/console/billing/accounts
      `.trim();

      logger.error(alertMessage);

      // TODO: Send email/slack alert to admin
      // Example: await sendEmailToAdmin(alertMessage);
    } else if (balance < alertThreshold * 2) {
      logger.log(`⚠️ Twilio balance is getting low: ${currency} ${balance.toFixed(2)}`);
    }
  } catch (error) {
    logger.error('Error checking Twilio balance in monitoring:', error);
  }
}

/**
 * Estimate how many OTPs can be sent with current balance
 * @param {number} costPerOTP - Cost per OTP (default: $0.0075 for WhatsApp to India)
 */
async function estimateRemainingOTPs(costPerOTP = 0.0075) {
  try {
    const { balance } = await getTwilioBalance();
    const remaining = Math.floor(balance / costPerOTP);

    return {
      balance,
      costPerOTP,
      remainingOTPs: remaining,
      message: `Can send approximately ${remaining} more OTPs with current balance`
    };
  } catch (error) {
    logger.error('Error estimating remaining OTPs:', error);
    throw error;
  }
}

module.exports = {
  getTwilioBalance,
  checkBalanceSufficient,
  startBalanceMonitoring,
  checkAndAlert,
  estimateRemainingOTPs,
  usesTwilioProvider
};
