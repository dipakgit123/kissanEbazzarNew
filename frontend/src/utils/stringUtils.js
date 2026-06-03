/**
 * String utility functions
 * Consolidates string manipulation logic used across components
 */

/**
 * Remove ellipsis from a string
 * @param {string} str - The string to process
 * @returns {string} String without ellipsis
 */
export const removeEllipsis = (str) => {
  if (!str) return '';
  return str.replace('...', '').replace('…', '');
};

/**
 * Count words in text
 * @param {string} text - The text to count
 * @returns {number} Number of words
 */
export const countWords = (text) => {
  if (!text) return 0;
  return text.split(/\s+/).length;
};

/**
 * Truncate text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 150) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Capitalize first letter of string
 * @param {string} str - The string to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert string to title case
 * @param {string} str - The string to convert
 * @returns {string} Title cased string
 */
export const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Slugify a string
 * @param {string} str - The string to slugify
 * @returns {string} Slugified string
 */
export const slugify = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Safe JSON parse with fallback
 * @param {string} str - The string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed object or fallback
 */
export const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

/**
 * Strip HTML tags from string
 * @param {string} html - The HTML string
 * @returns {string} Plain text
 */
export const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Extract excerpt from content
 * @param {string} content - The content to extract from
 * @param {number} maxLength - Maximum length
 * @returns {string} Excerpt
 */
export const extractExcerpt = (content, maxLength = 150) => {
  if (!content) return '';

  // Remove HTML tags first
  const plainText = stripHtml(content);

  return truncateText(plainText, maxLength);
};
