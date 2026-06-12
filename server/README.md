# KissanEbazzar API Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [User Location](#user-location-endpoints)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)

## Overview

KissanEbazzar is a phone OTP-based authentication system with integrated location services. Users can register/login using their phone number, receive OTP via SMS or WhatsApp depending on the configured provider, and set their location for location-based features.

## Features

✅ **OTP Authentication**
- Phone number verification via SMS or WhatsApp
- Secure OTP generation and validation
- Rate limiting and attempt tracking
- JWT token-based authentication

✅ **Location Management**
- One-time location setup during onboarding
- GPS-based current location capture
- Manual address entry option
- Find nearby users within radius
- Location privacy controls

✅ **Security Features**
- Bcrypt password hashing for OTPs
- JWT token authentication
- Rate limiting (1 OTP per minute)
- Maximum 3 OTP attempts before blocking
- Transaction-based database operations

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT, Bcrypt
- **Messaging**: Twilio SMS / WhatsApp API, Message Central
- **Geocoding**: OpenStreetMap Nominatim (free)
- **Environment**: dotenv for configuration

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- Twilio account with SMS enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/dipakgit123/kissanEbazzarNew.git
cd kissanEbazzarNew/server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configurations

# Run database migrations
npx sequelize-cli db:migrate

# Start the server
npm start
```

## Environment Variables

Create a `.env` file in the server directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kissanebazzar
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=7d

# OTP provider
OTP_PROVIDER=twilio-sms
OTP_LOCAL_CHANNEL=sms

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OTP Settings
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=5

# Optional Geocoding
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 1. Send OTP
Sends OTP to the user's configured delivery channel.

**Endpoint:** `POST /api/auth/send-otp`

**Request Body:**
```json
{
  "phoneNumber": "+919876543210"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully via sms",
  "expiresIn": "5 minutes"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Please wait 1 minute before requesting a new OTP"
}
```

---

#### 2. Verify OTP
Verifies the OTP and returns JWT token.

**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "phoneNumber": "+919876543210",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "user": {
    "id": 1,
    "phone_number": "+919876543210",
    "is_verified": true,
    "hasLocation": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requiresLocation": true
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Invalid OTP. 2 attempts remaining"
}
```

---

#### 3. Resend OTP
Resends OTP to the registered phone number using the active provider.

**Endpoint:** `POST /api/auth/resend-otp`

**Request Body:**
```json
{
  "phoneNumber": "+919876543210"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully via sms",
  "expiresIn": "5 minutes"
}
```

---

#### 4. Get User Profile
Get authenticated user's profile information.

**Endpoint:** `GET /api/auth/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "phone_number": "+919876543210",
    "email": null,
    "is_verified": true,
    "verified_at": "2024-10-10T10:30:00Z",
    "latitude": "19.0760",
    "longitude": "72.8777",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "created_at": "2024-10-10T10:25:00Z",
    "updated_at": "2024-10-10T10:30:00Z"
  }
}
```

---

### User Location Endpoints

All location endpoints require authentication (Bearer token).

#### 1. Set Location from GPS (One-time)
Set user location using GPS coordinates during initial setup.

**Endpoint:** `POST /api/location/set/current`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "latitude": 19.0760,
  "longitude": 72.8777
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Location set successfully",
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "address": "Mumbai, Maharashtra, India",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "postal_code": "400001"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Location already set. Use update endpoint to change location.",
  "hasLocation": true
}
```

---

#### 2. Set Location Manually (One-time)
Set user location by entering address manually.

**Endpoint:** `POST /api/location/set/manual`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "postal_code": "400001"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Location set successfully",
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "postal_code": "400001"
  }
}
```

---

#### 3. Update Location
Update existing user location.

**Endpoint:** `PUT /api/location/update`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body (GPS):**
```json
{
  "type": "current",
  "latitude": 19.0760,
  "longitude": 72.8777
}
```

**Request Body (Manual):**
```json
{
  "type": "manual",
  "address": "456 New Street",
  "city": "Pune",
  "state": "Maharashtra",
  "country": "India",
  "postal_code": "411001"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "address": "456 New Street, Pune, Maharashtra",
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    "postal_code": "411001"
  }
}
```

---

#### 4. Get User Location
Get current user's location information.

**Endpoint:** `GET /api/location/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "hasLocation": true,
  "location": {
    "latitude": "19.0760",
    "longitude": "72.8777",
    "address": "Mumbai, Maharashtra, India",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "postal_code": "400001",
    "location_type": "current",
    "set_at": "2024-10-10T10:35:00Z"
  }
}
```

---

#### 5. Check Location Status
Check if user has location set.

**Endpoint:** `GET /api/location/status`

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "hasLocation": true,
  "locationSetAt": "2024-10-10T10:35:00Z"
}
```

---

#### 6. Get Nearby Users
Find users within specified radius.

**Endpoint:** `GET /api/location/nearby?radius=10`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `radius` (optional): Search radius in kilometers (default: 10)

**Success Response (200):**
```json
{
  "success": true,
  "count": 3,
  "radius": 10,
  "users": [
    {
      "id": 2,
      "phone_number": "+919876543211",
      "distance": 2.5,
      "city": "Mumbai",
      "state": "Maharashtra"
    },
    {
      "id": 3,
      "phone_number": "+919876543212",
      "distance": 5.8,
      "city": "Thane",
      "state": "Maharashtra"
    }
  ]
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  otp VARCHAR(255),
  otp_expiry TIMESTAMP,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  otp_attempts INTEGER DEFAULT 0,
  last_otp_sent_at TIMESTAMP,
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMP,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  location_type VARCHAR(10),
  location_set_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### OTP Logs Table
```sql
CREATE TABLE otp_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  otp_code VARCHAR(10),
  action VARCHAR(20),
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  twilio_message_sid VARCHAR(100),
  error_message VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors, invalid input)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

### Common Error Responses

**Invalid Phone Number:**
```json
{
  "success": false,
  "message": "Invalid phone number format. Use E.164 format (e.g., +1234567890)"
}
```

**Rate Limiting:**
```json
{
  "success": false,
  "message": "Please wait 1 minute before requesting a new OTP"
}
```

**Max Attempts Exceeded:**
```json
{
  "success": false,
  "message": "Maximum OTP attempts exceeded. Account blocked for 30 minutes"
}
```

**Token Expired:**
```json
{
  "success": false,
  "message": "Token expired. Please login again."
}
```

## Rate Limiting & Security

- **OTP Request**: 1 request per minute per phone number
- **OTP Attempts**: Maximum 3 attempts, then 30-minute block
- **OTP Expiry**: 5 minutes
- **JWT Token Expiry**: 7 days
- **Password Hashing**: Bcrypt with salt rounds
- **Database Transactions**: All critical operations use transactions

## Testing with Postman

Import the following collection to test all endpoints:

```json
{
  "info": {
    "name": "KissanEbazzar API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please create an issue on GitHub or contact the development team.
