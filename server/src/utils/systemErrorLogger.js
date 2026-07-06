'use strict';

const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'password',
  'confirmpassword',
  'confirm_password',
  'otp',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'jwt',
  'secret',
  'apikey',
  'api_key',
  'privatekey',
  'private_key'
]);

const MAX_TEXT_LENGTH = 5000;
const MAX_JSON_LENGTH = 12000;

const normalizeError = (error) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message || 'Unknown error',
      stack: error.stack || null
    };
  }

  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
      stack: null
    };
  }

  return {
    name: error?.name || 'Error',
    message: error?.message || safeStringify(error || 'Unknown error'),
    stack: error?.stack || null
  };
};

const safeStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return '[Unserializable error]';
  }
};

const truncateText = (value, maxLength = MAX_TEXT_LENGTH) => {
  if (value === null || value === undefined) {
    return value;
  }

  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, maxLength)}... [truncated]` : text;
};

const redactValue = (value, key = '') => {
  if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
    return '[REDACTED]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((safe, [childKey, childValue]) => {
      safe[childKey] = redactValue(childValue, childKey);
      return safe;
    }, {});
  }

  if (typeof value === 'string') {
    return truncateText(value, 1000);
  }

  return value;
};

const safeJson = (value) => {
  if (!value || typeof value !== 'object') {
    return value || null;
  }

  try {
    const redacted = redactValue(value);
    const serialized = JSON.stringify(redacted);
    if (serialized.length <= MAX_JSON_LENGTH) {
      return redacted;
    }

    return {
      truncated: true,
      preview: serialized.slice(0, MAX_JSON_LENGTH)
    };
  } catch (error) {
    return {
      unserializable: true,
      message: error.message
    };
  }
};

const pickHeaders = (headers = {}) => ({
  authorization: headers.authorization ? '[REDACTED]' : undefined,
  'content-type': headers['content-type'],
  'content-length': headers['content-length'],
  'user-agent': headers['user-agent'],
  origin: headers.origin,
  referer: headers.referer,
  'x-forwarded-for': headers['x-forwarded-for']
});

const getModels = () => {
  try {
    return require('../models');
  } catch (error) {
    return null;
  }
};

const writeSystemErrorLog = async (payload) => {
  try {
    const models = getModels();
    if (!models?.SystemErrorLog) {
      return null;
    }

    return await models.SystemErrorLog.create(payload);
  } catch (logError) {
    console.error('Failed to persist system error log:', logError.message);
    return null;
  }
};

const logErrorFromRequest = (error, req, options = {}) => {
  const normalized = normalizeError(error);
  const statusCode = options.statusCode || error?.statusCode || error?.status || 500;

  return writeSystemErrorLog({
    source: options.source || 'api',
    severity: options.severity || (statusCode >= 500 ? 'error' : 'warning'),
    error_name: truncateText(normalized.name, 120),
    message: truncateText(normalized.message),
    stack: truncateText(normalized.stack, 20000),
    method: req?.method || null,
    route: truncateText(req?.originalUrl || req?.url || null, 500),
    status_code: statusCode,
    user_id: req?.user?.userId || req?.user?.id || null,
    admin_id: req?.admin?.id || null,
    ip_address: truncateText(req?.ip || req?.headers?.['x-forwarded-for'] || null, 80),
    user_agent: truncateText(req?.headers?.['user-agent'] || null, 1000),
    request_params: safeJson(req?.params),
    request_query: safeJson(req?.query),
    request_body: safeJson(req?.body),
    request_headers: safeJson(pickHeaders(req?.headers)),
    metadata: safeJson(options.metadata)
  });
};

const logSystemError = (error, options = {}) => {
  const normalized = normalizeError(error);

  return writeSystemErrorLog({
    source: options.source || 'process',
    severity: options.severity || 'fatal',
    error_name: truncateText(normalized.name, 120),
    message: truncateText(normalized.message),
    stack: truncateText(normalized.stack, 20000),
    method: null,
    route: null,
    status_code: null,
    user_id: null,
    admin_id: null,
    ip_address: null,
    user_agent: null,
    request_params: null,
    request_query: null,
    request_body: null,
    request_headers: null,
    metadata: safeJson(options.metadata)
  });
};

module.exports = {
  logErrorFromRequest,
  logSystemError
};
