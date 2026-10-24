'use strict';
const db = require('../models');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwt');
const { calendarDate } = require('../utils/businessTime');
const getAuthUserIdFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return decoded?.userId || null;
  } catch (error) {
    return null;
  }
};

const getRequestIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

const recordListingView = async (req, listing, listingType) => {
  if (!db.ListingViewLog || !listing?.user_id) {
    return false;
  }

  const viewerId = getAuthUserIdFromRequest(req);
  if (viewerId && Number(viewerId) === Number(listing.user_id)) {
    return false;
  }

  const viewerIp = getRequestIp(req);
  const viewerKey = viewerId ? `user:${viewerId}` : viewerIp ? `ip:${viewerIp}` : null;
  if (!viewerKey) {
    return false;
  }

  const viewDate = calendarDate();

  try {
    return await db.sequelize.transaction(async transaction => {
    const [, created] = await db.ListingViewLog.findOrCreate({
      transaction,
      where: {
        listing_id: listing.id,
        listing_type: listingType,
        view_date: viewDate,
        viewer_key: viewerKey
      },
      defaults: {
        listing_id: listing.id,
        listing_type: listingType,
        seller_id: listing.user_id,
        viewer_id: viewerId || null,
        viewer_ip: viewerIp,
        view_date: viewDate,
        viewer_key: viewerKey,
        user_agent: req.headers['user-agent'] || null
      }
    });
    if (created) await listing.increment('views', { transaction });
    return created;
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return false;
    }
    console.error('Failed to log listing view:', error.message);
    return false;
  }
};

module.exports = { recordListingView };
