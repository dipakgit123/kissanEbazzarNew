/**
 * QUICK TEST: Send Notification from Your Backend
 * 
 * This sends a "Kissan E-Bazzar" branded notification
 */

const notificationService = require('./src/services/notificationService');

// Test function
async function testKissanNotification() {
  try {
    // Your user ID (get from database)
    const userId = 'YOUR_USER_ID'; // Replace with actual user ID
    
    // Send notification
    const result = await notificationService.sendPushNotification(userId, {
      title: '🐄 Kissan E-Bazzar Alert',
      body: 'New buffalo available just 5km from you! Price: ₹50,000',
      data: {
        type: 'new_listing',
        animalType: 'buffalo',
        listingId: '123',
        distance: 5
      },
      sound: 'default',
      priority: 'high',
      badge: 1
    });
    
    console.log('✅ Notification sent successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
}

// Run test
testKissanNotification();
