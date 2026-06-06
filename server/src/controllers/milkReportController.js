'use strict';

const { Op } = require('sequelize');
const db = require('../models');

const DECIMAL_FIELDS = [
  'morning_liters',
  'afternoon_liters',
  'price_per_liter',
  'feed_cost',
  'medicine_cost',
  'labor_cost',
  'other_cost'
];
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

const validateDecimalField = (field, value) => {
  const numericValue = Number.parseFloat(value ?? 0);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return `${field} must be a valid non-negative number`;
  }

  return null;
};

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

const buildReportDuplicateWhereClause = ({ userId, reportDate, reportType, cowId, cowName, cowTag, excludeId = null }) => {
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
    total_liters: roundNumber(report.getTotalLiters()),
    total_revenue: roundNumber(report.getTotalRevenue()),
    total_cost: roundNumber(report.getTotalCost()),
    profit_or_loss: roundNumber(report.getProfitOrLoss()),
    profit_status: report.getProfitStatus()
  };
};

class MilkReportController {
  async createCow(req, res) {
    try {
      const userId = req.user.id;
      const animalType = normalizeAnimalType(req.body.animal_type);
      const cowName = normalizeText(req.body.cow_name);
      const cowTag = normalizeText(req.body.cow_tag);
      const breedName = normalizeText(req.body.breed_name);
      const notes = normalizeText(req.body.notes);
      const ageYears = req.body.age_years === undefined || req.body.age_years === '' ? null : Number.parseFloat(req.body.age_years);

      if (!cowName) {
        return res.status(400).json({
          success: false,
          message: 'cow_name is required'
        });
      }

      if (ageYears !== null && (!Number.isFinite(ageYears) || ageYears < 0)) {
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
        if (req.body.age_years === '') {
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

      await cow.save();

      const linkedReports = await db.MilkReport.findAll({
        where: {
          cow_id: cow.id,
          user_id: req.user.id
        }
      });

      await Promise.all(linkedReports.map((report) => {
        report.animal_type = cow.animal_type;
        report.cow_name = cow.cow_name;
        report.cow_tag = cow.cow_tag;
        return report.save();
      }));

      res.json({
        success: true,
        message: 'Animal updated successfully',
        data: buildCowResponse(cow)
      });
    } catch (error) {
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
      const reportDate = payload.report_date;
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

      for (const field of DECIMAL_FIELDS) {
        const errorMessage = validateDecimalField(field, payload[field]);
        if (errorMessage) {
          return res.status(400).json({
            success: false,
            message: errorMessage
          });
        }
      }

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
        notes: payload.notes || null
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
      const nextCowId = updates.cow_id !== undefined && updates.cow_id !== '' ? Number.parseInt(updates.cow_id, 10) : report.cow_id;
      const nextReportType = updates.report_type !== undefined
        ? normalizeReportType(updates.report_type)
        : normalizeReportType(report.report_type);

      let cow = null;
      if (nextReportType === REPORT_TYPES.INDIVIDUAL) {
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

      for (const field of DECIMAL_FIELDS) {
        if (updates[field] === undefined) {
          continue;
        }

        const errorMessage = validateDecimalField(field, updates[field]);
        if (errorMessage) {
          return res.status(400).json({
            success: false,
            message: errorMessage
          });
        }
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
        'report_date',
        'morning_liters',
        'afternoon_liters',
        'price_per_liter',
        'feed_cost',
        'medicine_cost',
        'labor_cost',
        'other_cost',
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
      const { month, year, cow_id, report_type, animal_type } = req.query;
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

      const stats = {
        total_reports: reports.length,
        total_liters: 0,
        total_revenue: 0,
        total_cost: 0,
        net_profit_or_loss: 0,
        profitable_days: 0,
        loss_days: 0,
        break_even_days: 0,
        best_day: null,
        worst_day: null
      };

      reports.forEach((report) => {
        const totalLiters = report.getTotalLiters();
        const totalRevenue = report.getTotalRevenue();
        const totalCost = report.getTotalCost();
        const profitOrLoss = report.getProfitOrLoss();
        const responseReport = buildReportResponse(report);

        stats.total_liters += totalLiters;
        stats.total_revenue += totalRevenue;
        stats.total_cost += totalCost;
        stats.net_profit_or_loss += profitOrLoss;

        if (profitOrLoss > 0) {
          stats.profitable_days += 1;
        } else if (profitOrLoss < 0) {
          stats.loss_days += 1;
        } else {
          stats.break_even_days += 1;
        }

        if (!stats.best_day || profitOrLoss > stats.best_day.profit_or_loss) {
          stats.best_day = responseReport;
        }

        if (!stats.worst_day || profitOrLoss < stats.worst_day.profit_or_loss) {
          stats.worst_day = responseReport;
        }
      });

      stats.total_liters = roundNumber(stats.total_liters);
      stats.total_revenue = roundNumber(stats.total_revenue);
      stats.total_cost = roundNumber(stats.total_cost);
      stats.net_profit_or_loss = roundNumber(stats.net_profit_or_loss);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
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
