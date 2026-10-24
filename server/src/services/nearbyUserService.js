'use strict';
const db = require('../models');

// Filter and bound results in PostgreSQL; never load the whole user table in Node.
const findNearbyUsers = async (latitude, longitude, radius = 10, { afterId = null, limit = 100, excludeId = 0 } = {}) => {
  const lat = Number(latitude), lon = Number(longitude), km = Number(radius);
  if (latitude == null || longitude == null || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !Number.isFinite(km) || km <= 0 || km > 500) return [];
  const delta = km / 111;
  const rows = await db.sequelize.query(`
    SELECT * FROM (SELECT id, city, state, latitude, longitude,
      6371 * acos(LEAST(1.0, GREATEST(-1.0,
        sin(radians(:lat)) * sin(radians(latitude::double precision)) +
        cos(radians(:lat)) * cos(radians(latitude::double precision)) *
        cos(radians(longitude::double precision - :lon))))) AS distance
    FROM users
    WHERE latitude BETWEEN :south AND :north AND longitude IS NOT NULL
      AND is_verified = true AND (is_blocked = false OR blocked_until <= NOW())
      AND id <> :excludeId AND id > :afterId) AS candidates
    WHERE distance <= :km
    ORDER BY ${afterId === null ? 'distance, id' : 'id'}
    LIMIT :limit
    `, {
    replacements: { lat, lon, km, south: Math.max(-90, lat - delta), north: Math.min(90, lat + delta), excludeId, afterId: afterId || 0, limit: Math.min(500, Math.max(1, limit)) },
    type: db.Sequelize.QueryTypes.SELECT,
  });
  return rows.map(row => ({ ...row, distance: Number(Number(row.distance).toFixed(2)) }));
};
module.exports = { findNearbyUsers };
