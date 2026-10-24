const { calendarDate, addCalendarDays } = require('../utils/businessTime');
const cron = require('node-cron');
const { Op } = require('sequelize');
const db = require('../models');
const service = require('./notificationService');
const queue = require('./notificationQueue');
const logger = require('../utils/logger');
const timezone = process.env.NOTIFICATION_TIMEZONE || 'Asia/Kolkata';
let scanning = false;
const pages = async (Model, where, visit) => {
  let cursor = 0;
  while (true) {
    const rows = await Model.findAll({ where: { ...where, id: { [Op.gt]: cursor } }, order: [['id', 'ASC']], limit: 100 });
    for (const row of rows) await visit(row);
    if (rows.length < 100) break;
    cursor = rows[rows.length - 1].id;
  }
};
const runPregnancyReminders = async () => {
  const today = calendarDate(new Date(), timezone);
  // Catch up recent missed checks and overdue delivery records without replaying old history.
  const since = addCalendarDays(today, -7);
  await pages(db.PregnancyRecord, { status: { [Op.in]: ['pregnant', 'pending_confirmation'] }, reminder_enabled: true,
    [Op.or]: [{ expected_delivery_date: { [Op.between]: [since, addCalendarDays(today, 7)] } }, { next_check_date: { [Op.between]: [since, today] } }] }, async record => {
    const dates = [];
    if (record.status === 'pregnant' && record.confirmed_on && record.expected_delivery_date >= since && record.expected_delivery_date <= addCalendarDays(today, 7)) {
      dates.push({ message_key: 'pregnancy_reminder', due_date: record.expected_delivery_date, date: record.expected_delivery_date, key: `delivery:${record.id}:${record.expected_delivery_date}:${today}` });
    }
    if (record.next_check_date && record.next_check_date >= since && record.next_check_date <= today) dates.push({ message_key: 'pregnancy_check', reminder_kind: 'examination', check_date: record.next_check_date, date: record.next_check_date, key: `check:${record.id}:${record.next_check_date}` });
    for (const entry of dates) {
      const result = await service.deliverNotification({ db, recipientId: record.user_id, type: 'pregnancy_reminder', title: 'Pregnancy reminder', body: 'Open the record', data: {
        record_id: record.id, animal_group: record.animal_group, message_key: entry.message_key, reminder_kind: entry.reminder_kind, due_date: entry.due_date, check_date: entry.check_date,
        message_args: { name: record.animal_name || record.ear_badge_number || '#'+record.id, date: entry.date }, dedupe_key: entry.key,
      } });
      if (result.stored) await record.update({ last_reminder_sent: new Date() });
    }
  });
};
const runMilkReminders = async () => {
  const today = calendarDate(new Date(), timezone);
  await pages(db.NotificationPreference, { recipient_type: 'user', milk_reminders_enabled: true }, async pref => {
    if (!await db.FarmerCow.findOne({ where: { user_id: pref.recipient_id } })) return;
    if (await db.MilkReport.findOne({ where: { user_id: pref.recipient_id, report_date: today } })) return;
    await service.deliverNotification({ db, recipientId: pref.recipient_id, type: 'milk_reminder', title: 'Milk entry', body: "Add today's entry", data: { animal_group: 'farm', report_date: today, dedupe_key: `milk:${pref.recipient_id}:${today}` } });
  });
};
const scan = async () => {
  if (scanning) return;
  scanning = true;
  try {
    const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
    if (hour >= 9) await runPregnancyReminders();
    if (hour >= 19) await runMilkReminders();
  } catch (error) { logger.error('Notification reminder scan failed:', error.message); }
  finally { scanning = false; }
};
// Appointment notifications are intentionally disabled: veterinarians are a directory.
const reminderJob = cron.schedule('*/15 * * * *', scan, { timezone });
const deliveryJob = cron.schedule('* * * * *', () => queue.run(db), { timezone });
const cleanupJob = cron.schedule('30 3 * * *', async () => {
  try {
    await service.cleanupInactiveTokens(db);
    await db.NotificationJob.destroy({ where: { status: { [Op.in]: ['done', 'accepted', 'suppressed', 'expired', 'failed'] }, updated_at: { [Op.lt]: new Date(Date.now() - 30 * 86400000) } } });
  } catch (error) { logger.error('Notification cleanup failed:', error.message); }
}, { timezone });
const start = () => { scan(); queue.run(db); };
module.exports = { start, stop: () => [reminderJob, deliveryJob, cleanupJob].forEach(job => job.stop()), runPregnancyReminders, runMilkReminders, scan };
