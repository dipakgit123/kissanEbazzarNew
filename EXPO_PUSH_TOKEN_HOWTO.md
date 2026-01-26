# ========================================
# QUICK WAYS TO GET YOUR EXPO PUSH TOKEN
# ========================================

## ✅ METHOD 1: Check Console (After Login)

1. Start app:
   \\\ash
   cd mobile
   expo start
   \\\

2. Open app on device and login

3. Look at console output for:
   \\\
   Push token obtained: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
   \\\

---

## ✅ METHOD 2: Use TokenTester Component

I've created a TokenTester component. Add it to any screen:

### Option A: Add to ProfileScreen (Temporary)

Edit: mobile/src/screens/ProfileScreen.js

\\\javascript
// Add at top
import TokenTester from '../components/TokenTester';

// Add in the render, somewhere visible (e.g., after header)
<TokenTester />
\\\

### Option B: Add to HomeScreen (Temporary)

Edit: mobile/src/screens/HomeScreen.js

\\\javascript
// Add at top
import TokenTester from '../components/TokenTester';

// Add anywhere in the render
<TokenTester />
\\\

### Then:
- Open app
- Tap "Get My Push Token" button
- Token appears in alert
- Tap "Copy" to copy to clipboard
- Also visible in console

---

## ✅ METHOD 3: Query Database

After logging in once, check database:

\\\ash
# SQLite (if using SQLite)
sqlite3 server/database.sqlite

SELECT * FROM device_tokens;
\\\

\\\sql
-- MySQL/PostgreSQL
SELECT user_id, token, platform, created_at 
FROM device_tokens 
ORDER BY created_at DESC;
\\\

---

## ✅ METHOD 4: API Endpoint

Create a simple endpoint to get tokens:

\\\ash
# Get all tokens
curl http://localhost:3000/api/notifications/tokens

# Get token for specific user
curl http://localhost:3000/api/notifications/tokens/USER_ID
\\\

---

## ✅ METHOD 5: Add to Debug Menu

Add a debug menu to your app (for development only):

\\\javascript
// In ProfileScreen or any screen
import { registerForPushNotificationsAsync } from '../services/notificationService';

// Add button
<TouchableOpacity onPress={async () => {
  const token = await registerForPushNotificationsAsync();
  alert('Token: ' + token);
  console.log('TOKEN:', token);
}}>
  <Text>Show Push Token</Text>
</TouchableOpacity>
\\\

---

## 🧪 TESTING WITH TOKEN

Once you have your token:

### Test 1: Expo Push Notification Tool
1. Go to: https://expo.dev/notifications
2. Paste your token
3. Add title and message
4. Click "Send a Notification"
5. Check your device!

### Test 2: cURL Command
\\\ash
curl -H "Content-Type: application/json" \\
  -X POST "https://exp.host/--/api/v2/push/send" \\
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
    "title": "Test Notification",
    "body": "Testing from terminal!",
    "data": {"test": true},
    "sound": "default"
  }'
\\\

### Test 3: Your Backend
\\\ash
curl -X POST http://localhost:3000/api/notifications/test \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": "YOUR_USER_ID",
    "title": "Test from Backend",
    "body": "This works!"
  }'
\\\

---

## 📱 EXPECTED TOKEN FORMAT

Your token should look like:
\\\
ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
\\\

Example:
\\\
ExponentPushToken[jF7g8H9k2L4mN6pQ8rS0tU2vW4xY6zA8]
\\\

- Starts with: ExponentPushToken[
- Contains: Random alphanumeric characters
- Ends with: ]

---

## ⚠️ IMPORTANT NOTES

1. **Physical Device Required**
   - Push tokens DON'T work on emulators
   - MUST test on real Android phone

2. **Permission Required**
   - User must grant notification permission
   - App will request on first launch

3. **Token Can Change**
   - Token may change if app is reinstalled
   - Token may change after major updates
   - Always re-register on login

4. **Development vs Production**
   - Tokens work in both development and production
   - Same token format for both

---

## 🎯 RECOMMENDED METHOD

**Best way:** Use TokenTester component

1. I already created it: mobile/src/components/TokenTester.js
2. Add to ProfileScreen temporarily
3. Login and tap button
4. Token shows in alert + console
5. Copy and use for testing
6. Remove component before production

Easy, visual, and reliable! ✅

