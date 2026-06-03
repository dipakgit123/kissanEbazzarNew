/**
 * IP-BASED RATE LIMITING FOR OTP
 * Prevents abuse from single IP addresses
 */

const logger = require('./logger');

// In-memory storage (upgrade to Redis for production)
const ipRequestLog = new Map();
const phoneNumberRequestLog = new Map();

/**
 * Clean old entries from rate limit logs
 */
function cleanOldEntries(map, maxAge = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  for (const [key, value] of map.entries()) {
    if (now - value.firstSeen > maxAge) {
      map.delete(key);
    }
  }
}

// Clean old entries every hour
setInterval(() => {
  cleanOldEntries(ipRequestLog);
  cleanOldEntries(phoneNumberRequestLog);
}, 60 * 60 * 1000);

/**
 * Check if IP is rate limited
 * @param {string} ipAddress - IP address
 * @param {number} maxRequests - Maximum requests allowed (default: 10 per hour)
 * @param {number} windowMs - Time window in milliseconds (default: 1 hour)
 * @returns {{allowed: boolean, remaining: number, resetTime: number}}
 */
function checkIPRateLimit(ipAddress, maxRequests = 10, windowMs = 60 * 60 * 1000) {
  const now = Date.now();

  if (!ipRequestLog.has(ipAddress)) {
    ipRequestLog.set(ipAddress, {
      count: 1,
      firstSeen: now,
      resetTime: now + windowMs
    });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  const data = ipRequestLog.get(ipAddress);

  // Reset if window expired
  if (now > data.resetTime) {
    data.count = 1;
    data.firstSeen = now;
    data.resetTime = now + windowMs;
    ipRequestLog.set(ipAddress, data);
    return { allowed: true, remaining: maxRequests - 1, resetTime: data.resetTime };
  }

  // Check if limit exceeded
  if (data.count >= maxRequests) {
    logger.warn(`⚠️ IP rate limit exceeded: ${ipAddress} (${data.count}/${maxRequests})`);
    return {
      allowed: false,
      remaining: 0,
      resetTime: data.resetTime,
      message: `Too many OTP requests from your location. Please try again after ${new Date(data.resetTime).toLocaleTimeString()}.`
    };
  }

  // Increment counter
  data.count++;
  ipRequestLog.set(ipAddress, data);

  return { allowed: true, remaining: maxRequests - data.count, resetTime: data.resetTime };
}

/**
 * Check if phone number is rate limited (daily limit)
 * @param {string} phoneNumber - Phone number
 * @param {number} maxRequests - Maximum requests per day (default: 5)
 * @returns {{allowed: boolean, remaining: number, resetsAt: string}}
 */
function checkPhoneNumberRateLimit(phoneNumber, maxRequests = 5) {
  const now = Date.now();
  const today = new Date(now).toDateString();

  if (!phoneNumberRequestLog.has(phoneNumber)) {
    phoneNumberRequestLog.set(phoneNumber, {
      count: 1,
      date: today,
      resetsAt: new Date(now + 24 * 60 * 60 * 1000).toISOString()
    });
    return { allowed: true, remaining: maxRequests - 1, resetsAt: phoneNumberRequestLog.get(phoneNumber).resetsAt };
  }

  const data = phoneNumberRequestLog.get(phoneNumber);

  // Reset if new day
  if (data.date !== today) {
    data.count = 1;
    data.date = today;
    data.resetsAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    phoneNumberRequestLog.set(phoneNumber, data);
    return { allowed: true, remaining: maxRequests - 1, resetsAt: data.resetsAt };
  }

  // Check if daily limit exceeded
  if (data.count >= maxRequests) {
    logger.warn(`⚠️ Phone number rate limit exceeded: ${phoneNumber} (${data.count}/${maxRequests} per day)`);
    return {
      allowed: false,
      remaining: 0,
      resetsAt: data.resetsAt,
      message: `Daily OTP limit reached for this number. Maximum ${maxRequests} OTPs per day. Please try again tomorrow.`
    };
  }

  // Increment counter
  data.count++;
  phoneNumberRequestLog.set(phoneNumber, data);

  return { allowed: true, remaining: maxRequests - data.count, resetsAt: data.resetsAt };
}

/**
 * Record successful OTP send (for analytics)
 */
function recordOTPAttempt(phoneNumber, ipAddress, success = true) {
  // This can be upgraded to store in database for analytics
  logger.log(`OTP attempt: ${phoneNumber} from ${ipAddress} - ${success ? 'Success' : 'Failed'}`);
}

/**
 * Get rate limit stats for a phone number
 */
function getPhoneNumberStats(phoneNumber) {
  if (!phoneNumberRequestLog.has(phoneNumber)) {
    return { count: 0, date: null, resetsAt: null };
  }

  const data = phoneNumberRequestLog.get(phoneNumber);
  return {
    count: data.count,
    date: data.date,
    resetsAt: data.resetsAt,
    remaining: Math.max(0, 5 - data.count)
  };
}

/**
 * Reset rate limit for a phone number (admin function)
 */
function resetPhoneNumberLimit(phoneNumber) {
  if (phoneNumberRequestLog.has(phoneNumber)) {
    phoneNumberRequestLog.delete(phoneNumber);
    logger.log(`Rate limit reset for ${phoneNumber}`);
    return true;
  }
  return false;
}

module.exports = {
  checkIPRateLimit,
  checkPhoneNumberRateLimit,
  recordOTPAttempt,
  getPhoneNumberStats,
  resetPhoneNumberLimit,
  cleanOldEntries
};
