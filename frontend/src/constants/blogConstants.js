/**
 * Blog-related constants
 * Centralizes all stringly-typed values for blog functionality
 */

/**
 * Blog status values
 */
export const BLOG_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

/**
 * Blog status display names
 */
export const BLOG_STATUS_DISPLAY = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived'
};

/**
 * Blog categories
 */
export const BLOG_CATEGORIES = {
  GENERAL: 'general',
  FARMING: 'farming',
  CATTLE_CARE: 'cattle-care',
  ANIMAL_HEALTH: 'animal-health',
  MARKET_TRENDS: 'market-trends',
  TECHNOLOGY: 'technology',
  SUCCESS_STORIES: 'success-stories',
  TIPS_TRICKS: 'tips-tricks'
};

/**
 * Blog categories list
 */
export const BLOG_CATEGORY_LIST = Object.values(BLOG_CATEGORIES);

/**
 * Rate limiting constants
 */
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  MESSAGE: 'Too many requests from this IP, please try again later.'
};

/**
 * Reading speed (words per minute)
 */
export const WORDS_PER_MINUTE = 200;

/**
 * Maximum excerpt length
 */
export const MAX_EXCERPT_LENGTH = 150;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};
