const db = require('../src/models');
const { sendFirebasePushNotification } = require('../src/services/notificationService');

const isExpoToken = (token) => typeof token === 'string' && token.startsWith('ExponentPushToken[');

const run = async () => {
  const candidates = await db.DeviceToken.findAll({
    where: { is_active: true },
    order: [['created_at', 'DESC']],
  });
  const deviceToken = candidates.find((row) => row.token && !isExpoToken(row.token));

  if (!deviceToken) {
    throw new Error('No active Firebase-like device token was found');
  }

  const recipientId = deviceToken.recipient_id || deviceToken.user_id;
  await deviceToken.update({
    provider: 'firebase',
    recipient_type: deviceToken.recipient_type || 'user',
    recipient_id: recipientId,
  });

  const response = await sendFirebasePushNotification(
    deviceToken.token,
    'Firebase FCM test',
    'Direct Firebase notification delivery is working.',
    {
      type: 'test_notification',
      source: 'firebase_admin_test',
      sentAt: new Date().toISOString(),
    },
    { channelId: 'default', priority: 'high' }
  );

  const errors = (response?.responses || [])
    .filter((item) => !item.success)
    .map((item) => ({ code: item.error?.code, message: item.error?.message }));

  console.log('FIREBASE_TEST_RESULT:', {
    token_id: deviceToken.id,
    recipient_type: deviceToken.recipient_type,
    recipient_id: recipientId,
    success_count: response?.successCount || 0,
    failure_count: response?.failureCount || 0,
    errors,
  });

  if (!response || response.successCount !== 1) {
    process.exitCode = 1;
  }
};

run()
  .catch((error) => {
    console.error('Firebase test failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.sequelize.close());
