'use strict';

const db = require('../models');
const { calendarDate, addCalendarDays } = require('../utils/businessTime');
const { validateRecord, validateDelivery, validateCheckup } = require('../utils/pregnancyValidation');

const { pregnancySummary, isOpen } = require('../utils/pregnancySummary');
const { Op } = require('sequelize');
const checkupsFor = (id, transaction) => db.PregnancyCheckup.findAll({ where: { pregnancy_record_id: id }, order: [['checked_on', 'DESC'], ['id', 'DESC']], transaction });
const summaryWithHistory = async (record, transaction) => ({ ...pregnancySummary(record), checkups: await checkupsFor(record.id, transaction) });

class PregnancyController {
  /**
   * Get pregnancy duration info for all animal types
   * GET /api/pregnancy/durations
   */
  async recordCheckup(req, res) {
    const record = await db.PregnancyRecord.findOne({ where: { id: req.params.id, user_id: req.user.id }, transaction: req.transaction, lock: req.transaction.LOCK.UPDATE });
    if (!record) return res.status(404).json({ success: false, message: 'Pregnancy record not found.' });
    const error = validateCheckup(req.body, record.mating_date);
    if (error) return res.status(400).json({ success: false, message: error });
    const { checked_on, result, estimated_age_value, estimated_age_unit, next_check_date, doctor_name, notes, request_id } = req.body;
    const details = { checked_on, result, estimated_age_value: estimated_age_value === '' || estimated_age_value == null ? null : Number(estimated_age_value), estimated_age_unit: estimated_age_value === '' || estimated_age_value == null ? null : estimated_age_unit, next_check_date: next_check_date || null, doctor_name: doctor_name?.trim() || null, notes: notes?.trim() || null, request_id };
    const history = await checkupsFor(record.id, req.transaction);
    const duplicate = history.find(check => check.request_id === req.body.request_id);
    if (duplicate) {
      const changed = Object.entries(details).some(([key, value]) => key === 'estimated_age_value' ? (duplicate[key] == null ? null : Number(duplicate[key])) !== value : (duplicate[key] ?? null) !== value);
      if (changed) return res.status(409).json({ success: false, message: 'This submission was already saved with different details. Close and reopen the doctor check form.' });
      return res.json({ success: true, data: await summaryWithHistory(record, req.transaction) });
    }
    if (!isOpen(record)) return res.status(409).json({ success: false, message: 'This breeding cycle is closed. Start a new record for another attempt.' });
    const check = await db.PregnancyCheckup.create({ pregnancy_record_id: record.id, recorded_by: req.user.id, ...details }, { transaction: req.transaction });
    // Backdated history is retained without replacing newer clinical findings.
    if (!history.length || checked_on >= history[0].checked_on) {
      record.last_check_result = result;
      record.next_check_date = result === 'not_pregnant' ? null : (next_check_date || null);
      if (result === 'pregnant') {
        record.status = 'pregnant';
        record.confirmed_on = record.confirmed_on || checked_on;
        record.confirmation_source = 'doctor_check';
      } else if (result === 'not_pregnant') {
        record.status = 'not_pregnant';
      }
      // Recheck retains any earlier positive confirmation and makes uncertainty visible.
      await record.save({ transaction: req.transaction });
    }
    return res.status(201).json({ success: true, data: { ...pregnancySummary(record), checkups: [check, ...history].sort((a, b) => b.checked_on.localeCompare(a.checked_on) || b.id - a.id) } });
  }

  async getPregnancyDurations(req, res) {
    try {
      const durations = db.PregnancyRecord.getAllPregnancyDurations();

      // Format with more details
      const formattedDurations = Object.entries(durations).filter(([type]) => require('../utils/animalGroup').allowsSpecies(req.animalGroup || 'farm', type)).map(([type, days]) => ({
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
          status: { [Op.in]: ['pregnant', 'pending_confirmation'] }
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
        pregnancy_duration_days,
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

      const normalizedAnimalType = typeof animal_type === 'string' ? animal_type.toLowerCase() : '';
      if (!Object.hasOwn(db.PregnancyRecord.getAllPregnancyDurations(), normalizedAnimalType)) {
        return res.status(400).json({ success: false, message: 'Invalid animal type.' });
      }
      const validationError = validateRecord(req.body, { type: normalizedAnimalType });
      if (validationError) return res.status(400).json({ success: false, message: validationError });
      const customDurationDays = Number(pregnancy_duration_days);

      if (
        normalizedAnimalType === 'other' &&
        (!Number.isFinite(customDurationDays) || customDurationDays <= 0)
      ) {
        return res.status(400).json({
          success: false,
          message: 'pregnancy_duration_days is required for animal_type "other"'
        });
      }

      // Calculate pregnancy duration and expected delivery date
      const pregnancyDuration = db.PregnancyRecord.getPregnancyDuration(normalizedAnimalType, customDurationDays);
      const expectedDeliveryDate = db.PregnancyRecord.calculateExpectedDeliveryDate(
        mating_date,
        normalizedAnimalType,
        customDurationDays
      );

      if (listing_id || listing_type) {
        const models = { cow: 'AnimalListing', buffalo: 'BuffaloListing', goat: 'GoatListing', horse: 'HorseListing', dog: 'DogListing', cat: 'CatListing' };
        const model = models[listing_type];
        if (!model || listing_type !== normalizedAnimalType || !Number.isInteger(Number(listing_id)) || Number(listing_id) < 1) return res.status(400).json({ success: false, message: 'Invalid animal listing.' });
        const animal = await db[model].findOne({ where: { id: listing_id, user_id: userId }, transaction: req.transaction, lock: req.transaction.LOCK.UPDATE });
        if (!animal) return res.status(404).json({ success: false, message: 'Animal listing not found.' });
        const existing = await db.PregnancyRecord.findOne({ where: { user_id: userId, listing_id, listing_type, status: { [Op.in]: ['pregnant', 'pending_confirmation'] } }, transaction: req.transaction });
        if (existing) return res.status(409).json({ success: false, message: 'This animal already has an open breeding record.' });
      }
      // Create the pregnancy record
      const pregnancyRecord = await db.PregnancyRecord.create({
        animal_profile_id: req.body.animal_profile_id || null,
        user_id: userId,
        status: 'pending_confirmation',
        confirmation_source: 'breeding_recorded',
        listing_id: listing_id || null,
        listing_type: listing_type || null,
        animal_type: normalizedAnimalType,
        animal_name: animal_name.trim(),
        ear_badge_number: ear_badge_number || null,
        breed_name: breed_name || null,
        animal_photo: animal_photo || null,
        mating_date,
        expected_delivery_date: expectedDeliveryDate,
        pregnancy_duration_days: pregnancyDuration,
        bull_sire_details: bull_sire_details || null,
        mating_type: mating_type || 'natural',
        notes: notes || null
      }, { transaction: req.transaction });

      // Add calculated fields to response
      const response = { ...pregnancySummary(pregnancyRecord), checkups: [] };

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
        include: [{ model: db.PregnancyCheckup, as: 'checkups' }],
        order: [
          ['status', 'ASC'],
          ['expected_delivery_date', 'ASC']
        ]
      });

      // Add calculated fields
      const enrichedRecords = records.map(record => pregnancySummary(record));

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
        where: { id, user_id: userId }, transaction: req.transaction, lock: req.transaction?.LOCK.UPDATE
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Pregnancy record not found'
        });
      }

      const data = await summaryWithHistory(record, req.transaction);

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
      const updates = { ...req.body };

      const record = await db.PregnancyRecord.findOne({
        where: { id, user_id: userId }, transaction: req.transaction, lock: req.transaction?.LOCK.UPDATE
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Pregnancy record not found'
        });
      }

      const validationError = validateRecord(updates, { partial: true, type: record.animal_type });
      if (validationError) return res.status(400).json({ success: false, message: validationError });
      if (updates.mating_date && record.actual_delivery_date && updates.mating_date > record.actual_delivery_date) {
        return res.status(400).json({ success: false, message: 'Mating date cannot be after the recorded delivery date.' });
      }
      if (updates.animal_name !== undefined) updates.animal_name = updates.animal_name.trim();
      const history = await checkupsFor(record.id, req.transaction);
      if (updates.mating_date && history.some(check => check.checked_on < updates.mating_date)) return res.status(400).json({ success: false, message: 'Breeding date cannot be after a recorded examination.' });
      if ((updates.mating_date && updates.mating_date !== record.mating_date) || (record.animal_type === 'other' && updates.pregnancy_duration_days !== undefined && Number(updates.pregnancy_duration_days) !== record.pregnancy_duration_days)) {
        record.date_corrections = [...(record.date_corrections || []), { previous_mating_date: record.mating_date, mating_date: updates.mating_date || record.mating_date, previous_duration: record.pregnancy_duration_days, duration: record.animal_type === 'other' && updates.pregnancy_duration_days !== undefined ? Number(updates.pregnancy_duration_days) : record.pregnancy_duration_days, recorded_by: userId, recorded_at: new Date().toISOString() }];
      }
      // Keep the saved duration when correcting dates, including custom durations.
      if (record.animal_type === 'other' && updates.pregnancy_duration_days !== undefined) {
        record.pregnancy_duration_days = Number(updates.pregnancy_duration_days);
      }
      if (updates.mating_date !== undefined || updates.pregnancy_duration_days !== undefined) {
        record.expected_delivery_date = addCalendarDays(updates.mating_date || record.mating_date, record.pregnancy_duration_days);
      }

      // Update allowed fields
      const allowedFields = [
        'animal_name', 'ear_badge_number', 'breed_name', 'animal_photo', 'mating_date',
        'bull_sire_details', 'mating_type',
        'health_status', 'notes', 'vet_checkup_dates', 'vaccination_dates',
        'reminder_enabled'
      ];

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          record[field] = updates[field];
        }
      });

      await record.save({ transaction: req.transaction });

      const data = await summaryWithHistory(record, req.transaction);

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
        where: { id, user_id: userId }, transaction: req.transaction, lock: req.transaction?.LOCK.UPDATE
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

      const validationError = validateDelivery(req.body, record.mating_date);
      if (validationError) return res.status(400).json({ success: false, message: validationError });
      const checks = await checkupsFor(record.id, req.transaction);
      if (checks.some(check => check.checked_on > delivery_date)) return res.status(400).json({ success: false, message: 'Delivery cannot be before a recorded pregnancy examination.' });

      await record.markAsDelivered({
        deliveryDate: delivery_date,
        offspringCount: offspring_count,
        offspringGender: offspring_gender,
        offspringDetails: offspring_details
      }, { transaction: req.transaction });

      res.json({
        success: true,
        message: 'Pregnancy marked as delivered',
        data: await summaryWithHistory(record, req.transaction)
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

      const validStatuses = ['miscarriage', 'false_pregnancy', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const record = await db.PregnancyRecord.findOne({
        where: { id, user_id: userId }, transaction: req.transaction, lock: req.transaction?.LOCK.UPDATE
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Pregnancy record not found'
        });
      }

      if (record.status === 'delivered') {
        return res.status(400).json({ success: false, message: 'A recorded delivery cannot be changed through the status endpoint.' });
      }
      if (!isOpen(record)) return res.status(400).json({ success: false, message: 'Start a new breeding record for another attempt.' });
      record.status = status;
      record.next_check_date = null;
      if (notes) record.notes = notes;
      await record.save({ transaction: req.transaction });

      res.json({
        success: true,
        message: 'Pregnancy status updated',
        data: await summaryWithHistory(record, req.transaction)
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
        where: { id, user_id: userId }, transaction: req.transaction, lock: req.transaction?.LOCK.UPDATE
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Pregnancy record not found'
        });
      }

      await record.destroy({ transaction: req.transaction });

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

      const today = calendarDate();
      const targetMonth = month === undefined ? Number(today.slice(5, 7)) - 1 : Number(month) - 1;
      const targetYear = year === undefined ? Number(today.slice(0, 4)) : Number(year);
      if (!Number.isInteger(targetMonth) || targetMonth < 0 || targetMonth > 11 || !Number.isInteger(targetYear) || targetYear < 1900 || targetYear > 9999) {
        return res.status(400).json({ success: false, message: 'Invalid calendar month or year.' });
      }

      // Get start and end of month
      const startOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1));
      const endOfMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0));

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
            confirmed_on: pregnancy.confirmed_on,
            delivery_estimate_provisional: !pregnancy.confirmed_on,
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
        due_this_week: pregnancies.filter(p => p.expected_delivery_date >= today && p.getDaysRemaining() <= 7).length,
        overdue: pregnancies.filter(p => p.expected_delivery_date < today).length
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
          confirmed_on: p.confirmed_on,
          delivery_estimate_provisional: !p.confirmed_on,
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
        confirmed_pregnancies: 0,
        pending_confirmation: 0,
        confirmation_unrecorded: 0,
        not_pregnant: 0,
        overdue: 0,
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
            if (record.confirmed_on) stats.confirmed_pregnancies++;
            else stats.confirmation_unrecorded++;
            // Check if due soon
            const daysRemaining = record.getDaysRemaining();
            if (record.expected_delivery_date < calendarDate()) stats.overdue++;
            if (daysRemaining <= 30 && record.expected_delivery_date >= calendarDate()) {
              stats.upcoming_deliveries.push({
                id: record.id,
                animal_name: record.animal_name,
                animal_type: record.animal_type,
                expected_delivery_date: record.expected_delivery_date,
                delivery_estimate_provisional: !record.confirmed_on,
                days_remaining: daysRemaining
              });
            }
            break;
          case 'pending_confirmation':
            stats.pending_confirmation++;
            break;
          case 'not_pregnant':
            stats.not_pregnant++;
            break;
          case 'delivered':
            stats.successful_deliveries++;
            break;
          case 'false_pregnancy':
            stats.not_pregnant++;
            break;
          case 'miscarriage':
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

// Commit before responding, and serialize every mutation on its pregnancy row.
const controller = new PregnancyController();
for (const method of ['createPregnancyRecord', 'updatePregnancyRecord', 'recordCheckup', 'markAsDelivered', 'updateStatus', 'deletePregnancyRecord']) {
  const handler = controller[method];
  controller[method] = async (req, res) => {
    let reply;
    try {
      await db.sequelize.transaction(async transaction => {
        const deferred = { code: 200, status(code) { this.code = code; return this; }, json(body) { reply = { code: this.code, body }; return this; } };
        await handler.call(controller, { ...req, transaction }, deferred);
        if (!reply || reply.code >= 400) throw new Error('Response rollback');
      });
    } catch (error) {
      if (!reply || reply.code < 400) {
        console.error('Pregnancy transaction failed:', error.message);
        reply = { code: 500, body: { success: false, message: 'Unable to save pregnancy record. Please retry.' } };
      }
    }
    return res.status(reply.code).json(reply.body);
  };
}
module.exports = controller;
