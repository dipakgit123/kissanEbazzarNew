const cron = require('node-cron');
const db = require('../models');
const notificationService = require('../services/notificationService');
const { Op } = require('sequelize');

/**
 * SCHEDULED NOTIFICATION JOBS
 * Runs automatically in background for all users
 */

// Job 1: Send appointment reminders (runs every hour)
cron.schedule('0 * * * *', async () => {
  try {
    console.log('🔔 Running appointment reminder job...');
    
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

    console.log(\Found \ appointments for tomorrow\);

    // Send reminder to each user
    const notificationPromises = appointments.map(appointment => {
      const appointmentTime = appointment.appointment_time || '10:00 AM';
      return notificationService.sendPushNotification(appointment.user_id, {
        title: '📅 Appointment Reminder',
        body: \Your vet appointment with Dr. \ is tomorrow at \\,
        data: {
          type: 'appointment_reminder',
          appointmentId: appointment.id.toString(),
          veterinarianId: appointment.veterinarian_id.toString()
        },
        sound: 'default',
        priority: 'high'
      });
    });

    await Promise.allSettled(notificationPromises);
    console.log(\✅ Sent \ appointment reminders\);
    
  } catch (error) {
    console.error('❌ Error in appointment reminder job:', error);
  }
});

// Job 2: Send pregnancy due date reminders (runs daily at 9 AM)
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('🔔 Running pregnancy reminder job...');
    
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

    console.log(\Found \ pregnancies due soon\);

    const notificationPromises = pregnancies.map(pregnancy => {
      const daysLeft = Math.ceil((new Date(pregnancy.expected_delivery_date) - today) / (1000 * 60 * 60 * 24));
      return notificationService.sendPushNotification(pregnancy.user_id, {
        title: '🐄 Pregnancy Alert',
        body: \\ is due in \ days! Be prepared.\,
        data: {
          type: 'pregnancy_reminder',
          recordId: pregnancy.id.toString(),
          daysLeft: daysLeft.toString()
        },
        sound: 'default'
      });
    });

    await Promise.allSettled(notificationPromises);
    console.log(\✅ Sent \ pregnancy reminders\);
    
  } catch (error) {
    console.error('❌ Error in pregnancy reminder job:', error);
  }
});

console.log('✅ Scheduled notification jobs started');
console.log('   - Appointment reminders: Every hour');
console.log('   - Pregnancy reminders: Daily at 9 AM');

module.exports = { /* Jobs run automatically */ };
