/**
 * NOTIFICATION SYSTEM TEST SCRIPT
 * Run this to test notifications end-to-end
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api';  // Change to your backend URL
const TEST_USER_ID = 'test-user-123';
const TEST_TOKEN = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'; // Replace with real token

// Test 1: Register Device Token
async function testRegisterToken() {
  console.log('\n🧪 TEST 1: Register Device Token');
  try {
    const response = await axios.post(\\/notifications/register-token\, {
      userId: TEST_USER_ID,
      token: TEST_TOKEN,
      platform: 'android'
    });
    console.log('✅ PASSED - Token registered:', response.data);
    return true;
  } catch (error) {
    console.log('❌ FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Send Test Notification
async function testSendNotification() {
  console.log('\n🧪 TEST 2: Send Test Notification');
  try {
    const response = await axios.post(\\/notifications/test\, {
      userId: TEST_USER_ID,
      title: 'Test Notification',
      body: 'This is a test notification from the system check'
    });
    console.log('✅ PASSED - Notification sent:', response.data);
    return true;
  } catch (error) {
    console.log('❌ FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Get User Notifications
async function testGetNotifications() {
  console.log('\n🧪 TEST 3: Get User Notifications');
  try {
    const response = await axios.get(\\/notifications?userId=\\);
    console.log('✅ PASSED - Got notifications:', response.data);
    return true;
  } catch (error) {
    console.log('❌ FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Send via Expo Push Service Directly
async function testExpoDirectSend() {
  console.log('\n🧪 TEST 4: Send via Expo Push Service Directly');
  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/send', {
      to: TEST_TOKEN,
      title: 'Direct Expo Test',
      body: 'Testing direct Expo push notification',
      data: { test: true },
      sound: 'default',
      priority: 'high'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('✅ PASSED - Direct Expo send:', response.data);
    return true;
  } catch (error) {
    console.log('❌ FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('========================================');
  console.log('🔔 NOTIFICATION SYSTEM TEST SUITE');
  console.log('========================================');
  
  const results = {
    registerToken: await testRegisterToken(),
    sendNotification: await testSendNotification(),
    getNotifications: await testGetNotifications(),
    expoDirectSend: await testExpoDirectSend()
  };
  
  console.log('\n========================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('========================================');
  console.log('Register Token:', results.registerToken ? '✅ PASS' : '❌ FAIL');
  console.log('Send Notification:', results.sendNotification ? '✅ PASS' : '❌ FAIL');
  console.log('Get Notifications:', results.getNotifications ? '✅ PASS' : '❌ FAIL');
  console.log('Expo Direct Send:', results.expoDirectSend ? '✅ PASS' : '❌ FAIL');
  
  const passCount = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;
  
  console.log(\\n🎯 Result: \/\ tests passed\);
  
  if (passCount === totalTests) {
    console.log('✅ ALL TESTS PASSED - Notification system is working!\n');
  } else {
    console.log('⚠️ SOME TESTS FAILED - Check the errors above\n');
  }
}

// Export for use
module.exports = { runAllTests };

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
