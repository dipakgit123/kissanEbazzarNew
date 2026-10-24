'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { validDate, decimal } = require('../utils/milkReportMath');
const categories = ['feed', 'medicine', 'labor', 'other'];
const validId = id => /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
const fail = (res, reason, status = 400) => res.status(status).json({ success: false, code: 'MILK_NOTEBOOK', reason });
const output = expense => ({ ...expense.toJSON(), amount: Number(expense.amount) });
async function prepare(body, userId, existing) {
  if (!validDate(body.expense_date)) return { error: 'invalidDate' };
  if (!categories.includes(body.category) || !['daily', 'purchase'].includes(body.kind || 'daily')) return { error: 'invalidExpense' };
  if (body.kind === 'purchase' && body.category !== 'feed') return { error: 'invalidExpense' };
  const amount = decimal(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'invalidExpense' };
  if (body.notes != null && (typeof body.notes !== 'string' || body.notes.length > 2000)) return { error: 'invalidExpense' };
  const scope = body.scope;
  if (!['herd', 'animal'].includes(scope)) return { error: 'invalidExpense' };
  let cow = null;
  const preserve = existing?.scope === 'animal' && existing.cow_id == null && scope === 'animal' && !body.cow_id;
  if (scope === 'animal' && !preserve) {
    if (!validId(body.cow_id)) return { error: 'chooseAnimal' };
    cow = await db.FarmerCow.findOne({ where: { id: body.cow_id, user_id: userId } });
    if (!cow) return { error: 'chooseAnimal' };
  }
  return { data: { expense_date: body.expense_date, scope, cow_id: cow?.id || null,
    cow_name: cow?.cow_name || (preserve ? existing.cow_name : null),
    cow_tag: cow?.cow_tag || (preserve ? existing.cow_tag : null),
    animal_type: cow?.animal_type || (preserve ? existing.animal_type : null),
    category: body.category, kind: body.kind || 'daily', amount, notes: (body.notes || '').trim() || null } };
}
const same = (row, data) => Object.keys(data).every(key => key === 'amount' ? Number(row[key]) === data[key] : row[key] === data[key]);
exports.list = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    if ((from_date && !validDate(from_date)) || (to_date && !validDate(to_date)) || (from_date && to_date && from_date > to_date)) return fail(res, 'invalidDate');
    const where = { user_id: req.user.id };
    if (from_date || to_date) where.expense_date = { ...(from_date && { [Op.gte]: from_date }), ...(to_date && { [Op.lte]: to_date }) };
    const data = await db.MilkExpense.findAll({ where, order: [['expense_date', 'DESC'], ['id', 'DESC']] });
    return res.json({ success: true, data: data.map(output) });
  } catch { return fail(res, 'loadError', 500); }
};
exports.create = async (req, res) => {
  let values;
  try {
    if (typeof req.body.request_id !== 'string' || !/^[\w-]{8,100}$/.test(req.body.request_id)) return fail(res, 'invalidExpense');
    const items = req.body.items || [req.body];
    if (!Array.isArray(items) || !items.length || items.length > 4 || new Set(items.map(item => item?.category)).size !== items.length) return fail(res, 'invalidExpense');
    values = [];
    for (const item of items) {
      const result = await prepare({ ...req.body, ...item }, req.user.id);
      if (result.error) return fail(res, result.error);
      values.push({ ...result.data, user_id: req.user.id, request_id: req.body.request_id + '-' + item.category });
    }
    const rows = await db.sequelize.transaction(transaction => db.MilkExpense.bulkCreate(values, { transaction, returning: true }));
    return res.status(201).json({ success: true, data: rows.map(output) });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError' && values) {
      const rows = await db.MilkExpense.findAll({ where: { user_id: req.user.id, request_id: { [Op.in]: values.map(value => value.request_id) } } });
      if (rows.length === values.length && values.every(value => rows.some(row => same(row, value)))) return res.json({ success: true, data: rows.map(output) });
      return fail(res, 'duplicateExpense', 409);
    }
    return fail(res, 'saveError', 500);
  }
};
exports.update = async (req, res) => {
  try {
    if (!validId(req.params.id)) return fail(res, 'invalidExpense');
    const record = await db.MilkExpense.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!record) return fail(res, 'notFound', 404);
    const result = await prepare({ ...record.toJSON(), ...req.body }, req.user.id, record);
    if (result.error) return fail(res, result.error);
    await record.update(result.data);
    return res.json({ success: true, data: output(record) });
  } catch { return fail(res, 'saveError', 500); }
};
exports.remove = async (req, res) => {
  try {
    if (!validId(req.params.id)) return fail(res, 'invalidExpense');
    const count = await db.MilkExpense.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    return count ? res.json({ success: true }) : fail(res, 'notFound', 404);
  } catch { return fail(res, 'saveError', 500); }
};
