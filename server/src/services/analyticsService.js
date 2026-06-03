'use strict';

const { Op, fn, col, literal } = require('sequelize');

class AnalyticsService {
  constructor(models) {
    this.models = models;
  }

  // Get overall dashboard stats
  async getDashboardStats() {
    const {
      User, AnimalListing, BuffaloListing, GoatListing,
      HorseListing, DogListing, CatListing, OtherAnimalListing, ContactLog, PregnancyRecord
    } = this.models;

    // Get total users
    const totalUsers = await User.count();
    const verifiedUsers = await User.count({ where: { is_verified: true } });
    const newUsersToday = await User.count({
      where: {
        created_at: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    const newUsersThisWeek = await User.count({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });
    const newUsersThisMonth = await User.count({
      where: {
        created_at: {
          [Op.gte]: new Date(new Date().setDate(1))
        }
      }
    });

    // Get listings by category
    const listingModels = [
      { model: AnimalListing, type: 'cow' },
      { model: BuffaloListing, type: 'buffalo' },
      { model: GoatListing, type: 'goat' },
      { model: HorseListing, type: 'horse' },
      { model: DogListing, type: 'dog' },
      { model: CatListing, type: 'cat' },
      { model: OtherAnimalListing, type: 'other' }
    ];

    const listingStats = {};
    let totalListings = 0;
    let totalActiveListings = 0;
    let totalSoldListings = 0;
    let totalViews = 0;

    for (const { model, type } of listingModels) {
      if (model) {
        const total = await model.count();
        const active = await model.count({ where: { status: 'active' } });
        const sold = await model.count({ where: { status: 'sold' } });
        const views = await model.sum('views') || 0;

        listingStats[type] = { total, active, sold, views };
        totalListings += total;
        totalActiveListings += active;
        totalSoldListings += sold;
        totalViews += views;
      }
    }

    // Get contact stats
    let contactStats = { total: 0, phoneViews: 0, whatsappClicks: 0, callClicks: 0 };
    if (ContactLog) {
      contactStats.total = await ContactLog.count();
      contactStats.phoneViews = await ContactLog.count({ where: { contact_type: 'phone_view' } });
      contactStats.whatsappClicks = await ContactLog.count({ where: { contact_type: 'whatsapp_click' } });
      contactStats.callClicks = await ContactLog.count({ where: { contact_type: 'call_click' } });
    }

    // Get pregnancy stats
    let pregnancyStats = { total: 0, active: 0, delivered: 0 };
    if (PregnancyRecord) {
      pregnancyStats.total = await PregnancyRecord.count();
      pregnancyStats.active = await PregnancyRecord.count({ where: { status: 'pregnant' } });
      pregnancyStats.delivered = await PregnancyRecord.count({ where: { status: 'delivered' } });
    }

    return {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth
      },
      listings: {
        total: totalListings,
        active: totalActiveListings,
        sold: totalSoldListings,
        totalViews,
        byCategory: listingStats
      },
      contacts: contactStats,
      pregnancy: pregnancyStats
    };
  }

  // Get user growth data for charts
  async getUserGrowth(days = 30) {
    const { User } = this.models;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const users = await User.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', '*'), 'count']
      ],
      where: {
        created_at: { [Op.gte]: startDate }
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    });

    return users;
  }

  // Get listings growth data for charts
  async getListingsGrowth(days = 30) {
    const {
      AnimalListing, BuffaloListing, GoatListing,
      HorseListing, DogListing, CatListing, OtherAnimalListing
    } = this.models;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = [];

    const listingModels = [
      { model: AnimalListing, type: 'cow' },
      { model: BuffaloListing, type: 'buffalo' },
      { model: GoatListing, type: 'goat' },
      { model: HorseListing, type: 'horse' },
      { model: DogListing, type: 'dog' },
      { model: CatListing, type: 'cat' },
      { model: OtherAnimalListing, type: 'other' }
    ];

    for (const { model, type } of listingModels) {
      if (model) {
        const data = await model.findAll({
          attributes: [
            [fn('DATE', col('created_at')), 'date'],
            [fn('COUNT', '*'), 'count']
          ],
          where: {
            created_at: { [Op.gte]: startDate }
          },
          group: [fn('DATE', col('created_at'))],
          order: [[fn('DATE', col('created_at')), 'ASC']],
          raw: true
        });

        result.push({ type, data });
      }
    }

    return result;
  }

  // Get sales data (sold listings)
  async getSalesData(days = 30) {
    const {
      AnimalListing, BuffaloListing, GoatListing,
      HorseListing, DogListing, CatListing, OtherAnimalListing
    } = this.models;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = [];

    const listingModels = [
      { model: AnimalListing, type: 'cow' },
      { model: BuffaloListing, type: 'buffalo' },
      { model: GoatListing, type: 'goat' },
      { model: HorseListing, type: 'horse' },
      { model: DogListing, type: 'dog' },
      { model: CatListing, type: 'cat' },
      { model: OtherAnimalListing, type: 'other' }
    ];

    for (const { model, type } of listingModels) {
      if (model) {
        const sold = await model.count({
          where: {
            status: 'sold',
            updated_at: { [Op.gte]: startDate }
          }
        });

        const totalValue = await model.sum('expected_price', {
          where: {
            status: 'sold',
            updated_at: { [Op.gte]: startDate }
          }
        }) || 0;

        result.push({ type, sold, totalValue });
      }
    }

    return result;
  }

  // Get top sellers
  async getTopSellers(limit = 10) {
    const { User, AnimalListing, BuffaloListing, GoatListing, HorseListing, DogListing, CatListing, OtherAnimalListing } = this.models;

    const listingModels = [AnimalListing, BuffaloListing, GoatListing, HorseListing, DogListing, CatListing, OtherAnimalListing];
    const sellerCounts = {};

    for (const model of listingModels) {
      if (model) {
        const listings = await model.findAll({
          attributes: ['user_id', [fn('COUNT', '*'), 'count']],
          group: ['user_id'],
          raw: true
        });

        listings.forEach(l => {
          sellerCounts[l.user_id] = (sellerCounts[l.user_id] || 0) + parseInt(l.count);
        });
      }
    }

    // Sort and get top sellers
    const topSellerIds = Object.entries(sellerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, count]) => ({ id: parseInt(id), count }));

    // Get user details
    const users = await User.findAll({
      where: { id: topSellerIds.map(s => s.id) },
      attributes: ['id', 'full_name', 'phone_number', 'city', 'state', 'profile_photo']
    });

    return topSellerIds.map(seller => {
      const user = users.find(u => u.id === seller.id);
      return {
        ...seller,
        user: user ? user.toJSON() : null
      };
    });
  }

  // Get location stats
  async getLocationStats() {
    const { User } = this.models;

    const byState = await User.findAll({
      attributes: [
        'state',
        [fn('COUNT', '*'), 'count']
      ],
      where: {
        state: { [Op.ne]: null }
      },
      group: ['state'],
      order: [[fn('COUNT', '*'), 'DESC']],
      limit: 10,
      raw: true
    });

    const byCity = await User.findAll({
      attributes: [
        'city',
        'state',
        [fn('COUNT', '*'), 'count']
      ],
      where: {
        city: { [Op.ne]: null }
      },
      group: ['city', 'state'],
      order: [[fn('COUNT', '*'), 'DESC']],
      limit: 10,
      raw: true
    });

    return { byState, byCity };
  }

  // Get recent activity
  async getRecentActivity(limit = 20) {
    const {
      User, AnimalListing, BuffaloListing, GoatListing,
      HorseListing, DogListing, CatListing, OtherAnimalListing
    } = this.models;

    const activities = [];

    // Recent users
    const recentUsers = await User.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'full_name', 'phone_number', 'city', 'created_at']
    });

    recentUsers.forEach(user => {
      activities.push({
        type: 'new_user',
        data: user.toJSON(),
        timestamp: user.created_at
      });
    });

    // Recent listings
    const listingModels = [
      { model: AnimalListing, type: 'cow', alias: 'seller' },
      { model: BuffaloListing, type: 'buffalo', alias: 'user' },
      { model: GoatListing, type: 'goat', alias: 'user' },
      { model: HorseListing, type: 'horse', alias: 'user' },
      { model: DogListing, type: 'dog', alias: 'user' },
      { model: CatListing, type: 'cat', alias: 'user' },
      { model: OtherAnimalListing, type: 'other', alias: 'seller' }
    ];

    for (const { model, type, alias } of listingModels) {
      if (model) {
        const listings = await model.findAll({
          order: [['created_at', 'DESC']],
          limit: 3,
          include: [{
            model: User,
            as: alias,
            attributes: ['id', 'full_name', 'phone_number']
          }]
        });

        listings.forEach(listing => {
          activities.push({
            type: 'new_listing',
            animalType: type,
            data: listing.toJSON(),
            timestamp: listing.created_at
          });
        });

        // Recent sales
        const sales = await model.findAll({
          where: { status: 'sold' },
          order: [['updated_at', 'DESC']],
          limit: 2,
          include: [{
            model: User,
            as: alias,
            attributes: ['id', 'full_name', 'phone_number']
          }]
        });

        sales.forEach(sale => {
          activities.push({
            type: 'sale',
            animalType: type,
            data: sale.toJSON(),
            timestamp: sale.updated_at
          });
        });
      }
    }

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // Get all users with pagination
  async getUsers(page = 1, limit = 20, search = '', filters = {}) {
    const { User } = this.models;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { phone_number: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (filters.verified !== undefined) {
      where.is_verified = filters.verified;
    }

    if (filters.state) {
      where.state = filters.state;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      attributes: { exclude: ['otp', 'otp_expiry'] }
    });

    return {
      users: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  // Get all listings with pagination
  async getListings(page = 1, limit = 20, animalType = 'all', status = 'all', search = '') {
    const {
      User, AnimalListing, BuffaloListing, GoatListing,
      HorseListing, DogListing, CatListing, OtherAnimalListing
    } = this.models;

    const offset = (page - 1) * limit;
    const modelMap = {
      cow: { model: AnimalListing, alias: 'seller' },
      buffalo: { model: BuffaloListing, alias: 'user' },
      goat: { model: GoatListing, alias: 'user' },
      horse: { model: HorseListing, alias: 'user' },
      dog: { model: DogListing, alias: 'user' },
      cat: { model: CatListing, alias: 'user' },
      other: { model: OtherAnimalListing, alias: 'seller' }
    };

    const results = [];

    const modelsToQuery = animalType === 'all'
      ? Object.entries(modelMap)
      : [[animalType, modelMap[animalType]]];

    for (const [type, modelInfo] of modelsToQuery) {
      const model = modelInfo.model || modelInfo;
      const alias = modelInfo.alias || 'user';

      if (model) {
        const where = {};

        if (status !== 'all') {
          where.status = status;
        }

        if (search) {
          where[Op.or] = [
            { breed_name: { [Op.iLike]: `%${search}%` } },
            { city: { [Op.iLike]: `%${search}%` } }
          ];
        }

        const listings = await model.findAll({
          where,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: alias,
            attributes: ['id', 'full_name', 'phone_number', 'city']
          }]
        });

        listings.forEach(listing => {
          results.push({
            ...listing.toJSON(),
            animalType: type
          });
        });
      }
    }

    // Sort and paginate
    const sorted = results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const paginated = sorted.slice(offset, offset + limit);

    return {
      listings: paginated,
      total: sorted.length,
      page,
      totalPages: Math.ceil(sorted.length / limit)
    };
  }
}

module.exports = AnalyticsService;
