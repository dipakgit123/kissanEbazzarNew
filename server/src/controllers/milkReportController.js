'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const { notebookData } = require('../utils/milkNotebook');
const { VALUE_FIELDS, OPTIONAL_FIELDS, validDate, decimal, normalizeValues, calculate, validateValues } = require('../utils/milkReportMath');
const validId = value => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
const invalid = (res, reason, field) => res.status(400).json({ success: false, code: 'MILK_VALIDATION', reason, field, message: 'Check the milk report values: ' + reason });
const filterError = query => {
  if ((query.from_date && !validDate(query.from_date)) || (query.to_date && !validDate(query.to_date)) || (query.from_date && query.to_date && query.from_date > query.to_date)) return 'invalidDate';
  if (query.cow_id && !validId(query.cow_id)) return 'invalidAnimal';
  if (query.report_type && !['individual', 'overall'].includes(query.report_type)) return 'invalidType';
  if (query.animal_type && !['cow', 'buffalo'].includes(query.animal_type)) return 'invalidType';
  return null;
};


const REPORT_TYPES = {
  INDIVIDUAL: 'individual',
  OVERALL: 'overall'
};
const ANIMAL_TYPES = {
  COW: 'cow',
  BUFFALO: 'buffalo'
};
const OVERALL_HERD_NAME = 'Overall Herd';

const normalizeText = (value) => {
  const normalized = `${value || ''}`.trim();
  return normalized || null;
};

const toNumber = (value) => {
  const parsed = Number.parseFloat(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundNumber = (value) => Number(toNumber(value).toFixed(2));

const normalizeReportType = (value) => (
  value === REPORT_TYPES.OVERALL ? REPORT_TYPES.OVERALL : REPORT_TYPES.INDIVIDUAL
);

const normalizeAnimalType = (value) => (
  value === ANIMAL_TYPES.BUFFALO ? ANIMAL_TYPES.BUFFALO : ANIMAL_TYPES.COW
);



const buildCowDuplicateWhereClause = ({ userId, animalType, cowName, cowTag, excludeId = null }) => {
  const whereClause = {
    user_id: userId,
    animal_type: normalizeAnimalType(animalType)
  };

  if (excludeId) {
    whereClause.id = {
      [Op.ne]: excludeId
    };
  }

  if (cowTag) {
    whereClause.cow_tag = cowTag;
    return whereClause;
  }

  whereClause.cow_name = cowName;
  return whereClause;
};

const buildReportDuplicateWhereClause = ({ userId, reportDate, reportType, cowId, cowName, cowTag, animalType, excludeId = null }) => {
  const whereClause = {
    user_id: userId,
    report_date: reportDate,
    report_type: normalizeReportType(reportType)
  };

  if (excludeId) {
    whereClause.id = {
      [Op.ne]: excludeId
    };
  }

  if (cowId) {
    whereClause.cow_id = cowId;
    return whereClause;
  }

  if (animalType) whereClause.animal_type = animalType;
  if (cowTag) {
    whereClause.cow_tag = cowTag;
    return whereClause;
  }

  whereClause.cow_tag = null;
  whereClause.cow_name = cowName;
  return whereClause;
};

const buildCowResponse = (cow) => {
  const data = cow.toJSON();

  return {
    ...data,
    age_years: data.age_years != null ? roundNumber(data.age_years) : null
  };
};

const buildReportResponse = (report) => {
  const data = report.toJSON();

  return {
    ...data,
    ...calculate(data)
  };
};

class MilkReportController {
  async createCow(req, res) {
    try {
      const userId = req.user.id;
      if (req.body.animal_type !== undefined && !['cow', 'buffalo'].includes(req.body.animal_type)) return invalid(res, 'invalidType');
      const animalType = normalizeAnimalType(req.body.animal_type);
      const cowName = normalizeText(req.body.cow_name);
      const cowTag = normalizeText(req.body.cow_tag);
      const breedName = normalizeText(req.body.breed_name);
      const notes = normalizeText(req.body.notes);
      const ageYears = req.body.age_years == null || req.body.age_years === '' ? null : decimal(req.body.age_years);

      if (!cowName) {
        return res.status(400).json({
          success: false,
          message: 'cow_name is required'
        });
      }

      if (ageYears !== null && (!Number.isFinite(ageYears) || ageYears < 0 || ageYears > 999.9)) {
        return res.status(400).json({
          success: false,
          message: 'age_years must be a valid non-negative number'
        });
      }

      const existingCow = await db.FarmerCow.findOne({
        where: buildCowDuplicateWhereClause({
          userId,
          animalType,
          cowName,
          cowTag
        })
      });

      if (existingCow) {
        return res.status(409).json({
          success: false,
          message: 'This cow already exists for your account'
        });
      }

      const cow = await db.FarmerCow.create({
        user_id: userId,
        animal_type: animalType,
        cow_name: cowName,
        cow_tag: cowTag,
        breed_name: breedName,
        age_years: ageYears,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Animal added successfully',
        data: buildCowResponse(cow)
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'A matching animal or daily report already exists' });
      console.error('Create cow error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add cow',
        error: error.message
      });
    }
  }

  async getCows(req, res) {
    try {
      if (req.query.animal_type && !['cow', 'buffalo'].includes(req.query.animal_type)) return invalid(res, 'invalidType');
      const whereClause = {
        user_id: req.user.id
      };

      if (req.query.animal_type === ANIMAL_TYPES.COW || req.query.animal_type === ANIMAL_TYPES.BUFFALO) {
        whereClause.animal_type = req.query.animal_type;
      }

      const cows = await db.FarmerCow.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        count: cows.length,
        data: cows.map(buildCowResponse)
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'A matching animal or daily report already exists' });
      console.error('Get cows error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cows',
        error: error.message
      });
    }
  }

  async updateCow(req, res) {
    try {
      if (!validId(req.params.id)) return invalid(res, 'invalidAnimal');
      const cow = await db.FarmerCow.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!cow) {
        return res.status(404).json({
          success: false,
          message: 'Animal not found'
        });
      }

      const updates = {};

      if (req.body.animal_type !== undefined && !['cow', 'buffalo'].includes(req.body.animal_type)) return invalid(res, 'invalidType');
      if (req.body.animal_type !== undefined) {
        updates.animal_type = normalizeAnimalType(req.body.animal_type);
      }

      if (req.body.cow_name !== undefined) {
        updates.cow_name = normalizeText(req.body.cow_name);
        if (!updates.cow_name) {
          return res.status(400).json({
            success: false,
            message: 'cow_name cannot be empty'
          });
        }
      }

      if (req.body.cow_tag !== undefined) {
        updates.cow_tag = normalizeText(req.body.cow_tag);
      }

      if (req.body.breed_name !== undefined) {
        updates.breed_name = normalizeText(req.body.breed_name);
      }

      if (req.body.notes !== undefined) {
        updates.notes = normalizeText(req.body.notes);
      }

      if (req.body.age_years !== undefined) {
        if (req.body.age_years === '' || req.body.age_years === null) {
          updates.age_years = null;
        } else {
          const ageYears = Number.parseFloat(req.body.age_years);
          if (!Number.isFinite(ageYears) || ageYears < 0) {
            return res.status(400).json({
              success: false,
              message: 'age_years must be a valid non-negative number'
            });
          }
          updates.age_years = ageYears;
        }
      }

      const nextCowName = updates.cow_name ?? cow.cow_name;
      const nextCowTag = updates.cow_tag !== undefined ? updates.cow_tag : cow.cow_tag;
      const nextAnimalType = updates.animal_type ?? cow.animal_type;

      const duplicateCow = await db.FarmerCow.findOne({
        where: buildCowDuplicateWhereClause({
          userId: req.user.id,
          animalType: nextAnimalType,
          cowName: nextCowName,
          cowTag: nextCowTag,
          excludeId: cow.id
        })
      });

      if (duplicateCow) {
        return res.status(409).json({
          success: false,
          message: 'This cow already exists for your account'
        });
      }

      Object.entries(updates).forEach(([key, value]) => {
        cow[key] = value;
      });

      await db.sequelize.transaction(async transaction => {
        await cow.save({ transaction });
        await db.MilkReport.update({
          animal_type: cow.animal_type, cow_name: cow.cow_name, cow_tag: cow.cow_tag,
        }, { where: { cow_id: cow.id, user_id: req.user.id }, transaction });
      });

      res.json({
        success: true,
        message: 'Animal updated successfully',
        data: buildCowResponse(cow)
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'A matching animal or daily report already exists' });
      console.error('Update cow error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update cow',
        error: error.message
      });
    }
  }

  async deleteCow(req, res) {
    try {
      if (!validId(req.params.id)) return invalid(res, 'invalidAnimal');
      const cow = await db.FarmerCow.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!cow) {
        return res.status(404).json({
          success: false,
          message: 'Animal not found'
        });
      }

      await cow.destroy();

      res.json({
        success: true,
        message: 'Animal deleted successfully'
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'A matching animal or daily report already exists' });
      console.error('Delete cow error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete cow',
        error: error.message
      });
    }
  }

  async createReport(req, res) {
    try {
      const userId = req.user.id;
      const payload = { ...req.body };
      if (payload.expense_status !== undefined && !['unknown', 'none'].includes(payload.expense_status)) return invalid(res, 'invalidNumber');
      const reportDate = payload.report_date;
      if (!validDate(reportDate)) return invalid(res, 'invalidDate');
      if (payload.report_type !== undefined && !['individual','overall'].includes(payload.report_type)) return invalid(res, 'invalidType');
      if (payload.cow_id != null && payload.cow_id !== '' && !validId(payload.cow_id)) return invalid(res, 'invalidAnimal');
      const cowId = payload.cow_id ? Number.parseInt(payload.cow_id, 10) : null;
      const reportType = normalizeReportType(payload.report_type || (cowId ? REPORT_TYPES.INDIVIDUAL : REPORT_TYPES.OVERALL));

      if (!reportDate) {
        return res.status(400).json({
          success: false,
          message: 'report_date is required'
        });
      }

      let cow = null;
      if (reportType === REPORT_TYPES.INDIVIDUAL) {
        if (!cowId) {
          return res.status(400).json({
            success: false,
            message: 'cow_id is required for individual reports'
          });
        }

        cow = await db.FarmerCow.findOne({
          where: {
            id: cowId,
            user_id: userId
          }
        });

        if (!cow) {
          return res.status(404).json({
            success: false,
            message: 'Selected cow not found'
          });
        }
      }

      const validation = validateValues(payload);
      if (validation) return invalid(res, validation.reason, validation.field);
      Object.assign(payload, normalizeValues(payload));

      const existingReport = await db.MilkReport.findOne({
        where: buildReportDuplicateWhereClause({
          userId,
          reportDate,
          reportType,
          cowId: cow?.id,
          cowName: cow?.cow_name || OVERALL_HERD_NAME,
          cowTag: cow?.cow_tag || null
        })
      });

      if (existingReport) {
        return res.status(409).json({
          success: false,
          message: reportType === REPORT_TYPES.OVERALL
            ? 'An overall herd report already exists on the selected date'
            : 'A report for this cow already exists on the selected date'
        });
      }

      const report = await db.MilkReport.create({
        user_id: userId,
        cow_id: cow?.id || null,
        report_type: reportType,
        animal_type: cow?.animal_type || null,
        report_date: reportDate,
        cow_name: cow?.cow_name || OVERALL_HERD_NAME,
        cow_tag: cow?.cow_tag || null,
        morning_liters: payload.morning_liters || 0,
        afternoon_liters: payload.afternoon_liters || 0,
        price_per_liter: payload.price_per_liter || 0,
        feed_cost: payload.feed_cost || 0,
        medicine_cost: payload.medicine_cost || 0,
        labor_cost: payload.labor_cost || 0,
        other_cost: payload.other_cost || 0,
        ...Object.fromEntries(VALUE_FIELDS.map(field => [field, payload[field]])),
        notes: payload.notes || null,
        expense_status: payload.expense_status || 'unknown'
      });

      const savedReport = await db.MilkReport.findByPk(report.id, {
        include: [
          {
            model: db.FarmerCow,
            as: 'cow'
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Milk report created successfully',
        data: buildReportResponse(savedReport)
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'A matching animal or daily report already exists' });
      console.error('Create milk report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create milk report',
        error: error.message
      });
    }
  }

  async getReports(req, res) {
    try {
      const error = filterError(req.query);
      if (error) return invalid(res, error);
      const { from_date, to_date, cow_name, cow_id, report_type, animal_type } = req.query;
      const whereClause = { user_id: req.user.id };

      if (cow_name) {
        whereClause.cow_name = cow_name;
      }

      if (cow_id) {
        whereClause.cow_id = cow_id;
      }

      if (report_type === REPORT_TYPES.INDIVIDUAL || report_type === REPORT_TYPES.OVERALL) {
        whereClause.report_type = report_type;
      }

      if (animal_type === ANIMAL_TYPES.COW || animal_type === ANIMAL_TYPES.BUFFALO) {
        whereClause.animal_type = animal_type;
      }

      if (from_date || to_date) {
        whereClause.report_date = {};
        if (from_date) {
          whereClause.report_date[Op.gte] = from_date;
        }
        if (to_date) {
          whereClause.report_date[Op.lte] = to_date;
        }
      }

      const reports = await db.MilkReport.findAll({
        where: whereClause,
        include: [
          {
            model: db.FarmerCow,
            as: 'cow'
          }
        ],
        order: [['report_date', 'DESC'], ['created_at', 'DESC']]
      });

      res.json({
        success: true,
        count: reports.length,
        data: reports.map(buildReportResponse)
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'A matching animal or daily report already exists' });
      console.error('Get milk reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch milk reports',
        error: error.message
      });
    }
  }

  async getReport(req, res) {
    try {
      if (!validId(req.params.id)) return invalid(res, 'invalidNumber');
      const report = await db.MilkReport.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        },
        include: [
          {
            model: db.FarmerCow,
            as: 'cow'
          }
        ]
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Milk report not found'
        });
      }

      res.json({
        success: true,
        data: buildReportResponse(report)
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'A matching animal or daily report already exists' });
      console.error('Get milk report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch milk report',
        error: error.message
      });
    }
  }

  async updateReport(req, res) {
    try {
      if (!validId(req.params.id)) return invalid(res, 'invalidNumber');
      const report = await db.MilkReport.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Milk report not found'
        });
      }

      const updates = { ...req.body };
      if (updates.expense_status !== undefined && !['unknown', 'none'].includes(updates.expense_status)) return invalid(res, 'invalidNumber');
      if (updates.report_date !== undefined && !validDate(updates.report_date)) return invalid(res, 'invalidDate');
      if (updates.report_type !== undefined && !['individual','overall'].includes(updates.report_type)) return invalid(res, 'invalidType');
      if (updates.cow_id != null && updates.cow_id !== '' && !validId(updates.cow_id)) return invalid(res, 'invalidAnimal');
      const nextCowId = updates.cow_id !== undefined && updates.cow_id !== '' ? Number.parseInt(updates.cow_id, 10) : report.cow_id;
      const nextReportType = updates.report_type !== undefined
        ? normalizeReportType(updates.report_type)
        : normalizeReportType(report.report_type);

      let cow = null;
      const preservedAnimal = nextReportType === REPORT_TYPES.INDIVIDUAL && report.report_type === REPORT_TYPES.INDIVIDUAL && report.cow_id == null && !nextCowId;
      if (nextReportType === REPORT_TYPES.INDIVIDUAL && !preservedAnimal) {
        if (!nextCowId) {
          return res.status(400).json({
            success: false,
            message: 'cow_id is required for individual reports'
          });
        }

        cow = await db.FarmerCow.findOne({
          where: {
            id: nextCowId,
            user_id: req.user.id
          }
        });

        if (!cow) {
          return res.status(404).json({
            success: false,
            message: 'Selected cow not found'
          });
        }
      }

      const mergedValues = { ...report.toJSON(), ...updates };
      const validation = validateValues(mergedValues);
      if (validation) return invalid(res, validation.reason, validation.field);
      for (const field of VALUE_FIELDS) {
        if (updates[field] !== undefined) updates[field] = OPTIONAL_FIELDS.includes(field) && (updates[field] === '' || updates[field] === null) ? null : decimal(updates[field]);
      }

      const nextReportDate = updates.report_date ?? report.report_date;
      const nextCowName = nextReportType === REPORT_TYPES.OVERALL
        ? OVERALL_HERD_NAME
        : (cow?.cow_name ?? report.cow_name);
      const nextCowTag = nextReportType === REPORT_TYPES.OVERALL
        ? null
        : (cow?.cow_tag ?? report.cow_tag);
      const nextAnimalType = nextReportType === REPORT_TYPES.OVERALL
        ? null
        : (cow?.animal_type ?? report.animal_type ?? ANIMAL_TYPES.COW);

      const duplicate = await db.MilkReport.findOne({
        where: buildReportDuplicateWhereClause({
          userId: req.user.id,
          reportDate: nextReportDate,
          reportType: nextReportType,
          cowId: nextReportType === REPORT_TYPES.INDIVIDUAL ? nextCowId : null,
          cowName: nextCowName,
          cowTag: nextCowTag,
          animalType: nextAnimalType,
          excludeId: report.id
        })
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: nextReportType === REPORT_TYPES.OVERALL
            ? 'An overall herd report already exists on the selected date'
            : 'A report for this cow already exists on the selected date'
        });
      }

      const allowedFields = [
        'expense_status',
        'report_date',
        ...VALUE_FIELDS,
        'notes'
      ];

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          report[field] = updates[field];
        }
      });

      if (updates.report_type !== undefined) {
        report.report_type = nextReportType;
      }

      if (updates.cow_id !== undefined || nextReportType === REPORT_TYPES.OVERALL) {
        report.cow_id = nextReportType === REPORT_TYPES.INDIVIDUAL ? nextCowId || null : null;
      }

      if (nextReportType === REPORT_TYPES.OVERALL) {
        report.animal_type = null;
        report.cow_name = OVERALL_HERD_NAME;
        report.cow_tag = null;
      } else if (cow) {
        report.animal_type = nextAnimalType;
        report.cow_name = cow.cow_name;
        report.cow_tag = cow.cow_tag;
      }

      await report.save();

      const savedReport = await db.MilkReport.findByPk(report.id, {
        include: [
          {
            model: db.FarmerCow,
            as: 'cow'
          }
        ]
      });

      res.json({
        success: true,
        message: 'Milk report updated successfully',
        data: buildReportResponse(savedReport)
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'A matching animal or daily report already exists' });
      console.error('Update milk report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update milk report',
        error: error.message
      });
    }
  }

  async deleteReport(req, res) {
    try {
      if (!validId(req.params.id)) return invalid(res, 'invalidNumber');
      const report = await db.MilkReport.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Milk report not found'
        });
      }

      await report.destroy();

      res.json({
        success: true,
        message: 'Milk report deleted successfully'
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'A matching animal or daily report already exists' });
      console.error('Delete milk report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete milk report',
        error: error.message
      });
    }
  }

  async getStats(req, res) {
    try {
      const error = filterError(req.query);
      if (error) return invalid(res, error);
      const { month, year, cow_id, report_type, animal_type } = req.query;
      if ((month || year) && (!/^\d{1,2}$/.test(String(month)) || Number(month) < 1 || Number(month) > 12 || !/^\d{4}$/.test(String(year)) || Number(year) < 1900)) return invalid(res, 'invalidDate');
      const whereClause = { user_id: req.user.id };

      if (cow_id) {
        whereClause.cow_id = cow_id;
      }

      if (report_type === REPORT_TYPES.INDIVIDUAL || report_type === REPORT_TYPES.OVERALL) {
        whereClause.report_type = report_type;
      }

      if (animal_type === ANIMAL_TYPES.COW || animal_type === ANIMAL_TYPES.BUFFALO) {
        whereClause.animal_type = animal_type;
      }

      if (month && year) {
        const monthNumber = Number.parseInt(month, 10);
        const yearNumber = Number.parseInt(year, 10);

        if (
          Number.isInteger(monthNumber) &&
          monthNumber >= 1 &&
          monthNumber <= 12 &&
          Number.isInteger(yearNumber)
        ) {
          const startDate = new Date(Date.UTC(yearNumber, monthNumber - 1, 1));
          const endDate = new Date(Date.UTC(yearNumber, monthNumber, 0));

          whereClause.report_date = {
            [Op.gte]: startDate.toISOString().slice(0, 10),
            [Op.lte]: endDate.toISOString().slice(0, 10)
          };
        }
      }

      if (req.query.from_date || req.query.to_date) {
        whereClause.report_date = { ...(req.query.from_date && { [Op.gte]: req.query.from_date }), ...(req.query.to_date && { [Op.lte]: req.query.to_date }) };
      }

      const reports = await db.MilkReport.findAll({
        where: whereClause,
        include: [
          {
            model: db.FarmerCow,
            as: 'cow'
          }
        ],
        order: [['report_date', 'DESC']]
      });

        const expenseWhere = { user_id: req.user.id };
        if (cow_id) expenseWhere.cow_id = cow_id;
        if (animal_type) expenseWhere.animal_type = animal_type;
        if (whereClause.report_date) expenseWhere.expense_date = whereClause.report_date;
        const expenses = await db.MilkExpense.findAll({ where: expenseWhere });
        const notebook = notebookData(reports.map(report => report.toJSON()), expenses.map(expense => expense.toJSON()));
        const { reports: _reports, expenses: _expenses, includedIds: _ids, days: _days, ...stats } = notebook;
        stats.net_profit_or_loss = notebook.balance;
        stats.profitable_days = notebook.days.filter(day => day.balance > 0).length;
        stats.loss_days = notebook.days.filter(day => day.balance < 0).length;
        stats.break_even_days = notebook.days.filter(day => day.balance === 0).length;

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'A matching animal or daily report already exists' });
      console.error('Get milk report stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch milk report statistics',
        error: error.message
      });
    }
  }
}

module.exports = new MilkReportController();
