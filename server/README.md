# Kissan Ebazzar API

Node/Express API for the Kissan Ebazzar web and Expo mobile apps.

## Features

- OTP authentication for users and JWT authentication for users, admins, and veterinarians.
- Farmer profile and location management.
- Animal listings, wishlist, contact, reports, and moderation workflows.
- Veterinarian registration, approval, reviews, call logs, appointments, and vet notifications.
- Pregnancy calendar, milk reports, pet mating, government schemes, blogs, and support contact flows.
- Push notifications through Firebase Cloud Messaging and Expo push tokens.
- Media uploads through AWS S3 compatible storage.

## Setup

```bash
cd server
npm install
copy .env.example .env
npx sequelize-cli db:migrate
npm start
```

The API runs on `http://localhost:5000/api` by default.

## Common Environment Variables

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=kissanebazzar
DB_USER=your_db_user
DB_PASSWORD=your_db_password

JWT_SECRET=change_this_secret
JWT_EXPIRE=7d

OTP_PROVIDER=twilio-sms
OTP_LOCAL_CHANNEL=sms
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your_bucket

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NOTIFICATION_TIMEZONE=Asia/Kolkata
```

## Checks

```bash
node --check server.js
node --check test-notifications.js
npm run notification:test
```

Run migrations after pulling backend schema changes. The notification migrations add user/veterinarian recipients, delivery deduplication, preferences, scheduled-reminder state, and device-token health fields.
