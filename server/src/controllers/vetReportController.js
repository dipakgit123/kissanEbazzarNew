const { VetReport, Veterinarian, User } = require('../models');
const { Op } = require('sequelize');

// Create a report against a veterinarian
exports.createReport = async (req, res) => {
  try {
    const { veterinarian_id, report_type, description, evidence_urls } = req.body;
    const user_id = req.user.id;

    // Check if veterinarian exists
    const veterinarian = await Veterinarian.findByPk(veterinarian_id);
    if (!veterinarian) {
      return res.status(404).json({
        success: false,
        message: 'Veterinarian not found'
      });
    }

    // Check for existing pending report from same user for same vet
    const existingReport = await VetReport.findOne({
      where: {
        veterinarian_id,
        user_id,
        status: { [Op.in]: ['pending', 'under_review'] }
      }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending report against this veterinarian. Please wait for it to be reviewed.'
      });
    }

    // Create the report
    const report = await VetReport.create({
      veterinarian_id,
      user_id,
      report_type,
      description,
      evidence_urls: evidence_urls || []
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      data: report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message
    });
  }
};

// Get user's reports
exports.getUserReports = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: reports } = await VetReport.findAndCountAll({
      where: { user_id },
      include: [{
        model: Veterinarian,
        as: 'veterinarian',
        attributes: ['id', 'full_name', 'profile_photo', 'specialization']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// Admin: Get all reports
exports.getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, report_type } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (report_type) whereClause.report_type = report_type;

    const { count, rows: reports } = await VetReport.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Veterinarian,
          as: 'veterinarian',
          attributes: ['id', 'full_name', 'profile_photo', 'specialization', 'phone_number', 'email']
        },
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'full_name', 'phone_number']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// Admin: Update report status
exports.updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, admin_notes } = req.body;
    const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report status'
      });
    }

    const report = await VetReport.findByPk(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const updateData = { status, admin_notes };

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolved_at = new Date();
      updateData.resolved_by = null;
    } else {
      updateData.resolved_at = null;
      updateData.resolved_by = null;
    }

    await report.update(updateData);

    // If report is resolved and serious, consider suspending the veterinarian
    if (status === 'resolved' && ['fraud', 'harassment', 'inappropriate_behavior'].includes(report.report_type)) {
      // Count resolved reports against this vet
      const resolvedReportsCount = await VetReport.count({
        where: {
          veterinarian_id: report.veterinarian_id,
          status: 'resolved'
        }
      });

      // If 3 or more serious reports, flag the veterinarian
      if (resolvedReportsCount >= 3) {
        await Veterinarian.update(
          { verification_status: 'suspended' },
          { where: { id: report.veterinarian_id } }
        );
      }
    }

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status',
      error: error.message
    });
  }
};

// Admin: Get report statistics
exports.getReportStats = async (req, res) => {
  try {
    const totalReports = await VetReport.count();
    const pendingReports = await VetReport.count({ where: { status: 'pending' } });
    const underReviewReports = await VetReport.count({ where: { status: 'under_review' } });
    const resolvedReports = await VetReport.count({ where: { status: 'resolved' } });
    const dismissedReports = await VetReport.count({ where: { status: 'dismissed' } });

    // Reports by type
    const reportsByType = await VetReport.findAll({
      attributes: [
        'report_type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['report_type']
    });

    res.json({
      success: true,
      data: {
        total: totalReports,
        pending: pendingReports,
        underReview: underReviewReports,
        resolved: resolvedReports,
        dismissed: dismissedReports,
        byType: reportsByType.reduce((acc, item) => {
          acc[item.report_type] = parseInt(item.dataValues.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report statistics',
      error: error.message
    });
  }
};

// Get reports for a specific veterinarian (Admin only)
exports.getVetReports = async (req, res) => {
  try {
    const { veterinarianId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: reports } = await VetReport.findAndCountAll({
      where: { veterinarian_id: veterinarianId },
      include: [{
        model: User,
        as: 'reporter',
        attributes: ['id', 'full_name', 'phone_number']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get vet reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};
