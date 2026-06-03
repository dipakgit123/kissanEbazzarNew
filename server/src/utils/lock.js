/**
 * DISTRIBUTED LOCKING MECHANISM
 * Prevents race conditions in concurrent OTP requests.
 * Uses in-memory storage (upgrade to Redis for production/multi-server).
 */

const logger = require('./logger');

// In-memory lock storage
const locks = new Map();

/**
 * Acquire a lock for a specific key.
 * @param {string} key - Lock key (e.g., phone number)
 * @param {number} timeout - Lock lease in milliseconds
 * @returns {Promise<{acquired: boolean, release: Function|null, extend: Function|null}>}
 */
async function acquireLock(key, timeout = 5000) {
  const now = Date.now();

  if (locks.has(key)) {
    const existingLock = locks.get(key);

    if (now < existingLock.expiresAt) {
      logger.log(`Lock busy for ${key}, expires in ${existingLock.expiresAt - now}ms`);
      return { acquired: false, release: null, extend: null };
    }

    locks.delete(key);
    logger.log(`Expired lock removed for ${key}`);
  }

  const lock = {
    acquiredAt: now,
    expiresAt: now + timeout,
  };

  locks.set(key, lock);
  logger.log(`Lock acquired for ${key} (expires in ${timeout}ms)`);

  const release = () => {
    const current = locks.get(key);
    if (current && current.acquiredAt === lock.acquiredAt) {
      locks.delete(key);
      logger.log(`Lock released for ${key}`);
      return true;
    }
    return false;
  };

  const extend = (nextTimeout = timeout) => {
    const current = locks.get(key);
    if (current && current.acquiredAt === lock.acquiredAt) {
      current.expiresAt = Date.now() + nextTimeout;
      return true;
    }
    return false;
  };

  return { acquired: true, release, extend };
}

/**
 * Execute function with lock.
 * The lock lease is extended while the function is still running.
 * @param {string} key - Lock key
 * @param {Function} fn - Function to execute
 * @param {number} timeout - Lock lease in milliseconds
 * @returns {Promise<any>} Result of function execution
 */
async function withLock(key, fn, timeout = 5000) {
  const { acquired, release, extend } = await acquireLock(key, timeout);

  if (!acquired) {
    throw new Error(`Could not acquire lock for ${key}. Please try again.`);
  }

  const heartbeatInterval = Math.max(1000, Math.floor(timeout / 2));
  const heartbeat = setInterval(() => {
    if (!extend || !extend(timeout)) {
      clearInterval(heartbeat);
    }
  }, heartbeatInterval);

  try {
    return await fn();
  } finally {
    clearInterval(heartbeat);
    if (release) {
      release();
    }
  }
}

/**
 * Clean up expired locks.
 */
function cleanupExpiredLocks() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, lock] of locks.entries()) {
    if (now >= lock.expiresAt) {
      locks.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.log(`Cleaned up ${cleaned} expired locks`);
  }

  return cleaned;
}

// Clean up expired locks every minute
setInterval(cleanupExpiredLocks, 60 * 1000);

/**
 * Get current lock stats.
 */
function getLockStats() {
  return {
    activeLocks: locks.size,
    locks: Array.from(locks.keys()),
  };
}

module.exports = {
  acquireLock,
  withLock,
  cleanupExpiredLocks,
  getLockStats,
};
