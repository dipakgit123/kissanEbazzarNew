# Kissan Ebazzar Mobile App

Expo React Native app for Kissan Ebazzar farmer, marketplace, veterinarian, notification, and appointment workflows.

## Setup

```bash
cd mobile
npm install
copy .env.example .env
```

Set the backend URL in `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_PUSH_PROVIDER=firebase
EXPO_PUBLIC_ALLOW_CLEARTEXT=true
```

For Android physical devices, use your computer or server IP instead of `localhost`.

## Development

```bash
npm start
npm run android
npm run ios
```

## Production Builds

```bash
npx eas build --platform android --profile production
```

Production and preview builds should use an HTTPS API URL. Cleartext HTTP is disabled by default in the Android config plugin; set `EXPO_PUBLIC_ALLOW_CLEARTEXT=true` only for development builds that need a local HTTP backend.

## Configuration

- Runtime config is merged in `app.config.js`.
- Default Expo config lives in `app.json`.
- EAS profile env vars live in `eas.json`; replace the placeholder production API URL with the deployed HTTPS backend before release.
- Push notifications support Firebase FCM on Android and Expo push tokens as fallback.
- Notification taps route to listings, appointments, calls, or pregnancy records from foreground, background, and cold start states.
- Farmers and veterinarians have separate inboxes, badges, device-token ownership, and server-synced category preferences.
- Remote push registration requires a physical device and an Expo development or production build; Android Expo Go does not support it.
- Uploaded media is handled by the backend storage configuration, currently AWS S3 compatible env vars.

## Checks

```bash
npx expo config --type public
npx expo export --platform android
```

The mobile JavaScript source can also be syntax-checked with Node for quick smoke validation.
