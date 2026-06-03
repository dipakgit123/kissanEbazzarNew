/**
 * Console utility for environment-based logging
 * In production, all console methods are no-ops to prevent information leakage
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

const logger = {
  log: isDevelopment ? console.log : () => {},
  warn: isDevelopment ? console.warn : () => {},
  error: isDevelopment ? console.error : () => {},
  info: isDevelopment ? console.info : () => {},
  debug: isDevelopment ? console.debug : () => {},
};

// Replace console methods in production
if (!isDevelopment) {
  console.log = logger.log;
  console.warn = logger.warn;
  console.error = logger.error;
  console.info = logger.info;
  console.debug = logger.debug;
}

export default logger;
