# ========================================
# QUICK TEST GUIDE - Prove Notifications Work When App is Closed
# ========================================

## 🧪 TEST METHOD 1: Using Expo Notifications Tool (Easiest)

### Steps:
1. Run your app: \expo start\
2. Scan QR code with Expo Go app
3. Login to your app
4. Find your push token in logs (starts with: ExponentPushToken[...])
5. CLOSE THE APP COMPLETELY (swipe away from recent apps)
6. Go to: https://expo.dev/notifications
7. Paste your token
8. Click "Send a Notification"
9. **Notification appears even though app is closed!** ✅

---

## 🧪 TEST METHOD 2: Using cURL (From Command Line)

\\\ash
# Replace YOUR_TOKEN with actual token
curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/send" -d '{
  "to": "ExponentPushToken[YOUR_TOKEN]",
  "title": "Test Notification",
  "body": "This proves notifications work when app is closed!",
  "data": {"test": true},
  "sound": "default"
}'
\\\

---

## 🧪 TEST METHOD 3: From Your Backend

\\\javascript
// Call this endpoint after closing the app
POST http://your-backend/api/notifications/test
{
  "userId": "your-user-id"
}
\\\

---

## 📱 EXPECTED BEHAVIOR (When App is Closed)

1. You close/kill the app completely
2. Notification arrives from backend/test tool
3. **Notification appears in status bar** ✅
4. **Sound plays** ✅
5. **Phone vibrates** ✅
6. You tap notification
7. **App opens** ✅
8. **Navigates to relevant screen** ✅

---

## ⚠️ IMPORTANT NOTES

1. **Must test on PHYSICAL device**
   - Emulators DON'T support push notifications
   - Use real Android phone

2. **Must have internet connection**
   - Notifications require internet
   - Works on WiFi or mobile data

3. **Notification permission must be granted**
   - User must allow notifications
   - Check in: Settings > Apps > Your App > Notifications

4. **Battery optimization**
   - Some phones kill apps aggressively
   - Disable battery optimization for testing

---

Your app is ready! Just test it! 🚀

