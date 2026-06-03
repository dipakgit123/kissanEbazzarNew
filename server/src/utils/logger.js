/**
 * Logger utility for server-side
 * In production, logs are written to a file or external service
 * In development, logs are written to console
 */

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
    // In production, you might want to use a logging service like Winston
  },
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // Always log errors (in production, send to error tracking service)
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

module.exports = logger;
