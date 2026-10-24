'use strict';

// Request-local scope: concurrent farm and pet requests cannot change one another.
// Ownership remains enforced by each controller; an experience is not a role.
const { AsyncLocalStorage } = require('node:async_hooks');
const { FARM, PET, validGroup, groupForSpecies } = require('../utils/animalGroup');
const storage = new AsyncLocalStorage();
const currentGroup = () => storage.getStore()?.group;
const fixed = { AnimalListing: 'farm', BuffaloListing: 'farm', GoatListing: 'farm', HorseListing: 'farm', DogListing: 'pet', CatListing: 'pet', FarmerCow: 'farm', MilkReport: 'farm', PetMatingProfile: 'pet', GovernmentScheme: 'farm' };

function middleware(req, res, next) {
  const path = req.path;
  const group = req.get('X-Animal-Group') || req.query.animal_group || 'farm';
  if (!validGroup(group)) return res.status(400).json({ success: false, code: 'INVALID_ANIMAL_GROUP', message: 'Choose Farm Animals or Pet Animals.' });
  req.animalGroup = group;
  // Account operations, administration, veterinary accounts and background jobs are shared.
  const scoped = /^\/(listings|animals|buffalos|horses|goats|cats|dogs|other-animals|pregnancy|health-check|milk-reports|pet-mating|wishlist|my-animals|blogs|government-schemes)(\/|$)/.test(path)
    || (path.startsWith('/veterinarians') && req.method === 'GET' && !/\/(profile|dashboard|stats)/.test(path));
  const admin = /\/admin(\/|$)/.test(path) || (path.startsWith('/blogs') && req.method !== 'GET');
  if (!scoped || admin) return next();
  const routeGroup = { animals: 'farm', buffalos: 'farm', horses: 'farm', goats: 'farm', cats: 'pet', dogs: 'pet' }[path.split('/')[1]];
  const healthSpecies = path.match(/^\/health-check\/(?:common-issues|vaccination|deworming)\/([^/]+)/)?.[1];
  const requiredGroup = routeGroup || groupForSpecies(healthSpecies);
  if (requiredGroup && requiredGroup !== group) return res.status(409).json({ success: false, code: 'ANIMAL_GROUP_REQUIRED', animal_group: requiredGroup, message: 'Switch animal experience to view this animal type.' });
  const featureGroup = /^\/(milk-reports|government-schemes)(\/|$)/.test(path) ? 'farm' : /^\/pet-mating(\/|$)/.test(path) ? 'pet' : null;
  if (featureGroup && featureGroup !== group) return res.status(409).json({ success: false, code: 'ANIMAL_GROUP_REQUIRED', animal_group: featureGroup, message: `Switch to ${featureGroup === 'farm' ? 'Farm Animals' : 'Pet Animals'} to use this feature.` });
  return storage.run({ group, path }, next);
}

function install(db) {
  const { Op } = db.Sequelize;
  const predicate = name => {
    const group = currentGroup();
    if (!group) return null;
    if (fixed[name]) return fixed[name] === group ? null : { id: null };
    if (['PregnancyRecord', 'OtherAnimalListing', 'AnimalProfile', 'AIHealthReport'].includes(name)) return { animal_group: group };
    if (name === 'Wishlist') return { [Op.or]: [{ animal_type: { [Op.in]: group === 'farm' ? FARM : PET } }, { animal_type: 'other', animal_group: group }] };
    if (name === 'Blog') return { audience: { [Op.in]: [group, 'both'] } };
    if (name === 'Veterinarian') return { animal_groups: { [Op.contains]: [group] } };
    return null;
  };
  for (const [name, model] of Object.entries(db)) {
    if (!model.addHook) continue;
    if (fixed[name]) model.addHook('beforeValidate', 'animalExperienceWrite', () => {
      if (currentGroup() && currentGroup() !== fixed[name]) throw Object.assign(new Error('Switch animal experience before saving this record.'), { status: 400 });
    });
    const scope = options => {
      const where = predicate(name);
      if (where) options.where = { [Op.and]: [options.where || {}, where] };
    };
    model.addHook('beforeFind', 'animalExperience', scope);
    model.addHook('beforeCount', 'animalExperience', scope);
    model.addHook('beforeBulkUpdate', 'animalExperience', scope);
    model.addHook('beforeBulkDestroy', 'animalExperience', scope);
    if (['PregnancyRecord', 'AIHealthReport', 'PetMatingProfile'].includes(name)) {
      model.addHook('beforeValidate', 'ownedAnimalProfile', async (record, options) => {
        if (!record.animal_profile_id || (!record.isNewRecord && !['animal_profile_id', 'animal_type', 'pet_type', 'context'].some(field => record.changed(field)))) return;
        const animal = await db.AnimalProfile.findOne({ where: { id: record.animal_profile_id, user_id: record.user_id, archived: false }, transaction: options?.transaction });
        const species = record.animal_type || record.pet_type || record.context?.animalType;
        if (!animal || animal.species !== species) throw Object.assign(new Error('Choose one of your saved animals with the same species.'), { status: 400 });
      });
    }
    if (['PregnancyRecord', 'OtherAnimalListing', 'AnimalProfile', 'AIHealthReport', 'Wishlist'].includes(name)) {
      model.addHook('beforeValidate', 'animalExperience', record => {
        const group = currentGroup();
        const species = record.context?.animalType || record.animalType || record.animal_type || record.species;
        const known = groupForSpecies(species);
        if (group && known && known !== group) throw Object.assign(new Error('Animal does not belong to the selected experience.'), { status: 400 });
        if (record.isNewRecord || group) record.animal_group = known || group || record.animal_group;
      });
    }
  }
}

// Raw marketplace UNION queries need the same predicate before ORDER/LIMIT.
// Table names and group values below come exclusively from fixed allowlists.
function scopeListingSql(sql, group = currentGroup()) {
  if (!validGroup(group)) return sql;
  const tables = { animal_listings: 'farm', buffalo_listings: 'farm', horse_listings: 'farm', goat_listings: 'farm', cat_listings: 'pet', dog_listings: 'pet', other_animal_listings: null };
  sql = sql.replace(/'(cow|buffalo|horse|goat|cat|dog|other)'\s+as animal_type,/gi, (match, type) => `${match} ${type === 'other' ? 'animal_type' : `'${type}'`} AS species,`);
  return sql.replace(/FROM\s+(animal_listings|buffalo_listings|horse_listings|goat_listings|cat_listings|dog_listings|other_animal_listings)\s+WHERE\s+/gi, (match, table) => `${match}${tables[table] ? (tables[table] === group ? 'TRUE' : 'FALSE') : `animal_group = '${group}'`} AND `);
}
module.exports = { middleware, install, currentGroup, scopeListingSql, storage };
