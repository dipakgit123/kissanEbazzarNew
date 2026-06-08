'use strict';

const db = require('../models');

class PregnancyController {
  /**
   * Get pregnancy duration info for all animal types
   * GET /api/pregnancy/durations
   */
  async getPregnancyDurations(req, res) {
    try {
      const durations = db.PregnancyRecord.getAllPregnancyDurations();

      // Format with more details
      const formattedDurations = Object.entries(durations).map(([type, days]) => ({
        animal_type: type,
        duration_days: days,
        duration_months: Math.round((days / 30) * 10) / 10,
        duration_text: `${Math.floor(days / 30)} months ${days % 30} days`
      }));

      res.json({
        success: true,
        data: formattedDurations
      });
    } catch (error) {
      console.error('Get pregnancy durations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pregnancy durations',
        error: error.message
      });
    }
  }

  /**
   * Get user's animals eligible for pregnancy tracking
   * GET /api/pregnancy/my-animals
   */
  async getMyAnimals(req, res) {
    try {
      const userId = req.user.id;
      const allAnimals = [];

      // Fetch animals from all listing tables
      const animalTypes = [
        { model: 'AnimalListing', type: 'cow' },
        { model: 'BuffaloListing', type: 'buffalo' },
        { model: 'GoatListing', type: 'goat' },
        { model: 'HorseListing', type: 'horse' },
        { model: 'DogListing', type: 'dog' },
        { model: 'CatListing', type: 'cat' }
      ];

      for (const { model, type } of animalTypes) {
        if (db[model]) {
          try {
            const listings = await db[model].findAll({
              where: {
                user_id: userId,
                status: 'active'
              },
              attributes: ['id', 'breed_name', 'front_photo', 'created_at']
            });

            listings.forEach(listing => {
              const data = listing.toJSON();
              allAnimals.push({
                id: data.id,
                listing_type: type,
                animal_type: type,
                breed_name: data.breed_name,
                photo: data.front_photo || data.photo_1,
                created_at: data.created_at
              });
            });
          } catch (e) {
            console.log(`Error fetching ${type} listings:`, e.message);
          }
        }
      }

      // Get existing pregnancy records for these animals
      const existingRecords = await db.PregnancyRecord.findAll({
        where: {
          user_id: userId,
          status: 'pregnant'
        },
        attributes: ['listing_id', 'listing_type']
      });

      const existingMap = new Map(
        existingRecords.map(r => [`${r.listing_type}-${r.listing_id}`, true])
      );

      // Mark animals that already have active pregnancy records
      allAnimals.forEach(animal => {
        animal.has_active_pregnancy = existingMap.has(`${animal.listing_type}-${animal.id}`);
      });

      res.json({
        success: true,
        count: allAnimals.length,
        data: allAnimals
      });
    } catch (error) {
      console.error('Get my animals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch your animals',
        error: error.message
      });
    }
  }

  /**
   * Create a new pregnancy record
   * POST /api/pregnancy/records
   */
  async createPregnancyRecord(req, res) {
    try {
      const userId = req.user.id;
      const {
        listing_id,
        listing_type,
        animal_type,
        animal_name,
        ear_badge_number,
        breed_name,
        animal_photo,
        mating_date,
        bull_sire_details,
        mating_type,
        notes
      } = req.body;

      // Validate required fields
      if (!animal_type || !animal_name || !mating_date) {
        return res.status(400).json({
          success: false,
          message: 'animal_type, animal_name, and mating_date are required'
        });
      }

      // Calculate pregnancy duration and expected delivery date
      const pregnancyDuration = db.PregnancyRecord.getPregnancyDuration(animal_type);
      const expectedDeliveryDate = db.PregnancyRecord.calculateExpectedDeliveryDate(mating_date, animal_type);

      // Create the pregnancy record
      const pregnancyRecord = await db.PregnancyRecord.create({
        user_id: userId,
        listing_id: listing_id || null,
        listing_type: listing_type || null,
        animal_type: animal_type.toLowerCase(),
        animal_name,
        ear_badge_number: ear_badge_number || null,
        breed_name: breed_name || null,
        animal_photo: animal_photo || null,
        mating_date,
        expected_delivery_date: expectedDeliveryDate,
        pregnancy_duration_days: pregnancyDuration,
        bull_sire_details: bull_sire_details || null,
        mating_type: mating_type || 'natural',
        notes: notes || null
      });

      // Add calculated fields to response
      const response = pregnancyRecord.toJSON();
      response.days_remaining = pregnancyRecord.getDaysRemaining();
      response.progress_percentage = pregnancyRecord.getProgressPercentage();
      response.current_trimester = pregnancyRecord.getCurrentTrimester();
      response.milestones = pregnancyRecord.getMilestones();

      res.status(201).json({
        success: true,
        message: 'Pregnancy record created successfully',
        data: response
      });
    } catch (error) {
      console.error('Create pregnancy record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create pregnancy record',
        error: error.message
      });
    }
  }

  /**
   * Get all pregnancy records for the user
   * GET /api/pregnancy/records
   */
  async getPregnancyRecords(req, res) {
    try {
      const userId = req.user.id;
      const { status, animal_type } = req.query;

      const whereClause = { user_id: userId };
      if (status) whereClause.status = status;
      if (animal_type) whereClause.animal_type = animal_type.toLowerCase();

      const records = await db.PregnancyRecord.findAll({
        where: whereClause,
        order: [
          ['status', 'ASC'],
          ['expected_delivery_date', 'ASC']
        ]
      });

      // Add calculated fields
      const enrichedRecords = records.map(record => {
        const data = record.toJSON();
        data.days_remaining = record.getDaysRemaining();
        data.progress_percentage = record.getProgressPercentage();
        data.current_trimester = record.getCurrentTrimester();
        return data;
      });

      res.json({
        success: true,
        count: enrichedRecords.length,
        data: enrichedRecords
      });
    } catch (error) {
      console.error('Get pregnancy records error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pregnancy records',
        error: error.message
      });
    }
  }

  /**
   * Get a single pregnancy record
   * GET /api/pregnancy/records/:id
   */
  async getPregnancyRecord(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const record = await db.PregnancyRecord.findOne({
        where: { id, user_id: userId }
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Pregnancy record not found'
        });
      }

      const data = record.toJSON();
      data.days_remaining = record.getDaysRemaining();
      data.progress_percentage = record.getProgressPercentage();
      data.current_trimester = record.getCurrentTrimester();
      data.milestones = record.getMilestones();

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Get pregnancy record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pregnancy record',
        error: error.message
      });
    }
  }

  /**
   * Update a pregnancy record
   * PUT /api/pregnancy/records/:id
   */
  async updatePregnancyRecord(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updates = req.body;

      const record = await db.PregnancyRecord.findOne({
        where: { id, user_id: userId }
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Pregnancy record not found'
        });
      }

      // If mating_date is being updated, recalculate expected delivery date
      if (updates.mating_date && updates.mating_date !== record.mating_date) {
        updates.expected_delivery_date = db.PregnancyRecord.calculateExpectedDeliveryDate(
          updates.mating_date,
          record.animal_type
        );
      }

      // Update allowed fields
      const allowedFields = [
        'animal_name', 'ear_badge_number', 'breed_name', 'animal_photo', 'mating_date',
        'expected_delivery_date', 'bull_sire_details', 'mating_type',
        'health_status', 'notes', 'vet_checkup_dates', 'vaccination_dates',
        'reminder_enabled'
      ];

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          record[field] = updates[field];
        }
      });

      await record.save();

      const data = record.toJSON();
      data.days_remaining = record.getDaysRemaining();
      data.progress_percentage = record.getProgressPercentage();
      data.current_trimester = record.getCurrentTrimester();

      res.json({
        success: true,
        message: 'Pregnancy record updated successfully',
        data
      });
    } catch (error) {
      console.error('Update pregnancy record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update pregnancy record',
        error: error.message
      });
    }
  }

  /**
   * Mark pregnancy as delivered
   * PATCH /api/pregnancy/records/:id/deliver
   */
  async markAsDelivered(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { delivery_date, offspring_count, offspring_gender, offspring_details } = req.body;

      const record = await db.PregnancyRecord.findOne({
        where: { id, user_id: userId }
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Pregnancy record not found'
        });
      }

      if (record.status !== 'pregnant') {
        return res.status(400).json({
          success: false,
          message: 'This pregnancy is not active'
        });
      }

      await record.markAsDelivered({
        deliveryDate: delivery_date,
        offspringCount: offspring_count,
        offspringGender: offspring_gender,
        offspringDetails: offspring_details
      });

      res.json({
        success: true,
        message: 'Pregnancy marked as delivered',
        data: record.toJSON()
      });
    } catch (error) {
      console.error('Mark as delivered error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark as delivered',
        error: error.message
      });
    }
  }

  /**
   * Update pregnancy status (miscarriage, false pregnancy, cancelled)
   * PATCH /api/pregnancy/records/:id/status
   */
  async updateStatus(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { status, notes } = req.body;

      const validStatuses = ['pregnant', 'delivered', 'miscarriage', 'false_pregnancy', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const record = await db.PregnancyRecord.findOne({
        where: { id, user_id: userId }
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Pregnancy record not found'
        });
      }

      record.status = status;
      if (notes) record.notes = notes;
      await record.save();

      res.json({
        success: true,
        message: 'Pregnancy status updated',
        data: record.toJSON()
      });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update status',
        error: error.message
      });
    }
  }

  /**
   * Delete a pregnancy record
   * DELETE /api/pregnancy/records/:id
   */
  async deletePregnancyRecord(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const record = await db.PregnancyRecord.findOne({
        where: { id, user_id: userId }
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Pregnancy record not found'
        });
      }

      await record.destroy();

      res.json({
        success: true,
        message: 'Pregnancy record deleted successfully'
      });
    } catch (error) {
      console.error('Delete pregnancy record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete pregnancy record',
        error: error.message
      });
    }
  }

  /**
   * Get pregnancy calendar view (upcoming deliveries)
   * GET /api/pregnancy/calendar
   */
  async getCalendarView(req, res) {
    try {
      const userId = req.user.id;
      const { month, year } = req.query;

      const currentDate = new Date();
      const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
      const targetYear = year ? parseInt(year) : currentDate.getFullYear();

      // Get start and end of month
      const startOfMonth = new Date(targetYear, targetMonth, 1);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 0);

      // Get all active pregnancies
      const pregnancies = await db.PregnancyRecord.findAll({
        where: {
          user_id: userId,
          status: 'pregnant'
        },
        order: [['expected_delivery_date', 'ASC']]
      });

      // Group pregnancies by expected delivery date
      const calendarData = {};

      pregnancies.forEach(pregnancy => {
        const expectedDate = pregnancy.expected_delivery_date;
        const dateObj = new Date(expectedDate);

        // Check if in target month
        if (dateObj >= startOfMonth && dateObj <= endOfMonth) {
          if (!calendarData[expectedDate]) {
            calendarData[expectedDate] = [];
          }
          calendarData[expectedDate].push({
            id: pregnancy.id,
            animal_name: pregnancy.animal_name,
            ear_badge_number: pregnancy.ear_badge_number,
            animal_type: pregnancy.animal_type,
            breed_name: pregnancy.breed_name,
            days_remaining: pregnancy.getDaysRemaining(),
            progress_percentage: pregnancy.getProgressPercentage()
          });
        }
      });

      // Get summary stats
      const stats = {
        total_active: pregnancies.length,
        due_this_month: Object.values(calendarData).flat().length,
        due_this_week: pregnancies.filter(p => p.getDaysRemaining() <= 7).length,
        overdue: pregnancies.filter(p => p.getDaysRemaining() === 0 && new Date(p.expected_delivery_date) < new Date()).length
      };

      res.json({
        success: true,
        month: targetMonth + 1,
        year: targetYear,
        stats,
        calendar: calendarData,
        all_active: pregnancies.map(p => ({
          id: p.id,
          animal_name: p.animal_name,
          ear_badge_number: p.ear_badge_number,
          animal_type: p.animal_type,
          breed_name: p.breed_name,
          expected_delivery_date: p.expected_delivery_date,
          days_remaining: p.getDaysRemaining(),
          progress_percentage: p.getProgressPercentage(),
          current_trimester: p.getCurrentTrimester()
        }))
      });
    } catch (error) {
      console.error('Get calendar view error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch calendar view',
        error: error.message
      });
    }
  }

  /**
   * Get pregnancy statistics
   * GET /api/pregnancy/stats
   */
  async getStats(req, res) {
    try {
      const userId = req.user.id;

      // Get all records
      const allRecords = await db.PregnancyRecord.findAll({
        where: { user_id: userId }
      });

      const stats = {
        total_records: allRecords.length,
        active_pregnancies: 0,
        successful_deliveries: 0,
        miscarriages: 0,
        by_animal_type: {},
        upcoming_deliveries: []
      };

      allRecords.forEach(record => {
        // Count by status
        switch (record.status) {
          case 'pregnant':
            stats.active_pregnancies++;
            // Check if due soon
            const daysRemaining = record.getDaysRemaining();
            if (daysRemaining <= 30) {
              stats.upcoming_deliveries.push({
                id: record.id,
                animal_name: record.animal_name,
                animal_type: record.animal_type,
                expected_delivery_date: record.expected_delivery_date,
                days_remaining: daysRemaining
              });
            }
            break;
          case 'delivered':
            stats.successful_deliveries++;
            break;
          case 'miscarriage':
          case 'false_pregnancy':
            stats.miscarriages++;
            break;
        }

        // Count by animal type
        const type = record.animal_type;
        if (!stats.by_animal_type[type]) {
          stats.by_animal_type[type] = { total: 0, active: 0, delivered: 0 };
        }
        stats.by_animal_type[type].total++;
        if (record.status === 'pregnant') stats.by_animal_type[type].active++;
        if (record.status === 'delivered') stats.by_animal_type[type].delivered++;
      });

      // Sort upcoming deliveries by date
      stats.upcoming_deliveries.sort((a, b) => a.days_remaining - b.days_remaining);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }
}

module.exports = new PregnancyController();
