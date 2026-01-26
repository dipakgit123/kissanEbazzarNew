# ========================================
# KISSAN E-BAZZAR NOTIFICATION TRIGGERS
# ========================================

## 📱 Automatic Notifications to Implement

### 1. NEW ANIMAL LISTING NEARBY
When a new animal is posted near a user:

Location: server/src/controllers/animalListingController.js
Trigger: After creating a new listing

\\\javascript
// After successful listing creation
const notificationService = require('../services/notificationService');

// Get nearby users (within 50km)
const nearbyUsers = await User.findAll({
  where: {
    // Add your distance calculation logic
  }
});

// Send notification to nearby users
for (const user of nearbyUsers) {
  await notificationService.sendPushNotification(user.id, {
    title: '🐄 New Animal Available!',
    body: \\ posted just \km from you\,
    data: {
      type: 'new_listing',
      listingId: newListing.id,
      animalType: animalType
    }
  });
}
\\\

---

### 2. WISHLIST PRICE DROP
When price drops on wishlisted item:

Location: server/src/controllers/animalListingController.js
Trigger: When listing price is updated

\\\javascript
// When price is reduced
const oldPrice = listing.price;
const newPrice = req.body.price;

if (newPrice < oldPrice) {
  // Get users who wishlisted this item
  const wishlisters = await Wishlist.findAll({
    where: { animal_id: listingId }
  });

  for (const wishlist of wishlisters) {
    await notificationService.sendPushNotification(wishlist.user_id, {
      title: '💰 Price Drop Alert!',
      body: \Your wishlisted \ is now ₹\\,
      data: {
        type: 'price_drop',
        listingId: listingId,
        oldPrice: oldPrice,
        newPrice: newPrice
      }
    });
  }
}
\\\

---

### 3. APPOINTMENT REMINDER
24 hours before appointment:

Location: server/src/services/notificationService.js
Trigger: Scheduled job (use node-cron)

\\\javascript
const cron = require('node-cron');

// Run every hour
cron.schedule('0 * * * *', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await Appointment.findAll({
    where: {
      appointment_date: tomorrow,
      status: 'confirmed'
    }
  });

  for (const appointment of appointments) {
    await notificationService.sendPushNotification(appointment.user_id, {
      title: '📅 Appointment Reminder',
      body: \Your vet appointment is tomorrow at \\,
      data: {
        type: 'appointment_reminder',
        appointmentId: appointment.id
      }
    });
  }
});
\\\

---

### 4. NEW MESSAGE/INQUIRY
When someone contacts about your listing:

Location: server/src/controllers/messageController.js (if exists)

\\\javascript
// When buyer contacts seller
await notificationService.sendPushNotification(sellerId, {
  title: '💬 New Message',
  body: \\ is interested in your \\,
  data: {
    type: 'new_message',
    fromUserId: buyerId,
    listingId: listingId
  }
});
\\\

---

### 5. LISTING APPROVED/PUBLISHED
When admin approves listing:

\\\javascript
await notificationService.sendPushNotification(userId, {
  title: '✅ Listing Published',
  body: 'Your buffalo listing is now live!',
  data: {
    type: 'listing_approved',
    listingId: listingId
  }
});
\\\

---

### 6. WELCOME NOTIFICATION
When user completes registration:

Location: server/src/controllers/authController.js

\\\javascript
// After successful registration
await notificationService.sendPushNotification(user.id, {
  title: '🎉 Welcome to Kissan E-Bazzar!',
  body: 'Start buying and selling animals near you',
  data: {
    type: 'welcome'
  }
});
\\\

---

## 🔧 IMPLEMENTATION STEPS

1. Install node-cron for scheduled notifications:
   \\\ash
   cd server
   npm install node-cron
   \\\

2. Add notification calls in your controllers

3. Test each notification type

4. Monitor notification logs

