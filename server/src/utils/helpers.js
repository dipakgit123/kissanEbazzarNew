/**
 * Server-side utility functions
 */

/**
 * Safe JSON parse with fallback
 * Prevents crashes from malformed JSON
 * @param {string} str - String to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed object or fallback
 */
function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return fallback;
  }
}

/**
 * Normalize tag input from JSON arrays, arrays, or comma-separated strings
 * @param {string|string[]|null|undefined} input - Raw tag input
 * @param {string[]} fallback - Fallback value if input is empty or invalid
 * @returns {string[]} Normalized tag array
 */
function normalizeTags(input, fallback = []) {
  if (Array.isArray(input)) {
    return input
      .map(tag => String(tag).trim())
      .filter(Boolean);
  }

  if (typeof input !== 'string') {
    return fallback;
  }

  const trimmedInput = input.trim();
  if (!trimmedInput) {
    return [];
  }

  const parsedTags = safeJsonParse(trimmedInput, null);
  if (Array.isArray(parsedTags)) {
    return parsedTags
      .map(tag => String(tag).trim())
      .filter(Boolean);
  }

  return trimmedInput
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
}

module.exports = {
  safeJsonParse,
  normalizeTags
};
