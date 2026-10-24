'use strict';
const router = require('express').Router();
const db = require('../models');
const { allowsSpecies } = require('../utils/animalGroup');
router.use(require('../middlewares/authMiddleware'));
const handle = fn => async (req, res, next) => { try { await fn(req, res); } catch (error) { next(error); } };
router.get('/', handle(async (req, res) => {
  // Dairy animals added from the existing milk workflow remain reusable here.
  if (req.animalGroup === 'farm') {
    const cows = await db.FarmerCow.findAll({ where: { user_id: req.user.id }, limit: 500 });
    for (const cow of cows) {
      const values = { species: cow.animal_type, name: cow.cow_name, tag: cow.cow_tag, breed: cow.breed_name };
      const [profile, created] = await db.AnimalProfile.findOrCreate({ where: { farmer_cow_id: cow.id }, defaults: { ...values, user_id: req.user.id, animal_group: 'farm' } });
      if (!created && Object.entries(values).some(([key, value]) => (profile[key] ?? null) !== (value ?? null))) await profile.update(values);
    }
  }
  const data = await db.AnimalProfile.findAll({ where: { user_id: req.user.id, archived: false }, order: [['name', 'ASC']], limit: 500 });
  res.json({ success: true, data });
}));
const save = handle(async (req, res) => {
  const { name, species, tag, breed } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.length > 100 || !allowsSpecies(req.animalGroup, species)
    || [tag, breed].some(value => value != null && (typeof value !== 'string' || value.length > 100))) {
    return res.status(400).json({ success: false, message: 'Enter an animal name and a species from this experience (maximum 100 characters per field).' });
  }
  let record;
  await db.sequelize.transaction(async transaction => {
    const values = { name: name.trim(), species, tag: tag?.trim() || null, breed: breed?.trim() || null, animal_group: req.animalGroup };
    if (req.params.id) {
      record = await db.AnimalProfile.findOne({ where: { id: req.params.id, user_id: req.user.id, archived: false }, transaction, lock: transaction.LOCK.UPDATE });
      if (!record) return;
      if (record.farmer_cow_id && species !== record.species) throw Object.assign(new Error('Species cannot change after linking milk records.'), { status: 400 });
      await record.update(values, { transaction });
    } else record = await db.AnimalProfile.create({ ...values, user_id: req.user.id }, { transaction });
    if (['cow', 'buffalo'].includes(species)) {
      const cowValues = { user_id: req.user.id, animal_type: species, cow_name: values.name, cow_tag: values.tag, breed_name: values.breed };
      if (record.farmer_cow_id) await db.FarmerCow.update(cowValues, { where: { id: record.farmer_cow_id, user_id: req.user.id }, transaction });
      else {
        const cow = await db.FarmerCow.create(cowValues, { transaction });
        await record.update({ farmer_cow_id: cow.id }, { transaction });
      }
    }
  });
  if (!record) return res.status(404).json({ success: false, message: 'Animal not found.' });
  res.json({ success: true, data: record });
});
router.post('/', save);
router.put('/:id', save);
router.delete('/:id', handle(async (req, res) => {
  const [count] = await db.AnimalProfile.update({ archived: true }, { where: { id: req.params.id, user_id: req.user.id, archived: false } });
  res.status(count ? 200 : 404).json({ success: !!count });
}));
module.exports = router;
