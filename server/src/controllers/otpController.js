/**
 * BULK OTP SENDING - For admin use only
 * Send OTP to multiple phone numbers
 * Updated: Support 1000+ OTPs per day
 */

const otpService = require('../services/otpService');
const logger = require('../utils/logger');

async function sendBulkOTP(req, res) {
  const { phoneNumbers } = req.body;
  const { User, sequelize } = req.db;

  // Validate
  if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'phoneNumbers must be a non-empty array'
    });
  }

  // ✅ FIXED: Increased limit from 100 to 1000
  // Also made it configurable via environment variable
  const MAX_BULK_OTP = parseInt(process.env.MAX_BULK_OTP || 1000);

  if (phoneNumbers.length > MAX_BULK_OTP) {
    return res.status(400).json({
      success: false,
      message: `Cannot send more than ${MAX_BULK_OTP} OTPs at once. Please split into smaller batches.`
    });
  }

  // Check admin authorization
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  logger.log(`📤 Admin ${req.user.id} sending bulk OTP to ${phoneNumbers.length} numbers`);

  try {
    // Send OTPs concurrently (with batching for very large requests)
    const batchSize = parseInt(process.env.BULK_OTP_BATCH_SIZE || 50, 10);
    const results = [];

    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      const batch = phoneNumbers.slice(i, i + batchSize);
      logger.log(`Sending batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(phoneNumbers.length / batchSize)}`);

      const batchResults = await Promise.allSettled(
        batch.map(phoneNumber =>
          otpService.sendOTP(phoneNumber, req.ip, req.get('user-agent'))
        )
      );

      batchResults.forEach((result, index) => {
        results.push({
          phoneNumber: batch[index],
          result,
        });
      });

      // Small delay between batches to be nice to Twilio API
      if (i + batchSize < phoneNumbers.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successful = results.filter(({ result }) => result.status === 'fulfilled' && result.value.success);
    const failed = results.filter(({ result }) => result.status === 'rejected' || !result.value?.success);

    // ✅ FIXED: Better response with cost estimate
    const cost = calculateCost(successful.length);

    logger.log(`✅ Bulk OTP completed: ${successful.length}/${phoneNumbers.length} successful, cost: $${cost.estimated}`);

    res.json({
      success: true,
      message: `Processed ${phoneNumbers.length} OTPs`,
      stats: {
        total: phoneNumbers.length,
        successful: successful.length,
        failed: failed.length,
        cost: cost,
        successRate: `${((successful.length / phoneNumbers.length) * 100).toFixed(1)}%`
      },
      details: {
        successful: successful.map(({ phoneNumber, result }) => ({
          phoneNumber,
          ...result.value
        })),
        failed: failed.map(({ phoneNumber, result }) => ({
          phoneNumber,
          error: result.reason?.message || result.value?.message || 'Unknown error'
        }))
      }
    });

  } catch (error) {
    logger.error('Bulk OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk OTPs',
      error: error.message
    });
  }
}

/**
 * Calculate estimated cost for OTPs
 * WhatsApp to India: ~₹0.60-₹0.75 per message
 */
function calculateCost(messageCount) {
  const avgCostPerMessage = 0.0075; // ~₹0.60 in USD
  return {
    estimated: (messageCount * avgCostPerMessage).toFixed(2),
    inr: (messageCount * 0.60).toFixed(2) // Approximate
  };
}

/**
 * Send OTP with queue (for high volume)
 */
async function sendOTPWithQueue(req, res) {
  const { phoneNumber } = req.body;
  const { User, OtpQueue, sequelize } = req.db;

  // Add to queue
  await OtpQueue.create({
    phone_number: phoneNumber,
    priority: 'normal',
    status: 'pending',
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.json({
    success: true,
    message: 'OTP added to queue'
  });

  // Process queue in background
  processQueue();
}

/**
 * Process OTP queue (runs in background)
 * ✅ FIXED: Removed broken transaction reference
 */
async function processQueue() {
  const { OtpQueue, sequelize } = req.db;
  const transaction = await sequelize.transaction();

  try {
    // Get pending OTPs (max 10 at a time)
    const queueItems = await OtpQueue.findAll({
      where: { status: 'pending' },
      order: [['created_at', 'ASC']],
      limit: 10,
      transaction
    });

    if (queueItems.length === 0) {
      await transaction.commit();
      return;
    }

    logger.log(`Processing ${queueItems.length} queued OTPs`);

    // Process concurrently
    await Promise.all(
      queueItems.map(async (item) => {
        try {
          await otpService.sendOTP(item.phone_number, item.ip_address, item.user_agent);
          await OtpQueue.update({ status: 'sent' }, {
            where: { id: item.id },
            transaction
          });
        } catch (error) {
          logger.error(`Queue OTP failed for ${item.phone_number}:`, error.message);
          await OtpQueue.update({ status: 'failed', error: error.message }, {
            where: { id: item.id },
            transaction
          });
        }
      })
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    logger.error('Error processing OTP queue:', error);
  }
}

module.exports = {
  sendBulkOTP,
  sendOTPWithQueue,
  processQueue,
  calculateCost
};
