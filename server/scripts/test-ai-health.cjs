// Offline regression tests. Production config, dotenv, AI, and storage are never loaded.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const contract = require('../src/utils/healthContract');
const root = path.resolve(__dirname, '..');
let checks = 0;
function check(name, fn) { fn(); checks++; console.log('PASS ' + name); }
async function test(name, fn) { await fn(); checks++; console.log('PASS ' + name); }
function load(relative, mocks, extra = {}) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, relative), 'utf8'), { module, exports: module.exports, require: name => {
    if (!(name in mocks)) throw new Error('Blocked dependency: ' + name);
    return mocks[name];
  }, Buffer, Date, setTimeout, clearTimeout, process: { env: { GEMINI_API_KEY: 'offline-fixture' } }, ...extra }, { filename: relative });
  return module.exports;
}
const fixture = { animalDetected: true, overallHealth: 'Cannot diagnose from a photo', animalType: 'Cow', whenToSeeVet: 'Contact your vet', healthScore: null, bodyConditionScore: null, urgencyCode: 'unknown', visibleSigns: ['Visible observation'], firstAid: ['Low-risk care'], preventiveCare: ['Ask your vet'], recommendations: [], potentialIssues: [] };
const photo = { buffer: Buffer.from([255, 216, 255, 0, 1, 2]), mimetype: 'image/jpeg' };
let modelText = JSON.stringify(fixture), providerError, requests = [], fallbackFailure = false, hanging = false;
const aiMocks = {
  '@google/generative-ai': { GoogleGenerativeAI: class { getGenerativeModel(config, options) { return { generateContent: async contents => { requests.push({ config, options, contents }); if (hanging) return new Promise(() => {}); if (fallbackFailure && requests.length === 1) throw Object.assign(new Error('Unavailable'), { status: 503 }); if (providerError) throw providerError; return { response: { text: () => modelText } }; } }; } } },
  '../utils/safeImageFetch': { fetchImage: async () => ({ base64: photo.buffer.toString('base64'), mimeType: photo.mimetype }) },
  '../utils/healthContract': contract
};
const ai = load('src/services/healthGeneration.js', aiMocks);

async function main() {
  check('invalid request types and species are rejected', () => {
    for (const body of [{ animalType: 'camel' }, { animalType: 'cow', symptoms: {} }, { animalType: 'cow', ageMonths: '-3' }, { animalType: 'cow', sex: 'x' }, { animalType: 'cow', symptomDurationDays: '1.5' }, { animalType: 'cow', cowId: true }]) assert.throws(() => contract.context(body), e => e.status === 400);
  });
  check('byte signatures and size limit are enforced', () => {
    assert.equal(contract.image(photo.buffer, photo.mimetype).mimeType, 'image/jpeg');
    assert.throws(() => contract.image(Buffer.from('<svg/>'), 'image/jpeg'));
    assert.throws(() => contract.image(photo.buffer, 'image/png'));
    assert.throws(() => contract.image(Buffer.alloc(contract.MAX_IMAGE_BYTES + 1), 'image/jpeg'), e => e.status === 413);
  });
  check('unspecified image rejections do not claim the photo is blurry', () => { for (const raw of [{ animalDetected: false }, { ...fixture, imageUsable: false }]) assert.throws(() => contract.analysis(raw), e => e.code === 'AI_IMAGE_NOT_ASSESSABLE'); });
  check('image rejection reasons have distinct actionable errors', () => {
    const codes = { no_animal: 'AI_NO_ANIMAL', unclear: 'AI_IMAGE_UNCLEAR', multiple_animals: 'AI_MULTIPLE_ANIMALS', species_mismatch: 'AI_SPECIES_MISMATCH', not_real_photo: 'AI_REAL_PHOTO_REQUIRED', cannot_assess: 'AI_IMAGE_NOT_ASSESSABLE' };
    for (const [rejectionReason, code] of Object.entries(codes)) assert.throws(() => contract.analysis({ animalDetected: rejectionReason !== 'no_animal', imageUsable: false, rejectionReason }), error => error.status === 422 && error.code === code);
    assert.throws(() => contract.analysis({ ...fixture, imageUsable: true, rejectionReason: 'species_mismatch' }), error => error.code === 'AI_INVALID_RESPONSE');
    assert.throws(() => contract.analysis({ ...fixture, imageUsable: false, rejectionReason: 'invented_reason' }), error => error.code === 'AI_INVALID_RESPONSE');
  });
  check('a visible animal can have limited observations without invented scores', () => {
    const result = contract.analysis({ ...fixture, imageUsable: true, rejectionReason: 'none', assessmentLimitations: ['Health cannot be determined from this view.'] });
    assert.equal(result.animalDetected, true); assert.equal(result.healthScore, null); assert.equal(result.bodyConditionScore, null); assert.equal(result.assessmentLimitations.length, 1);
    assert.throws(() => contract.analysis({ ...fixture, assessmentLimitations: 'wrong type' }), error => error.code === 'AI_INVALID_RESPONSE');
  });
  check('malformed schema cannot become a successful report', () => { for (const extra of [{ healthScore: 999 }, { bodyConditionScore: 6 }, { visibleSigns: 'string' }, { recommendations: [{}] }, { potentialIssues: [{}] }, { overallHealth: {} }]) assert.throws(() => contract.analysis({ ...fixture, ...extra }), e => e.code === 'AI_INVALID_RESPONSE'); });
  check('unknown scores stay unknown; reproductive guesses discarded', () => { const value = contract.analysis({ ...fixture, breedingReadiness: { daysUntilMatingReady: 30 } }); assert.equal(value.healthScore, null); assert.equal(value.bodyConditionScore, null); assert.equal(value.breedingReadiness, undefined); });
  check('all emergency labels are normalized consistently', () => { for (const label of ['Emergency', 'आणीबाणी', 'आपातकाल', 'critical']) assert.equal(contract.analysis({ ...fixture, urgencyLevel: label }).urgencyCode, 'emergency'); assert.equal(contract.analysis(fixture).urgencyCode, 'unknown'); });
  await test('language and owner context reach AI; custom question uses one call', async () => { requests = []; const result = await ai.analyzeAnimalHealth(photo, 'cow', { languageHint: 'hi', sex: 'female', ageMonths: 36, customQuestion: 'Question' }); assert.equal(result.analysis.firstAid.length, 1); assert.equal(requests.length, 1); assert.match(requests[0].contents[0], /Hindi/); assert.match(requests[0].contents[0], /"ageMonths":36/); assert.equal(requests[0].options.timeout <= 35000, true); });
  await test('photo prompt separates visibility, species and health uncertainty', async () => {
    requests = []; modelText = JSON.stringify({ ...fixture, imageUsable: true, rejectionReason: 'none', assessmentLimitations: ['Cannot assess from this view.'] });
    const result = await ai.analyzeAnimalHealth(photo, 'other');
    assert.equal(result.analysis.assessmentLimitations[0], 'Cannot assess from this view.');
    assert.match(requests[0].contents[0], /plain white, transparent or removed background is acceptable/);
    assert.match(requests[0].contents[0], /For selected type other, allow any animal species/);
    assert.equal(requests[0].config.generationConfig.responseMimeType, 'application/json');
    modelText = JSON.stringify({ animalDetected: true, imageUsable: false, rejectionReason: 'species_mismatch' });
    await assert.rejects(ai.analyzeAnimalHealth(photo, 'cow'), error => error.code === 'AI_SPECIES_MISMATCH');
    modelText = JSON.stringify(fixture);
  });
  await test('invalid JSON is an explicit retryable error', async () => { modelText = 'Not JSON'; await assert.rejects(ai.analyzeAnimalHealth(photo, 'cow'), e => e.code === 'AI_INVALID_RESPONSE' && e.status === 502); modelText = JSON.stringify(fixture); });
  await test('quota failure does not sleep or retry for minutes', async () => { requests = []; providerError = Object.assign(new Error('Please retry in 61s'), { status: 429 }); await assert.rejects(ai.analyzeAnimalHealth(photo, 'cow'), e => e.code === 'AI_RATE_LIMITED' && e.status === 429); assert.equal(requests.length, 1); providerError = null; });
  await test('provider permission, configuration and timeout errors stay distinct', async () => {
    for (const [failure, code] of [[{ status: 403 }, 'AI_CONFIGURATION_ERROR'], [{ status: 401 }, 'AI_CONFIGURATION_ERROR'], [{ status: 400 }, 'AI_REQUEST_REJECTED'], [{ status: 404 }, 'AI_MODEL_UNAVAILABLE'], [{ name: 'AbortError' }, 'AI_TIMEOUT'], [{ status: 400, message: 'API key not valid' }, 'AI_CONFIGURATION_ERROR']]) {
      providerError = Object.assign(new Error('Provider failure'), failure);
      await assert.rejects(ai.analyzeAnimalHealth(photo, 'cow'), error => error.code === code);
    }
    providerError = null;
  });
  await test('temporary failure uses at most one fallback', async () => { requests = []; fallbackFailure = true; await ai.analyzeAnimalHealth(photo, 'cow'); assert.equal(requests.length, 2); fallbackFailure = false; });
  await test('provider errors distinguish unavailable, HTTP failure and connection failure', async () => {
    for (const [failure, code, attempts] of [
      [{ status: 500 }, 'AI_PROVIDER_ERROR', 2],
      [{ status: 502 }, 'AI_PROVIDER_ERROR', 2],
      [{ status: 503 }, 'AI_TEMPORARILY_BUSY', 2],
      [{ status: 504 }, 'AI_PROVIDER_ERROR', 2],
      [{ message: 'SDK fetch failed' }, 'AI_PROVIDER_CONNECTION_ERROR', 1],
      [{ message: 'Unexpected SDK failure' }, 'AI_PROVIDER_ERROR', 1],
    ]) {
      requests = []; providerError = Object.assign(new Error('Provider failure'), failure);
      await assert.rejects(ai.analyzeAnimalHealth(photo, 'cow'), error => error.code === code);
      assert.equal(requests.length, attempts);
    }
    providerError = null;
  });
  await test('provider diagnostics contain status without leaking SDK messages or credentials', async () => {
    const logs = [];
    const logged = load('src/services/healthGeneration.js', aiMocks, { console: { warn: (...args) => logs.push(args) } });
    requests = []; providerError = Object.assign(new Error('SECRET_KEY_AND_PRIVATE_REQUEST_URL'), { status: 500 });
    await assert.rejects(logged.analyzeAnimalHealth(photo, 'cow'), error => error.code === 'AI_PROVIDER_ERROR');
    assert.equal(logs.length, 2);
    assert.equal(logs[0][1].upstreamStatus, 500); assert.equal(logs[0][1].fallback, true);
    assert.equal(logs[1][1].fallback, false);
    assert.equal(logs[0][1].model, 'gemini-2.5-flash');
    assert.equal(JSON.stringify(logs).includes('SECRET_KEY'), false);
    providerError = null;
  });
  await test('hanging provider times out', async () => { hanging = true; const fast = load('src/services/healthGeneration.js', aiMocks, { setTimeout: fn => setTimeout(fn, 1) }); await assert.rejects(fast.analyzeAnimalHealth(photo, 'cow'), e => e.code === 'AI_TIMEOUT'); hanging = false; });
  if (process.argv.includes('--database')) await databaseTests();
  console.log(`PASS ${checks} isolated AI health checks`);
}

async function databaseTests() {
  const { Sequelize, DataTypes } = require('sequelize');
  const net = require('node:net');
  const originalConnect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function (...args) {
    const options = net._normalizeArgs(args)[0];
    if (!options || options.host !== '127.0.0.1' || Number(options.port) !== 55439) throw new Error('Blocked non-isolated network connection');
    return originalConnect.apply(this, args);
  };
  const name = `health_test_${Date.now()}`;
  const options = { host: '127.0.0.1', port: 55439, dialect: 'postgres', logging: false };
  const admin = new Sequelize('postgres', 'audit_admin', '', options);
  let sequelize;
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
    sequelize = new Sequelize(name, 'audit_admin', '', options);
    await sequelize.query('CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1),(2); CREATE TABLE farmer_cows(id INTEGER PRIMARY KEY,user_id INTEGER, animal_type TEXT,cow_name TEXT,cow_tag TEXT); INSERT INTO farmer_cows VALUES(1,1,\'cow\',\'Gauri\',\'A1\'),(2,2,\'cow\',\'Other\',\'B1\')');
    const migration = require('../src/migrations/20261022000002-ai-health-reports');
    await migration.up(sequelize.getQueryInterface(), DataTypes);
    const db = { sequelize, AIHealthReport: require('../src/models/AIHealthReport')(sequelize, DataTypes), AIHealthUsage: require('../src/models/AIHealthUsage')(sequelize, DataTypes), FarmerCow: sequelize.define('FarmerCow', { id: { type: DataTypes.INTEGER, primaryKey: true }, user_id: DataTypes.INTEGER, animal_type: DataTypes.STRING, cow_name: DataTypes.STRING, cow_tag: DataTypes.STRING }, { tableName: 'farmer_cows', timestamps: false }) };
    const store = load('src/services/healthReportService.js', { '../models': db, crypto: require('crypto'), '../utils/healthContract': contract });
    let calls = 0;
    const controller = load('src/controllers/healthReportsController.js', { crypto: require('crypto'), '../models': db, '../services/healthReportService': store, '../utils/healthContract': contract, '../services/healthGeneration': { analyzeAnimalHealth: async () => { calls++; return { analysis: contract.analysis(fixture) }; }, answerHealthQuestion: async options => { calls++; assert.ok(options.reportContext.analysis); return { answer: 'Follow-up answer' }; } } });
    const call = async (action, body = {}, owner = 1, params = {}, file = undefined, query = {}) => {
      const response = { statusCode: 200, locals: {}, set() {}, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
      await controller[action]({ body, user: { id: owner }, params, file, query }, response); return response;
    };
    let id;
    await test('new photo creates private owned report without storage', async () => { const result = await call('analyze', { animalType: 'cow', cowId: '1', requestId: 'test-one', languageHint: 'mr' }, 1, {}, photo); assert.equal(result.statusCode, 200); id = result.body.report.id; assert.equal(result.body.report.context.animalName, 'Gauri'); assert.equal(result.body.imageUrl, undefined); });
    await test('request retries recover saved report without AI billing', async () => { const before = calls; const result = await call('analyze', { animalType: 'cow', requestId: 'test-one' }, 1, {}, photo); assert.equal(result.body.report.id, id); assert.equal(calls, before); });
    await test('report history is scoped to its owner', async () => { assert.equal((await call('list')).body.total, 1); assert.equal((await call('list', {}, 2)).body.total, 0); });
    await test('cross-account read, delete, follow-up and animal link denied', async () => { for (const action of ['detail', 'remove', 'ask']) assert.equal((await call(action, { prompt: 'Question' }, 2, { id })).statusCode, 404); assert.equal((await call('analyze', { animalType: 'cow', cowId: '2' }, 1, {}, photo)).statusCode, 404); });
    await test('follow-up uses saved context and persists conversation', async () => { assert.equal((await call('ask', { prompt: 'What next?', languageHint: 'hi' }, 1, { id })).statusCode, 200); assert.equal((await call('detail', {}, 1, { id })).body.data.messages.length, 1); });
    await test('invalid request does not call AI', async () => { const before = calls; assert.equal((await call('ask', { prompt: {} }, 1, { id })).statusCode, 400); assert.equal(calls, before); });
    await test('malformed report IDs are rejected before database parsing', async () => { assert.equal((await call('detail', {}, 1, { id: '-'.repeat(36) })).statusCode, 404); });
    await test('concurrent requests use a shared per-user lease', async () => { let release, ready; const started = new Promise(resolve => { ready = resolve; }); const first = store.withAllowance(1, () => { ready(); return new Promise(resolve => { release = resolve; }); }); await started; await assert.rejects(store.withAllowance(1, async () => {}), e => e.code === 'AI_IN_PROGRESS'); release(); await first; assert.equal((await db.AIHealthUsage.findByPk(1)).lease, null); });
    await test('provider failure releases allowance lease', async () => { await assert.rejects(store.withAllowance(1, async () => { throw Error('fixture failure'); })); assert.equal((await db.AIHealthUsage.findByPk(1)).lease, null); });
    await test('locked usage update returns a database-busy error instead of hanging', async () => {
      const blocker = await sequelize.transaction();
      try {
        await db.AIHealthUsage.findByPk(1, { transaction: blocker, lock: blocker.LOCK.UPDATE });
        const before = calls;
        const result = await call('ask', { prompt: 'Question' }, 1, { id });
        assert.equal(result.statusCode, 503); assert.equal(result.body.code, 'HEALTH_DATABASE_BUSY'); assert.equal(calls, before);
        assert.equal(result.locals.healthPublicError, true);
      } finally { await blocker.rollback(); }
    });
    await test('usage cleanup failure cannot discard a successful result', async () => {
      const update = db.AIHealthUsage.update;
      try { db.AIHealthUsage.update = async () => { throw Error('cleanup failed'); }; assert.equal(await store.withAllowance(1, async () => 'saved report'), 'saved report'); }
      finally { db.AIHealthUsage.update = update; await update.call(db.AIHealthUsage, { lease: null, active_until: null }, { where: { user_id: 1 } }); }
    });
    await test('daily budget is enforced and resets next day', async () => { await db.AIHealthUsage.update({ requests: 30 }, { where: { user_id: 1 } }); await assert.rejects(store.withAllowance(1, async () => {}), e => e.code === 'AI_DAILY_LIMIT'); await db.AIHealthUsage.update({ day: '2000-01-01' }, { where: { user_id: 1 } }); await store.withAllowance(1, async () => {}); assert.equal((await db.AIHealthUsage.findByPk(1)).requests, 1); });
    await test('deleting an animal preserves its historical report', async () => { await db.FarmerCow.destroy({ where: { id: 1 } }); const saved = await db.AIHealthReport.findByPk(id); assert.equal(saved.cow_id, null); assert.equal(saved.context.animalName, 'Gauri'); });
    await test('owner can delete report and questions', async () => { assert.equal((await call('remove', {}, 1, { id })).statusCode, 200); assert.equal((await call('detail', {}, 1, { id })).statusCode, 404); });
    await test('migration rolls back cleanly', async () => { await migration.down(sequelize.getQueryInterface()); });
  } finally {
    if (sequelize) await sequelize.close();
    await admin.query(`DROP DATABASE IF EXISTS "${name}"`); await admin.close(); net.Socket.prototype.connect = originalConnect;
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
