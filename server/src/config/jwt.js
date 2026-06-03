'use strict';

const INSECURE_DEFAULTS = new Set([
  'default_secret_change_this',
  'admin-secret-key',
  'your-secret-key'
]);

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || INSECURE_DEFAULTS.has(secret) || secret.trim().length < 16) {
    throw new Error(
      'JWT_SECRET must be set to a non-default value with at least 16 characters.'
    );
  }

  return secret;
};

module.exports = {
  getJwtSecret
};
