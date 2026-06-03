/**
 * Blog helper functions
 * Consolidates blog-related logic to avoid code duplication
 */

const { Op, literal } = require('sequelize');

/**
 * Generate unique slug for blog post
 * Handles duplicate slugs by appending counter
 * @param {string} baseSlug - The base slug to generate from
 * @param {number|null} excludeId - ID to exclude from uniqueness check (for updates)
 * @param {object} db - Database models
 * @returns {Promise<string>} Unique slug
 */
async function generateUniqueSlug(baseSlug, excludeId = null, db) {
  let slug = baseSlug;
  let counter = 0;
  const maxAttempts = 100;

  while (counter < maxAttempts) {
    const whereClause = {
      slug: slug
    };

    // Exclude current blog ID when updating
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const existing = await db.Blog.findOne({
      where: whereClause,
      attributes: ['id']
    });

    if (!existing) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  // Fallback: use timestamp if counter loop fails
  return `${baseSlug}-${Date.now()}`;
}

/**
 * Optimized slug generation using single query with regex
 * More efficient than iterative approach
 * @param {string} baseSlug - The base slug to generate from
 * @param {number|null} excludeId - ID to exclude from uniqueness check
 * @param {object} db - Database models
 * @returns {Promise<string>} Unique slug
 */
async function generateUniqueSlugOptimized(baseSlug, excludeId = null, db) {
  // Find all existing slugs matching pattern
  const whereClause = {
    slug: { [Op.like]: `${baseSlug}-%` }
  };

  // Exclude current blog ID when updating
  if (excludeId) {
    whereClause.id = { [Op.ne]: excludeId };
  }

  const existingSlugs = await db.Blog.findAll({
    where: whereClause,
    attributes: ['slug'],
    raw: true
  });

  // Extract counters from existing slugs
  const counters = existingSlugs
    .map(s => {
      const parts = s.slug.split('-');
      const num = parseInt(parts[parts.length - 1]);
      return isNaN(num) ? 0 : num;
    })
    .filter(n => !isNaN(n));

  // Get max counter or default to 0
  const maxCounter = counters.length > 0 ? Math.max(...counters) : 0;

  // Check if base slug itself exists
  const baseExists = await db.Blog.findOne({
    where: { slug: baseSlug, ...(excludeId && { id: { [Op.ne]: excludeId } }) },
    attributes: ['id']
  });

  // If base slug exists, use counter, otherwise use base slug
  return baseExists ? `${baseSlug}-${maxCounter + 1}` : baseSlug;
}

module.exports = {
  generateUniqueSlug,
  generateUniqueSlugOptimized
};
