const cron = require('node-cron');
const { Op } = require('sequelize');
const db = require('../models');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

const timezone = process.env.NOTIFICATION_TIMEZONE || 'Asia/Kolkata';

const getDateWindow = (daysAhead) => {
  const start = new Date();
  start.setDate(start.getDate() + daysAhead);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const runAppointmentReminders = async () => {
  try {
    const { start, end } = getDateWindow(1);
    const appointments = await db.Appointment.findAll({
      where: {
        appointment_date: { [Op.gte]: start, [Op.lt]: end },
        status: 'confirmed',
        reminder_sent_at: null,
      },
      include: [{ model: db.Veterinarian, as: 'veterinarian' }],
    });

    const results = await Promise.allSettled(appointments.map(async (appointment) => {
      const result = await notificationService.deliverNotification({
        db,
        recipientId: appointment.user_id,
        title: 'Appointment Reminder',
        body: `Your appointment with Dr. ${appointment.veterinarian?.full_name || 'Veterinarian'} is tomorrow at ${appointment.appointment_time}`,
        type: 'appointment_reminder',
        data: {
          appointment_id: appointment.id,
          veterinarian_id: appointment.veterinarian_id,
          dedupe_key: `appointment-reminder:${appointment.id}:${appointment.appointment_date}`,
        },
        pushOptions: { channelId: 'high-priority' },
      });

      if (result.delivered || result.suppressed || result.duplicate) {
        await appointment.update({ reminder_sent_at: new Date() });
      }
    }));

    const failures = results.filter((result) => result.status === 'rejected').length;
    logger.log(`Appointment reminders processed: ${appointments.length}, failed: ${failures}`);
  } catch (error) {
    logger.error('Appointment reminder job failed:', error);
  }
};

const runPregnancyReminders = async () => {
  try {
    const { start: today } = getDateWindow(0);
    const { end: weekEnd } = getDateWindow(7);
    const pregnancies = await db.PregnancyRecord.findAll({
      where: {
        expected_delivery_date: { [Op.gte]: today, [Op.lt]: weekEnd },
        status: 'pregnant',
        reminder_enabled: true,
      },
    });

    const results = await Promise.allSettled(pregnancies.map(async (pregnancy) => {
      const daysLeft = Math.max(0, Math.ceil(
        (new Date(pregnancy.expected_delivery_date) - today) / (24 * 60 * 60 * 1000)
      ));
      const result = await notificationService.deliverNotification({
        db,
        recipientId: pregnancy.user_id,
        title: 'Pregnancy Alert',
        body: `${pregnancy.animal_name || 'Your animal'} is due in ${daysLeft} days.`,
        type: 'pregnancy_reminder',
        data: {
          record_id: pregnancy.id,
          days_left: daysLeft,
          dedupe_key: `pregnancy-reminder:${pregnancy.id}:${daysLeft}`,
        },
        pushOptions: { channelId: 'reminders' },
      });

      if (result.delivered || result.suppressed || result.duplicate) {
        await pregnancy.update({ last_reminder_sent: new Date() });
      }
    }));

    const failures = results.filter((result) => result.status === 'rejected').length;
    logger.log(`Pregnancy reminders processed: ${pregnancies.length}, failed: ${failures}`);
  } catch (error) {
    logger.error('Pregnancy reminder job failed:', error);
  }
};

cron.schedule('0 * * * *', runAppointmentReminders, { timezone });
cron.schedule('0 9 * * *', runPregnancyReminders, { timezone });
cron.schedule('30 3 * * *', async () => {
  try {
    const deleted = await notificationService.cleanupInactiveTokens(db);
    if (deleted > 0) logger.log(`Removed ${deleted} stale notification tokens`);
  } catch (error) {
    logger.error('Notification token cleanup failed:', error);
  }
}, { timezone });

logger.log(`Scheduled notification jobs started (${timezone})`);

module.exports = {
  runAppointmentReminders,
  runPregnancyReminders,
};
