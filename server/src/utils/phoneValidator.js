/**
 * PHONE NUMBER VALIDATION
 * Validates and normalizes phone numbers in E.164 format
 */

const logger = require('./logger');

/**
 * Validate and clean phone number
 * ✅ CONFIGURED FOR INDIA ONLY (+91)
 * @param {string} phoneNumber - Phone number to validate
 * @returns {{valid: boolean, cleaned: string, error: string|null}}
 */
function validatePhoneNumber(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return {
      valid: false,
      cleaned: '',
      error: 'Phone number is required'
    };
  }

  // Remove all non-numeric characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // Remove leading + if present (we'll add it back after validation)
  const hasPlus = cleaned.startsWith('+');
  if (hasPlus) {
    cleaned = cleaned.substring(1);
  }

  // Check if number is empty after cleaning
  if (cleaned.length === 0) {
    return {
      valid: false,
      cleaned: '',
      error: 'Invalid phone number: no digits found'
    };
  }

  // Check if number contains only digits
  if (!/^\d+$/.test(cleaned)) {
    return {
      valid: false,
      cleaned: '',
      error: 'Invalid phone number: contains non-numeric characters'
    };
  }

  // ✅ FIXED: Only accept Indian phone numbers (+91)
  // Indian numbers: +91 followed by 10 digits (total 12 digits with +91)
  if (!cleaned.startsWith('91')) {
    return {
      valid: false,
      cleaned: '',
      error: 'Only Indian phone numbers (+91) are supported. Please enter a valid Indian mobile number.'
    };
  }

  // Remove country code for length check
  const numberWithoutCountryCode = cleaned.substring(2);

  // ✅ FIXED: Indian mobile numbers are exactly 10 digits (without +91)
  if (numberWithoutCountryCode.length !== 10) {
    return {
      valid: false,
      cleaned: '',
      error: `Invalid Indian mobile number length: ${numberWithoutCountryCode.length} digits (must be exactly 10 digits after +91)`
    };
  }

  // ✅ FIXED: Indian mobile numbers start with 6, 7, 8, or 9
  const firstDigit = numberWithoutCountryCode.charAt(0);
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return {
      valid: false,
      cleaned: '',
      error: 'Invalid Indian mobile number: must start with 6, 7, 8, or 9 after +91'
    };
  }

  // Add + back
  cleaned = '+91' + numberWithoutCountryCode;

  return {
    valid: true,
    cleaned,
    error: null
  };
}

/**
 * Format phone number for display
 * @param {string} phoneNumber - Phone number in E.164 format
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phoneNumber) {
  const validation = validatePhoneNumber(phoneNumber);
  if (!validation.valid) {
    return phoneNumber;
  }

  const cleaned = validation.cleaned;

  // Format: +91 XXXXX XXXXX (India)
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 8)} ${cleaned.substring(8)}`;
  }

  // Format: +1 (XXX) XXX-XXXX (US/Canada)
  if (cleaned.startsWith('+1') && cleaned.length === 12) {
    return `+1 (${cleaned.substring(2, 5)}) ${cleaned.substring(5, 8)}-${cleaned.substring(8)}`;
  }

  // Default: just return cleaned number
  return cleaned;
}

/**
 * Extract country code from phone number
 * @param {string} phoneNumber - Phone number in E.164 format
 * @returns {string} Country code
 */
function extractCountryCode(phoneNumber) {
  const validation = validatePhoneNumber(phoneNumber);
  if (!validation.valid) {
    return null;
  }

  const cleaned = validation.cleaned.substring(1); // Remove +

  // Check for 2-digit country code first
  if (cleaned.length >= 12) {
    return cleaned.substring(0, 2);
  }

  // Otherwise 1-digit country code
  return cleaned.substring(0, 1);
}

/**
 * Check if phone number is from India
 * @param {string} phoneNumber - Phone number in E.164 format
 * @returns {boolean}
 */
function isIndianNumber(phoneNumber) {
  return phoneNumber.startsWith('+91');
}

/**
 * Check if phone number is from US/Canada
 * @param {string} phoneNumber - Phone number in E.164 format
 * @returns {boolean}
 */
function isUSNumber(phoneNumber) {
  return phoneNumber.startsWith('+1');
}

/**
 * Sanitize phone number for logging
 * @param {string} phoneNumber - Phone number
 * @returns {string} Sanitized (partially hidden) phone number
 */
function sanitizePhoneNumber(phoneNumber) {
  const validation = validatePhoneNumber(phoneNumber);
  if (!validation.valid) {
    return '***-***-****';
  }

  const cleaned = validation.cleaned;

  // Show first 4 and last 2 digits
  if (cleaned.length <= 6) {
    return cleaned.substring(0, 2) + '****';
  }

  return cleaned.substring(0, 4) + '****' + cleaned.substring(cleaned.length - 2);
}

module.exports = {
  validatePhoneNumber,
  formatPhoneNumber,
  extractCountryCode,
  isIndianNumber,
  isUSNumber,
  sanitizePhoneNumber
};
