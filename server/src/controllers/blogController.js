'use strict';

const db = require('../models');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { Op, literal } = require('sequelize');
const { generateUniqueSlugOptimized } = require('../utils/blogHelpers');
const { normalizeTags } = require('../utils/helpers');

// Blog status constants
const BLOG_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

class BlogController {
  // CREATE - Admin only
  async createBlog(req, res) {
    try {
      const adminId = req.admin.id;

      const {
        title,
        content,
        excerpt,
        category,
        tags,
        status,
        meta_description,
        meta_keywords,
        is_featured
      } = req.body;

      // Validation
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required'
        });
      }

      // Generate unique slug using helper function
      const baseSlug = db.Blog.generateSlug(title);
      const slug = await generateUniqueSlugOptimized(baseSlug, null, db);

      // Calculate reading time
      const wordCount = content.split(/\s+/).length;
      const reading_time = Math.ceil(wordCount / 200) || 1;

      // Process featured image
      let featured_image = null;
      let featured_image_public_id = null;

      if (req.files && req.files.featured_image && req.files.featured_image[0]) {
        try {
          const result = await uploadToCloudinary(req.files.featured_image[0], 'blogs/images');
          featured_image = result.secure_url;
          featured_image_public_id = result.public_id;
        } catch (error) {
          console.error('Error uploading featured image:', error);
        }
      }

      // Create blog
      const blog = await db.Blog.create({
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        category: category || 'general',
        tags: normalizeTags(tags, []),
        author_id: adminId,
        status: status || BLOG_STATUS.DRAFT,
        featured_image,
        featured_image_public_id,
        meta_description,
        meta_keywords,
        is_featured: is_featured === 'true' || is_featured === true,
        reading_time,
        published_at: status === BLOG_STATUS.PUBLISHED ? new Date() : null
      });

      // Fetch blog with author info
      const blogWithAuthor = await db.Blog.findByPk(blog.id, {
        include: [{
          model: db.Admin,
          as: 'author',
          attributes: ['id', 'username', 'full_name', 'email']
        }]
      });

      res.status(201).json({
        success: true,
        message: 'Blog created successfully',
        data: blogWithAuthor
      });
    } catch (error) {
      console.error('Create blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create blog',
        error: error.message
      });
    }
  }

  // GET ALL - Public (published only)
  async getAllBlogs(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        search,
        status,
        is_featured,
        sortBy = 'published_at',
        order = 'DESC'
      } = req.query;
      const validSortFields = ['published_at', 'created_at', 'updated_at', 'views', 'title'];
      const validStatuses = ['all', BLOG_STATUS.DRAFT, BLOG_STATUS.PUBLISHED, BLOG_STATUS.ARCHIVED];
      const sanitizedSortBy = validSortFields.includes(sortBy) ? sortBy : 'published_at';
      const sanitizedOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const effectiveStatus = status ?? (req.admin ? 'all' : 'published');

      if (!validStatuses.includes(effectiveStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid blog status filter'
        });
      }

      // Build where clause
      const where = {};

      if (effectiveStatus === 'published') {
        where.status = 'published';
        where.published_at = { [Op.ne]: null };
      } else if (effectiveStatus !== 'all') {
        where.status = effectiveStatus;
      }

      if (category) {
        where.category = category;
      }

      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
          { excerpt: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (is_featured === 'true') {
        where.is_featured = true;
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const blogs = await db.Blog.findAndCountAll({
        where,
        include: [{
          model: db.Admin,
          as: 'author',
          attributes: ['id', 'username', 'full_name', 'email']
        }],
        limit: parseInt(limit),
        offset: offset,
        order: [[sanitizedSortBy, sanitizedOrder]],
        attributes: {
          exclude: ['featured_image_public_id']
        }
      });

      res.json({
        success: true,
        data: {
          blogs: blogs.rows,
          totalCount: blogs.count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(blogs.count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get blogs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blogs',
        error: error.message
      });
    }
  }

  // GET SINGLE - Public (published only)
  async getBlogBySlug(req, res) {
    try {
      const { slug } = req.params;
      const shouldTrackView = req.query.trackView !== 'false';

      const blog = await db.Blog.findOne({
        where: { slug, status: 'published' },
        include: [{
          model: db.Admin,
          as: 'author',
          attributes: ['id', 'username', 'full_name', 'email']
        }]
      });

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      const relatedBlogsPromise = db.Blog.findAll({
        where: {
          id: { [Op.ne]: blog.id },
          category: blog.category,
          status: BLOG_STATUS.PUBLISHED
        },
        limit: 4,
        order: [['views', 'DESC']],
        attributes: ['id', 'title', 'slug', 'excerpt', 'featured_image', 'category', 'reading_time', 'created_at']
      });

      if (shouldTrackView) {
        await db.Blog.increment('views', { where: { id: blog.id } });
      }

      const [updatedBlog, relatedBlogs] = await Promise.all([
        db.Blog.findByPk(blog.id, {
          include: [{
            model: db.Admin,
            as: 'author',
            attributes: ['id', 'username', 'full_name', 'email']
          }]
        }),
        relatedBlogsPromise
      ]);

      res.json({
        success: true,
        data: updatedBlog,
        relatedBlogs
      });
    } catch (error) {
      console.error('Get blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog',
        error: error.message
      });
    }
  }

  // GET SINGLE BY ID - Admin
  async getBlogById(req, res) {
    try {
      const { id } = req.params;

      const blog = await db.Blog.findByPk(id, {
        include: [{
          model: db.Admin,
          as: 'author',
          attributes: ['id', 'username', 'full_name', 'email']
        }]
      });

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      res.json({
        success: true,
        data: blog
      });
    } catch (error) {
      console.error('Get blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog',
        error: error.message
      });
    }
  }

  // UPDATE - Admin only
  async updateBlog(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.admin.id;

      const blog = await db.Blog.findByPk(id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      const {
        title,
        content,
        excerpt,
        category,
        tags,
        status,
        meta_description,
        meta_keywords,
        is_featured
      } = req.body;

      const updates = {};

      if (title) {
        updates.title = title;
        // Update slug only if title changed (using helper function)
        if (title !== blog.title) {
          const baseSlug = db.Blog.generateSlug(title);
          updates.slug = await generateUniqueSlugOptimized(baseSlug, id, db);
        }
      }

      if (content) {
        updates.content = content;
        const wordCount = content.split(/\s+/).length;
        updates.reading_time = Math.ceil(wordCount / 200) || 1;
      }

      if (excerpt !== undefined) updates.excerpt = excerpt;
      if (category !== undefined) updates.category = category;
      if (tags !== undefined) updates.tags = normalizeTags(tags, blog.tags);
      if (meta_description !== undefined) updates.meta_description = meta_description;
      if (meta_keywords !== undefined) updates.meta_keywords = meta_keywords;
      if (is_featured !== undefined) updates.is_featured = is_featured === 'true' || is_featured === true;

      if (status !== undefined) {
        updates.status = status;
        if (status === BLOG_STATUS.PUBLISHED && !blog.published_at) {
          updates.published_at = new Date();
        } else if (status === BLOG_STATUS.DRAFT) {
          updates.published_at = null;
        }
      }

      // Handle featured image update
      if (req.files && req.files.featured_image && req.files.featured_image[0]) {
        // Delete old image
        if (blog.featured_image_public_id) {
          try {
            await deleteFromCloudinary(blog.featured_image_public_id);
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }

        // Upload new image
        try {
          const result = await uploadToCloudinary(req.files.featured_image[0], 'blogs/images');
          updates.featured_image = result.secure_url;
          updates.featured_image_public_id = result.public_id;
        } catch (error) {
          console.error('Error uploading new image:', error);
        }
      }

      await blog.update(updates);

      // Fetch updated blog with author
      const updatedBlog = await db.Blog.findByPk(blog.id, {
        include: [{
          model: db.Admin,
          as: 'author',
          attributes: ['id', 'username', 'full_name', 'email']
        }]
      });

      res.json({
        success: true,
        message: 'Blog updated successfully',
        data: updatedBlog
      });
    } catch (error) {
      console.error('Update blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update blog',
        error: error.message
      });
    }
  }

  // DELETE - Admin only
  async deleteBlog(req, res) {
    try {
      const { id } = req.params;

      const blog = await db.Blog.findByPk(id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      // Delete image from Cloudinary
      if (blog.featured_image_public_id) {
        try {
          await deleteFromCloudinary(blog.featured_image_public_id);
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }

      await blog.destroy();

      res.json({
        success: true,
        message: 'Blog deleted successfully'
      });
    } catch (error) {
      console.error('Delete blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete blog',
        error: error.message
      });
    }
  }

  // GET CATEGORIES
  async getCategories(req, res) {
    try {
      const categories = await db.Blog.findAll({
        attributes: [
          'category',
          [literal('COUNT(*)'), 'count']
        ],
        where: {
          status: 'published',
          category: { [Op.ne]: null }
        },
        group: ['category'],
        order: [[literal('count'), 'DESC']]
      });

      res.json({
        success: true,
        data: categories.map(c => ({
          name: c.category,
          count: parseInt(c.dataValues.count)
        }))
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error: error.message
      });
    }
  }

  // GET FEATURED BLOGS
  async getFeaturedBlogs(req, res) {
    try {
      const { limit = 5 } = req.query;

      const blogs = await db.Blog.findAll({
        where: {
          status: 'published',
          is_featured: true
        },
        include: [{
          model: db.Admin,
          as: 'author',
          attributes: ['id', 'username', 'full_name']
        }],
        limit: parseInt(limit),
        order: [['published_at', 'DESC']],
        attributes: {
          exclude: ['featured_image_public_id']
        }
      });

      res.json({
        success: true,
        data: blogs
      });
    } catch (error) {
      console.error('Get featured blogs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch featured blogs',
        error: error.message
      });
    }
  }

  // TOGGLE FEATURED
  async toggleFeatured(req, res) {
    try {
      const { id } = req.params;

      const blog = await db.Blog.findByPk(id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      blog.is_featured = !blog.is_featured;
      await blog.save();

      res.json({
        success: true,
        message: `Blog ${blog.is_featured ? 'featured' : 'unfeatured'} successfully`,
        data: blog
      });
    } catch (error) {
      console.error('Toggle featured error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle featured status',
        error: error.message
      });
    }
  }

  // GET BLOG STATS - Optimized with single aggregation query
  async getBlogStats(req, res) {
    try {
      // Single aggregation query to get all stats at once
      const [statsResult, recentBlogs] = await Promise.all([
        // Aggregation query for status counts and total views
        db.Blog.findAll({
          attributes: [
            'status',
            [literal('COUNT(*)'), 'count'],
            [literal('SUM(views)'), 'totalViews']
          ],
          group: ['status'],
          raw: true
        }),
        // Recent blogs query (runs in parallel)
        db.Blog.findAll({
          where: { status: 'published' },
          limit: 5,
          order: [['published_at', 'DESC']],
          attributes: ['id', 'title', 'slug', 'views', 'published_at']
        })
      ]);

      // Calculate totals from aggregation result
      const totalBlogs = statsResult.reduce((sum, stat) => sum + parseInt(stat.count), 0);
      const publishedBlogs = parseInt(statsResult.find(s => s.status === 'published')?.count || 0);
      const draftBlogs = parseInt(statsResult.find(s => s.status === 'draft')?.count || 0);
      const archivedBlogs = parseInt(statsResult.find(s => s.status === 'archived')?.count || 0);
      const totalViews = statsResult.reduce((sum, stat) => sum + parseInt(stat.totalViews || 0), 0);

      res.json({
        success: true,
        data: {
          totalBlogs,
          publishedBlogs,
          draftBlogs,
          archivedBlogs,
          totalViews,
          byStatus: statsResult.map(stat => ({
            status: stat.status,
            count: parseInt(stat.count),
            totalViews: parseInt(stat.totalViews || 0)
          })),
          recentBlogs
        }
      });
    } catch (error) {
      console.error('Get blog stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog stats',
        error: error.message
      });
    }
  }
}

module.exports = new BlogController();
