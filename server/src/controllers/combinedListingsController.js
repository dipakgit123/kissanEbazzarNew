'use strict';

const db = require('../models');

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

      res.json({
        success: true,
        count: listingsWithSeller.length,
        data: listingsWithSeller
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

      res.json({
        success: true,
        count: listingsWithSeller.length,
        data: listingsWithSeller
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
        dog: { table: 'dog_listings', model: 'DogListing' }
      };

      const tableInfo = tableMap[animalType.toLowerCase()];
      if (!tableInfo) {
        return res.status(400).json({
          success: false,
          message: 'Invalid animal type. Valid types: cow, buffalo, horse, goat, cat, dog'
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

      res.json({
        success: true,
        data: {
          ...listingData,
          animal_type: animalType.toLowerCase(),
          seller: seller ? {
            id: seller.id,
            name: seller.full_name,
            phone: seller.phone_number,
            profile_photo: seller.profile_photo,
            city: seller.city,
            state: seller.state
          } : null
        }
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
}

module.exports = new CombinedListingsController();
