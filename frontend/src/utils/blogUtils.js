/**
 * Blog utility functions
 * Consolidates blog-related logic used across multiple components
 */

// Re-export formatCategory from stringUtils for backward compatibility
import { formatCategory as formatCategoryUtil } from './stringUtils.js';

/**
 * Get color classes for blog categories
 * @param {string} category - The blog category
 * @returns {string} Tailwind CSS classes for the category
 */
export const getCategoryColor = (category) => {
  const colors = {
    'general': 'bg-blue-100 text-blue-800',
    'farming': 'bg-green-100 text-green-800',
    'cattle-care': 'bg-yellow-100 text-yellow-800',
    'animal-health': 'bg-red-100 text-red-800',
    'market-trends': 'bg-purple-100 text-purple-800',
    'technology': 'bg-indigo-100 text-indigo-800',
    'success-stories': 'bg-pink-100 text-pink-800',
    'tips-tricks': 'bg-orange-100 text-orange-800'
  };

  // Handle categories with hyphens
  const normalizedCategory = category?.toLowerCase().replace(/\s+/g, '-');
  return colors[normalizedCategory] || colors.general;
};

/**
 * Calculate reading time for blog content
 * @param {string} content - The blog content
 * @returns {number} Estimated reading time in minutes
 */
export const getReadingTime = (content) => {
  if (!content) return 1;

  const words = content.split(/\s+/).length;
  const wordsPerMinute = 200; // Average reading speed
  return Math.ceil(words / wordsPerMinute) || 1;
};

/**
 * Format category name for display
 * Uses stringUtils.formatCategory for consistency
 * @param {string} category - The category slug
 * @returns {string} Formatted category name
 */
export const formatCategory = formatCategoryUtil;

/**
 * Blog categories configuration
 */
export const BLOG_CATEGORIES = [
  'general',
  'farming',
  'cattle-care',
  'animal-health',
  'market-trends',
  'technology',
  'success-stories',
  'tips-tricks'
];

/**
 * Get category display name
 * @param {string} category - The category slug
 * @returns {string} Display name for the category
 */
export const getCategoryDisplayName = (category) => {
  const displayNames = {
    'general': 'General',
    'farming': 'Farming',
    'cattle-care': 'Cattle Care',
    'animal-health': 'Animal Health',
    'market-trends': 'Market Trends',
    'technology': 'Technology',
    'success-stories': 'Success Stories',
    'tips-tricks': 'Tips & Tricks'
  };

  return displayNames[category] || formatCategory(category);
};
