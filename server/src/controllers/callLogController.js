const db = require('../models');
const CallLog = db.CallLog;
const User = db.User;

const LISTING_MODEL_MAP = {
  animal: db.AnimalListing,
  cow: db.AnimalListing,
  buffalo: db.BuffaloListing,
  goat: db.GoatListing,
  horse: db.HorseListing,
  cat: db.CatListing,
  dog: db.DogListing,
  other: db.OtherAnimalListing,
  'other-animal': db.OtherAnimalListing,
  'other-animals': db.OtherAnimalListing
};

/**
 * Log a new call (when user clicks call button)
 */
exports.logCall = async (req, res) => {
  try {
    const callerId = req.user.id;
    const {
      receiverId,
      receiverPhoneNumber,
      callType,
      listingId,
      listingType,
      veterinarianId,
      callerLatitude,
      callerLongitude
    } = req.body;

    // Validate required fields
    if (!receiverId || !receiverPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and phone number are required'
      });
    }

    // Get user agent from request
    const userAgent = req.headers['user-agent'];

    // Create call log
    const callLog = await CallLog.create({
      callerId,
      receiverId,
      receiverPhoneNumber,
      callType: callType || 'direct',
      listingId: listingId || null,
      listingType: listingType || null,
      veterinarianId: veterinarianId || null,
      callStatus: 'initiated',
      callerLatitude: callerLatitude || null,
      callerLongitude: callerLongitude || null,
      userAgent
    });

    res.status(201).json({
      success: true,
      message: 'Call logged successfully',
      data: callLog
    });

  } catch (error) {
    console.error('Error logging call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log call',
      error: error.message
    });
  }
};

/**
 * Get user's call history (both made and received)
 */
exports.getUserCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const callLogs = await CallLog.getUserCallLogs(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCalls = await CallLog.count({
      where: {
        [db.Sequelize.Op.or]: [
          { caller_id: userId },
          { receiver_id: userId }
        ]
      }
    });

    res.json({
      success: true,
      data: callLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCalls / limit),
        totalItems: totalCalls,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call history',
      error: error.message
    });
  }
};

/**
 * Get calls made by user
 */
exports.getCallsMade = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const callsMade = await CallLog.getCallsMade(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCalls = await CallLog.count({
      where: { caller_id: userId }
    });

    res.json({
      success: true,
      data: callsMade,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCalls / limit),
        totalItems: totalCalls,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching calls made:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calls made',
      error: error.message
    });
  }
};

/**
 * Get calls received by user
 */
exports.getCallsReceived = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const callsReceived = await CallLog.getCallsReceived(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCalls = await CallLog.count({
      where: { receiver_id: userId }
    });

    res.json({
      success: true,
      data: callsReceived,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCalls / limit),
        totalItems: totalCalls,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching calls received:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calls received',
      error: error.message
    });
  }
};

/**
 * Get call statistics for user
 */
exports.getUserCallStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await CallLog.getUserStats(userId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching call stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call statistics',
      error: error.message
    });
  }
};

/**
 * Get calls for a specific listing (for listing owner)
 */
exports.getListingCalls = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listingId, listingType } = req.params;
    const normalizedListingType = String(listingType || '').toLowerCase();
    const ListingModel = LISTING_MODEL_MAP[normalizedListingType];

    if (!ListingModel) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing type'
      });
    }

    const listing = await ListingModel.findByPk(listingId, {
      attributes: ['id', 'user_id']
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (Number(listing.user_id) !== Number(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view calls for this listing'
      });
    }

    const calls = await CallLog.getListingCalls(listingId, normalizedListingType);

    res.json({
      success: true,
      data: calls,
      count: calls.length
    });

  } catch (error) {
    console.error('Error fetching listing calls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listing calls',
      error: error.message
    });
  }
};

/**
 * Update call status (e.g., when call ends)
 */
exports.updateCallStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { callStatus, callDuration } = req.body;
    const userId = req.user.id;

    const callLog = await CallLog.findByPk(id);

    if (!callLog) {
      return res.status(404).json({
        success: false,
        message: 'Call log not found'
      });
    }

    // Verify user is caller or receiver
    if (callLog.callerId !== userId && callLog.receiverId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this call log'
      });
    }

    await callLog.update({
      callStatus: callStatus || callLog.callStatus,
      callDuration: callDuration || callLog.callDuration
    });

    res.json({
      success: true,
      message: 'Call status updated successfully',
      data: callLog
    });

  } catch (error) {
    console.error('Error updating call status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update call status',
      error: error.message
    });
  }
};

module.exports = exports;
