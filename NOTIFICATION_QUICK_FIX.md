# ========================================
# NOTIFICATION SYSTEM - QUICK FIX GUIDE
# ========================================

## 🔧 FIXES NEEDED

### Fix 1: Run Database Migration

\\\ash
cd server
npx sequelize-cli db:migrate
\\\

This creates the required tables:
- device_tokens
- notifications

---

### Fix 2: Add Token Registration in Mobile App

Update mobile/src/screens/LoginScreen.js after successful OTP verification:

\\\javascript
// After successful login
import { registerForPushNotificationsAsync } from '../services/notificationService';
import { API_URL } from '../services/api';

// In handleVerifyOTP function, after login success:
try {
  const pushToken = await registerForPushNotificationsAsync();
  if (pushToken) {
    await fetch(\\/notifications/register-token\, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData.id,
        token: pushToken,
        platform: Platform.OS
      })
    });
  }
} catch (error) {
  console.log('Push token registration error:', error);
}
\\\

---

### Fix 3: Test Notification System

\\\ash
# 1. Start backend
cd server
npm start

# 2. Run test script
node test-notifications.js

# 3. Check results
\\\

---

## ✅ AFTER FIXES, YOUR SYSTEM WILL:

1. ✅ Register device tokens on user login
2. ✅ Store tokens in database
3. ✅ Send notifications from backend
4. ✅ Receive notifications on mobile (even when app closed)
5. ✅ Store notification history
6. ✅ Allow users to view notifications

---

## 🧪 MANUAL TESTING STEPS

### Step 1: Register Token
\\\ash
curl -X POST http://localhost:3000/api/notifications/register-token \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "token": "ExponentPushToken[YOUR_TOKEN_HERE]",
    "platform": "android"
  }'
\\\

### Step 2: Send Test Notification
\\\ash
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "title": "Test Notification",
    "body": "Testing notification system"
  }'
\\\

### Step 3: Get Notifications
\\\ash
curl http://localhost:3000/api/notifications?userId=test123
\\\

---

## 📱 GET YOUR PUSH TOKEN

Run the mobile app and check console:
\\\
expo start
# Look for: "Push token: ExponentPushToken[...]"
\\\

Or add this to your app:
\\\javascript
import { registerForPushNotificationsAsync } from './src/services/notificationService';

registerForPushNotificationsAsync().then(token => {
  console.log('YOUR PUSH TOKEN:', token);
  alert('Token: ' + token);
});
\\\

---

## 🚀 QUICK START

\\\ash
# 1. Run migration
cd server && npx sequelize-cli db:migrate

# 2. Start backend
npm start

# 3. Run mobile app
cd ../mobile && expo start

# 4. Get push token from app console

# 5. Test notification
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "title": "Hello!",
    "body": "Your notification system works!"
  }'
\\\

