# Kissan E-Bazzar Mobile App

React Native mobile app for Kissan E-Bazzar - A farmers marketplace for buying and selling animals.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Navigate to the mobile folder:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the API URL:
   - Open `src/services/api.js`
   - Update the `API_URL` to point to your backend server:
     - For Android Emulator: `http://10.0.2.2:5000`
     - For iOS Simulator: `http://localhost:5000`
     - For Physical Device: `http://YOUR_COMPUTER_IP:5000`

## Running the App

### Start the development server:
```bash
npm start
# or
expo start
```

### Run on specific platform:
```bash
# Android
npm run android

# iOS (macOS only)
npm run ios

# Web
npm run web
```

## Project Structure

```
mobile/
├── App.js                    # Main entry point
├── app.json                  # Expo configuration
├── package.json              # Dependencies
├── assets/                   # App icons and images
└── src/
    ├── components/           # Reusable UI components
    │   └── AnimalCard.js
    ├── context/              # React Context providers
    │   └── AuthContext.js
    ├── navigation/           # Navigation setup
    │   └── AppNavigator.js
    ├── screens/              # App screens
    │   ├── LoginScreen.js
    │   ├── OTPVerificationScreen.js
    │   ├── ProfileCompletionScreen.js
    │   ├── HomeScreen.js
    │   ├── AnimalDetailScreen.js
    │   ├── ProfileScreen.js
    │   └── SellAnimalScreen.js
    ├── services/             # API services
    │   └── api.js
    └── utils/                # Utility functions
        └── constants.js
```

## Features

- **Authentication**: Phone number login with OTP verification
- **Home Screen**: Browse featured and nearby animal listings
- **Animal Detail**: View complete details of an animal listing
- **Profile Management**: View and edit user profile, upload photo
- **Sell Animals**: List your animals for sale (6 categories supported)
- **Search & Filter**: Search by breed, type, or location

## Backend Connection

This app connects to the same backend as the web frontend. Make sure:

1. The backend server is running on port 5000
2. The API URL in `src/services/api.js` is correctly configured
3. Your firewall allows connections to the backend

## Supported Animal Categories

- Cow
- Buffalo
- Horse
- Goat
- Dog
- Cat

## Building for Production

### Android:
```bash
expo build:android
# or
eas build --platform android
```

### iOS:
```bash
expo build:ios
# or
eas build --platform ios
```

## Troubleshooting

### Connection Issues
- Make sure your phone and computer are on the same network
- Check if the backend server is running
- Verify the API URL is correct for your platform

### OTP Not Receiving
- Check backend SMS configuration
- Verify phone number format (should be 10 digits without country code)

### Images Not Loading
- Check Cloudinary configuration in backend
- Verify image URLs are accessible

## Tech Stack

- React Native with Expo
- React Navigation (Stack + Bottom Tabs)
- Axios for API calls
- AsyncStorage for local storage
- Expo Location for geolocation
- Expo Image Picker for photo uploads
