'use strict';
// Isolated controller tests: no database, credentials, storage, or push services.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { test } = require('node:test');
const validation = require('../src/utils/petMatingValidation');
const valid = { pet_type: 'dog', pet_name: 'Bruno', breed: 'Labrador', gender: 'male', owner_phone: '+91 99999 99999', fee_type: 'negotiable' };
const Op = Object.fromEntries(['in', 'ne', 'and', 'or', 'gte', 'iLike'].map(key => [key, Symbol(key)]));

function harness(options = {}) {
  const calls = [], state = { profile: null, previousReport: null, ...options };
  const profile = {
    ...valid, id: 10, user_id: 2, status: 'active', photos: ['old.jpg'], photo_public_ids: ['old-photo'], video_public_id: 'old-video', video_url: 'old.mp4',
    toJSON() { return { ...this, owner: { id: 2, full_name: 'Owner' } }; },
    async update(payload) { calls.push(['update', payload]); if (state.updateFails) throw Error('fixture database failure'); Object.assign(this, payload); return this; },
    async increment(field, options) { calls.push(['increment', field, options]); },
    async reload() { return this; }
  };
  state.profile = options.profile === null ? null : Object.assign(profile, options.profile);
  const db = {
    User: {},
    PetMatingProfile: {
      async findOne(query) { calls.push(['findOne', query]); return state.profile; },
      async findByPk(id, query) { calls.push(['findByPk', query]); return state.profile; },
      async findAndCountAll(query) { calls.push(['list', query]); return { count: 30, rows: [] }; },
      async findAll(query) { calls.push(['mine', query]); return []; },
      async create(payload) { calls.push(['create', payload]); return payload; }
    },
    PetMatingReport: {
      async findOne(query) { calls.push(['reportQuery', query]); return state.previousReport; },
      async create(payload) { calls.push(['report', payload]); return payload; }
    },
    sequelize: { async transaction(callback) { return callback({ LOCK: { UPDATE: 'UPDATE' } }); } }
  };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/controllers/petMatingController.js'), 'utf8'), {
    module, exports: module.exports, console: { error() {} }, Date,
    require(name) {
      if (name === 'sequelize') return { Op };
      if (name === '../models') return db;
      if (name === '../utils/petMatingValidation') return validation;
      if (name === '../config/cloudinary') return {
        async uploadToCloudinary(file) { calls.push(['upload']); if (state.uploadFails) throw Error('fixture upload failure'); return { secure_url: 'new.jpg', public_id: 'new-photo' }; },
        async deleteFromCloudinary(id) { calls.push(['deleteMedia', id]); }
      };
      throw Error(`Unexpected dependency ${name}`);
    }
  });
  return { calls, state, async run(method, overrides = {}) {
    const req = { query: {}, params: { id: '10' }, user: { id: 2 }, body: {}, files: {}, ...overrides };
    const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await module.exports[method](req, res); return res;
  } };
}

test('valid input normalizes phone; rejects invalid enums, numbers, dates, and fee', () => {
  assert.equal(validation.validateProfile(valid), '+919999999999');
  const cases = [
    { age_months: -1 }, { age_months: 1.5 }, { weight_kg: -2 }, { fee_type: 'paid', fee_amount: 0 },
    { owner_phone: 'abc' }, { pet_type: 'cow' }, { gender: 'invalid' }, { vaccination_status: 'yes' },
    { available_from: '2026-02-30' }, { available_from: '2099-12-02', available_to: '2099-12-01' },
    { last_vaccination_date: '2999-01-01' }, { available_to: '2000-01-01' }, { pet_name: { invalid: true } }
  ];
  for (const body of cases) assert.throws(() => validation.validateProfile({ ...valid, ...body }), error => error.status === 400);
  assert.throws(() => validation.pagination({ page: 'NaN' }));
  assert.deepEqual(validation.pagination({ page: '2', limit: '12' }), { page: 2, limit: 12, offset: 12 });
});

test('public queries exclude private contact and storage fields and expire availability', async () => {
  const h = harness(); const res = await h.run('getProfiles', { query: { page: '2', limit: '12', search: 'Pune' } });
  assert.equal(res.code, 200); assert.equal(res.body.data.totalPages, 3);
  const query = h.calls.find(c => c[0] === 'list')[1];
  assert.equal(query.offset, 12); assert.ok(query.attributes.exclude.includes('owner_phone'));
  assert.ok(query.attributes.exclude.includes('photo_public_ids'));
  assert.ok(!query.include[0].attributes.includes('phone_number'));
  assert.equal(query.where.user_id[Op.ne], 2); assert.ok(query.where[Op.and]);
  const detail = await h.run('getProfileById'); assert.equal(detail.body.data.profile.owner_phone, undefined);
  await h.run('getMyProfiles'); assert.equal(h.calls.find(c => c[0] === 'mine')[1].where.status[Op.ne], 'removed');
});

test('invalid create fails before uploading or writing', async () => {
  const h = harness(); const res = await h.run('createProfile', { body: { ...valid, age_months: -5 }, files: { photos: [{}] } });
  assert.equal(res.code, 400); assert.ok(res.body.fields.age_months); assert.equal(h.calls.length, 0);
});

test('replacement persists before deleting old media; upload/save failure preserves old media', async () => {
  for (const options of [{}, { uploadFails: true }, { updateFails: true }]) {
    const h = harness(options); const res = await h.run('updateProfile', { body: { ...valid }, files: { photos: [{}] } });
    if (options.uploadFails || options.updateFails) {
      assert.equal(res.code, 500); assert.ok(!h.calls.some(c => c[0] === 'deleteMedia'));
    } else {
      assert.equal(res.code, 200); assert.ok(h.calls.findIndex(c => c[0] === 'update') < h.calls.findIndex(c => c[0] === 'deleteMedia'));
      assert.ok(h.calls.some(c => c[0] === 'deleteMedia' && c[1] === 'old-photo'));
    }
  }
});

test('editing without new photos preserves photos and clears optional values', async () => {
  const h = harness(); const res = await h.run('updateProfile', { body: { age_months: '', city: '', remove_video: 'true' } });
  assert.equal(res.code, 200); assert.equal(h.state.profile.photos[0], 'old.jpg');
  assert.equal(h.state.profile.age_months, null); assert.equal(h.state.profile.city, null); assert.equal(h.state.profile.video_url, null);
});

test('status actions reject moderated profiles and expired reactivation', async () => {
  for (const status of ['pending', 'rejected', 'removed']) {
    const h = harness({ profile: { status } });
    assert.equal((await h.run('updateStatus', { body: { status: 'active' } })).code, 409);
    assert.equal((await h.run('updateProfile', { body: valid })).code, 409);
  }
  const expired = harness({ profile: { status: 'paused', available_to: '2000-01-01' } });
  assert.equal((await expired.run('updateStatus', { body: { status: 'active' } })).code, 400);
  const h = harness(); assert.equal((await h.run('updateStatus', { body: { status: 'paused' } })).code, 200);
  assert.equal(h.state.profile.status, 'paused');
});

test('contact endpoint prevents self contact and returns phone only after explicit contact', async () => {
  const h = harness(); assert.equal((await h.run('trackContact')).code, 400);
  const res = await h.run('trackContact', { user: { id: 3 } }); assert.equal(res.code, 200);
  assert.equal(res.body.data.owner_phone, valid.owner_phone);
  assert.ok(h.calls.some(c => c[0] === 'increment' && c[1] === 'contact_count'));
});

test('reports require details, reject self/duplicate reports and lock the profile', async () => {
  const h = harness(); const body = { reason: 'spam', description: 'Repeated promotional content' };
  assert.equal((await h.run('reportProfile', { body })).code, 400);
  assert.equal((await h.run('reportProfile', { user: { id: 3 }, body: { ...body, description: '' } })).code, 400);
  assert.equal((await h.run('reportProfile', { user: { id: 3 }, body })).code, 201);
  assert.equal(h.calls.find(c => c[0] === 'findByPk')[1].lock, 'UPDATE');
  h.state.previousReport = { id: 1 };
  assert.equal((await h.run('reportProfile', { user: { id: 3 }, body })).code, 409);
  assert.equal(h.calls.filter(c => c[0] === 'report').length, 1);
});
