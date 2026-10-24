const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const math = require('../src/utils/milkAdvice');
const { shiftDate } = require('../src/utils/milkNotebook');
const today = math.todayIndia();
const plan = () => Object.fromEntries(['milk', 'feed_cost', 'next_week'].map(key => [key, { action: 'Check the trough and keep clean water available throughout the day.', reason: 'You reported that clean water is not always available.', evidence: ['water'] }]));
const routine = () => ({ since: shiftDate(today, -20), calving_months: 3, feed: [{ type: 'green', kg: 12 }, { type: 'dry', kg: null }], water: 'no', changes: ['none'] });
const reports = () => Array.from({ length: 14 }, (_, i) => ({ id: i + 1, report_type: 'individual', cow_id: 4, report_date: shiftDate(today, -14 + i), morning_liters: i < 7 ? 8 : 7, afternoon_liters: i < 7 ? 8 : 7, feed_cost: 10, medicine_cost: 0, labor_cost: 0, other_cost: 0 }));
function load(file, mocks, env = { GROQ_API_KEY: 'test-key', GROQ_MODEL: 'fixture-model' }) {
  const filename = path.resolve(__dirname, '../src', file), module = { exports: {} };
  const localRequire = require('node:module').createRequire(filename);
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), { module, exports: module.exports, require: name => Object.hasOwn(mocks, name) ? mocks[name] : localRequire(name), process: { env }, console, Date, Buffer, setTimeout, clearTimeout }, { filename });
  return module.exports;
}
test('routine validation: unknowns, exclusive choices, malformed types, bounds and dates', () => {
  assert.equal(math.validateRoutine(routine()).feed.find(f => f.type === 'dry').kg, null);
  for (const changes of [['none', 'unwell'], [], ['unknown', 'feed_changed']]) assert.throws(() => math.validateRoutine({ ...routine(), changes }));
  for (const kg of [-1, 'two bundles', {}, [3], true, 201, .001]) assert.throws(() => math.validateRoutine({ ...routine(), feed: [{ type: 'green', kg }] }));
  for (const calving_months of [-1, 1.1, true, [2]]) assert.throws(() => math.validateRoutine({ ...routine(), calving_months }));
  assert.throws(() => math.validateRoutine({ ...routine(), since: shiftDate(today, 1) }));
  assert.throws(() => math.validateRoutine({ ...routine(), feed: [{ type: 'unknown' }, { type: 'dry' }] }));
  assert.throws(() => math.validateRoutine({ ...routine(), feed: [{ type: 'other', description: '' }] }));
});
test('optional feed prices calculate a disclosed partial estimate and preserve old routines', () => {
  for (const price_per_kg of [-1, true, {}, [2], 10001, .001]) assert.throws(() => math.validateRoutine({ ...routine(), feed: [{ type: 'green', kg: 12, price_per_kg }] }));
  const saved = math.validateRoutine({ ...routine(), feed: [{ type: 'green', kg: 12, price_per_kg: 4 }, { type: 'dry', kg: 2 }] });
  const partial = math.feedingEstimate(saved); assert.equal(partial.known_daily_cost, 48); assert.equal(partial.complete, false);
  assert.equal(partial.items.find(f => f.type === 'dry').daily_cost, null); assert.equal(math.feedingEstimate(routine()).known_daily_cost, null);
  const complete = math.feedingEstimate({ feed: [{ type: 'green', kg: 12, price_per_kg: 4 }, { type: 'dry', kg: 2, price_per_kg: 5 }] });
  assert.equal(complete.known_daily_cost, 58); assert.equal(complete.complete, true);
  assert.equal(math.feedingEstimate({ feed: [{ type: 'green', kg: 12, price_per_kg: 0 }] }).known_daily_cost, 0);
});
test('two complete weeks exclude herd, other animals, today and missing days; purchases separate', () => {
  const all = [...reports(), { ...reports()[0], report_type: 'overall', morning_liters: 999 }, { ...reports()[0], cow_id: 99 }, { ...reports()[0], report_date: today }];
  const expenses = [{ scope: 'herd', expense_date: shiftDate(today, -1), category: 'feed', amount: 900 }, { scope: 'animal', cow_id: 4, expense_date: shiftDate(today, -1), category: 'feed', kind: 'purchase', amount: 1000 }];
  const facts = math.summarize(all, expenses, 4);
  assert.equal(facts.recent.average, 14); assert.equal(facts.previous.average, 16); assert.equal(facts.change_liters, -2);
  assert.equal(facts.costs.feed, 140); assert.equal(facts.bulk_purchases, 1000); assert.equal(facts.shared_costs_excluded, true);
  const sparse = math.summarize(reports().slice(10), [], 4);
  assert.equal(sparse.recent.average, 14); assert.equal(sparse.recent.days, 4); assert.equal(sparse.sufficient, false); assert.equal(sparse.previous.average, null);
  assert.equal(math.summarize([{ ...reports()[0], feed_cost: 0 }], [], 4).missing_cost_days, 1);
  assert.throws(() => math.summarize([...reports(), reports()[0]], [], 4), { code: 'DUPLICATE_RECORDS' });
  assert.equal(math.todayIndia(new Date('2026-10-22T19:00:00Z')), '2026-10-23');
  const todayOnly = math.summarize([{ ...reports()[0], report_date: today }], [{ scope: 'animal', cow_id: 4, expense_date: today, category: 'feed', kind: 'daily', amount: 20 }], 4);
  assert.equal(todayOnly.today_costs.categories.feed, 30); assert.equal(todayOnly.today_costs.has_records, true);
  assert.equal(todayOnly.costs.feed, 0); assert.equal(todayOnly.latest_milk.may_be_partial, true); assert.equal(todayOnly.recent.days, 0);
});
test('provider returns personalized sections in requested language and rejects invalid claims', async () => {
  let payload, options, mode = 'success';
  const provider = load('services/milkAdviceProvider.js', { axios: { post: async (url, body, opts) => {
    payload = body; options = opts; assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    if (mode === 'busy') throw { response: { status: 429 } };
    if (mode === 'network') throw Error('private provider text');
    return { data: { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(mode === 'unsafe' ? { actions: ['double_concentrate'] } : plan()) } }] } };
  } } });
  const args = { species: 'cow', routine: { ...routine(), feed: [{ type: 'other', kg: null, description: 'Private user content' }] }, facts: math.summarize(reports().slice(-1), [], 4), language: 'en' };
  assert.equal((await provider.recommend(args)).milk.action, plan().milk.action);
  assert.equal(JSON.stringify(payload).includes('Private user content'), false); assert.equal(options.timeout, 25000);
  assert.equal(options.headers.Authorization, 'Bearer test-key'); assert.equal(payload.model, 'fixture-model');
  assert.equal(payload.response_format.json_schema.strict, true); assert.equal(payload.response_format.json_schema.schema.additionalProperties, false);
  assert.ok(payload.messages[0].content.includes('simple English'));
  const sent = JSON.parse(payload.messages[1].content); assert.equal(sent.evidence.milk_records.recorded_days, 1); assert.equal(sent.evidence.milk_records.trend_available, false);
  for (const action of ['Feed an extra 5 kg every day.', 'Milk will double with this diet.', 'Use oxytocin to increase milk.', '<script>use unsafe text</script>']) {
    const bad = plan(); bad.milk.action = action; assert.throws(() => provider.validateOutput(bad), { code: 'AI_INVALID_RESPONSE' });
  }
  const badRef = plan(); badRef.milk.evidence = ['invented_body_weight']; assert.throws(() => provider.validateOutput(badRef));
  assert.throws(() => provider.validateOutput(plan(), 'mr'));
  assert.throws(() => provider.validateOutput({ ...plan(), extra: 'unexpected' }));
  mode = 'unsafe'; await assert.rejects(provider.recommend(args), { code: 'AI_INVALID_RESPONSE' });
  mode = 'busy'; await assert.rejects(provider.recommend(args), { code: 'AI_BUSY' });
  mode = 'network'; await assert.rejects(provider.recommend(args), { code: 'AI_UNAVAILABLE' });
});
test('Groq configuration is required; legacy provider credentials cannot trigger a request', async () => {
  let called = false;
  for (const env of [{}, { GROQ_API_KEY: 'test-key' }, { XAI_API_KEY: 'legacy-test', XAI_MODEL: 'legacy-model' }, { GROK_API_KEY: 'legacy-test', GROK_MODEL: 'legacy-model' }]) {
    const provider = load('services/milkAdviceProvider.js', { axios: { post: async () => { called = true; } } }, env);
    await assert.rejects(provider.recommend({}), { code: 'AI_NOT_CONFIGURED' });
  }
  assert.equal(called, false);
});
function fixture() {
  let owned = true, saved = null, rows = reports(), expenses = [], cache = null, calls = 0, usage = null, providerError = null, changeDuringAI = false;
  const checkOwner = opts => { assert.equal(opts.where.user_id, 7); assert.equal(opts.where.id, 4); };
  const db = {
    FarmerCow: { findOne: async opts => { checkOwner(opts); return owned ? { id: 4, animal_type: 'cow' } : null; } },
    MilkFeedingRoutine: { findOne: async opts => { assert.equal(opts.where.user_id, 7); return saved; }, create: async value => { saved = { ...value, created_at: new Date() }; } },
    MilkReport: { findAll: async opts => { assert.equal(opts.where.user_id, 7); assert.equal(opts.where.cow_id, 4); return rows; } },
    MilkExpense: { findAll: async () => expenses },
    MilkAdvice: { findOne: async opts => cache?.fingerprint === opts.where.fingerprint ? cache : null, upsert: async value => { cache = value; } },
    MilkAdviceUsage: { findOrCreate: async () => { if (!usage) usage = { day: today, requests: 0, update: async value => Object.assign(usage, value) }; return [usage]; }, update: async value => Object.assign(usage, value) },
    sequelize: { transaction: async callback => callback({}), query: async (sql, opts) => { assert.ok(sql.includes('pg_advisory_xact_lock')); assert.equal(opts.replacements.user, 7); } }
  };
  const controller = load('controllers/milkAdviceController.js', { '../models': db, sequelize: { Op: { between: Symbol('between'), or: Symbol('or') } }, '../services/milkAdviceProvider': { recommend: async () => { calls++; if (changeDuringAI) rows[0].morning_liters++; if (providerError) throw providerError; return plan(); } } });
  const run = async (method, body, language = 'en') => { const result = { statusCode: 200, status(code) { this.statusCode = code; return this; }, set() { return this; }, json(value) { this.body = value; return this; } }; await controller[method]({ user: { id: 7 }, params: { id: '4' }, query: { language }, body }, result); return result; };
  return { run, setOwned: value => { owned = value; }, setRows: value => { rows = value; }, setExpenses: value => { expenses = value; }, stale: () => { saved.created_at = new Date(Date.now() - 8 * 86400000); }, setError: value => { providerError = value; }, changeDuringAI: () => { changeDuringAI = true; }, calls: () => calls, usage: () => usage };
}
test('controller ownership, save, cache reuse, record edits and cost edits invalidate advice', async () => {
  const f = fixture(); f.setOwned(false);
  for (const method of ['get', 'saveRoutine', 'generate']) assert.equal((await f.run(method, routine())).statusCode, 404);
  f.setOwned(true); assert.equal((await f.run('get')).body.data.status, 'needs_routine');
  assert.equal((await f.run('saveRoutine', routine())).body.data.status, 'ready');
  assert.equal((await f.run('generate')).body.data.advice.source, 'groq'); assert.equal(f.calls(), 1);
  await f.run('generate'); assert.equal(f.calls(), 1);
  const changed = reports(); changed[0].morning_liters = 12; f.setRows(changed); await f.run('generate'); assert.equal(f.calls(), 2);
  f.setExpenses([{ scope: 'animal', cow_id: 4, expense_date: shiftDate(today, -1), category: 'medicine', kind: 'daily', amount: 100 }]); await f.run('generate'); assert.equal(f.calls(), 3);
  assert.equal(f.usage().lease, null);
  await f.run('generate', null, 'mr'); assert.equal(f.calls(), 4);
  await f.run('generate', null, 'mr'); assert.equal(f.calls(), 4);
});
test('illness and stale answers block AI, but sparse records allow initial guidance', async () => {
  const f = fixture(); await f.run('saveRoutine', { ...routine(), changes: ['unwell'] });
  assert.equal((await f.run('generate')).body.data.status, 'vet_first'); f.stale(); assert.equal((await f.run('generate')).body.data.status, 'vet_first');
  await f.run('saveRoutine', routine()); f.stale(); assert.equal((await f.run('generate')).body.data.status, 'confirm_routine');
  await f.run('saveRoutine', routine()); f.setRows([]); const initial = (await f.run('generate')).body.data; assert.equal(initial.status, 'ready'); assert.equal(initial.mode, 'initial'); assert.equal(f.calls(), 1);
  f.setRows([{ ...reports()[0], report_date: today }]); const single = (await f.run('generate')).body.data; assert.equal(single.mode, 'initial'); assert.equal(single.facts.latest_milk.may_be_partial, true); assert.equal(f.calls(), 2);
});
test('failures release lease; retry succeeds; limits enforced; concurrent record change rejected', async () => {
  const f = fixture(); await f.run('saveRoutine', routine()); f.setError(math.fail('AI_UNAVAILABLE', 503));
  assert.equal((await f.run('generate')).statusCode, 503); assert.equal(f.usage().lease, null);
  f.usage().active_until = new Date(Date.now() + 10000); assert.equal((await f.run('generate')).body.code, 'AI_BUSY'); f.usage().active_until = null;
  f.usage().requests = 10; assert.equal((await f.run('generate')).body.code, 'DAILY_LIMIT'); f.usage().requests = 1;
  f.setError(null); assert.equal((await f.run('generate')).statusCode, 200);
  const g = fixture(); await g.run('saveRoutine', routine()); g.changeDuringAI(); assert.equal((await g.run('generate')).body.code, 'RECORDS_CHANGED');
});
test('web and mobile use identical translated contract and request hook', () => {
  for (const file of ['milkAdviceCopy.json', 'milkAdvicePlanCopy.json', 'useMilkAdvice.js']) assert.equal(fs.readFileSync(path.resolve(__dirname, '../../frontend/src/utils', file), 'utf8'), fs.readFileSync(path.resolve(__dirname, '../../mobile/src/utils', file), 'utf8'));
  const copy = require('../../frontend/src/utils/milkAdviceCopy.json');
  for (const lang of ['mr', 'hi']) assert.deepEqual(Object.keys(copy[lang]).sort(), Object.keys(copy.en).sort());
  const planCopy = require('../../frontend/src/utils/milkAdvicePlanCopy.json');
  for (const lang of ['mr', 'hi']) assert.deepEqual(Object.keys(planCopy[lang]).sort(), Object.keys(planCopy.en).sort());
});
test('additive migration creates indexed owned tables and reverses in a transaction', async () => {
  const migration = require('../src/migrations/20261024000000-milk-advice');
  const tables = [], drops = [], indexes = [];
  const transaction = {};
  const q = { sequelize: { transaction: fn => fn(transaction) }, createTable: async (name, schema, opts) => { assert.equal(opts.transaction, transaction); tables.push(name); assert.equal(schema.user_id.references.model, 'users'); if (schema.cow_id) assert.equal(schema.cow_id.onDelete, 'CASCADE'); }, addIndex: async (table, cols) => indexes.push([table, cols]), dropTable: async (name, opts) => { assert.equal(opts.transaction, transaction); drops.push(name); } };
  const S = { INTEGER: 'integer', STRING: n => 'varchar' + n, JSONB: 'jsonb', DATE: 'date', DATEONLY: 'dateonly' };
  await migration.up(q, S); await migration.down(q);
  assert.deepEqual(tables, ['milk_feeding_routines', 'milk_advice', 'milk_advice_usage']); assert.deepEqual(drops, [...tables].reverse()); assert.equal(indexes.length, 1);
});
