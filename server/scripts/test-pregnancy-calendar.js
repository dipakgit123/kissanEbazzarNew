'use strict';
// Isolated controller/model regression tests: no environment file, DB connection, or providers.
const assert = require('node:assert/strict');
const { calendarDate, addCalendarDays } = require('../src/utils/businessTime');
const { validDate, validateRecord, validateDelivery } = require('../src/utils/pregnancyValidation');
const Record = require('../src/models/PregnancyRecord')({ define() {
  return class {
    constructor(values) { Object.assign(this, values); }
    toJSON() { return { ...this }; }
    async save() { return this; }
  };
} });
let records = [], lastWhere;
Record.create = async values => { const record = new Record({ id: records.length + 1, status: 'pregnant', ...values }); records.push(record); return record; };
Record.findOne = async ({ where }) => records.find(record => record.id === Number(where.id) && record.user_id === where.user_id) || null;
Record.findAll = async ({ where }) => { lastWhere = where; return records.filter(record => record.user_id === where.user_id && (!where.status || record.status === where.status)); };
const modelPath = require.resolve('../src/models');
require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: { PregnancyRecord: Record, PregnancyCheckup: { findAll: async () => [] }, sequelize: { transaction: async callback => callback({ LOCK: { UPDATE: 'UPDATE' } }) } } };
const controller = require('../src/controllers/pregnancyController');
let checks = 0;
async function call(method, body = {}, id = 1, user = 7, query = {}) {
  let result;
  const res = { code: 200, status(code) { this.code = code; return this; }, json(value) { result = { code: this.code, ...value }; return this; } };
  await controller[method]({ body, params: { id }, user: { id: user }, query }, res);
  checks++;
  return result;
}
(async () => {
  const today = calendarDate();
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2024-02-29'), true);
  assert.ok(validateRecord({ animal_name: ' ', mating_date: today }));
  assert.ok(validateRecord({ animal_name: 'Test', mating_date: '2026-02-30' }));
  assert.ok(validateDelivery({ delivery_date: today, offspring_count: 1.2 }, '2020-01-01'));
  for (const animal_type of [42, 'unknown', '__proto__']) {
    assert.equal((await call('createPregnancyRecord', { animal_type, animal_name: 'Test', mating_date: today })).code, 400);
  }
  for (const pregnancy_duration_days of [0, -2, 1.5, 1001]) {
    assert.equal((await call('createPregnancyRecord', { animal_type: 'other', animal_name: 'Test', mating_date: today, pregnancy_duration_days })).code, 400);
  }
  let result = await call('createPregnancyRecord', { animal_type: 'other', animal_name: ' Local test ', mating_date: '2024-01-01', pregnancy_duration_days: 120 });
  assert.equal(result.code, 201); assert.equal(result.data.animal_name, 'Local test');
  result = await call('updatePregnancyRecord', { mating_date: '2024-02-01' });
  assert.equal(result.data.pregnancy_duration_days, 120);
  assert.equal(result.data.expected_delivery_date, '2024-05-31');
  result = await call('updatePregnancyRecord', { pregnancy_duration_days: 100 });
  assert.equal(result.data.expected_delivery_date, '2024-05-11');
  result = await call('updatePregnancyRecord', { expected_delivery_date: '2030-01-01' });
  assert.equal(result.data.expected_delivery_date, '2024-05-11');
  assert.equal((await call('updatePregnancyRecord', { mating_date: '2024-02-30' })).code, 400);
  assert.equal((await call('updatePregnancyRecord', { animal_name: 'Intruder' }, 1, 99)).code, 404);
  assert.equal((await call('updateStatus', { status: 'delivered' })).code, 400);
  for (const payload of [
    { delivery_date: '2024-01-01', offspring_count: 1 },
    { delivery_date: addCalendarDays(today, 1), offspring_count: 1 },
    { delivery_date: today, offspring_count: 0 },
    { delivery_date: today, offspring_count: 1.5 },
    { delivery_date: today, offspring_count: 1, offspring_gender: 'invalid' },
  ]) assert.equal((await call('markAsDelivered', payload)).code, 400);
  records[0].status = 'pregnant'; // A doctor-confirmed fixture for the existing delivery regression.
  result = await call('markAsDelivered', { delivery_date: today, offspring_count: 2, offspring_gender: 'mixed', offspring_details: 'Local test only' });
  assert.equal(result.data.status, 'delivered'); assert.equal(result.data.offspring_count, 2);
  assert.equal((await call('markAsDelivered', { delivery_date: today, offspring_count: 1 })).code, 400);
  assert.equal((await call('updateStatus', { status: 'pregnant' })).code, 400);
  records = [-1, 0, 7, 31].map((offset, i) => new Record({ id: i + 1, user_id: 7, status: 'pregnant', confirmed_on: null, animal_type: 'cow', mating_date: addCalendarDays(today, -280), pregnancy_duration_days: 280, expected_delivery_date: addCalendarDays(today, offset) }));
  result = await call('getStats');
  assert.equal(result.data.overdue, 1); assert.equal(result.data.upcoming_deliveries.length, 2);
  assert.equal(result.data.active_pregnancies, 4);
  assert.equal(result.data.confirmed_pregnancies, 0);
  assert.equal(result.data.confirmation_unrecorded, 4);
  result = await call('getCalendarView');
  assert.equal(result.stats.overdue, 1); assert.equal(result.stats.due_this_week, 2);
  assert.equal(result.stats.total_active, 4);
  assert.equal(lastWhere.confirmed_on, undefined, 'Calendar query must include older pregnancy records');
  assert.equal((await call('getCalendarView', {}, 1, 7, { month: '13' })).code, 400);
  assert.equal(records[1].getDaysRemaining(), 0);
  assert.equal(records[2].getDaysRemaining(), 7);
  assert.equal(Record.calculateExpectedDeliveryDate('2026-03-07', 'other', 3), '2026-03-10');
  console.log(`Pregnancy validation, dates, ownership, edit, delivery, and stats checks passed (${checks} controller calls). No external connections.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
