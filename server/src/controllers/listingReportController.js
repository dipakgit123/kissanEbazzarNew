'use strict';

const db = require('../models');
const { Op } = db.Sequelize;

const VALID_LISTING_TYPES = ['cow', 'buffalo', 'goat', 'horse', 'dog', 'cat', 'other'];
const VALID_REPORT_TYPES = [
  'fraud',
  'wrong_information',
  'already_sold',
  'inappropriate_content',
  'suspicious_price',
  'seller_not_responding',
  'animal_welfare',
  'other'
];
const VALID_STATUSES = ['pending', 'under_review', 'resolved', 'dismissed'];

const LISTING_MODEL_MAP = {
  cow: 'AnimalListing',
  buffalo: 'BuffaloListing',
  goat: 'GoatListing',
  horse: 'HorseListing',
  dog: 'DogListing',
  cat: 'CatListing',
  other: 'OtherAnimalListing'
};

const sanitizePositiveInt = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
};

const getListingModel = (listingType) => {
  const modelName = LISTING_MODEL_MAP[String(listingType || '').toLowerCase()];
  return modelName ? db[modelName] : null;
};

const buildListingSnapshot = (listing, listingType) => {
  const raw = listing?.toJSON ? listing.toJSON() : listing;
  if (!raw) return null;

  return {
    id: raw.id,
    listing_type: listingType,
    breed_name: raw.breed_name || raw.breedName || raw.animal_type,
    expected_price: raw.expected_price || raw.expectedPrice,
    status: raw.status,
    city: raw.city,
    state: raw.state,
    pincode: raw.pincode,
    front_photo: raw.front_photo || raw.frontPhoto || raw.photo_1,
    seller_id: raw.user_id || raw.userId
  };
};

const getListingOrRespond = async (res, listingType, listingId) => {
  const normalizedType = String(listingType || '').toLowerCase();
  const Model = getListingModel(normalizedType);

  if (!VALID_LISTING_TYPES.includes(normalizedType) || !Model) {
    res.status(400).json({
      success: false,
      message: 'Invalid listing type'
    });
    return null;
  }

  const parsedListingId = Number.parseInt(listingId, 10);
  if (!Number.isFinite(parsedListingId) || parsedListingId <= 0) {
    res.status(400).json({
      success: false,
      message: 'Invalid listing id'
    });
    return null;
  }

  const listing = await Model.findByPk(parsedListingId);
  if (!listing) {
    res.status(404).json({
      success: false,
      message: 'Listing not found'
    });
    return null;
  }

  return { listing, listingId: parsedListingId, listingType: normalizedType };
};

exports.createReport = async (req, res) => {
  try {
    const {
      listing_id,
      listing_type,
      report_type,
      description
    } = req.body;
    const reporterId = req.user.id;

    if (!VALID_REPORT_TYPES.includes(report_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report reason'
      });
    }

    const trimmedDescription = String(description || '').trim();
    if (trimmedDescription.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please add at least 10 characters describing the issue'
      });
    }

    const listingResult = await getListingOrRespond(res, listing_type, listing_id);
    if (!listingResult) return;

    const { listing, listingId, listingType } = listingResult;
    const sellerId = listing.user_id || listing.userId || null;

    if (sellerId && Number(sellerId) === Number(reporterId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report your own listing'
      });
    }

    const existingReport = await db.ListingReport.findOne({
      where: {
        reporter_id: reporterId,
        listing_id: listingId,
        listing_type: listingType,
        status: { [Op.in]: ['pending', 'under_review'] }
      }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending report for this listing'
      });
    }

    const report = await db.ListingReport.create({
      listing_id: listingId,
      listing_type: listingType,
      reporter_id: reporterId,
      seller_id: sellerId,
      report_type,
      description: trimmedDescription,
      listing_snapshot: buildListingSnapshot(listing, listingType)
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our team will review this listing shortly.',
      data: report
    });
  } catch (error) {
    console.error('Create listing report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit listing report',
      error: error.message
    });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const page = sanitizePositiveInt(req.query.page, 1, 1000);
    const limit = sanitizePositiveInt(req.query.limit, 10, 50);
    const offset = (page - 1) * limit;

    const { count, rows: reports } = await db.ListingReport.findAndCountAll({
      where: { reporter_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my listing reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const page = sanitizePositiveInt(req.query.page, 1, 1000);
    const limit = sanitizePositiveInt(req.query.limit, 20, 100);
    const offset = (page - 1) * limit;
    const { status, listing_type, report_type } = req.query;

    const where = {};
    if (status && VALID_STATUSES.includes(status)) where.status = status;
    if (listing_type && VALID_LISTING_TYPES.includes(listing_type)) where.listing_type = listing_type;
    if (report_type && VALID_REPORT_TYPES.includes(report_type)) where.report_type = report_type;

    const { count, rows: reports } = await db.ListingReport.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'reporter',
          attributes: ['id', 'full_name', 'phone_number']
        },
        {
          model: db.User,
          as: 'seller',
          attributes: ['id', 'full_name', 'phone_number']
        },
        {
          model: db.Admin,
          as: 'resolver',
          attributes: ['id', 'username', 'full_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get listing reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listing reports',
      error: error.message
    });
  }
};

exports.getReportStats = async (req, res) => {
  try {
    const [total, pending, underReview, resolved, dismissed] = await Promise.all([
      db.ListingReport.count(),
      db.ListingReport.count({ where: { status: 'pending' } }),
      db.ListingReport.count({ where: { status: 'under_review' } }),
      db.ListingReport.count({ where: { status: 'resolved' } }),
      db.ListingReport.count({ where: { status: 'dismissed' } })
    ]);

    res.json({
      success: true,
      data: { total, pending, under_review: underReview, resolved, dismissed }
    });
  } catch (error) {
    console.error('Get listing report stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listing report stats',
      error: error.message
    });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const reportId = Number.parseInt(req.params.reportId, 10);
    const { status, admin_notes } = req.body;

    if (!Number.isFinite(reportId) || reportId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report id'
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report status'
      });
    }

    const report = await db.ListingReport.findByPk(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const updateData = {
      status,
      admin_notes: admin_notes || null
    };

    if (['resolved', 'dismissed'].includes(status)) {
      updateData.resolved_at = new Date();
      updateData.resolved_by = req.admin?.id || null;
    } else {
      updateData.resolved_at = null;
      updateData.resolved_by = null;
    }

    await report.update(updateData);

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Update listing report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update listing report',
      error: error.message
    });
  }
};

exports.VALID_REPORT_TYPES = VALID_REPORT_TYPES;
exports.VALID_LISTING_TYPES = VALID_LISTING_TYPES;
