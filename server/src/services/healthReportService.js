'use strict';
const db = require('../models');
const { randomUUID } = require('crypto');
const { fail } = require('../utils/healthContract');

async function usageTransaction(work) {
  return db.sequelize.transaction(async transaction => {
    // A locked usage row must not keep the browser waiting indefinitely.
    await db.sequelize.query("SET LOCAL lock_timeout = '5s'", { transaction });
    await db.sequelize.query("SET LOCAL statement_timeout = '10s'", { transaction });
    return work(transaction);
  });
}

// A database-backed lease applies across server workers, with expiry after crashes.
async function withAllowance(userId, work) {
  const lease = randomUUID();
  await usageTransaction(async transaction => {
    await db.sequelize.query('SELECT pg_advisory_xact_lock(72814, :userId)', { replacements: { userId }, transaction });
    const today = new Date().toISOString().slice(0, 10);
    let usage = await db.AIHealthUsage.findByPk(userId, { transaction });
    if (!usage) usage = await db.AIHealthUsage.create({ user_id: userId, day: today, requests: 0 }, { transaction });
    if (usage.active_until && new Date(usage.active_until) > new Date()) throw fail('A health request is already running. Please wait.', 'AI_IN_PROGRESS', 429);
    const count = usage.day === today ? usage.requests : 0;
    if (count >= 30) throw fail('Daily health-check limit reached. Please try again tomorrow.', 'AI_DAILY_LIMIT', 429);
    await usage.update({ day: today, requests: count + 1, lease, active_until: new Date(Date.now() + 90000) }, { transaction });
  });
  try { return await work(); }
  finally {
    try { await usageTransaction(transaction => db.AIHealthUsage.update({ active_until: null, lease: null }, { where: { user_id: userId, lease }, transaction })); }
    catch {
      // The lease expires automatically. Preserve the original AI error or saved result.
      console.warn('AI health usage cleanup delayed', { code: 'HEALTH_LEASE_CLEANUP_FAILED' });
    }
  }
}
async function ownedReport(userId, id) {
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw fail('Report not found.', 'HEALTH_NOT_FOUND', 404);
  const report = await db.AIHealthReport.findOne({ where: { user_id: userId, id } });
  if (!report) throw fail('Report not found.', 'HEALTH_NOT_FOUND', 404);
  return report;
}
async function linkAnimal(userId, context) {
  if (context.animalId) {
    const animal = await db.AnimalProfile.findOne({ where: { id: context.animalId, user_id: userId, archived: false } });
    if (!animal) throw fail('Animal not found.', 'HEALTH_NOT_FOUND', 404);
    if (context.animalType !== animal.species) throw fail('Selected animal type does not match the saved animal.');
    return { ...context, animalName: animal.name, animalTag: animal.tag || '', cowId: animal.farmer_cow_id || null };
  }
  if (!context.cowId) return context;
  const animal = await db.FarmerCow.findOne({ where: { id: context.cowId, user_id: userId } });
  if (!animal) throw fail('Animal not found.', 'HEALTH_NOT_FOUND', 404);
  if (context.animalType !== animal.animal_type) throw fail('Selected animal type does not match the saved animal.');
  return { ...context, animalName: animal.cow_name, animalTag: animal.cow_tag || '' };
}
module.exports = { withAllowance, ownedReport, linkAnimal };
