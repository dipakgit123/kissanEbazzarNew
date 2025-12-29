# Profile Completion Implementation - First Time Login Flow

## Overview
Implemented a complete first-time user login flow that collects full name and pincode after OTP verification, then automatically fetches location details from the pincode.

## New User Flow

### For First-Time Users:
1. **OTP Login** → Mobile number and OTP verification
2. **Profile Completion** → User enters full name and pincode
3. **Automatic Location Fetch** → System fetches city, state, country, and coordinates from pincode
4. **Save to Database** → All information stored in user record
5. **Redirect to Home** → User can start using the app

### For Returning Users:
1. **OTP Login** → Mobile number and OTP verification
2. **Direct to Home** → No profile completion needed

## Backend Changes

### 1. Database Schema
**File**: `server/src/models/User.js`
- Added `full_name` field (VARCHAR 255)

**Migration**: `server/src/migrations/20250101000000-add-fullname-to-users.js`
- Migration successfully run to add full_name column to users table

### 2. Geocoding Service
**File**: `server/src/services/geocodingService.js`

Features:
- Fetches location from Indian pincodes using India Post API
- Falls back to OpenStreetMap Nominatim for international postal codes
- Returns: latitude, longitude, city, state, country, address
- Gracefully handles API failures

APIs used:
- India Post API: `https://api.postalpincode.in/pincode/{pincode}`
- Nominatim (OSM): `https://nominatim.openstreetmap.org/search`

### 3. Auth Controller Updates
**File**: `server/src/controllers/authController.js`

#### Modified `verifyOTP` method:
```javascript
// Returns additional flags
{
  requiresProfileCompletion: true/false,  // First-time login check
  requiresLocation: true/false,           // Location setup check
  user: {
    full_name: string,
    isFirstTimeLogin: boolean
  }
}
```

#### New `completeProfile` method:
- Protected route (requires authentication)
- Validates full_name (min 2 characters)
- Validates postal_code (min 4 characters)
- Fetches location from pincode using geocoding service
- Updates user record with name and location data

### 4. Routes
**File**: `server/src/routes/authRoutes.js`

New route:
```javascript
POST /api/auth/complete-profile
Headers: Authorization: Bearer {token}
Body: {
  full_name: string,
  postal_code: string
}
```

## Frontend Changes

### 1. Profile Completion Component
**File**: `frontend/src/components/ProfileCompletion.jsx`

Features:
- Beautiful UI matching the login form design
- Full name input with validation (min 2 characters)
- Pincode/postal code input with validation (min 4 characters)
- Informative banner explaining why information is needed
- Real-time validation with error messages
- Automatic location fetching from pincode
- Loading states during API calls

### 2. API Service
**File**: `frontend/src/services/api.js`

New service:
```javascript
export const userService = {
  completeProfile: async (profileData) => { ... },
  getProfile: async () => { ... }
}
```

### 3. App Routing
**File**: `frontend/src/App.jsx`

Modified flow:
```javascript
handleLoginSuccess(response) {
  if (response.requiresProfileCompletion) {
    → Redirect to /profile-completion
  } else if (response.requiresLocation) {
    → Redirect to /location-setup
  } else {
    → Redirect to home
  }
}
```

New route added:
```javascript
<Route
  path="/profile-completion"
  element={<ProfileCompletion onComplete={handleProfileComplete} />}
/>
```

## Data Flow

### First-Time Login:
```
User enters mobile number
  ↓
OTP sent via Twilio
  ↓
User enters OTP
  ↓
Backend verifies OTP
  ↓
Backend checks: full_name exists? postal_code exists?
  ↓ (No → First-time user)
Frontend receives: { requiresProfileCompletion: true }
  ↓
Redirect to /profile-completion
  ↓
User enters: Full Name + Pincode
  ↓
POST /api/auth/complete-profile
  ↓
Backend calls geocoding service with pincode
  ↓
Geocoding returns: city, state, country, lat/lng
  ↓
Backend updates user record:
  - full_name
  - postal_code
  - latitude, longitude
  - city, state, country
  - address
  - location_type
  - location_set_at
  ↓
Success response sent
  ↓
Frontend redirects to home page
```

### Returning User Login:
```
User enters mobile number
  ↓
OTP sent via Twilio
  ↓
User enters OTP
  ↓
Backend verifies OTP
  ↓
Backend checks: full_name exists? postal_code exists?
  ↓ (Yes → Returning user)
Frontend receives: { requiresProfileCompletion: false }
  ↓
Direct redirect to home page
```

## Database Fields Updated

When profile is completed, the following fields are set:

```javascript
{
  full_name: "User's Full Name",
  postal_code: "123456",
  latitude: 28.7041,        // From geocoding API
  longitude: 77.1025,       // From geocoding API
  city: "New Delhi",        // From geocoding API
  state: "Delhi",           // From geocoding API
  country: "India",         // From geocoding API
  address: "Full address",  // From geocoding API
  location_type: "manual",  // Set to 'manual' for pincode-based
  location_set_at: Date     // Current timestamp
}
```

## Error Handling

### Geocoding Failures:
If geocoding API fails, the system:
- Continues with profile completion
- Saves full_name and postal_code
- Sets location fields to NULL
- User can manually set location later

### Validation Errors:
- Full name: Must be at least 2 characters
- Postal code: Must be at least 4 characters
- Clear error messages displayed to user

## Testing Checklist

- [x] Database migration runs successfully
- [x] New user can login with OTP
- [x] Profile completion page appears for first-time users
- [x] Full name validation works
- [x] Pincode validation works
- [x] Geocoding service fetches location from Indian pincode
- [x] User data saved to database
- [x] Returning users skip profile completion
- [x] All routes properly configured

## Dependencies Added

Backend:
- `axios` - For geocoding API calls

## Files Created

1. `server/src/models/User.js` - Modified (added full_name field)
2. `server/src/migrations/20250101000000-add-fullname-to-users.js` - New migration
3. `server/src/services/geocodingService.js` - New geocoding service
4. `server/src/controllers/authController.js` - Modified (added completeProfile method)
5. `server/src/routes/authRoutes.js` - Modified (added /complete-profile route)
6. `frontend/src/components/ProfileCompletion.jsx` - New component
7. `frontend/src/services/api.js` - Modified (added userService)
8. `frontend/src/App.jsx` - Modified (added profile completion flow)

## API Endpoints

### POST /api/auth/complete-profile
**Protected route** (requires JWT token)

Request:
```json
{
  "full_name": "John Doe",
  "postal_code": "110001"
}
```

Response:
```json
{
  "success": true,
  "message": "Profile completed successfully",
  "location": {
    "city": "New Delhi",
    "state": "Delhi",
    "country": "India",
    "postal_code": "110001",
    "hasLocation": true
  }
}
```

## Notes

- The system uses India Post API for Indian pincodes (6 digits)
- Falls back to OpenStreetMap Nominatim for other postal codes
- Location data is cached in the user record
- First-time login detection is based on presence of full_name and postal_code
- All changes are backward compatible with existing users

## Future Enhancements

1. Add profile picture upload during profile completion
2. Add language selection during profile completion
3. Cache geocoding results to reduce API calls
4. Add manual location override option
5. Support for multiple addresses per user
6. Email verification flow
