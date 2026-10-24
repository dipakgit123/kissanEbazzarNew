const { Op } = require('sequelize');
const { randomUUID } = require('crypto');
const { enqueue } = require('./notificationQueue');
const listingTypes = { AnimalListing: 'cow', BuffaloListing: 'buffalo', GoatListing: 'goat', HorseListing: 'horse', CatListing: 'cat', DogListing: 'dog', OtherAnimalListing: 'other' };
const fields = ['id', 'user_id', 'status', 'expectedPrice', 'verification_status', 'receiverId', 'callerId', 'listingId', 'listingType', 'veterinarian_id', 'lead_type'];
const snapshot = row => Object.fromEntries(fields.map(key => [key, row.get ? row.get(key) : row[key]]));
const relevant = (model, before, after) => {
  if (listingTypes[model]) return !before || before.status !== after.status || Number(before.expectedPrice) > Number(after.expectedPrice);
  if (['Blog', 'GovernmentScheme'].includes(model)) return after.status === 'published' && before?.status !== 'published';
  if (model === 'AIHealthReport' || model === 'CallLog' || model === 'VetLeadLog') return !before;
  if (model === 'Veterinarian') return before && before.verification_status !== after.verification_status;
  return model === 'PetMatingProfile' && before && before.status !== after.status;
};
const install = db => {
  for (const name of [...Object.keys(listingTypes), 'Blog', 'GovernmentScheme', 'AIHealthReport', 'CallLog', 'VetLeadLog', 'Veterinarian', 'PetMatingProfile']) {
    const Model = db[name];
    if (!Model) continue;
    const saveEvent = async (row, before, options) => {
      const after = snapshot(row);
      if (!relevant(name, before, after)) return;
      await enqueue(db, 'event', `event:${randomUUID()}`, { model: name, id: row.id, before, after, cursor: 0 }, { transaction: options.transaction });
    };
    Model.addHook('afterCreate', 'notificationCreate', (row, options) => saveEvent(row, null, options));
    Model.addHook('afterUpdate', 'notificationUpdate', (row, options) => saveEvent(row, snapshot({ ...row._previousDataValues }), options));
    // Static Model.update does not run per-instance hooks by default.
    Model.addHook('beforeBulkUpdate', 'notificationBeforeBulk', async options => {
      if (options.individualHooks || !['status', 'expectedPrice', 'verification_status'].some(key => key in options.attributes)) return;
      options.notificationBefore = (await Model.findAll({ where: options.where, transaction: options.transaction })).map(snapshot);
    });
    Model.addHook('afterBulkUpdate', 'notificationAfterBulk', async options => {
      for (const before of options.notificationBefore || []) {
        const row = await Model.findByPk(before.id, { transaction: options.transaction });
        if (row) await saveEvent(row, before, options);
      }
    });
  }
};
const processEvent = async (db, job) => {
  const { model, id, before, after, cursor = 0 } = job.payload;
  const row = await db[model].findByPk(id);
  if (!row) return { status: 'suppressed' };
  const service = require('./notificationService');
  const send = (recipientId, type, data = {}, recipientType = 'user') => service.deliverNotification({ db, recipientId, recipientType, type, title: type, body: type,
    data: { ...data, dedupe_key: `event:${job.id}:${recipientType}:${recipientId}` } });
  let recipients = [], type, data = {}, nextCursor;
  if (listingTypes[model]) {
    const animalType = listingTypes[model];
    data = { listing_id: row.id, animal_type: animalType, animal_group: row.animal_group || require('../utils/animalGroup').groupForSpecies(animalType) };
    if (!before && row.status === 'active') {
      type = 'new_listing';
      recipients = await require('./nearbyUserService').findNearbyUsers(row.latitude, row.longitude, 50, { afterId: cursor, limit: 100, excludeId: row.user_id });
    } else if ((after.status === 'sold' && before?.status !== 'sold' && row.status === 'sold') || (row.status === 'active' && Number(before?.expectedPrice) > Number(after.expectedPrice) && Number(row.expectedPrice) <= Number(after.expectedPrice))) {
      type = after.status === 'sold' ? 'listing_sold' : 'price_drop';
      const wishes = await db.Wishlist.findAll({ where: { animal_type: animalType, animal_id: id, id: { [Op.gt]: cursor } }, order: [['id', 'ASC']], limit: 100 });
      recipients = wishes.map(wish => ({ id: wish.user_id, cursor: wish.id }));
    }
  } else if (model === 'AIHealthReport') { await send(row.user_id, 'health_report', { report_id: row.id, animal_group: row.animal_group || require('../utils/animalGroup').groupForSpecies(row.context?.animalType) }); }
  else if (model === 'CallLog') {
    if (row.callerId !== row.receiverId) await service.deliverNotification({ db, recipientId: row.receiverId, type: 'contact', title: 'Contact', body: 'Contact', data: { listing_id: row.listingId, animal_type: row.listingType, dedupe_key: `call-interest:${row.callerId}:${row.receiverId}:${row.listingId || 0}:${new Date(row.createdAt || row.created_at).toISOString().slice(0,10)}` } });
  } else if (model === 'VetLeadLog' && ['call_click', 'whatsapp_click'].includes(row.lead_type)) { await send(row.veterinarian_id, 'vet_contact', {}, 'veterinarian'); }
  else if (model === 'Veterinarian') { await send(row.id, 'vet_status', {}, 'veterinarian'); }
  else if (model === 'PetMatingProfile') { await send(row.user_id, 'pet_status', { profile_id: row.id, animal_group: 'pet' }); }
  else if (['Blog', 'GovernmentScheme'].includes(model) && row.status === 'published') {
    type = model === 'Blog' ? 'blog_published' : 'scheme_published';
    if (model === 'Blog' && row.audience === 'unassigned') return { status: 'suppressed' };
    data = { slug: row.slug, animal_group: model === 'GovernmentScheme' ? 'farm' : row.audience, message_args: { title: row.title } };
    const prefs = await db.NotificationPreference.findAll({ where: { recipient_type: 'user', content_enabled: true, id: { [Op.gt]: cursor } }, order: [['id', 'ASC']], limit: 100 });
    recipients = prefs.map(pref => ({ id: pref.recipient_id, cursor: pref.id }));
  }
  for (const recipient of recipients) {
    if (recipient.id !== row.user_id) await send(recipient.id, type, data);
    nextCursor = recipient.cursor || recipient.id;
  }
  return recipients.length === 100 ? { retryAfter: 0, noAttempt: true, payload: { ...job.payload, cursor: nextCursor } } : { status: 'done' };
};
module.exports = { install, processEvent, relevant };
