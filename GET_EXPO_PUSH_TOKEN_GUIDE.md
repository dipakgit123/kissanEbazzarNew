# ========================================
# HOW TO GET EXPO PUSH TOKEN - COMPLETE GUIDE
# ========================================

## 🎯 METHOD 1: FROM YOUR APP CONSOLE (EASIEST)

### Steps:
1. Start your mobile app:
   \\\ash
   cd mobile
   expo start
   \\\

2. Scan QR code with Expo Go app (or run on device)

3. Open the app and login

4. Check the console output (terminal where you ran expo start)

5. Look for these messages:
   \\\
   Push token obtained: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
   ✅ Push token registered successfully
   \\\

6. Copy the token!

---

## 🎯 METHOD 2: ADD ALERT TO SHOW TOKEN (RECOMMENDED)

I'll create a simple way to display the token directly in your app.

---

## 🎯 METHOD 3: CHECK BACKEND DATABASE

After logging in, check the database:
\\\sql
SELECT * FROM device_tokens WHERE user_id = 'YOUR_USER_ID';
\\\

---

## 🎯 METHOD 4: ADD TOKEN DISPLAY IN PROFILE

Add a button in ProfileScreen to view your token.

