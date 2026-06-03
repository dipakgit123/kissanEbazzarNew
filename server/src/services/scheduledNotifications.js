const cron = require('node-cron');
const db = require('../models');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * SCHEDULED NOTIFICATION JOBS
 * Runs automatically in background for all users
 */

// Job 1: Send appointment reminders (runs every hour)
cron.schedule('0 * * * *', async () => {
  try {
    logger.log('🔔 Running appointment reminder job...');
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find appointments scheduled for tomorrow
    const appointments = await db.Appointment.findAll({
      where: {
        appointment_date: {
          [Op.gte]: tomorrow,
          [Op.lt]: dayAfterTomorrow
        },
        status: 'confirmed'
      },
      include: [
        { model: db.User, as: 'user' },
        { model: db.Veterinarian, as: 'veterinarian' }
      ]
    });

    logger.log(`Found ${appointments.length} appointments for tomorrow`);

    // Send reminder to each user
    const notificationPromises = appointments.map(async (appointment) => {
      const appointmentTime = appointment.appointment_time || '10:00 AM';
      const vetName = appointment.veterinarian?.full_name || 'Veterinarian';

      // Get user's device tokens
      const tokens = await db.DeviceToken.findAll({
        where: { user_id: appointment.user_id, is_active: true }
      });

      if (tokens.length > 0) {
        const pushTokens = tokens.map(t => t.token);
        return notificationService.sendBulkPushNotifications(
          pushTokens,
          '📅 Appointment Reminder',
          `Your vet appointment with Dr. ${vetName} is tomorrow at ${appointmentTime}`,
          {
            type: 'appointment_reminder',
            appointmentId: appointment.id.toString(),
            veterinarianId: appointment.veterinarian_id.toString()
          }
        );
      }
      return null;
    });

    await Promise.allSettled(notificationPromises);
    logger.log(`✅ Sent ${appointments.length} appointment reminders`);
    
  } catch (error) {
    logger.error('❌ Error in appointment reminder job:', error);
  }
});

// Job 2: Send pregnancy due date reminders (runs daily at 9 AM)
cron.schedule('0 9 * * *', async () => {
  try {
    logger.log('🔔 Running pregnancy reminder job...');
    
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    // Find pregnancies due within a week
    const pregnancies = await db.PregnancyRecord.findAll({
      where: {
        expected_delivery_date: {
          [Op.gte]: today,
          [Op.lte]: weekFromNow
        },
        status: 'pregnant'
      },
      include: [{ model: db.User, as: 'user' }]
    });

    logger.log(`Found ${pregnancies.length} pregnancies due soon`);

    const notificationPromises = pregnancies.map(async (pregnancy) => {
      const daysLeft = Math.ceil((new Date(pregnancy.expected_delivery_date) - today) / (1000 * 60 * 60 * 24));
      const animalName = pregnancy.animal_name || 'Your animal';

      // Get user's device tokens
      const tokens = await db.DeviceToken.findAll({
        where: { user_id: pregnancy.user_id, is_active: true }
      });

      if (tokens.length > 0) {
        const pushTokens = tokens.map(t => t.token);
        return notificationService.sendBulkPushNotifications(
          pushTokens,
          '🐄 Pregnancy Alert',
          `${animalName} is due in ${daysLeft} days! Be prepared.`,
          {
            type: 'pregnancy_reminder',
            recordId: pregnancy.id.toString(),
            daysLeft: daysLeft.toString()
          }
        );
      }
      return null;
    });

    await Promise.allSettled(notificationPromises);
    logger.log(`✅ Sent ${pregnancies.length} pregnancy reminders`);
    
  } catch (error) {
    logger.error('❌ Error in pregnancy reminder job:', error);
  }
});

logger.log('✅ Scheduled notification jobs started');
logger.log('   - Appointment reminders: Every hour');
logger.log('   - Pregnancy reminders: Daily at 9 AM');

module.exports = { /* Jobs run automatically */ };
