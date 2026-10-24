// Isolated tests: no dotenv, configured database, AI, storage or push connections.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Sequelize, DataTypes, Op } = require('sequelize');
const { middleware, install, storage, currentGroup, scopeListingSql } = require('../src/services/animalGroupScope');
const { groupForSpecies, allowsSpecies } = require('../src/utils/animalGroup');
const contract = require('../src/utils/healthContract');

function fixture() {
  const names = ['AnimalListing', 'DogListing', 'OtherAnimalListing', 'PregnancyRecord', 'AIHealthReport', 'AnimalProfile', 'FarmerCow', 'Blog', 'Veterinarian', 'Wishlist'];
  const db = { Sequelize: { Op } };
  for (const name of names) {
    const hooks = {};
    db[name] = { hooks, addHook(event, key, fn) { (hooks[event] ||= []).push(fn); } };
  }
  install(db);
  const invoke = (name, event, options) => { for (const fn of db[name].hooks[event] || []) fn(options); return options; };
  return { db, invoke };
}

test('taxonomy distinguishes known species; ambiguous others require explicit group', () => {
  assert.equal(groupForSpecies('dog'), 'pet'); assert.equal(groupForSpecies('sheep'), 'farm');
  assert.equal(groupForSpecies('rabbit'), null); assert.equal(groupForSpecies('other'), null);
  assert.equal(allowsSpecies('pet', 'cow'), false); assert.equal(allowsSpecies('farm', 'other'), true);
});
test('concurrent requests retain their own group across awaits', async () => {
  await Promise.all(['farm', 'pet'].map(group => storage.run({ group }, async () => {
    await new Promise(resolve => setTimeout(resolve, group === 'farm' ? 12 : 1));
    assert.equal(currentGroup(), group);
  })));
  assert.equal(currentGroup(), undefined);
});
test('scopes combine with ownership for reads, totals, updates and deletes', () => {
  const { invoke } = fixture();
  storage.run({ group: 'pet' }, () => {
    for (const event of ['beforeFind', 'beforeCount', 'beforeBulkUpdate', 'beforeBulkDestroy']) {
      const result = invoke('PregnancyRecord', event, { where: { user_id: 17, id: 4 } });
      assert.deepEqual(result.where[Op.and], [{ user_id: 17, id: 4 }, { animal_group: 'pet' }]);
    }
    assert.deepEqual(invoke('FarmerCow', 'beforeFind', {}).where[Op.and][1], { id: null });
    assert.equal(invoke('DogListing', 'beforeFind', {}).where, undefined);
  });
});
test('background jobs and shared account operations stay unscoped', () => {
  const { invoke } = fixture();
  assert.deepEqual(invoke('PregnancyRecord', 'beforeFind', { where: { user_id: 17 } }).where, { user_id: 17 });
});
test('content supports both groups, vets declare groups, wishlist scopes other listings', () => {
  const { invoke } = fixture();
  storage.run({ group: 'pet' }, () => {
    assert.deepEqual(invoke('Blog', 'beforeFind', {}).where[Op.and][1].audience[Op.in], ['pet', 'both']);
    assert.deepEqual(invoke('Veterinarian', 'beforeFind', {}).where[Op.and][1].animal_groups[Op.contains], ['pet']);
    const wishlist = invoke('Wishlist', 'beforeFind', {}).where[Op.and][1];
    assert.deepEqual(wishlist[Op.or][1], { animal_type: 'other', animal_group: 'pet' });
  });
});
test('writes reject cross-group animals and derive group for new other records', () => {
  const { invoke } = fixture();
  storage.run({ group: 'pet' }, () => {
    assert.throws(() => invoke('AnimalListing', 'beforeValidate', {}), /Switch/);
    assert.throws(() => invoke('PregnancyRecord', 'beforeValidate', { animal_type: 'cow' }), /does not belong/);
    const row = { isNewRecord: true, animalType: 'rabbit' };
    invoke('OtherAnimalListing', 'beforeValidate', row); assert.equal(row.animal_group, 'pet');
  });
});
test('health contract rejects mismatch before any provider call', () => {
  storage.run({ group: 'pet' }, () => {
    assert.throws(() => contract.context({ animalType: 'cow' }), /current experience/);
    assert.equal(contract.context({ animalType: 'dog' }).animalGroup, 'pet');
  });
});
test('raw listing filtering occurs inside every union branch before pagination', () => {
  const sql = `SELECT * FROM (SELECT * FROM animal_listings WHERE status = $1 UNION ALL SELECT * FROM dog_listings WHERE status = $1 UNION ALL SELECT * FROM other_animal_listings WHERE status = $1) listings ORDER BY created_at LIMIT $2`;
  const pet = scopeListingSql(sql, 'pet');
  assert.match(pet, /animal_listings WHERE FALSE AND status/);
  assert.match(pet, /dog_listings WHERE TRUE AND status/);
  assert.match(pet, /other_animal_listings WHERE animal_group = 'pet' AND/);
  assert.ok(pet.endsWith('LIMIT $2'));
  assert.equal(scopeListingSql(sql, "pet' OR TRUE"), sql);
});
test('middleware validates group and limits exclusive features without filtering accounts', () => {
  let status, body, ran = false;
  const res = { status(value) { status = value; return this; }, json(value) { body = value; return this; } };
  const req = (path, group) => ({ path, method: 'GET', query: {}, get: () => group });
  middleware(req('/milk-reports', 'pet'), res, () => { ran = true; });
  assert.equal(status, 409); assert.equal(body.animal_group, 'farm'); assert.equal(ran, false);
  middleware(req('/listings', 'invalid'), res, () => {}); assert.equal(status, 400);
  middleware(req('/auth/profile', 'pet'), res, () => assert.equal(currentGroup(), undefined));
  middleware(req('/blogs/admin/all', 'pet'), res, () => assert.equal(currentGroup(), undefined));
  middleware(req('/listings', 'pet'), res, () => assert.equal(currentGroup(), 'pet'));
});
test('model definitions and new registry validation work without a database connection', async () => {
  const sequelize = new Sequelize('isolated', 'isolated', 'isolated', { dialect: 'postgres', logging: false });
  const registry = require('../src/models/AnimalProfile')(sequelize, DataTypes);
  await registry.build({ user_id: 1, animal_group: 'pet', species: 'dog', name: 'Moti' }).validate();
  await assert.rejects(registry.build({ user_id: 1, animal_group: 'invalid', species: 'dog', name: 'Moti' }).validate());
  assert.equal(registry.rawAttributes.archived.defaultValue, false);
  await sequelize.close();
});
test('migration is additive, transactional and preserves ambiguous historical records', async () => {
  const operations = [], transaction = {};
  const q = { sequelize: { transaction: fn => fn(transaction), query: async (sql, options) => { assert.equal(options.transaction, transaction); operations.push(sql); } } };
  for (const name of ['addColumn', 'addIndex', 'createTable']) q[name] = async (...args) => { assert.equal(args.at(-1).transaction, transaction); operations.push(name + ':' + args[0]); };
  await require('../src/migrations/20261023000000-animal-experiences').up(q, DataTypes);
  assert.ok(operations.some(sql => sql.includes('ELSE NULL END')));
  assert.ok(operations.some(sql => sql.startsWith('INSERT INTO animal_profiles')));
  assert.ok(!operations.some(sql => /DELETE FROM|DROP TABLE/i.test(sql)));
});
test('web and native experience translations remain identical', () => {
  for (const file of ['animalExperienceText.json', 'experienceAssistant.json']) assert.equal(fs.readFileSync('../frontend/src/utils/' + file, 'utf8'), fs.readFileSync('../mobile/src/utils/' + file, 'utf8'));
});

test('migration string defaults fit their columns and blog audiences match the model', async () => {
  const columns = new Map();
  const check = (table, name, definition) => {
    columns.set(`${table}.${name}`, definition);
    if (definition.type.key === 'STRING' && typeof definition.defaultValue === 'string') {
      assert.ok(definition.defaultValue.length <= definition.type.options.length,
        `${table}.${name}: default exceeds VARCHAR length`);
    }
  };
  const q = {
    sequelize: { transaction: fn => fn({}), query: async () => {} },
    addColumn: async (table, name, definition) => check(table, name, definition),
    addIndex: async () => {},
    createTable: async (table, definitions) => {
      for (const [name, definition] of Object.entries(definitions)) check(table, name, definition);
    }
  };
  await require('../src/migrations/20261023000000-animal-experiences').up(q, DataTypes);
  const sequelize = new Sequelize('isolated', 'isolated', 'isolated', { dialect: 'postgres', logging: false });
  try {
    const audience = require('../src/models/Blog')(sequelize).rawAttributes.audience;
    const migrated = columns.get('blogs.audience');
    assert.equal(migrated.type.options.length, audience.type.options.length);
    assert.equal(migrated.defaultValue, audience.defaultValue);
    for (const value of audience.validate.isIn[0]) {
      assert.ok(value.length <= migrated.type.options.length, `${value} exceeds audience column length`);
    }
  } finally {
    await sequelize.close();
  }
});

test('vets explicitly choose groups; malformed or empty selections fail before controller',()=>{
 const validate=require('../src/middlewares/validateAnimalGroups');let status,called=false;
 const res={status(value){status=value;return this;},json(){}};
 validate({path:'/register',body:{animal_groups:''}},res,()=>{called=true;});assert.equal(status,400);assert.equal(called,false);
 const req={path:'/register',body:{animal_groups:'["farm","pet"]'}};validate(req,res,()=>{called=true;});assert.equal(called,true);assert.deepEqual(req.body.animal_groups,['farm','pet']);
});

test('shared animal links enforce owner and species before any write',async()=>{
 const {db}=fixture();db.AnimalProfile.findOne=async({where})=>where.user_id===1?{species:'dog'}:null;
 const validate=async row=>{for(const hook of db.PregnancyRecord.hooks.beforeValidate)await hook(row);};
 await storage.run({group:'pet'},async()=>{
  await validate({isNewRecord:true,user_id:1,animal_type:'dog',animal_profile_id:8});
  await assert.rejects(validate({isNewRecord:true,user_id:2,animal_type:'dog',animal_profile_id:8}),/saved animals/);
  await assert.rejects(validate({isNewRecord:true,user_id:1,animal_type:'cat',animal_profile_id:8}),/same species/);
 });
});
