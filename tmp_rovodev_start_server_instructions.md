# Instructions to Start the Server and Test Other Animal Listing

## Problem Summary
The "Other Animal Listing" error occurs because:
1. **Server is NOT running** - The backend server needs to be started on port 5000
2. **Cloudinary function signature was incorrect** - Fixed ✓

## Issue Fixed
✅ Updated `uploadToCloudinary` function to accept 3 parameters: (file, folder, resourceType)

## Steps to Fix and Test

### 1. Start the Backend Server
```bash
cd server
npm start
```

Or for development with auto-reload:
```bash
cd server
npm run dev
```

**Expected Output:**
```
╔══════════════════════════════════════════════╗
║   🚀 Server is running on port 5000         ║
║   📱 WhatsApp OTP Service with Sequelize    ║
║   📍 Location Services Enabled               ║
║   🐄 Animal Marketplace Active              ║
╚══════════════════════════════════════════════╝
```

### 2. Verify Server is Running
```bash
curl http://192.168.15.146:5000/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "database": "Connected",
  "timestamp": "..."
}
```

### 3. Test the Other Animal Listing Form
1. Open the mobile app
2. Navigate to "Sell Animal" → "Other Animals"
3. Fill in the form with test data:
   - Animal Type: Select any (e.g., Sheep)
   - Breed Name: Test Breed
   - Age: 2 years
   - Gender: Male
   - Expected Price: 10000
   - Upload at least one photo
4. Submit the form

### 4. Expected Result
- ✅ Form submits successfully
- ✅ Photos upload to Cloudinary
- ✅ Listing is created in database
- ✅ Success message appears

## Technical Details

### What Was Fixed
**File:** `server/src/config/cloudinary.js`

**Before:**
```javascript
const uploadToCloudinary = async (file, resourceType = 'image') => {
  // folder was hardcoded based on resourceType
  folder: resourceType === 'video' ? 'animal-listings/videos' : 'animal-listings/images'
}
```

**After:**
```javascript
const uploadToCloudinary = async (file, folder = 'animal-listings/images', resourceType = 'image') => {
  // folder is now a parameter that can be customized
  folder: folder
}
```

This allows controllers to specify custom folders like:
- `other-animals/front-photos`
- `other-animals/side-photos`
- `other-animals/videos`

## If Server Won't Start

### Check for Port Conflicts
```powershell
Get-NetTCPConnection | Where-Object {$_.LocalPort -eq 5000 -and $_.State -eq 'Listen'}
```

If port 5000 is in use, stop the conflicting process or change the PORT in `.env`

### Check Environment Variables
Ensure `server/.env` has:
```
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Check Dependencies
```bash
cd server
npm install
```
