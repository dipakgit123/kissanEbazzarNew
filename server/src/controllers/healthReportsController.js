'use strict';
const { randomUUID } = require('crypto');
const db = require('../models');
const ai = require('../services/healthGeneration');
const store = require('../services/healthReportService');
const contract = require('../utils/healthContract');
const userId = req => req.user.id || req.user.userId;
const handle = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (error) {
    const known = /^(AI_|HEALTH_)/.test(error.code || '');
    const dbCode = error.original?.code || error.parent?.code;
    const databaseError = dbCode === '42P01' || dbCode === '42703'
      ? { status: 503, code: 'HEALTH_SETUP_REQUIRED', message: 'Health reports need a database update. Please contact support.' }
      : ['55P03', '57014'].includes(dbCode)
        ? { status: 503, code: 'HEALTH_DATABASE_BUSY', message: 'The health report database is busy. Please retry shortly.' }
        : /SequelizeConnection|SequelizeHost|SequelizeAcquire/.test(error.name || '')
          ? { status: 503, code: 'HEALTH_DATABASE_UNAVAILABLE', message: 'The health report database is unavailable. Please retry later.' }
          : { status: 500, code: 'HEALTH_SAVE_FAILED', message: 'Unable to save or load the health report. Please try again.' };
    const publicError = known ? { status: error.status || 400, code: error.code, message: error.message } : databaseError;
    console.warn('AI health request failed', { code: publicError.code, status: publicError.status, databaseCode: /^[A-Z0-9]{5}$/.test(dbCode || '') ? dbCode : undefined });
    if (known && error.status === 429) res.set('Retry-After', error.code === 'AI_DAILY_LIMIT' ? '3600' : '60');
    // Only the controlled public messages above bypass the generic 5xx sanitizer.
    res.locals.healthPublicError = true;
    res.status(publicError.status).json({ success: false, code: publicError.code, message: publicError.message });
  }
};
const publicReport = report => ({ id: report.id, context: report.context, analysis: report.analysis, messages: report.messages, createdAt: report.created_at });

const analyze = handle(async (req, res) => {
  const owner = userId(req);
  let context = contract.context(req.body);
  const requestId = contract.text(req.body.requestId || randomUUID(), 'request ID', 80);
  if (!requestId || !/^[\w-]+$/.test(requestId)) throw contract.fail('Invalid request ID.');
  context = await store.linkAnimal(owner, context);
  // Recovery after a lost response must not consume another AI request.
  const cached = await db.AIHealthReport.findOne({ where: { user_id: owner, request_id: requestId } });
  if (cached) return res.json({ success: true, data: cached.analysis, report: publicReport(cached) });
  const source = req.file || req.body.imageUrl;
  if (!source) throw contract.fail('Choose an image.');
  if (req.file) contract.image(req.file.buffer, req.file.mimetype);
  else if (typeof source !== 'string' || source.length > 2048) throw contract.fail('Invalid image URL.');
  const report = await store.withAllowance(owner, async () => {
    const result = await ai.analyzeAnimalHealth(source, context.animalType, context);
    return db.AIHealthReport.create({ user_id: owner, cow_id: context.cowId, animal_profile_id: context.animalId, request_id: requestId, context, analysis: result.analysis, messages: [] });
  });
  res.json({ success: true, data: report.analysis, report: publicReport(report) });
});

const ask = handle(async (req, res) => {
  const owner = userId(req);
  const prompt = contract.text(req.body.prompt, 'question', 2000);
  if (!prompt) throw contract.fail('Enter a question.');
  const reportId = req.params.id || req.body.reportId;
  const report = reportId ? await store.ownedReport(owner, reportId) : null;
  const context = contract.context(report ? { ...report.context, languageHint: req.body.languageHint || report.context.languageHint } : req.body);
  if (report && report.messages.length >= 20) throw contract.fail('This report has reached its question limit.', 'AI_CONVERSATION_LIMIT', 429);
  const answer = await store.withAllowance(owner, async () => {
    const current = report ? await store.ownedReport(owner, report.id) : null;
    if (current && current.messages.length >= 20) throw contract.fail('This report has reached its question limit.', 'AI_CONVERSATION_LIMIT', 429);
    const generated = await ai.answerHealthQuestion({ ...context, prompt, reportContext: current ? { analysis: current.analysis, messages: current.messages.slice(-6) } : undefined });
    if (report) {
      const messages = [...current.messages, { question: prompt, answer: generated.answer, createdAt: new Date().toISOString() }];
      const [count] = await db.AIHealthReport.update({ messages }, { where: { id: report.id, user_id: owner } });
      if (!count) throw contract.fail('Report was deleted.', 'HEALTH_NOT_FOUND', 404);
    }
    return generated.answer;
  });
  res.json({ success: true, data: { answer } });
});

const list = handle(async (req, res) => {
  const page = Number(req.query.page || 1);
  if (!Number.isInteger(page) || page < 1 || page > 10000) throw contract.fail('Invalid page.');
  const { count, rows } = await db.AIHealthReport.findAndCountAll({ where: { user_id: userId(req) }, order: [['created_at', 'DESC'], ['id', 'DESC']], limit: 10, offset: (page - 1) * 10 });
  res.json({ success: true, total: count, page, data: rows.map(publicReport) });
});
const detail = handle(async (req, res) => res.json({ success: true, data: publicReport(await store.ownedReport(userId(req), req.params.id)) }));
const remove = handle(async (req, res) => {
  const report = await store.ownedReport(userId(req), req.params.id);
  await report.destroy();
  res.json({ success: true });
});
const animals = handle(async (req, res) => {
  const rows = await db.FarmerCow.findAll({ where: { user_id: userId(req) }, attributes: ['id', 'cow_name', 'cow_tag', 'animal_type'], order: [['cow_name', 'ASC']], limit: 500 });
  res.json({ success: true, data: rows });
});
module.exports = { analyze, ask, list, detail, remove, animals };
