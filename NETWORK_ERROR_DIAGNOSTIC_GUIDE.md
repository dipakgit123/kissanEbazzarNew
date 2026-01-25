# Network Error Diagnostic Guide

## Current Status

✅ **Server is running** on port 5000
✅ **Server is listening** on all network interfaces (0.0.0.0:5000)
✅ **Timeout increased** from 30s to 60s
✅ **Body size limit increased** to 50mb
✅ **Better error logging** added to CowListingForm
✅ **Authentication check** added (shows token exists: true)
✅ **IP address is correct** (192.168.15.146)

## The Issue

You're seeing:
```
[COW LISTING] Submitting to: /api/animals/listings
[COW LISTING] Token exists: true
[COW LISTING] Error: Network Error
```

This means:
- ✅ User is logged in (token exists)
- ✅ Form validation passed
- ✅ Request is being sent
- ❌ Request is failing before reaching the server

## Most Likely Causes

### 1. **Mobile Device Not on Same WiFi Network** 🔴
**Problem**: Your mobile device might not be on the same WiFi network as your computer.

**How to Check**:
- On your mobile device, go to WiFi settings
- Check the network name (SSID)
- Compare with your computer's WiFi network
- They MUST be the same

**Solution**: Connect both devices to the same WiFi network.

---

### 2. **Firewall Blocking Connection** 🔴
**Problem**: Windows Firewall might be blocking incoming connections on port 5000.

**How to Fix**:
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Animal Bazaar API" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

**Or manually**:
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Choose "Port" → TCP → Port 5000
5. Allow the connection

---

### 3. **VPN or Network Proxy Active** 🔴
**Problem**: VPN or proxy might be blocking local network connections.

**Solution**: Temporarily disable VPN/proxy and try again.

---

### 4. **React Native Debugger or Metro Bundler Issue** 🟡
**Problem**: Sometimes React Native's network layer gets stuck.

**Solution**:
1. Close the mobile app completely (swipe away from recent apps)
2. Stop Metro bundler
3. Clear cache: `cd mobile && npm start -- --reset-cache`
4. Reopen the app

---

### 5. **Large Image Size** 🟡
**Problem**: If images are too large, the upload might timeout or fail.

**Solution**: Try with smaller images first (under 1MB).

---

## Detailed Debugging Steps

### Step 1: Verify Server is Accessible from Mobile

On your mobile device browser, open:
```
http://192.168.15.146:5000/health
```

**Expected Result**: You should see JSON like:
```json
{
  "status": "OK",
  "message": "Server is running",
  "database": "Connected"
}
```

**If this fails**: The issue is network connectivity, not the app.

---

### Step 2: Check the New Error Logs

With the updated code, you should now see MORE detailed error logs:

```
❌ [COW LISTING] Full Error: [error object]
❌ [COW LISTING] Error Response: [response data]
❌ [COW LISTING] Error Status: [status code]
❌ [COW LISTING] Error Message: [message]
❌ [COW LISTING] Error Code: [code]
```

**Please share these logs!** They will tell us exactly what's failing.

---

### Step 3: Test with Minimal Data

Try submitting a listing with:
- Only required fields filled
- Only ONE small photo (under 500KB)
- No video
- Minimal text

This will help determine if it's a data size issue.

---

### Step 4: Check Axios Configuration

The mobile app now has:
- ✅ 60 second timeout (up from 30)
- ✅ Automatic token injection
- ✅ Better error messages

If you're still seeing "Network Error" with NO additional details, it means:
1. The request isn't reaching the server at all
2. It's a network layer issue (firewall, WiFi, etc.)

---

## Quick Fixes to Try

### Fix 1: Restart Everything
```bash
# Stop server
# Close mobile app completely
# Restart computer (if needed)
# Start server
cd server
node server.js

# Start mobile app
cd mobile
npm start
```

### Fix 2: Use Computer's Actual IP
Sometimes the IP changes. Get the current IP:
```powershell
ipconfig | Select-String "IPv4.*192.168"
```

If it's different from 192.168.15.146, update `mobile/src/services/api.js`.

### Fix 3: Test from Another Device
Try accessing the server from another device on the same network to rule out device-specific issues.

### Fix 4: Check React Native Network Inspector
In React Native Debugger:
1. Open Network tab
2. Try submitting the form
3. Look for the request
4. Check request headers, body, and error details

---

## What the New Error Messages Mean

### "Request timeout"
```
error.code === 'ECONNABORTED'
```
- Request took longer than 60 seconds
- Possible causes: Large files, slow network, server overload

### "Network Error"
```
error.message === 'Network Error'
```
- Cannot reach the server at all
- Possible causes: Wrong IP, different WiFi, firewall, server down

### "401 Unauthorized"
```
error.response.status === 401
```
- Token is invalid or expired
- Solution: Logout and login again

### Other Status Codes
- **400**: Bad request (invalid data)
- **500**: Server error (check server logs)
- **413**: Request too large (reduce file sizes)

---

## Next Steps

### 1. Try Submitting Again
The app now has better error handling. Submit a listing and check:
- The detailed error logs in the console
- The error message shown to the user

### 2. Test Server Access from Mobile Browser
Open `http://192.168.15.146:5000/health` in your mobile browser.

### 3. Share the Logs
Copy and share ALL the error logs that appear, especially:
- Error Code
- Error Message  
- Error Response
- Error Status

### 4. Check Firewall
Add firewall rule for port 5000 if not already done.

---

## Server Status Commands

**Check if server is running**:
```powershell
Test-NetConnection -ComputerName 192.168.15.146 -Port 5000
```

**Check server process**:
```powershell
Get-Process -Name node
```

**View server logs**:
Watch the terminal where `node server.js` is running.

**Test server endpoint**:
```powershell
Invoke-WebRequest -Uri "http://192.168.15.146:5000/health"
```

---

## Expected Successful Flow

When everything works correctly:

```
📤 [COW LISTING] Submitting to: /api/animals/listings
🔑 [COW LISTING] Token exists: true
👤 [COW LISTING] User: Logged in
✅ [COW LISTING] Success: { success: true, data: {...} }
```

Server logs should show:
```
POST /api/animals/listings 201 - - 1234 ms
```

User sees:
```
Alert: "Listing created successfully!"
```

---

## Important Notes

1. **Keep server running** while testing the mobile app
2. **Both devices must be on the same WiFi**
3. **Firewall must allow port 5000**
4. **Token must be valid** (login if needed)
5. **Images should be reasonable size** (under 5MB each)

---

## Contact Me With

When you test again, please provide:

1. ✅ All console error logs (the new detailed ones)
2. ✅ Result of opening `http://192.168.15.146:5000/health` in mobile browser
3. ✅ Confirmation both devices are on same WiFi
4. ✅ Image sizes you're trying to upload
5. ✅ Any error message shown in the Alert

This will help me pinpoint the exact issue! 🎯
