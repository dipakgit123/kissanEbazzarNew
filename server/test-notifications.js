/**
 * Notification smoke test.
 *
 * Usage:
 *   AUTH_TOKEN=<user-or-vet-jwt> TEST_PUSH_TOKEN=<expo-or-fcm-token> node test-notifications.js
 *
 * Optional:
 *   API_URL=http://localhost:5000/api ENABLE_EXPO_DIRECT_TEST=true node test-notifications.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const TEST_PUSH_TOKEN = process.env.TEST_PUSH_TOKEN || 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
const ENABLE_EXPO_DIRECT_TEST = process.env.ENABLE_EXPO_DIRECT_TEST === 'true';

const client = axios.create({
  baseURL: API_URL,
  headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {},
});

const logFailure = (error) => {
  console.log('FAILED:', error.response?.data || error.message);
};

async function testRegisterToken() {
  console.log('\nTEST 1: Register device token');

  try {
    const response = await client.post('/notifications/register-token', {
      token: TEST_PUSH_TOKEN,
      platform: 'android',
      provider: TEST_PUSH_TOKEN.startsWith('ExponentPushToken') ? 'expo' : 'firebase',
    });
    console.log('PASSED:', response.data);
    return true;
  } catch (error) {
    logFailure(error);
    return false;
  }
}

async function testSendNotification() {
  console.log('\nTEST 2: Send backend test notification');

  try {
    const response = await client.post('/notifications/test-push', {
      title: 'Test Notification',
      body: 'This is a test notification from the system check',
    });
    console.log('PASSED:', response.data);
    return true;
  } catch (error) {
    logFailure(error);
    return false;
  }
}

async function testGetNotifications() {
  console.log('\nTEST 3: Get notifications');

  try {
    const response = await client.get('/notifications');
    console.log('PASSED:', response.data);
    return true;
  } catch (error) {
    logFailure(error);
    return false;
  }
}

async function testExpoDirectSend() {
  console.log('\nTEST 4: Send via Expo push service directly');

  if (!ENABLE_EXPO_DIRECT_TEST) {
    console.log('SKIPPED: set ENABLE_EXPO_DIRECT_TEST=true to call Expo directly.');
    return true;
  }

  try {
    const response = await axios.post(
      'https://exp.host/--/api/v2/push/send',
      {
        to: TEST_PUSH_TOKEN,
        title: 'Direct Expo Test',
        body: 'Testing direct Expo push notification',
        data: { test: true },
        sound: 'default',
        priority: 'high',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    console.log('PASSED:', response.data);
    return true;
  } catch (error) {
    logFailure(error);
    return false;
  }
}

async function runAllTests() {
  if (!AUTH_TOKEN) {
    console.log('AUTH_TOKEN is required because notification routes are protected.');
    process.exitCode = 1;
    return;
  }

  console.log('========================================');
  console.log('NOTIFICATION SYSTEM SMOKE TEST');
  console.log('========================================');

  const results = {
    registerToken: await testRegisterToken(),
    sendNotification: await testSendNotification(),
    getNotifications: await testGetNotifications(),
    expoDirectSend: await testExpoDirectSend(),
  };

  const passCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log('\n========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('========================================');
  Object.entries(results).forEach(([name, passed]) => {
    console.log(`${name}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  console.log(`Result: ${passCount}/${totalTests} tests passed`);

  if (passCount !== totalTests) {
    process.exitCode = 1;
  }
}

module.exports = { runAllTests };

if (require.main === module) {
  runAllTests().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
