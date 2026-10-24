'use strict';
const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const db = require('../models');
const { validGroup } = require('../utils/animalGroup');
router.use(auth);
// Resolve shared links without returning an animal's private records.
router.get('/listing-group/:id', async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ success: false });
  try {
    const listing = await db.OtherAnimalListing.findOne({ where: { id: req.params.id, status: ['active', 'sold'] }, attributes: ['animal_group'] });
    if (!listing?.animal_group) return res.status(404).json({ success: false });
    res.json({ success: true, animal_group: listing.animal_group });
  } catch (error) { next(error); }
});
const reviewModels = { pregnancy: 'PregnancyRecord', listing: 'OtherAnimalListing', health: 'AIHealthReport' };
router.get('/unassigned', async (req, res, next) => {
  try {
    const groups = await Promise.all(Object.entries(reviewModels).map(async ([kind, model]) => {
      const rows = await db[model].findAll({ where: { user_id: req.user.id, animal_group: null }, limit: 100, order: [['id', 'ASC']] });
      return rows.map(row => ({ kind, id: row.id, name: row.animal_name || row.breedName || row.context?.animalName || row.context?.animalType || 'Other', species: row.animal_type || row.animalType || row.context?.animalType }));
    }));
    res.json({ success: true, data: groups.flat() });
  } catch (error) { next(error); }
});
router.put('/unassigned/:kind/:id', async (req, res, next) => {
  const model = reviewModels[req.params.kind];
  if (!model || !validGroup(req.body.animal_group)) return res.status(400).json({ success: false, message: 'Choose an animal group.' });
  try {
    const [count] = await db[model].update({ animal_group: req.body.animal_group }, { where: { id: req.params.id, user_id: req.user.id, animal_group: null } });
    if (!count) return res.status(404).json({ success: false, message: 'Record not found or already classified.' });
    if (req.params.kind === 'listing') await db.Wishlist.update({ animal_group: req.body.animal_group }, { where: { animal_type: 'other', animal_id: req.params.id, animal_group: null } });
    res.json({ success: true });
  } catch (error) { next(error); }
});
router.get('/', async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.user.id);
    res.json({ success: true, animal_group: user.metadata?.animal_group || null });
  } catch (error) { next(error); }
});
router.put('/', async (req, res, next) => {
  if (!validGroup(req.body.animal_group)) return res.status(400).json({ success: false, message: 'Choose Farm Animals or Pet Animals.' });
  try {
    await db.sequelize.transaction(async transaction => {
      const user = await db.User.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
      await user.update({ metadata: { ...(user.metadata || {}), animal_group: req.body.animal_group } }, { transaction });
    });
    res.json({ success: true, animal_group: req.body.animal_group });
  } catch (error) { next(error); }
});
module.exports = router;
