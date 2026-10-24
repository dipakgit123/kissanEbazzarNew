'use strict';
// Disposable loopback PostgreSQL only. Never imports config, .env, providers or the app server.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Sequelize, DataTypes } = require('sequelize');
const { calendarDate, addCalendarDays } = require('../src/utils/businessTime');
const { pregnancySummary } = require('../src/utils/pregnancySummary');
const net = require('node:net');
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const options = net._normalizeArgs(args)[0];
  if (options.host !== '127.0.0.1' || Number(options.port) !== 55439) throw Error('Only isolated PostgreSQL port 55439 is allowed');
  return connect.apply(this, args);
};
const database = `pregnancy_confirmation_test_${Date.now()}`;
const options = { dialect: 'postgres', host: '127.0.0.1', port: 55439, logging: false, dialectOptions: { ssl: false } };
let db, admin, checks = 0;
async function main() {
  admin = new Sequelize('postgres', 'audit_admin', '', options);
  await admin.query(`CREATE DATABASE "${database}"`);
  await admin.close(); admin = null;
  const sequelize = new Sequelize(database, 'audit_admin', '', options);
  db = { sequelize, Sequelize };
  const qi = sequelize.getQueryInterface();
  await require('../src/migrations/20250103000000-create-pregnancy-records').up(qi, Sequelize);
  await require('../src/migrations/20260608000001-add-ear-badge-to-pregnancy-records').up(qi, Sequelize);
  const today = calendarDate();
  const mating = addCalendarDays(today, -92);
  await qi.bulkInsert('pregnancy_records', [{ user_id: 7, animal_type: 'cow', animal_name: 'Legacy animal', mating_date: mating, expected_delivery_date: addCalendarDays(mating, 280), pregnancy_duration_days: 280, status: 'pregnant', created_at: new Date(), updated_at: new Date() }]);
  await require('../src/migrations/20261021000000-add-pregnancy-confirmation').up(qi, Sequelize);
  db.PregnancyRecord = require('../src/models/PregnancyRecord')(sequelize);
  db.PregnancyCheckup = require('../src/models/PregnancyCheckup')(sequelize);
  db.PregnancyRecord.associate(db); db.PregnancyCheckup.associate(db);
  db.AnimalListing = sequelize.define('AnimalListing', { user_id: DataTypes.INTEGER }, { tableName: 'test_animals' });
  await db.AnimalListing.sync();
  const legacy = await db.PregnancyRecord.findByPk(1);
  assert.equal(legacy.status, 'pregnant'); assert.equal(legacy.confirmation_source, 'legacy_unrecorded'); assert.equal(legacy.confirmed_on, null);
  const defaults = await qi.describeTable('pregnancy_records');
  assert.match(defaults.status.defaultValue, /pending_confirmation/);
  const modulePath = require.resolve('../src/models');
  require.cache[modulePath] = { id: modulePath, filename: modulePath, loaded: true, exports: db };
  const controller = require('../src/controllers/pregnancyController');
  async function call(method, body = {}, id = 1, user = 7, query = {}) {
    let response;
    const res = { code: 200, status(code) { this.code = code; return this; }, json(value) { response = { code: this.code, ...JSON.parse(JSON.stringify(value)) }; return this; } };
    await controller[method]({ body, params: { id }, user: { id: user }, query }, res);
    checks++; return response;
  }
  const create = (name = 'Laxmi', extra = {}) => call('createPregnancyRecord', { animal_name: name, animal_type: 'cow', mating_date: mating, ...extra });
  const payload = (result = 'pregnant', extra = {}) => ({ checked_on: today, result, request_id: randomUUID(), ...extra });
  let response = await create(); assert.equal(response.code, 201, JSON.stringify(response));
  const id = response.data.id;
  assert.equal(response.data.status, 'pending_confirmation');
  assert.equal(response.data.days_since_breeding, 92); assert.equal(response.data.days_remaining, 188);
  assert.equal((await call('markAsDelivered', { delivery_date: today, offspring_count: 1 }, id)).code, 400);
  assert.equal((await call('updateStatus', { status: 'pregnant' }, id)).code, 400);
  assert.equal((await call('recordCheckup', payload(), id, 99)).code, 404);
  for (const body of [payload('unknown'), payload('pregnant', { checked_on: addCalendarDays(today, 1) }), payload('pregnant', { checked_on: addCalendarDays(mating, -1) }), payload('pregnant', { estimated_age_value: -2, estimated_age_unit: 'months' }), payload('recheck', { next_check_date: today }), payload('pregnant', { request_id: 'invalid' })]) assert.equal((await call('recordCheckup', body, id)).code, 400);
  const confirmed = payload('pregnant', { estimated_age_value: 3, estimated_age_unit: 'months', next_check_date: addCalendarDays(today, 7), doctor_name: 'Local test doctor' });
  response = await call('recordCheckup', confirmed, id);
  assert.equal(response.code, 201, JSON.stringify(response));
  assert.equal(response.data.status, 'pregnant'); assert.equal(response.data.mating_date, mating);
  assert.equal(response.data.expected_delivery_date, addCalendarDays(mating, 280));
  assert.equal(response.data.days_remaining, 188); assert.equal(Number(response.data.checkups[0].estimated_age_value), 3);
  const duplicates = await Promise.all([call('recordCheckup', confirmed, id), call('recordCheckup', confirmed, id)]);
  assert.ok(duplicates.every(item => item.code === 200));
  assert.equal((await call('recordCheckup', { ...confirmed, result: 'recheck' }, id)).code, 409);
  assert.equal(await db.PregnancyCheckup.count({ where: { pregnancy_record_id: id } }), 1);
  response = await call('recordCheckup', payload('recheck', { next_check_date: addCalendarDays(today, 14) }), id);
  assert.equal(response.data.status, 'pregnant'); assert.equal(response.data.last_check_result, 'recheck');
  response = await call('recordCheckup', payload('not_pregnant', { checked_on: addCalendarDays(today, -1) }), id);
  assert.equal(response.data.status, 'pregnant'); assert.equal(response.data.last_check_result, 'recheck');
  assert.equal(response.data.checkups.length, 3);
  assert.equal((await call('updatePregnancyRecord', { mating_date: today }, id)).code, 400);
  response = await call('updatePregnancyRecord', { mating_date: addCalendarDays(mating, -2) }, id);
  assert.equal(response.data.days_remaining, 186); assert.equal(response.data.date_corrections.length, 1);
  assert.equal(response.data.checkups.length, 3);
  response = await call('recordCheckup', payload('not_pregnant'), id);
  assert.equal(response.data.status, 'not_pregnant'); assert.equal(response.data.next_check_date, null);
  assert.equal((await call('recordCheckup', payload(), id)).code, 409);
  response = await create('Laxmi'); assert.equal(response.code, 201); assert.notEqual(response.data.id, id);
  const newId = response.data.id;
  response = await call('recordCheckup', payload('recheck'), newId); assert.equal(response.data.status, 'pending_confirmation');
  // Fresh simultaneous retries serialize on the record row and create one examination.
  const same = payload();
  const concurrent = await Promise.all([call('recordCheckup', same, newId), call('recordCheckup', same, newId)]);
  assert.deepEqual(concurrent.map(item => item.code).sort(), [200, 201]);
  response = await call('markAsDelivered', { delivery_date: today, offspring_count: 1 }, newId);
  assert.equal(response.data.status, 'delivered'); assert.equal(response.data.next_check_date, null);
  assert.equal((await call('recordCheckup', payload(), newId)).code, 409);
  // Rollback both check history and status when a later operation fails.
  const rollback = (await create('Rollback')).data;
  const save = db.PregnancyRecord.prototype.save;
  db.PregnancyRecord.prototype.save = async function (...args) { if (this.id === rollback.id) throw Error('Injected save failure'); return save.apply(this, args); };
  assert.equal((await call('recordCheckup', payload(), rollback.id)).code, 500);
  db.PregnancyRecord.prototype.save = save;
  assert.equal(await db.PregnancyCheckup.count({ where: { pregnancy_record_id: rollback.id } }), 0);
  assert.equal((await db.PregnancyRecord.findByPk(rollback.id)).status, 'pending_confirmation');
  // Owner validation and duplicate attempts for an actual linked animal.
  const animal = await db.AnimalListing.create({ user_id: 7 });
  assert.equal((await create('Unauthorized', { listing_id: animal.id + 1, listing_type: 'cow' })).code, 404);
  const linked = await Promise.all([create('Linked', { listing_id: animal.id, listing_type: 'cow' }), create('Linked', { listing_id: animal.id, listing_type: 'cow' })]);
  assert.deepEqual(linked.map(item => item.code).sort(), [201, 409]);
  response = await call('getPregnancyRecords'); assert.ok(response.data.every(item => Array.isArray(item.checkups)));
  response = await call('getStats'); assert.ok(response.data.pending_confirmation >= 2); assert.equal(response.data.not_pregnant, 1); assert.equal(response.data.confirmation_unrecorded, 1);
  assert.equal(pregnancySummary({ status: 'pregnant', mating_date: '2024-02-28', expected_delivery_date: '2024-03-01', pregnancy_duration_days: 2 }, '2024-02-29').days_remaining, 1);
  // Mock notification delivery and cron registration. No provider module is loaded.
  const delivered = [];
  const seen = new Set();
  for (const [module, exports] of [
    ['node-cron', { schedule: () => ({ stop() {} }) }],
    ['../src/services/notificationService', { deliverNotification: async message => { if (!seen.has(message.data.dedupe_key)) delivered.push(message); seen.add(message.data.dedupe_key); return { delivered: true }; } }],
    ['../src/utils/logger', { log() {}, error(message, error) { throw error || Error(message); } }],
  ]) { const filename = require.resolve(module); require.cache[filename] = { id: filename, filename, loaded: true, exports }; }
  const due = await db.PregnancyRecord.create({ user_id: 7, animal_name: 'Confirmed due', animal_type: 'cow', mating_date: addCalendarDays(today, -279), expected_delivery_date: addCalendarDays(today, 1), pregnancy_duration_days: 280, status: 'pregnant', confirmed_on: today, next_check_date: today });
  await legacy.update({ expected_delivery_date: addCalendarDays(today, 1) });
  await db.PregnancyRecord.update({ next_check_date: today }, { where: { id: rollback.id } });
  const jobs = require('../src/services/scheduledNotifications');
  await jobs.runPregnancyReminders(); await jobs.runPregnancyReminders(); jobs.stop();
  assert.equal(delivered.length, 3); assert.equal(delivered.filter(item => item.data.reminder_kind === 'examination').length, 2);
  assert.ok(!delivered.some(item => item.data.record_id === legacy.id || item.data.record_id === id || item.data.record_id === newId));
  assert.equal(delivered.find(item => item.data.days_left !== undefined).data.record_id, due.id);
  console.log(`PASS: migration, legacy data, date arithmetic, confirmation, history, ownership, concurrency, rollback, delivery and mocked reminders (${checks} controller calls). Database retained: ${database}`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (db) await db.sequelize.close(); if (admin) await admin.close(); });
