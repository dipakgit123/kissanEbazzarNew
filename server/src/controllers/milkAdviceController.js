'use strict';
const { randomUUID } = require('node:crypto');
const { Op } = require('sequelize');
const db = require('../models');
const { shiftDate } = require('../utils/milkNotebook');
const { validateRoutine, summarize, feedingEstimate, fingerprint, todayIndia, fail } = require('../utils/milkAdvice');
const provider = require('../services/milkAdviceProvider');

const sendError = (res, error) => {
  // Never log provider payloads, authorization headers or farmer records.
  const known = error.status && /^[A-Z_]+$/.test(error.code || '');
  if (!known) console.error('Milk advice request failed:', error.name || 'Error');
  if (error.status === 429) res.set('Retry-After', error.code === 'DAILY_LIMIT' ? '3600' : '60');
  return res.status(known ? error.status : 500).json({ success: false, code: known ? error.code : 'MILK_ADVICE_ERROR' });
};
async function ownedCow(req) {
  if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) throw fail('ANIMAL_NOT_FOUND', 404);
  const cow = await db.FarmerCow.findOne({ where: { id: Number(req.params.id), user_id: req.user.id } });
  if (!cow || !['cow', 'buffalo'].includes(cow.animal_type)) throw fail('ANIMAL_NOT_FOUND', 404);
  return cow;
}
async function snapshot(req) {
  const cow = await ownedCow(req), today = todayIndia();
  const language = req.query?.language || req.body?.language || 'en';
  if (!['en', 'mr', 'hi'].includes(language)) throw fail('INVALID_LANGUAGE');
  const where = { user_id: req.user.id, cow_id: cow.id };
  const [saved, reports, expenses] = await Promise.all([
    db.MilkFeedingRoutine.findOne({ where, order: [['id', 'DESC']] }),
    db.MilkReport.findAll({ where: { ...where, report_type: 'individual', report_date: { [Op.between]: [shiftDate(today, -14), today] } }, raw: true }),
    db.MilkExpense.findAll({ where: { user_id: req.user.id, expense_date: { [Op.between]: [shiftDate(today, -14), today] }, [Op.or]: [{ cow_id: cow.id, scope: 'animal' }, { scope: 'herd' }] }, raw: true })
  ]);
  const facts = summarize(reports, expenses, cow.id, today);
  const routine = saved?.routine || null;
  const needs_confirmation = !!saved && Date.now() - new Date(saved.created_at).getTime() >= 7 * 86400000;
  const status = !routine ? 'needs_routine' : routine.changes.some(x => ['unwell', 'eating_less'].includes(x)) ? 'vet_first' : needs_confirmation ? 'confirm_routine' : 'ready';
  const hash = fingerprint({ user: req.user.id, cow: cow.id, species: cow.animal_type, routine, confirmed: saved?.created_at, facts, language, provider: 'groq', model: process.env.GROQ_MODEL || '' });
  const cached = status === 'ready' ? await db.MilkAdvice.findOne({ where: { ...where, fingerprint: hash } }) : null;
  return { cow, where, hash, today, language, data: { routine, confirmed_at: saved?.created_at || null, facts, feed_estimate: feedingEstimate(routine), status, mode: facts.sufficient ? 'trend' : 'initial', advice: cached?.result || null } };
}
exports.get = async (req, res) => {
  try { return res.json({ success: true, data: (await snapshot(req)).data }); }
  catch (error) { return sendError(res, error); }
};
exports.saveRoutine = async (req, res) => {
  try {
    const routine = validateRoutine(req.body);
    const cow = await ownedCow(req);
    await db.MilkFeedingRoutine.create({ user_id: req.user.id, cow_id: cow.id, routine });
    return res.json({ success: true, data: (await snapshot(req)).data });
  } catch (error) { return sendError(res, error); }
};
async function reserve(user, day) {
  return db.sequelize.transaction(async transaction => {
    await db.sequelize.query('SELECT pg_advisory_xact_lock(72815, :user)', { replacements: { user }, transaction });
    const [usage] = await db.MilkAdviceUsage.findOrCreate({ where: { user_id: user }, defaults: { day, requests: 0 }, transaction });
    if (usage.active_until && new Date(usage.active_until).getTime() > Date.now()) throw fail('AI_BUSY', 429);
    const requests = usage.day === day ? usage.requests : 0;
    if (requests >= 10) throw fail('DAILY_LIMIT', 429);
    const lease = randomUUID();
    await usage.update({ day, requests: requests + 1, lease, active_until: new Date(Date.now() + 60000) }, { transaction });
    return lease;
  });
}
exports.generate = async (req, res) => {
  let lease;
  try {
    const state = await snapshot(req);
    if (state.data.status !== 'ready' || state.data.advice) return res.json({ success: true, data: state.data });
    if (!process.env.GROQ_API_KEY || !process.env.GROQ_MODEL) throw fail('AI_NOT_CONFIGURED', 503);
    lease = await reserve(req.user.id, state.today);
    const sections = await provider.recommend({ species: state.cow.animal_type, routine: state.data.routine, facts: state.data.facts, language: state.language });
    // Do not publish advice for records/routines edited while the provider was running.
    const current = await snapshot(req);
    if (current.hash !== state.hash) throw fail('RECORDS_CHANGED', 409);
    const result = { sections, language: state.language, generated_at: new Date().toISOString(), source: 'groq' };
    await db.MilkAdvice.upsert({ ...state.where, fingerprint: state.hash, result, created_at: new Date() });
    return res.json({ success: true, data: { ...state.data, advice: result } });
  } catch (error) { return sendError(res, error); }
  finally {
    if (lease) {
      try { await db.MilkAdviceUsage.update({ lease: null, active_until: null }, { where: { user_id: req.user.id, lease } }); }
      catch { console.error('Milk advice lease cleanup failed; lease will expire.'); }
    }
  }
};
