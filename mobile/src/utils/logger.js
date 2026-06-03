/**
 * Console utility for React Native
 * In production, all console methods are no-ops to prevent information leakage
 */

const isDevelopment = __DEV__ || process.env.EXPO_PUBLIC_ENV === 'development';

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
