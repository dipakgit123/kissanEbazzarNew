'use strict';

const db = require('../models');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { Op, literal } = require('sequelize');

const SCHEME_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

const VALID_STATUSES = ['all', SCHEME_STATUS.DRAFT, SCHEME_STATUS.PUBLISHED, SCHEME_STATUS.ARCHIVED];
const VALID_GOVERNMENT_LEVELS = ['central', 'state', 'district', 'other'];
const VALID_CATEGORIES = ['loan', 'subsidy', 'insurance', 'training', 'health', 'general'];
const VALID_ANIMAL_CATEGORIES = ['farm', 'pet', 'both'];
const VALID_ANIMAL_TYPES = ['cow', 'buffalo', 'goat', 'sheep', 'horse', 'dog', 'cat', 'other'];

const parseBoolean = (value) => value === true || value === 'true' || value === '1';

const parseJsonField = (value, fallback) => {
  if (value === undefined) {
    return fallback;
  }

  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return value;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    return trimmed
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const normalizeStringArray = (value) => {
  const parsed = parseJsonField(value, []);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => String(item || '').trim())
    .filter(Boolean);
};

const normalizeAnimalTypes = (value) => (
  normalizeStringArray(value)
    .map((type) => type.toLowerCase())
    .filter((type, index, all) => VALID_ANIMAL_TYPES.includes(type) && all.indexOf(type) === index)
);

const normalizeTranslations = (value) => {
  const parsed = parseJsonField(value, {});
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
};

const getAdminInclude = () => ([{
  model: db.Admin,
  as: 'creator',
  attributes: ['id', 'username', 'full_name', 'email']
}]);

const generateUniqueSchemeSlug = async (title, excludeId = null) => {
  const baseSlug = db.GovernmentScheme.generateSlug(title);
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const where = { slug };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const existing = await db.GovernmentScheme.findOne({ where, attributes: ['id'] });
    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

const buildSchemePayload = (body, existingScheme = null) => {
  const payload = {};

  const simpleFields = [
    'title',
    'department',
    'state',
    'short_description',
    'description',
    'amount_label',
    'interest_rate',
    'deadline',
    'official_url',
    'contact_info'
  ];

  simpleFields.forEach((field) => {
    if (body[field] !== undefined) {
      const value = String(body[field] || '').trim();
      payload[field] = value || null;
    }
  });

  if (body.government_level !== undefined) {
    payload.government_level = VALID_GOVERNMENT_LEVELS.includes(body.government_level)
      ? body.government_level
      : 'central';
  }

  if (body.category !== undefined) {
    payload.category = VALID_CATEGORIES.includes(body.category) ? body.category : 'general';
  }

  if (body.animal_category !== undefined) {
    payload.animal_category = VALID_ANIMAL_CATEGORIES.includes(body.animal_category)
      ? body.animal_category
      : 'both';
  }

  if (body.status !== undefined) {
    payload.status = VALID_STATUSES.includes(body.status) && body.status !== 'all'
      ? body.status
      : existingScheme?.status || SCHEME_STATUS.DRAFT;
    payload.published_at = payload.status === SCHEME_STATUS.PUBLISHED
      ? existingScheme?.published_at || new Date()
      : null;
  }

  if (body.is_featured !== undefined) {
    payload.is_featured = parseBoolean(body.is_featured);
  }

  if (body.animal_types !== undefined) {
    payload.animal_types = normalizeAnimalTypes(body.animal_types);
  }

  if (body.translations !== undefined) {
    payload.translations = normalizeTranslations(body.translations);
  }

  if (body.benefits !== undefined) {
    payload.benefits = normalizeStringArray(body.benefits);
  }

  if (body.eligibility !== undefined) {
    payload.eligibility = normalizeStringArray(body.eligibility);
  }

  if (body.required_documents !== undefined) {
    payload.required_documents = normalizeStringArray(body.required_documents);
  }

  if (body.application_steps !== undefined) {
    payload.application_steps = normalizeStringArray(body.application_steps);
  }

  return payload;
};

class GovernmentSchemeController {
  async createScheme(req, res) {
    try {
      const adminId = req.admin?.id;
      const payload = buildSchemePayload(req.body);

      if (!payload.title) {
        return res.status(400).json({
          success: false,
          message: 'Scheme title is required'
        });
      }

      payload.slug = await generateUniqueSchemeSlug(payload.title);
      payload.created_by = adminId;
      payload.updated_by = adminId;

      if (!payload.status) {
        payload.status = SCHEME_STATUS.DRAFT;
      }

      if (payload.status === SCHEME_STATUS.PUBLISHED) {
        payload.published_at = new Date();
      }

      const imageFile = req.files?.image?.[0];
      if (imageFile) {
        const upload = await uploadToCloudinary(imageFile, 'content/government-schemes/images', 'image');
        payload.image_url = upload.secure_url;
        payload.image_public_id = upload.public_id;
      }

      const scheme = await db.GovernmentScheme.create(payload);
      const schemeWithAdmin = await db.GovernmentScheme.findByPk(scheme.id, {
        include: getAdminInclude()
      });

      res.status(201).json({
        success: true,
        message: 'Government scheme created successfully',
        data: schemeWithAdmin
      });
    } catch (error) {
      console.error('Create government scheme error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create government scheme',
        error: error.message
      });
    }
  }

  async getSchemes(req, res) {
    try {
      const {
        page = 1,
        limit = 12,
        search,
        category,
        animalCategory,
        animalType,
        governmentLevel,
        state,
        status,
        isFeatured,
        sortBy = 'published_at',
        order = 'DESC'
      } = req.query;

      const validSortFields = ['published_at', 'created_at', 'updated_at', 'deadline', 'views', 'title'];
      const sanitizedSortBy = validSortFields.includes(sortBy) ? sortBy : 'published_at';
      const sanitizedOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      const effectiveStatus = status ?? (req.admin ? 'all' : SCHEME_STATUS.PUBLISHED);

      if (!VALID_STATUSES.includes(effectiveStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid scheme status filter'
        });
      }

      const where = {};

      if (effectiveStatus === SCHEME_STATUS.PUBLISHED) {
        where.status = SCHEME_STATUS.PUBLISHED;
        where.published_at = { [Op.ne]: null };
      } else if (effectiveStatus !== 'all') {
        where.status = effectiveStatus;
      }

      if (category && VALID_CATEGORIES.includes(category)) {
        where.category = category;
      }

      if (animalCategory && VALID_ANIMAL_CATEGORIES.includes(animalCategory)) {
        where.animal_category = animalCategory === 'both'
          ? { [Op.in]: ['farm', 'pet', 'both'] }
          : { [Op.in]: [animalCategory, 'both'] };
      }

      if (governmentLevel && VALID_GOVERNMENT_LEVELS.includes(governmentLevel)) {
        where.government_level = governmentLevel;
      }

      if (state) {
        where.state = { [Op.iLike]: `%${state}%` };
      }

      if (isFeatured === 'true') {
        where.is_featured = true;
      }

      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { department: { [Op.iLike]: `%${search}%` } },
          { short_description: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (animalType && VALID_ANIMAL_TYPES.includes(String(animalType).toLowerCase())) {
        const normalizedAnimalType = String(animalType).toLowerCase();
        where[Op.and] = [
          ...(where[Op.and] || []),
          literal(`animal_types = '[]'::jsonb OR animal_types ? '${normalizedAnimalType}'`)
        ];
      }

      const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
      const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
      const offset = (parsedPage - 1) * parsedLimit;

      const schemes = await db.GovernmentScheme.findAndCountAll({
        where,
        include: req.admin ? getAdminInclude() : [],
        limit: parsedLimit,
        offset,
        order: [[sanitizedSortBy, sanitizedOrder]],
        attributes: {
          exclude: req.admin ? [] : ['image_public_id', 'created_by', 'updated_by']
        }
      });

      res.json({
        success: true,
        data: {
          schemes: schemes.rows,
          totalCount: schemes.count,
          currentPage: parsedPage,
          totalPages: Math.ceil(schemes.count / parsedLimit)
        }
      });
    } catch (error) {
      console.error('Get government schemes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch government schemes',
        error: error.message
      });
    }
  }

  async getFeaturedSchemes(req, res) {
    req.query.isFeatured = 'true';
    req.query.status = SCHEME_STATUS.PUBLISHED;
    req.query.limit = req.query.limit || 6;
    return this.getSchemes(req, res);
  }

  async getSchemeBySlug(req, res) {
    try {
      const { slug } = req.params;
      const shouldTrackView = req.query.trackView !== 'false';

      const scheme = await db.GovernmentScheme.findOne({
        where: {
          slug,
          status: SCHEME_STATUS.PUBLISHED,
          published_at: { [Op.ne]: null }
        },
        attributes: {
          exclude: ['image_public_id', 'created_by', 'updated_by']
        }
      });

      if (!scheme) {
        return res.status(404).json({
          success: false,
          message: 'Government scheme not found'
        });
      }

      if (shouldTrackView) {
        await db.GovernmentScheme.increment('views', { where: { id: scheme.id } });
      }

      const updatedScheme = await db.GovernmentScheme.findByPk(scheme.id, {
        attributes: {
          exclude: ['image_public_id', 'created_by', 'updated_by']
        }
      });

      const relatedSchemes = await db.GovernmentScheme.findAll({
        where: {
          id: { [Op.ne]: scheme.id },
          status: SCHEME_STATUS.PUBLISHED,
          category: scheme.category
        },
        limit: 4,
        order: [['is_featured', 'DESC'], ['views', 'DESC']],
        attributes: ['id', 'title', 'slug', 'short_description', 'category', 'amount_label', 'image_url']
      });

      res.json({
        success: true,
        data: updatedScheme,
        relatedSchemes
      });
    } catch (error) {
      console.error('Get government scheme detail error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch government scheme',
        error: error.message
      });
    }
  }

  async getSchemeById(req, res) {
    try {
      const scheme = await db.GovernmentScheme.findByPk(req.params.id, {
        include: getAdminInclude()
      });

      if (!scheme) {
        return res.status(404).json({
          success: false,
          message: 'Government scheme not found'
        });
      }

      res.json({
        success: true,
        data: scheme
      });
    } catch (error) {
      console.error('Get government scheme by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch government scheme',
        error: error.message
      });
    }
  }

  async updateScheme(req, res) {
    try {
      const scheme = await db.GovernmentScheme.findByPk(req.params.id);

      if (!scheme) {
        return res.status(404).json({
          success: false,
          message: 'Government scheme not found'
        });
      }

      const updates = buildSchemePayload(req.body, scheme);

      if (updates.title && updates.title !== scheme.title) {
        updates.slug = await generateUniqueSchemeSlug(updates.title, scheme.id);
      }

      updates.updated_by = req.admin?.id;

      const imageFile = req.files?.image?.[0];
      if (imageFile) {
        if (scheme.image_public_id) {
          try {
            await deleteFromCloudinary(scheme.image_public_id);
          } catch (error) {
            console.error('Error deleting old scheme image:', error);
          }
        }

        const upload = await uploadToCloudinary(imageFile, 'content/government-schemes/images', 'image');
        updates.image_url = upload.secure_url;
        updates.image_public_id = upload.public_id;
      }

      await scheme.update(updates);

      const updatedScheme = await db.GovernmentScheme.findByPk(scheme.id, {
        include: getAdminInclude()
      });

      res.json({
        success: true,
        message: 'Government scheme updated successfully',
        data: updatedScheme
      });
    } catch (error) {
      console.error('Update government scheme error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update government scheme',
        error: error.message
      });
    }
  }

  async deleteScheme(req, res) {
    try {
      const scheme = await db.GovernmentScheme.findByPk(req.params.id);

      if (!scheme) {
        return res.status(404).json({
          success: false,
          message: 'Government scheme not found'
        });
      }

      if (scheme.image_public_id) {
        try {
          await deleteFromCloudinary(scheme.image_public_id);
        } catch (error) {
          console.error('Error deleting scheme image:', error);
        }
      }

      await scheme.destroy();

      res.json({
        success: true,
        message: 'Government scheme deleted successfully'
      });
    } catch (error) {
      console.error('Delete government scheme error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete government scheme',
        error: error.message
      });
    }
  }

  async updateSchemeStatus(req, res) {
    try {
      const { status } = req.body;
      const scheme = await db.GovernmentScheme.findByPk(req.params.id);

      if (!scheme) {
        return res.status(404).json({
          success: false,
          message: 'Government scheme not found'
        });
      }

      if (!VALID_STATUSES.includes(status) || status === 'all') {
        return res.status(400).json({
          success: false,
          message: 'Invalid scheme status'
        });
      }

      await scheme.update({
        status,
        updated_by: req.admin?.id,
        published_at: status === SCHEME_STATUS.PUBLISHED
          ? scheme.published_at || new Date()
          : null
      });

      res.json({
        success: true,
        message: 'Government scheme status updated successfully',
        data: scheme
      });
    } catch (error) {
      console.error('Update government scheme status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update scheme status',
        error: error.message
      });
    }
  }

  async getSchemeStats(req, res) {
    try {
      const [total, published, draft, featured] = await Promise.all([
        db.GovernmentScheme.count(),
        db.GovernmentScheme.count({ where: { status: SCHEME_STATUS.PUBLISHED } }),
        db.GovernmentScheme.count({ where: { status: SCHEME_STATUS.DRAFT } }),
        db.GovernmentScheme.count({ where: { is_featured: true } })
      ]);

      res.json({
        success: true,
        data: { total, published, draft, featured }
      });
    } catch (error) {
      console.error('Government scheme stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheme stats',
        error: error.message
      });
    }
  }
}

module.exports = new GovernmentSchemeController();
