/**
 * Date utility functions
 * Consolidates date formatting logic used across multiple components
 */

/**
 * Format a date string to a localized format
 * @param {string|Date} date - The date to format
 * @param {string} format - The format style ('long' or 'short')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'long') => {
  if (!date) return 'N/A';

  const options = {
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    short: { day: 'numeric', month: 'short', year: 'numeric' }
  };

  try {
    return new Date(date).toLocaleDateString('en-IN', options[format] || options.long);
  } catch {
    console.error('Invalid date:', date);
    return 'Invalid Date';
  }
};

/**
 * Format a date with time
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';

  try {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    console.error('Invalid date:', date);
    return 'Invalid Date';
  }
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {string|Date} date - The date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return 'N/A';

  try {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(date, 'short');
  } catch {
    console.error('Invalid date:', date);
    return 'Invalid Date';
  }
};
