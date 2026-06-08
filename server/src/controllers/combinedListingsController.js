'use strict';

const db = require('../models');
const jwt = require('jsonwebtoken');
const geocodingService = require('../services/geocodingService');
const { getJwtSecret } = require('../config/jwt');

const ANIMAL_TABLE_MAP = {
  cow: { table: 'animal_listings', model: 'AnimalListing', type: 'cow' },
  buffalo: { table: 'buffalo_listings', model: 'BuffaloListing', type: 'buffalo' },
  horse: { table: 'horse_listings', model: 'HorseListing', type: 'horse' },
  goat: { table: 'goat_listings', model: 'GoatListing', type: 'goat' },
  cat: { table: 'cat_listings', model: 'CatListing', type: 'cat' },
  dog: { table: 'dog_listings', model: 'DogListing', type: 'dog' },
  other: { table: 'other_animal_listings', model: 'OtherAnimalListing', type: 'other' }
};

const parsePositiveInt = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
};

const parseOptionalPositiveFloat = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const parseCoordinate = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePostalCode = (value) => String(value || '').trim();

const calculateDistanceKm = (fromLatitude, fromLongitude, toLatitude, toLongitude) => {
  const lat1 = parseCoordinate(fromLatitude);
  const lon1 = parseCoordinate(fromLongitude);
  const lat2 = parseCoordinate(toLatitude);
  const lon2 = parseCoordinate(toLongitude);

  if ([lat1, lon1, lat2, lon2].some((value) => value === null)) {
    return null;
  }

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const COORDINATE_MISMATCH_THRESHOLD_KM = 250;

const chooseTrustedCoordinates = async (
  {
    latitude,
    longitude,
    postalCode,
    preferStoredCoordinates = false
  },
  postalCodeCache
) => {
  const storedLatitude = parseCoordinate(latitude);
  const storedLongitude = parseCoordinate(longitude);
  const normalizedPostalCode = normalizePostalCode(postalCode);

  let geocodedLatitude = null;
  let geocodedLongitude = null;

  if (normalizedPostalCode) {
    const geocodedCoordinates = await getCoordinatesForPostalCode(normalizedPostalCode, postalCodeCache);
    geocodedLatitude = parseCoordinate(geocodedCoordinates?.latitude);
    geocodedLongitude = parseCoordinate(geocodedCoordinates?.longitude);
  }

  const hasStoredCoordinates = storedLatitude !== null && storedLongitude !== null;
  const hasGeocodedCoordinates = geocodedLatitude !== null && geocodedLongitude !== null;

  if (hasStoredCoordinates && !hasGeocodedCoordinates) {
    return { latitude: storedLatitude, longitude: storedLongitude };
  }

  if (!hasStoredCoordinates && hasGeocodedCoordinates) {
    return { latitude: geocodedLatitude, longitude: geocodedLongitude };
  }

  if (!hasStoredCoordinates && !hasGeocodedCoordinates) {
    return { latitude: null, longitude: null };
  }

  if (preferStoredCoordinates) {
    return { latitude: storedLatitude, longitude: storedLongitude };
  }

  const mismatchDistance = calculateDistanceKm(
    storedLatitude,
    storedLongitude,
    geocodedLatitude,
    geocodedLongitude
  );

  if (
    mismatchDistance !== null &&
    mismatchDistance > COORDINATE_MISMATCH_THRESHOLD_KM
  ) {
    return { latitude: geocodedLatitude, longitude: geocodedLongitude };
  }

  return { latitude: storedLatitude, longitude: storedLongitude };
};

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

const getCoordinatesForPostalCode = async (postalCode, cache) => {
  const normalizedPostalCode = normalizePostalCode(postalCode);
  if (!normalizedPostalCode) {
    return null;
  }

  if (cache.has(normalizedPostalCode)) {
    return cache.get(normalizedPostalCode);
  }

  try {
    const location = await geocodingService.getLocationFromPostalCode(normalizedPostalCode, 'IN');
    const coordinates =
      parseCoordinate(location?.latitude) !== null && parseCoordinate(location?.longitude) !== null
        ? {
            latitude: parseCoordinate(location.latitude),
            longitude: parseCoordinate(location.longitude)
          }
        : null;

    cache.set(normalizedPostalCode, coordinates);
    return coordinates;
  } catch (error) {
    cache.set(normalizedPostalCode, null);
    return null;
  }
};

const getRequesterLocation = async (req) => {
  const queryLatitude = parseCoordinate(req.query.latitude ?? req.query.userLatitude);
  const queryLongitude = parseCoordinate(req.query.longitude ?? req.query.userLongitude);
  const queryPostalCode = normalizePostalCode(req.query.postalCode);
  const authUserId = getAuthUserIdFromRequest(req);
  const hasExplicitQueryCoordinates = queryLatitude !== null && queryLongitude !== null;

  if (!authUserId) {
    return {
      userId: null,
      latitude: queryLatitude,
      longitude: queryLongitude,
      postalCode: queryPostalCode,
      hasExplicitCoordinates: hasExplicitQueryCoordinates
    };
  }

  const user = await db.User.findByPk(authUserId, {
    attributes: ['id', 'latitude', 'longitude', 'postal_code']
  });

  return {
    userId: user?.id || authUserId,
    latitude: queryLatitude ?? parseCoordinate(user?.latitude),
    longitude: queryLongitude ?? parseCoordinate(user?.longitude),
    postalCode: queryPostalCode || normalizePostalCode(user?.postal_code),
    hasExplicitCoordinates: hasExplicitQueryCoordinates
  };
};

const attachAccurateDistances = async (listings, requesterLocation) => {
  if (!Array.isArray(listings) || listings.length === 0) {
    return listings;
  }

  const postalCodeCache = new Map();
  const originCoordinates = await chooseTrustedCoordinates(
    {
      latitude: requesterLocation?.latitude,
      longitude: requesterLocation?.longitude,
      postalCode: requesterLocation?.postalCode,
      preferStoredCoordinates: requesterLocation?.hasExplicitCoordinates
    },
    postalCodeCache
  );
  const originLatitude = parseCoordinate(originCoordinates?.latitude);
  const originLongitude = parseCoordinate(originCoordinates?.longitude);
  const originPostalCode = normalizePostalCode(requesterLocation?.postalCode);

  return Promise.all(
    listings.map(async (listing) => {
      const listingPostalCode = normalizePostalCode(listing.pincode || listing.postal_code);

      if (
        requesterLocation?.userId &&
        listing.user_id &&
        String(requesterLocation.userId) === String(listing.user_id)
      ) {
        return { ...listing, distance: 0 };
      }

      if (originPostalCode && listingPostalCode && originPostalCode === listingPostalCode) {
        return { ...listing, distance: 0 };
      }

      const destinationCoordinates = await chooseTrustedCoordinates(
        {
          latitude: listing.latitude,
          longitude: listing.longitude,
          postalCode: listingPostalCode,
          preferStoredCoordinates: false
        },
        postalCodeCache
      );
      const destinationLatitude = parseCoordinate(destinationCoordinates?.latitude);
      const destinationLongitude = parseCoordinate(destinationCoordinates?.longitude);

      const distance = calculateDistanceKm(
        originLatitude,
        originLongitude,
        destinationLatitude,
        destinationLongitude
      );

      if (distance === null) {
        const existingDistance = parseCoordinate(listing.distance);
        return existingDistance === null ? listing : { ...listing, distance: existingDistance };
      }

      return { ...listing, distance };
    })
  );
};

class CombinedListingsController {
  /**
   * Get all nearby listings from all animal categories
   * GET /api/listings/nearby?latitude=XX&longitude=XX&radius=50
   */
  async getAllNearbyListings(req, res) {
    try {
      const { latitude, longitude, radius = 100, limit = 20 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const rad = parseFloat(radius);
      const lim = parseInt(limit);

      // PostgreSQL compatible query using subquery for distance calculation
      // All tables use snake_case column names in the database
      // Cast all ENUM types to TEXT for UNION compatibility
      const query = `
        SELECT * FROM (
          SELECT
            id,
            'cow' as animal_type,
            breed_name,
            age::text as age,
            milk_capacity::text as milk_capacity,
            pregnancy_status::text as pregnancy_status,
            health_condition::text as health_condition,
            expected_price,
            is_negotiable,
            front_photo,
            side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at,
            (6371 * acos(
              LEAST(1.0,
                cos(radians($1)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(latitude))
              )
            )) AS distance
          FROM animal_listings
          WHERE status = 'active'
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL

          UNION ALL

          SELECT
            id,
            'buffalo' as animal_type,
            breed_name,
            age::text as age,
            milk_capacity::text as milk_capacity,
            pregnancy_status::text as pregnancy_status,
            health_condition::text as health_condition,
            expected_price,
            is_negotiable,
            front_photo,
            side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at,
            (6371 * acos(
              LEAST(1.0,
                cos(radians($1)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(latitude))
              )
            )) AS distance
          FROM buffalo_listings
          WHERE status = 'active'
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL

          UNION ALL

          SELECT
            id,
            'horse' as animal_type,
            breed_name,
            COALESCE(age, '') as age,
            NULL::text as milk_capacity,
            NULL::text as pregnancy_status,
            health_condition::text as health_condition,
            expected_price,
            is_negotiable,
            front_photo,
            side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at,
            (6371 * acos(
              LEAST(1.0,
                cos(radians($1)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(latitude))
              )
            )) AS distance
          FROM horse_listings
          WHERE status = 'active'
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL

          UNION ALL

          SELECT
            id,
            'goat' as animal_type,
            breed_name,
            COALESCE(age, '') as age,
            NULL::text as milk_capacity,
            NULL::text as pregnancy_status,
            health_status::text as health_condition,
            expected_price,
            is_negotiable,
            photo_1 as front_photo,
            photo_2 as side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at,
            (6371 * acos(
              LEAST(1.0,
                cos(radians($1)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(latitude))
              )
            )) AS distance
          FROM goat_listings
          WHERE status = 'active'
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL

          UNION ALL

          SELECT
            id,
            'cat' as animal_type,
            breed_name,
            COALESCE(age, '') as age,
            NULL::text as milk_capacity,
            NULL::text as pregnancy_status,
            health_condition::text as health_condition,
            expected_price,
            is_negotiable,
            photo_1 as front_photo,
            photo_2 as side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at,
            (6371 * acos(
              LEAST(1.0,
                cos(radians($1)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(latitude))
              )
            )) AS distance
          FROM cat_listings
          WHERE status = 'active'
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL

          UNION ALL

          SELECT
            id,
            'dog' as animal_type,
            breed_name,
            COALESCE(age, '') as age,
            NULL::text as milk_capacity,
            NULL::text as pregnancy_status,
            health_condition::text as health_condition,
            expected_price,
            is_negotiable,
            photo_1 as front_photo,
            photo_2 as side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at,
            (6371 * acos(
              LEAST(1.0,
                cos(radians($1)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(latitude))
              )
            )) AS distance
          FROM dog_listings
          WHERE status = 'active'
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL

          UNION ALL

          SELECT
            id,
            'other' as animal_type,
            breed_name,
            COALESCE(age, '') as age,
            NULL::text as milk_capacity,
            NULL::text as pregnancy_status,
            health_condition::text as health_condition,
            expected_price,
            is_negotiable,
            front_photo,
            side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at,
            (6371 * acos(
              LEAST(1.0,
                cos(radians($1)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(latitude))
              )
            )) AS distance
          FROM other_animal_listings
          WHERE status = 'active'
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL
        ) AS combined_listings
        WHERE distance < $3
        ORDER BY distance ASC
        LIMIT $4;
      `;

      const listings = await db.sequelize.query(query, {
        bind: [lat, lng, rad, lim],
        type: db.sequelize.QueryTypes.SELECT
      });

      // Fetch seller info for each listing
      const listingsWithSeller = await Promise.all(
        listings.map(async (listing) => {
          const seller = await db.User.findByPk(listing.user_id, {
            attributes: ['id', 'full_name', 'phone_number', 'profile_photo', 'city', 'state']
          });
          return {
            ...listing,
            seller: seller ? {
              id: seller.id,
              name: seller.full_name,
              phone: seller.phone_number,
              profile_photo: seller.profile_photo,
              city: seller.city,
              state: seller.state
            } : null
          };
        })
      );

      const listingsWithAccurateDistance = await attachAccurateDistances(listingsWithSeller, {
        latitude: lat,
        longitude: lng,
        postalCode: normalizePostalCode(req.query.postalCode),
        userId: getAuthUserIdFromRequest(req)
      });
      listingsWithAccurateDistance.sort((a, b) => {
        const firstDistance = parseCoordinate(a.distance);
        const secondDistance = parseCoordinate(b.distance);

        if (firstDistance === null && secondDistance === null) return 0;
        if (firstDistance === null) return 1;
        if (secondDistance === null) return -1;
        return firstDistance - secondDistance;
      });

      res.json({
        success: true,
        count: listingsWithAccurateDistance.length,
        data: listingsWithAccurateDistance
      });
    } catch (error) {
      console.error('Get all nearby listings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch nearby listings',
        error: error.message
      });
    }
  }

  /**
   * Get all featured listings (without location filter)
   * GET /api/listings/featured?limit=20
   */
  async getFeaturedListings(req, res) {
    try {
      const { limit = 20 } = req.query;
      const lim = parseInt(limit);

      // Fetch most recent active listings from all categories
      // All tables use snake_case column names in the database
      // Cast all ENUM types to TEXT for UNION compatibility
      const query = `
        SELECT * FROM (
          SELECT
            id,
            'cow' as animal_type,
            breed_name,
            age::text as age,
            milk_capacity::text as milk_capacity,
            pregnancy_status::text as pregnancy_status,
            health_condition::text as health_condition,
            expected_price,
            is_negotiable,
            front_photo,
            side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at
          FROM animal_listings
          WHERE status = 'active'

          UNION ALL

          SELECT
            id,
            'buffalo' as animal_type,
            breed_name,
            age::text as age,
            milk_capacity::text as milk_capacity,
            pregnancy_status::text as pregnancy_status,
            health_condition::text as health_condition,
            expected_price,
            is_negotiable,
            front_photo,
            side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at
          FROM buffalo_listings
          WHERE status = 'active'

          UNION ALL

          SELECT
            id,
            'horse' as animal_type,
            breed_name,
            COALESCE(age, '') as age,
            NULL::text as milk_capacity,
            NULL::text as pregnancy_status,
            health_condition::text as health_condition,
            expected_price,
            is_negotiable,
            front_photo,
            side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at
          FROM horse_listings
          WHERE status = 'active'

          UNION ALL

          SELECT
            id,
            'goat' as animal_type,
            breed_name,
            COALESCE(age, '') as age,
            NULL::text as milk_capacity,
            NULL::text as pregnancy_status,
            health_status::text as health_condition,
            expected_price,
            is_negotiable,
            photo_1 as front_photo,
            photo_2 as side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at
          FROM goat_listings
          WHERE status = 'active'

          UNION ALL

          SELECT
            id,
            'cat' as animal_type,
            breed_name,
            COALESCE(age, '') as age,
            NULL::text as milk_capacity,
            NULL::text as pregnancy_status,
            health_condition::text as health_condition,
            expected_price,
            is_negotiable,
            photo_1 as front_photo,
            photo_2 as side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at
          FROM cat_listings
          WHERE status = 'active'

          UNION ALL

          SELECT
            id,
            'dog' as animal_type,
            breed_name,
            COALESCE(age, '') as age,
            NULL::text as milk_capacity,
            NULL::text as pregnancy_status,
            health_condition::text as health_condition,
            expected_price,
            is_negotiable,
            photo_1 as front_photo,
            photo_2 as side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at
          FROM dog_listings
          WHERE status = 'active'

          UNION ALL

          SELECT
            id,
            'other' as animal_type,
            breed_name,
            COALESCE(age, '') as age,
            NULL::text as milk_capacity,
            NULL::text as pregnancy_status,
            health_condition::text as health_condition,
            expected_price,
            is_negotiable,
            front_photo,
            side_photo,
            city,
            state,
            pincode,
            latitude,
            longitude,
            status::text as status,
            user_id,
            created_at
          FROM other_animal_listings
          WHERE status = 'active'
        ) AS combined_listings
        ORDER BY created_at DESC
        LIMIT $1;
      `;

      const listings = await db.sequelize.query(query, {
        bind: [lim],
        type: db.sequelize.QueryTypes.SELECT
      });

      // Fetch seller info for each listing
      const listingsWithSeller = await Promise.all(
        listings.map(async (listing) => {
          const seller = await db.User.findByPk(listing.user_id, {
            attributes: ['id', 'full_name', 'phone_number', 'profile_photo', 'city', 'state']
          });
          return {
            ...listing,
            seller: seller ? {
              id: seller.id,
              name: seller.full_name,
              phone: seller.phone_number,
              profile_photo: seller.profile_photo,
              city: seller.city,
              state: seller.state
            } : null
          };
        })
      );

      const requesterLocation = await getRequesterLocation(req);
      const listingsWithAccurateDistance = await attachAccurateDistances(
        listingsWithSeller,
        requesterLocation
      );

      res.json({
        success: true,
        count: listingsWithAccurateDistance.length,
        data: listingsWithAccurateDistance
      });
    } catch (error) {
      console.error('Get featured listings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch featured listings',
        error: error.message
      });
    }
  }

  /**
   * Get a single listing by animal type and ID
   * GET /api/listings/:animalType/:id
   */
  async getListingById(req, res) {
    try {
      const { animalType, id } = req.params;

      // Map animal type to table name and model
      const tableMap = {
        cow: { table: 'animal_listings', model: 'AnimalListing' },
        buffalo: { table: 'buffalo_listings', model: 'BuffaloListing' },
        horse: { table: 'horse_listings', model: 'HorseListing' },
        goat: { table: 'goat_listings', model: 'GoatListing' },
        cat: { table: 'cat_listings', model: 'CatListing' },
        dog: { table: 'dog_listings', model: 'DogListing' },
        other: { table: 'other_animal_listings', model: 'OtherAnimalListing' }
      };

      const tableInfo = tableMap[animalType.toLowerCase()];
      if (!tableInfo) {
        return res.status(400).json({
          success: false,
          message: 'Invalid animal type. Valid types: cow, buffalo, horse, goat, cat, dog, other'
        });
      }

      // Get the model
      const Model = db[tableInfo.model];
      if (!Model) {
        return res.status(500).json({
          success: false,
          message: 'Model not found'
        });
      }

      // Fetch the listing
      const listing = await Model.findByPk(id);

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Listing not found'
        });
      }

      // Get plain object
      const listingData = listing.toJSON();

      // Fetch seller info
      const seller = await db.User.findByPk(listingData.user_id, {
        attributes: ['id', 'full_name', 'phone_number', 'profile_photo', 'city', 'state']
      });

      // Increment views
      await listing.incrementViews();

      // Normalize field names to snake_case for frontend consistency
      const normalizedData = {
        id: listingData.id,
        user_id: listingData.user_id,
        breed_name: listingData.breedName || listingData.breed_name,
        age: listingData.age,
        milk_capacity: listingData.milkCapacity || listingData.milk_capacity,
        pregnancy_status: listingData.pregnancyStatus || listingData.pregnancy_status,
        has_horns: listingData.hasHorns !== undefined ? listingData.hasHorns : listingData.has_horns,
        health_condition: listingData.healthCondition || listingData.health_condition,
        expected_price: listingData.expectedPrice || listingData.expected_price,
        is_negotiable: listingData.isNegotiable !== undefined ? listingData.isNegotiable : listingData.is_negotiable,
        front_photo: listingData.frontPhoto || listingData.front_photo,
        side_photo: listingData.sidePhoto || listingData.side_photo,
        milk_scene_photo: listingData.milkScenePhoto || listingData.milk_scene_photo,
        full_body_photo: listingData.fullBodyPhoto || listingData.full_body_photo,
        video: listingData.video,
        vaccination_details: listingData.vaccinationDetails || listingData.vaccination_details,
        delivery_available: listingData.deliveryAvailable !== undefined ? listingData.deliveryAvailable : listingData.delivery_available,
        additional_notes: listingData.additionalNotes || listingData.additional_notes,
        latitude: listingData.latitude,
        longitude: listingData.longitude,
        city: listingData.city,
        state: listingData.state,
        pincode: listingData.pincode,
        status: listingData.status,
        views: listingData.views,
        created_at: listingData.createdAt || listingData.created_at,
        updated_at: listingData.updatedAt || listingData.updated_at,
        // Additional fields for different animal types
        gender: listingData.gender,
        weight: listingData.weight,
        color: listingData.color,
        purpose: listingData.purpose,
        vaccination_status: listingData.vaccinationStatus || listingData.vaccination_status,
        trained: listingData.trained,
        behavior: listingData.behavior,
        description: listingData.description,
        photo_1: listingData.photo1 || listingData.photo_1,
        photo_2: listingData.photo2 || listingData.photo_2,
        photo_3: listingData.photo3 || listingData.photo_3,
        photo_4: listingData.photo4 || listingData.photo_4,
        photo_5: listingData.photo5 || listingData.photo_5,
        animal_type: animalType.toLowerCase(),
        seller: seller ? {
          id: seller.id,
          name: seller.full_name,
          phone: seller.phone_number,
          profile_photo: seller.profile_photo,
          city: seller.city,
          state: seller.state
        } : null
      };

      res.json({
        success: true,
        data: normalizedData
      });
    } catch (error) {
      console.error('Get listing by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch listing',
        error: error.message
      });
    }
  }

  /**
   * Get listings by animal type
   * GET /api/listings/type/:animalType?limit=50
   */
  async getListingsByType(req, res) {
    try {
      const { animalType } = req.params;
      const { limit = 50 } = req.query;
      const lim = parsePositiveInt(limit, 50, 100);

      const tableInfo = ANIMAL_TABLE_MAP[animalType.toLowerCase()];
      if (!tableInfo) {
        return res.status(400).json({
          success: false,
          message: 'Invalid animal type. Valid types: cow, buffalo, horse, goat, cat, dog, other'
        });
      }

      // Get the model
      const Model = db[tableInfo.model];
      if (!Model) {
        return res.status(500).json({
          success: false,
          message: 'Model not found'
        });
      }

      // Fetch listings
      const listings = await Model.findAll({
        where: { status: 'active' },
        order: [['created_at', 'DESC']],
        limit: lim
      });

      // Fetch seller info for each listing
      const listingsWithSeller = await Promise.all(
        listings.map(async (listing) => {
          const listingData = listing.toJSON();
          const seller = await db.User.findByPk(listingData.user_id, {
            attributes: ['id', 'full_name', 'phone_number', 'profile_photo', 'city', 'state']
          });
          return {
            id: listingData.id,
            user_id: listingData.user_id,
            breed_name: listingData.breedName || listingData.breed_name,
            age: listingData.age,
            milk_capacity: listingData.milkCapacity || listingData.milk_capacity,
            pregnancy_status: listingData.pregnancyStatus || listingData.pregnancy_status,
            has_horns: listingData.hasHorns !== undefined ? listingData.hasHorns : listingData.has_horns,
            health_condition: listingData.healthCondition || listingData.health_condition,
            expected_price: listingData.expectedPrice || listingData.expected_price,
            is_negotiable: listingData.isNegotiable !== undefined ? listingData.isNegotiable : listingData.is_negotiable,
            front_photo: listingData.frontPhoto || listingData.front_photo,
            side_photo: listingData.sidePhoto || listingData.side_photo,
            milk_scene_photo: listingData.milkScenePhoto || listingData.milk_scene_photo,
            full_body_photo: listingData.fullBodyPhoto || listingData.full_body_photo,
            video: listingData.video,
            vaccination_details: listingData.vaccinationDetails || listingData.vaccination_details,
            delivery_available: listingData.deliveryAvailable !== undefined ? listingData.deliveryAvailable : listingData.delivery_available,
            additional_notes: listingData.additionalNotes || listingData.additional_notes,
            latitude: listingData.latitude,
            longitude: listingData.longitude,
            city: listingData.city,
            state: listingData.state,
            pincode: listingData.pincode,
            status: listingData.status,
            views: listingData.views,
            created_at: listingData.createdAt || listingData.created_at,
            updated_at: listingData.updatedAt || listingData.updated_at,
            gender: listingData.gender,
            weight: listingData.weight,
            color: listingData.color,
            purpose: listingData.purpose,
            vaccination_status: listingData.vaccinationStatus || listingData.vaccination_status,
            trained: listingData.trained,
            behavior: listingData.behavior,
            description: listingData.description,
            photo_1: listingData.photo1 || listingData.photo_1,
            photo_2: listingData.photo2 || listingData.photo_2,
            photo_3: listingData.photo3 || listingData.photo_3,
            photo_4: listingData.photo4 || listingData.photo_4,
            photo_5: listingData.photo5 || listingData.photo_5,
            animal_type: animalType.toLowerCase(),
            seller: seller ? {
              id: seller.id,
              name: seller.full_name,
              phone: seller.phone_number,
              profile_photo: seller.profile_photo,
              city: seller.city,
              state: seller.state
            } : null
          };
        })
      );

      const requesterLocation = await getRequesterLocation(req);
      const listingsWithAccurateDistance = await attachAccurateDistances(
        listingsWithSeller,
        requesterLocation
      );

      res.json({
        success: true,
        count: listingsWithAccurateDistance.length,
        data: listingsWithAccurateDistance
      });
    } catch (error) {
      console.error('Get listings by type error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch listings',
        error: error.message
      });
    }
  }

  /**
   * Search listings across all categories
   * GET /api/listings/search?query=xxx&animalType=xxx&minPrice=xxx&maxPrice=xxx
   */
  async searchListings(req, res) {
    try {
      const { query = '', animalType, minPrice, maxPrice, limit = 50 } = req.query;
      const lim = parsePositiveInt(limit, 50, 100);
      const searchQuery = query.toLowerCase().trim();
      const minimumPrice = parseOptionalPositiveFloat(minPrice);
      const maximumPrice = parseOptionalPositiveFloat(maxPrice);

      if (minPrice && minimumPrice === null) {
        return res.status(400).json({
          success: false,
          message: 'Invalid minimum price'
        });
      }

      if (maxPrice && maximumPrice === null) {
        return res.status(400).json({
          success: false,
          message: 'Invalid maximum price'
        });
      }

      // Build WHERE conditions
      let whereClause = "status = 'active'";
      const bindings = [];
      let bindIndex = 1;

      if (searchQuery) {
        whereClause += ` AND (LOWER(breed_name) LIKE $${bindIndex} OR LOWER(city) LIKE $${bindIndex} OR LOWER(state) LIKE $${bindIndex})`;
        bindings.push(`%${searchQuery}%`);
        bindIndex++;
      }

      if (minimumPrice !== null) {
        whereClause += ` AND expected_price >= $${bindIndex}`;
        bindings.push(minimumPrice);
        bindIndex++;
      }

      if (maximumPrice !== null) {
        whereClause += ` AND expected_price <= $${bindIndex}`;
        bindings.push(maximumPrice);
        bindIndex++;
      }

      // If specific animal type is requested
      if (animalType && animalType !== 'all') {
        const tableInfo = ANIMAL_TABLE_MAP[animalType.toLowerCase()];
        if (!tableInfo) {
          return res.status(400).json({
            success: false,
            message: 'Invalid animal type'
          });
        }

        const singleQuery = `
          SELECT *, '${tableInfo.type}' as animal_type
          FROM ${tableInfo.table}
          WHERE ${whereClause}
          ORDER BY created_at DESC
          LIMIT $${bindIndex}
        `;
        bindings.push(lim);

        const listings = await db.sequelize.query(singleQuery, {
          bind: bindings,
          type: db.sequelize.QueryTypes.SELECT
        });

        // Fetch seller info
        const listingsWithSeller = await Promise.all(
          listings.map(async (listing) => {
            const seller = await db.User.findByPk(listing.user_id, {
              attributes: ['id', 'full_name', 'phone_number', 'profile_photo', 'city', 'state']
            });
            return {
              ...listing,
              seller: seller ? {
                id: seller.id,
                name: seller.full_name,
                phone: seller.phone_number,
                profile_photo: seller.profile_photo,
                city: seller.city,
                state: seller.state
              } : null
            };
          })
        );

        const requesterLocation = await getRequesterLocation(req);
        const listingsWithAccurateDistance = await attachAccurateDistances(
          listingsWithSeller,
          requesterLocation
        );

        return res.json({
          success: true,
          count: listingsWithAccurateDistance.length,
          data: listingsWithAccurateDistance
        });
      }

      // Search across all categories
      const searchAllQuery = `
        SELECT * FROM (
          SELECT id, 'cow' as animal_type, breed_name, age::text as age,
            expected_price, front_photo, city, state, pincode, latitude, longitude, user_id, created_at
          FROM animal_listings WHERE ${whereClause}

          UNION ALL

          SELECT id, 'buffalo' as animal_type, breed_name, age::text as age,
            expected_price, front_photo, city, state, pincode, latitude, longitude, user_id, created_at
          FROM buffalo_listings WHERE ${whereClause}

          UNION ALL

          SELECT id, 'horse' as animal_type, breed_name, COALESCE(age, '') as age,
            expected_price, front_photo, city, state, pincode, latitude, longitude, user_id, created_at
          FROM horse_listings WHERE ${whereClause}

          UNION ALL

          SELECT id, 'goat' as animal_type, breed_name, COALESCE(age, '') as age,
            expected_price, photo_1 as front_photo, city, state, pincode, latitude, longitude, user_id, created_at
          FROM goat_listings WHERE ${whereClause}

          UNION ALL

          SELECT id, 'cat' as animal_type, breed_name, COALESCE(age, '') as age,
            expected_price, photo_1 as front_photo, city, state, pincode, latitude, longitude, user_id, created_at
          FROM cat_listings WHERE ${whereClause}

          UNION ALL

          SELECT id, 'dog' as animal_type, breed_name, COALESCE(age, '') as age,
            expected_price, photo_1 as front_photo, city, state, pincode, latitude, longitude, user_id, created_at
          FROM dog_listings WHERE ${whereClause}

          UNION ALL

          SELECT id, 'other' as animal_type, breed_name, COALESCE(age, '') as age,
            expected_price, front_photo, city, state, pincode, latitude, longitude, user_id, created_at
          FROM other_animal_listings WHERE ${whereClause}
        ) AS combined_search
        ORDER BY created_at DESC
        LIMIT $${bindIndex}
      `;
      bindings.push(lim);

      const listings = await db.sequelize.query(searchAllQuery, {
        bind: bindings,
        type: db.sequelize.QueryTypes.SELECT
      });

      // Fetch seller info
      const listingsWithSeller = await Promise.all(
        listings.map(async (listing) => {
          const seller = await db.User.findByPk(listing.user_id, {
            attributes: ['id', 'full_name', 'phone_number', 'profile_photo', 'city', 'state']
          });
          return {
            ...listing,
            seller: seller ? {
              id: seller.id,
              name: seller.full_name,
              phone: seller.phone_number,
              profile_photo: seller.profile_photo,
              city: seller.city,
              state: seller.state
            } : null
          };
        })
      );

      const requesterLocation = await getRequesterLocation(req);
      const listingsWithAccurateDistance = await attachAccurateDistances(
        listingsWithSeller,
        requesterLocation
      );

      res.json({
        success: true,
        count: listingsWithAccurateDistance.length,
        data: listingsWithAccurateDistance
      });
    } catch (error) {
      console.error('Search listings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search listings',
        error: error.message
      });
    }
  }

  /**
   * Get all listings for the authenticated user
   * GET /api/listings/my-listings
   */
  async getMyListings(req, res) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      console.log('Fetching listings for user:', userId);

      // Fetch listings from all tables in parallel (including sold listings)
      const [
        cowListings,
        buffaloListings,
        goatListings,
        horseListings,
        dogListings,
        catListings,
        otherListings
      ] = await Promise.all([
        db.AnimalListing.findAll({ 
          where: { user_id: userId },
          order: [['created_at', 'DESC']]
        }),
        db.BuffaloListing.findAll({ 
          where: { user_id: userId },
          order: [['created_at', 'DESC']]
        }),
        db.GoatListing.findAll({ 
          where: { user_id: userId },
          order: [['created_at', 'DESC']]
        }),
        db.HorseListing.findAll({ 
          where: { user_id: userId },
          order: [['created_at', 'DESC']]
        }),
        db.DogListing.findAll({ 
          where: { user_id: userId },
          order: [['created_at', 'DESC']]
        }),
        db.CatListing.findAll({ 
          where: { user_id: userId },
          order: [['created_at', 'DESC']]
        }),
        db.OtherAnimalListing.findAll({ 
          where: { user_id: userId },
          order: [['created_at', 'DESC']]
        })
      ]);

      // Helper function to format listings
      const formatListing = (listing, type) => {
        const data = listing.toJSON ? listing.toJSON() : listing;
        return {
          id: data.id,
          type: type,
          animal_type: type,
          breed: data.breed_name || data.breedName,
          age: data.age,
          price: data.expected_price || data.expectedPrice,
          photo1: data.front_photo || data.frontPhoto || data.photo_1 || data.photo1,
          photo2: data.side_photo || data.sidePhoto || data.photo_2 || data.photo2,
          photos: [
            data.front_photo || data.frontPhoto || data.photo_1 || data.photo1,
            data.side_photo || data.sidePhoto || data.photo_2 || data.photo2,
            data.photo_3 || data.photo3,
            data.photo_4 || data.photo4,
            data.photo_5 || data.photo5
          ].filter(Boolean),
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          status: data.status,
          created_at: data.created_at || data.createdAt,
          updated_at: data.updated_at || data.updatedAt
        };
      };

      // Combine and format all listings
      const allListings = [
        ...cowListings.map(listing => formatListing(listing, 'cow')),
        ...buffaloListings.map(listing => formatListing(listing, 'buffalo')),
        ...goatListings.map(listing => formatListing(listing, 'goat')),
        ...horseListings.map(listing => formatListing(listing, 'horse')),
        ...dogListings.map(listing => formatListing(listing, 'dog')),
        ...catListings.map(listing => formatListing(listing, 'cat')),
        ...otherListings.map(listing => formatListing(listing, 'other'))
      ];

      // Sort by created_at descending
      allListings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      console.log(`Found ${allListings.length} listings for user ${userId}`);

      res.json({
        success: true,
        listings: allListings,
        count: allListings.length
      });

    } catch (error) {
      console.error('Get my listings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch listings',
        error: error.message
      });
    }
  }

  /**
   * Mark listing as sold
   * PATCH /api/listings/:animalType/:id/sold
   */
  async markListingAsSold(req, res) {
    try {
      const { animalType, id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const tableInfo = ANIMAL_TABLE_MAP[animalType.toLowerCase()];
      if (!tableInfo) {
        return res.status(400).json({
          success: false,
          message: 'Invalid animal type. Valid types: cow, buffalo, horse, goat, cat, dog, other'
        });
      }

      // Get the model
      const Model = db[tableInfo.model];
      if (!Model) {
        return res.status(500).json({
          success: false,
          message: 'Model not found'
        });
      }

      // Fetch the listing
      const listing = await Model.findByPk(id);

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Listing not found'
        });
      }

      // Check ownership
      if (listing.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to modify this listing'
        });
      }

      // Mark as sold
      await listing.markAsSold();

      res.json({
        success: true,
        message: 'Listing marked as sold successfully',
        data: listing
      });

    } catch (error) {
      console.error('Error marking listing as sold:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark listing as sold',
        error: error.message
      });
    }
  }

  /**
   * Helper method to format listing data
   */
  formatListing(listing, type) {
    return {
      id: listing.id,
      type: type,
      animal_type: type,
      breed: listing.breed_name || listing.breedName,
      age: listing.age,
      price: listing.expected_price || listing.expectedPrice,
      photo1: listing.front_photo || listing.frontPhoto || listing.photo_1 || listing.photo1,
      photo2: listing.side_photo || listing.sidePhoto || listing.photo_2 || listing.photo2,
      photos: [
        listing.front_photo || listing.frontPhoto || listing.photo_1 || listing.photo1,
        listing.side_photo || listing.sidePhoto || listing.photo_2 || listing.photo2,
        listing.photo_3 || listing.photo3,
        listing.photo_4 || listing.photo4,
        listing.photo_5 || listing.photo5
      ].filter(Boolean),
      city: listing.city,
      state: listing.state,
      pincode: listing.pincode,
      status: listing.status,
      created_at: listing.created_at || listing.createdAt,
      updated_at: listing.updated_at || listing.updatedAt
    };
  }
}

module.exports = new CombinedListingsController();
