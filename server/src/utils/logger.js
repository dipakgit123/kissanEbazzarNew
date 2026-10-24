'use strict';

// PM2/systemd collect stdout/stderr in production. Never silently discard errors.
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const sensitiveKey = /authorization|cookie|password|otp|token|secret|api.?key|private.?key|credential/i;
const cleanText = value => String(value)
  .replace(/Bearer\s+[^\s"',}]+/gi, 'Bearer [REDACTED]')
  .replace(/((?:password|otp|token|secret|api[_-]?key)\s*[=:]\s*)[^\s&,;]+/gi, '$1[REDACTED]')
  .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1[REDACTED]@')
  .slice(0, 2000);
const sanitize = (value, depth = 0, seen = new WeakSet()) => {
  if (value instanceof Error) return { name: value.name, message: cleanText(value.message), code: value.code, status: value.status || value.response?.status };
  if (typeof value === 'string') return cleanText(value);
  if (!value || typeof value !== 'object') return value;
  if (depth >= 4 || seen.has(value)) return '[TRUNCATED]';
  seen.add(value);
  if (Array.isArray(value)) return value.slice(0, 20).map(item => sanitize(item, depth + 1, seen));
  return Object.fromEntries(Object.entries(value).slice(0, 30).map(([key, item]) => [key,
    sensitiveKey.test(key) ? '[REDACTED]' : sanitize(item, depth + 1, seen)]));
};
const write = (level, args) => console[level](...(isDevelopment ? args : args.map(value => sanitize(value))));
module.exports = {
  log: (...args) => { if (isDevelopment) write('log', args); },
  debug: (...args) => { if (isDevelopment) write('debug', args); },
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args)
};
