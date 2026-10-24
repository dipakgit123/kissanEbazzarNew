# Kissan Ebazzar API

Node/Express API for the Kissan Ebazzar web and Expo mobile apps.

## Production dependency and upload updates

- Use Node 20.19 or newer and install from the committed lockfiles with `npm ci` (backend: `npm ci --omit=dev`). Build the frontend with its development dependencies available. Restart existing Node/Vite processes after upgrading dependencies.
- The Sequelize-only UUID override keeps the patched CommonJS-compatible 11.x release. Do not use `npm audit fix --force` to downgrade Sequelize. bcrypt compatibility and email generation are covered by `npm run production:test` without contacting a database or SMTP service.
- Both Nginx configurations now allow 160 MiB requests: at most six files of 25 MiB each, plus bounded fields and multipart overhead. Veterinarian documents retain their smaller 6 MiB per-file limit; AI health and profile-photo limits are unchanged. Existing web and mobile clients can keep sending their current multipart fields.
- Listing/registration uploads use isolated temporary directories and stream to S3 with one 5 MiB multipart buffer per file. At most two such requests run per Node process; additional requests get HTTP 429 and `Retry-After: 5`. Temporary files are removed on success, failure and disconnect. Ensure the OS temporary directory is writable and has adequate disk space; monitor both that directory and Nginx's request-body temporary directory. OS maintenance should remove abandoned temporary files after a process or host crash.
- Install the updated Nginx configuration, validate it with `nginx -t`, then reload Nginx. Rebuild/redeploy the frontend and restart the backend. No database migration is required for these dependency, upload, logging or error-response changes.
- Production warnings/errors go to stdout/stderr for PM2/systemd collection with credential redaction. Milk-advice errors preserve only allowlisted public codes; internal provider payloads stay hidden.

Validation: `npm run production:test` uses loopback HTTP and mocked storage only. It covers upload limits, cleanup, concurrency, S3 streaming, production logging/error responses, password hashes and email generation. Recheck both projects with `npm audit --omit=dev` before each deployment.

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
