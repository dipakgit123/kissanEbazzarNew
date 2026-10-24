const { Op } = require('sequelize');
const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

const enqueue = async (db, kind, key, payload, options = {}) => {
  const [job] = await db.NotificationJob.findOrCreate({
    where: { dedupe_key: key },
    defaults: { kind, payload, expires_at: options.expiresAt || new Date(Date.now() + 86400000) },
    transaction: options.transaction,
  });
  return job;
};

const eligible = async (db, notification) => {
  const service = require('./notificationService');
  const vet = notification.recipient_type === 'veterinarian';
  const account = await (vet ? db.Veterinarian : db.User).findByPk(notification.recipient_id || notification.user_id);
  if (!account) return false;
  if (vet ? (!account.is_active || account.verification_status !== 'verified') && notification.type !== 'vet_status'
    : !account.is_verified || (account.is_blocked && (!account.blocked_until || new Date(account.blocked_until) > new Date()))) return false;
  const prefs = await db.NotificationPreference.findOne({ where: { recipient_type: notification.recipient_type, recipient_id: notification.recipient_id } });
  if (prefs && (prefs.push_enabled === false || prefs[service.getCategoryPreference(notification.type)] === false)) return false;
  const data = notification.data || {};
  if (['farm', 'pet'].includes(data.animal_group) && prefs?.[data.animal_group + '_enabled'] === false) return false;
  if (data.animal_group === 'both' && prefs?.farm_enabled === false && prefs?.pet_enabled === false) return false;
  if (notification.type === 'pregnancy_reminder') {
    const record = await db.PregnancyRecord.findByPk(data.record_id);
    if (!record || !record.reminder_enabled || !['pregnant', 'pending_confirmation'].includes(record.status)) return false;
    if (data.reminder_kind === 'examination') return record.next_check_date === data.check_date;
    return !!record.confirmed_on && record.expected_delivery_date === data.due_date;
  }
  if (notification.type === 'milk_reminder') {
    if (require('../utils/businessTime').calendarDate(new Date(), process.env.NOTIFICATION_TIMEZONE || 'Asia/Kolkata') !== data.report_date) return false;
    return !await db.MilkReport.findOne({ where: { user_id: notification.recipient_id, report_date: data.report_date } });
  }
  return true;
};

// Each worker claims one job with a database lease; multiple servers share this queue.
const claim = async db => db.sequelize.transaction(async transaction => {
  const job = await db.NotificationJob.findOne({
    where: { status: { [Op.in]: ['pending', 'processing'] }, next_attempt_at: { [Op.lte]: new Date() },
      [Op.or]: [{ locked_until: null }, { locked_until: { [Op.lt]: new Date() } }] },
    order: [['next_attempt_at', 'ASC'], ['id', 'ASC']], lock: transaction.LOCK.UPDATE, skipLocked: true, transaction,
  });
  if (!job) return null;
  await job.update({ status: 'processing', lease: randomUUID(), locked_until: new Date(Date.now() + 300000) }, { transaction });
  return job;
});

const processJob = async (db, job) => {
  const service = require('./notificationService');
  if (job.kind === 'event') return require('./notificationEvents').processEvent(db, job);
  const notification = await db.Notification.findByPk(job.payload.notificationId);
  if (!notification || !await eligible(db, notification)) return { status: 'suppressed' };
  if (job.kind === 'notification') {
    const tokens = await db.DeviceToken.findAll({ where: service.buildRecipientTokenWhere(notification.recipient_id, notification.recipient_type) });
    if (!tokens.length) {
      await notification.update({ push_status: 'no_devices' });
      return { retryAfter: 300000, noAttempt: true };
    }
    await db.sequelize.transaction(async transaction => {
      for (const token of tokens) await enqueue(db, 'push', `push:${notification.id}:${token.id}`, { notificationId: notification.id, tokenId: token.id }, { transaction, expiresAt: job.expires_at });
      await notification.update({ push_status: 'queued' }, { transaction });
    });
    return { status: 'done' };
  }
  const token = await db.DeviceToken.findOne({ where: { id: job.payload.tokenId, ...service.buildRecipientTokenWhere(notification.recipient_id, notification.recipient_type) } });
  if (!token) return { status: 'suppressed' };
  if (job.payload.receiptId) {
    const receipt = await service.getExpoReceipt(job.payload.receiptId);
    if (!receipt) return { retryAfter: 60000, noAttempt: true };
    if (receipt.status === 'ok') return { status: 'accepted' };
    const code = receipt.details?.error || 'expo_receipt_failed';
    await service.recordTokenFailure(token.token, code, code === 'DeviceNotRegistered');
    if (code === 'DeviceNotRegistered') return { status: 'failed', error: code };
    return { retryAfter: 60000, payload: { ...job.payload, receiptId: null }, error: code };
  }
  const badge = await db.Notification.count({ where: service.buildRecipientWhere(notification.recipient_id, notification.recipient_type, { is_read: false }) });
  const result = await service.sendPushAttempt(token, notification, badge, Math.max(0, new Date(job.expires_at).getTime() - Date.now()));
  if (result.receiptId) return { retryAfter: 15 * 60000, noAttempt: true, payload: { ...job.payload, receiptId: result.receiptId } };
  if (result.accepted) return { status: 'accepted' };
  if (result.permanent) return { status: 'failed', error: result.error };
  return { retryAfter: 60000 * 2 ** Math.min(job.attempts, 5), error: result.error };
};

const syncDeliveryState = async (db, notificationId) => {
  if (!notificationId) return;
  const jobs = await db.NotificationJob.findAll({ where: { kind: 'push', payload: { notificationId } }, attributes: ['status'] });
  if (!jobs.length) return;
  const allAccepted = jobs.every(job => job.status === 'accepted');
  const someAccepted = jobs.some(job => job.status === 'accepted');
  const pending = jobs.some(job => ['pending', 'processing'].includes(job.status));
  const suppressed = jobs.every(job => job.status === 'suppressed');
  await db.Notification.update({ push_status: allAccepted ? 'accepted' : someAccepted ? 'partial' : pending ? 'queued' : suppressed ? 'suppressed' : 'failed',
    // Provider acceptance is NOT proof of display on the phone.
    push_delivered_at: null }, { where: { id: notificationId } });
};

let running = false;
const run = async db => {
  if (running) return;
  running = true;
  try {
    for (let i = 0; i < 50; i++) {
      const job = await claim(db);
      if (!job) break;
      let outcome;
      try {
        outcome = new Date(job.expires_at) <= new Date() ? { status: 'expired' } : await processJob(db, job);
      } catch (error) {
        outcome = { retryAfter: 60000 * 2 ** Math.min(job.attempts, 5), error: error.code || error.message };
      }
      const attempts = job.attempts + (outcome.noAttempt ? 0 : 1);
      const status = outcome.status || (attempts >= 8 ? 'failed' : 'pending');
      await db.NotificationJob.update({ status, attempts, lease: null, locked_until: null,
        next_attempt_at: new Date(Date.now() + (outcome.retryAfter || 0)),
        ...(outcome.payload ? { payload: outcome.payload } : {}), last_error: outcome.error ? String(outcome.error).slice(0, 255) : null },
      { where: { id: job.id, lease: job.lease } });
      await syncDeliveryState(db, job.payload.notificationId);
      if (job.kind === 'notification' && ['suppressed', 'expired', 'failed'].includes(status)) await db.Notification.update({ push_status: status }, { where: { id: job.payload.notificationId } });
    }
  } catch (error) { logger.error('Notification queue failed:', error.message); }
  finally { running = false; }
};
module.exports = { enqueue, run, processJob, eligible, syncDeliveryState };
