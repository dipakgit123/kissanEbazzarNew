# Goat Listing API Documentation

Complete API documentation for Goat listing endpoints with request/response examples.

---

## Base URL
```
http://localhost:5000/api/goats
```

---

## Authentication
Protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Table of Contents
1. [Create Goat Listing](#1-create-goat-listing) - POST `/listings` 🔒
2. [Get All Goat Listings](#2-get-all-goat-listings) - GET `/listings` 🌐
3. [Get Goat Listing by ID](#3-get-goat-listing-by-id) - GET `/listings/:id` 🌐
4. [Get Nearby Goat Listings](#4-get-nearby-goat-listings) - GET `/listings/nearby` 🌐
5. [Get My Goat Listings](#5-get-my-goat-listings) - GET `/my-listings` 🔒
6. [Update Goat Listing](#6-update-goat-listing) - PUT `/listings/:id` 🔒
7. [Delete Goat Listing](#7-delete-goat-listing) - DELETE `/listings/:id` 🔒
8. [Mark Goat as Sold](#8-mark-goat-as-sold) - PATCH `/listings/:id/sold` 🔒

🔒 = Protected (Auth Required) | 🌐 = Public

---

## 1. Create Goat Listing

**Endpoint:** `POST /api/goats/listings`
**Access:** Protected (Authentication Required)
**Content-Type:** `multipart/form-data`

### Request Body (Form Data)

#### Required Fields:
```javascript
{
  // 1. Goat Details / शेळीची माहिती
  "goatType": "female",                      // Enum: male, female
  "breedName": "Sirohi",                     // String (2-100 chars) - e.g., Sirohi, Jamunapari, Barbari, Beetal
  "age": "2 years",                          // String - in months or years
  "weight": "45.5",                          // Number (0-200 kg)
  "color": "White",                          // String
  "hornType": "with_horns",                  // Enum: with_horns, without_horns
  "healthStatus": "healthy",                 // Enum: healthy, under_treatment, vaccinated
  "purpose": "milk",                         // Enum: milk, meat, breeding, pet

  // 4. Pricing
  "expectedPrice": "15000",                  // Number (positive)
  "isNegotiable": "true",                    // Boolean (true/false)

  // 5. Terms & Confirmation
  "detailsConfirmed": "true",                // Boolean (true/false) - I confirm all details are true
  "termsAccepted": "true"                    // Boolean (true/false) - I agree to listing terms
}
```

#### Optional Fields:
```javascript
{
  // 1. Goat Details (continued)
  "description": "Calm nature, high milk yield",  // Text - Additional information

  // 2. Production Info (for female goats) / उत्पादन माहिती
  "milkCapacity": "2.5",                     // Number (liters per day)
  "lastDeliveryDate": "2024-06-15",          // Date (YYYY-MM-DD format)
  "numberOfKidsDelivered": "3",              // Integer

  // 3. Images / छायाचित्रे
  "photo1": <File>,                          // Image file (Max 5MB, JPEG/PNG/WebP)
  "photo2": <File>,                          // Image file (Max 5MB, JPEG/PNG/WebP)
  "photo3": <File>,                          // Image file (Max 5MB, JPEG/PNG/WebP)
  "photo4": <File>,                          // Image file (Max 5MB, JPEG/PNG/WebP)
  "photo5": <File>,                          // Image file (Max 5MB, JPEG/PNG/WebP)
  "video": <File>,                           // Video file (Max 25MB, MP4/MOV/AVI/WebM)

  // Location
  "latitude": "18.5204",                     // Decimal (-90 to 90)
  "longitude": "73.8567",                    // Decimal (-180 to 180)
  "city": "Pune",                            // String
  "state": "Maharashtra",                    // String
  "pincode": "411001"                        // String (10 chars max)
}
```

### Example Request (JavaScript/Axios)

```javascript
const formData = new FormData();

// Required fields
formData.append('goatType', 'female');
formData.append('breedName', 'Sirohi');
formData.append('age', '2 years');
formData.append('weight', '45.5');
formData.append('color', 'White');
formData.append('hornType', 'with_horns');
formData.append('healthStatus', 'healthy');
formData.append('purpose', 'milk');
formData.append('expectedPrice', '15000');
formData.append('isNegotiable', 'true');
formData.append('detailsConfirmed', 'true');
formData.append('termsAccepted', 'true');

// Optional fields - Production Info
formData.append('description', 'Calm nature, high milk yield');
formData.append('milkCapacity', '2.5');
formData.append('lastDeliveryDate', '2024-06-15');
formData.append('numberOfKidsDelivered', '3');

// Optional - Location
formData.append('city', 'Pune');
formData.append('state', 'Maharashtra');
formData.append('pincode', '411001');
formData.append('latitude', '18.5204');
formData.append('longitude', '73.8567');

// Photos (min 1, max 5)
formData.append('photo1', photo1File);
formData.append('photo2', photo2File);
formData.append('photo3', photo3File);
formData.append('video', videoFile);

// Make request
const response = await axios.post('http://localhost:5000/api/goats/listings', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

### Example Request (cURL)

```bash
curl -X POST http://localhost:5000/api/goats/listings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "goatType=female" \
  -F "breedName=Sirohi" \
  -F "age=2 years" \
  -F "weight=45.5" \
  -F "color=White" \
  -F "hornType=with_horns" \
  -F "healthStatus=healthy" \
  -F "purpose=milk" \
  -F "expectedPrice=15000" \
  -F "isNegotiable=true" \
  -F "detailsConfirmed=true" \
  -F "termsAccepted=true" \
  -F "description=Calm nature, high milk yield" \
  -F "milkCapacity=2.5" \
  -F "lastDeliveryDate=2024-06-15" \
  -F "numberOfKidsDelivered=3" \
  -F "city=Pune" \
  -F "state=Maharashtra" \
  -F "pincode=411001" \
  -F "photo1=@/path/to/photo1.jpg" \
  -F "photo2=@/path/to/photo2.jpg" \
  -F "video=@/path/to/video.mp4"
```

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Goat listing created successfully",
  "data": {
    "id": 1,
    "user_id": 123,
    "goatType": "female",
    "breedName": "Sirohi",
    "age": "2 years",
    "weight": "45.50",
    "color": "White",
    "hornType": "with_horns",
    "healthStatus": "healthy",
    "purpose": "milk",
    "description": "Calm nature, high milk yield",
    "milkCapacity": "2.50",
    "lastDeliveryDate": "2024-06-15",
    "numberOfKidsDelivered": 3,
    "photo1": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/abc.jpg",
    "photo1PublicId": "goat-listings/images/abc",
    "photo2": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/def.jpg",
    "photo2PublicId": "goat-listings/images/def",
    "photo3": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/ghi.jpg",
    "photo3PublicId": "goat-listings/images/ghi",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/goat-listings/videos/jkl.mp4",
    "videoPublicId": "goat-listings/videos/jkl",
    "expectedPrice": "15000.00",
    "isNegotiable": true,
    "detailsConfirmed": true,
    "termsAccepted": true,
    "latitude": "18.52040000",
    "longitude": "73.85670000",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
    "status": "active",
    "views": 0,
    "created_at": "2025-01-13T10:30:00.000Z",
    "updated_at": "2025-01-13T10:30:00.000Z"
  }
}
```

### Error Responses

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Goat type must be either male or female",
      "param": "goatType",
      "location": "body"
    },
    {
      "msg": "Details confirmation is required",
      "param": "detailsConfirmed",
      "location": "body"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "No token provided"
}
```

---

## 2. Get All Goat Listings

**Endpoint:** `GET /api/goats/listings`
**Access:** Public (No Authentication Required)

### Query Parameters (All Optional)

```javascript
{
  // Pagination
  "page": 1,                          // Default: 1
  "limit": 10,                        // Default: 10

  // Filters
  "city": "Pune",                     // Filter by city (case-insensitive)
  "state": "Maharashtra",             // Filter by state (case-insensitive)
  "minPrice": "5000",                 // Minimum price
  "maxPrice": "20000",                // Maximum price
  "goatType": "female",               // male, female
  "purpose": "milk",                  // milk, meat, breeding, pet
  "healthStatus": "healthy",          // healthy, under_treatment, vaccinated
  "hornType": "with_horns",           // with_horns, without_horns

  // Sorting
  "sortBy": "created_at",             // Fields: created_at, expectedPrice, views
  "sortOrder": "DESC"                 // ASC or DESC
}
```

### Example Request (JavaScript/Axios)

```javascript
const response = await axios.get('http://localhost:5000/api/goats/listings', {
  params: {
    page: 1,
    limit: 10,
    city: 'Pune',
    minPrice: 5000,
    maxPrice: 20000,
    goatType: 'female',
    purpose: 'milk',
    healthStatus: 'healthy',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  }
});
```

### Example Request (cURL)

```bash
curl -X GET "http://localhost:5000/api/goats/listings?page=1&limit=10&city=Pune&minPrice=5000&maxPrice=20000&goatType=female&purpose=milk&healthStatus=healthy&sortBy=created_at&sortOrder=DESC"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": 1,
        "user_id": 123,
        "goatType": "female",
        "breedName": "Sirohi",
        "age": "2 years",
        "weight": "45.50",
        "color": "White",
        "hornType": "with_horns",
        "healthStatus": "healthy",
        "purpose": "milk",
        "description": "Calm nature, high milk yield",
        "milkCapacity": "2.50",
        "lastDeliveryDate": "2024-06-15",
        "numberOfKidsDelivered": 3,
        "photo1": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/abc.jpg",
        "photo2": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/def.jpg",
        "video": "https://res.cloudinary.com/xxx/video/upload/v123/goat-listings/videos/jkl.mp4",
        "expectedPrice": "15000.00",
        "isNegotiable": true,
        "detailsConfirmed": true,
        "termsAccepted": true,
        "latitude": "18.52040000",
        "longitude": "73.85670000",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411001",
        "status": "active",
        "views": 45,
        "created_at": "2025-01-13T10:30:00.000Z",
        "updated_at": "2025-01-13T10:30:00.000Z",
        "user": {
          "id": 123,
          "phone_number": "+919876543210",
          "city": "Pune",
          "state": "Maharashtra"
        }
      }
      // ... more listings
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

---

## 3. Get Goat Listing by ID

**Endpoint:** `GET /api/goats/listings/:id`
**Access:** Public (No Authentication Required)

### Path Parameters

```javascript
{
  "id": 1  // Integer ID of the goat listing
}
```

### Example Request (JavaScript/Axios)

```javascript
const goatId = 1;
const response = await axios.get(`http://localhost:5000/api/goats/listings/${goatId}`);
```

### Example Request (cURL)

```bash
curl -X GET http://localhost:5000/api/goats/listings/1
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 123,
    "goatType": "female",
    "breedName": "Sirohi",
    "age": "2 years",
    "weight": "45.50",
    "color": "White",
    "hornType": "with_horns",
    "healthStatus": "healthy",
    "purpose": "milk",
    "description": "Calm nature, high milk yield",
    "milkCapacity": "2.50",
    "lastDeliveryDate": "2024-06-15",
    "numberOfKidsDelivered": 3,
    "photo1": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/abc.jpg",
    "photo1PublicId": "goat-listings/images/abc",
    "photo2": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/def.jpg",
    "photo2PublicId": "goat-listings/images/def",
    "photo3": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/ghi.jpg",
    "photo3PublicId": "goat-listings/images/ghi",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/goat-listings/videos/jkl.mp4",
    "videoPublicId": "goat-listings/videos/jkl",
    "expectedPrice": "15000.00",
    "isNegotiable": true,
    "detailsConfirmed": true,
    "termsAccepted": true,
    "latitude": "18.52040000",
    "longitude": "73.85670000",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
    "status": "active",
    "views": 46,
    "created_at": "2025-01-13T10:30:00.000Z",
    "updated_at": "2025-01-13T10:30:00.000Z",
    "user": {
      "id": 123,
      "phone_number": "+919876543210",
      "city": "Pune",
      "state": "Maharashtra"
    }
  }
}
```

**Note:** Views are automatically incremented when this endpoint is called.

### Error Response (404 Not Found)

```json
{
  "success": false,
  "message": "Goat listing not found"
}
```

---

## 4. Get Nearby Goat Listings

**Endpoint:** `GET /api/goats/listings/nearby`
**Access:** Public (No Authentication Required)

### Query Parameters

```javascript
{
  "latitude": "18.5204",      // Required - Your current latitude
  "longitude": "73.8567",     // Required - Your current longitude
  "radius": "50",             // Optional - Search radius in km (default: 50)
  "limit": "10"               // Optional - Max results to return (default: 10)
}
```

### Example Request (JavaScript/Axios)

```javascript
const response = await axios.get('http://localhost:5000/api/goats/listings/nearby', {
  params: {
    latitude: 18.5204,
    longitude: 73.8567,
    radius: 50,
    limit: 10
  }
});
```

### Example Request (cURL)

```bash
curl -X GET "http://localhost:5000/api/goats/listings/nearby?latitude=18.5204&longitude=73.8567&radius=50&limit=10"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "goatType": "female",
      "breedName": "Sirohi",
      "age": "2 years",
      "weight": "45.50",
      "color": "White",
      "hornType": "with_horns",
      "healthStatus": "healthy",
      "purpose": "milk",
      "description": "Calm nature, high milk yield",
      "milkCapacity": "2.50",
      "lastDeliveryDate": "2024-06-15",
      "numberOfKidsDelivered": 3,
      "photo1": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/abc.jpg",
      "photo2": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/def.jpg",
      "video": "https://res.cloudinary.com/xxx/video/upload/v123/goat-listings/videos/jkl.mp4",
      "expectedPrice": "15000.00",
      "isNegotiable": true,
      "detailsConfirmed": true,
      "termsAccepted": true,
      "latitude": "18.52040000",
      "longitude": "73.85670000",
      "city": "Pune",
      "state": "Maharashtra",
      "pincode": "411001",
      "status": "active",
      "views": 45,
      "created_at": "2025-01-13T10:30:00.000Z",
      "updated_at": "2025-01-13T10:30:00.000Z",
      "user": {
        "id": 123,
        "phone_number": "+919876543210",
        "city": "Pune",
        "state": "Maharashtra"
      },
      "distance": 2.5
    },
    {
      "id": 2,
      "breedName": "Jamunapari",
      "age": "3 years",
      "goatType": "male",
      "purpose": "breeding",
      "city": "Mumbai",
      "distance": 15.8,
      // ... other fields
    }
  ]
}
```

**Note:** Results are sorted by distance (nearest first) and include a `distance` field in kilometers.

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "message": "Latitude and longitude are required"
}
```

---

## 5. Get My Goat Listings

**Endpoint:** `GET /api/goats/my-listings`
**Access:** Protected (Authentication Required)

### Query Parameters (Optional)

```javascript
{
  "status": "active"  // Options: active, sold, expired, deleted, all (default: active)
}
```

### Example Request (JavaScript/Axios)

```javascript
const response = await axios.get('http://localhost:5000/api/goats/my-listings', {
  headers: {
    'Authorization': `Bearer ${token}`
  },
  params: {
    status: 'active'
  }
});
```

### Example Request (cURL)

```bash
curl -X GET "http://localhost:5000/api/goats/my-listings?status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "goatType": "female",
      "breedName": "Sirohi",
      "age": "2 years",
      "weight": "45.50",
      "color": "White",
      "hornType": "with_horns",
      "healthStatus": "healthy",
      "purpose": "milk",
      "description": "Calm nature, high milk yield",
      "milkCapacity": "2.50",
      "lastDeliveryDate": "2024-06-15",
      "numberOfKidsDelivered": 3,
      "photo1": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/abc.jpg",
      "photo2": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/def.jpg",
      "video": "https://res.cloudinary.com/xxx/video/upload/v123/goat-listings/videos/jkl.mp4",
      "expectedPrice": "15000.00",
      "isNegotiable": true,
      "detailsConfirmed": true,
      "termsAccepted": true,
      "latitude": "18.52040000",
      "longitude": "73.85670000",
      "city": "Pune",
      "state": "Maharashtra",
      "pincode": "411001",
      "status": "active",
      "views": 45,
      "created_at": "2025-01-13T10:30:00.000Z",
      "updated_at": "2025-01-13T10:30:00.000Z"
    }
    // ... more listings by this user
  ]
}
```

---

## 6. Update Goat Listing

**Endpoint:** `PUT /api/goats/listings/:id`
**Access:** Protected (Authentication Required - Owner Only)
**Content-Type:** `multipart/form-data`

### Path Parameters

```javascript
{
  "id": 1  // Integer ID of the goat listing
}
```

### Request Body (Form Data - All Optional)

You can update any field(s) from the create request. Only include fields you want to update.

```javascript
{
  // Goat Details
  "breedName": "Sirohi",
  "age": "3 years",
  "weight": "50.0",
  "color": "Brown and White",
  "hornType": "without_horns",
  "healthStatus": "vaccinated",
  "purpose": "breeding",
  "description": "Updated description",

  // Production Info
  "milkCapacity": "3.0",
  "lastDeliveryDate": "2024-12-20",
  "numberOfKidsDelivered": "4",

  // Photos (uploading new files will replace old ones)
  "photo1": <New File>,
  "photo2": <New File>,
  "photo3": <New File>,
  "photo4": <New File>,
  "photo5": <New File>,
  "video": <New File>,

  // Pricing
  "expectedPrice": "18000",
  "isNegotiable": "false",

  // Location
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```

### Example Request (JavaScript/Axios)

```javascript
const formData = new FormData();
formData.append('expectedPrice', '18000');
formData.append('isNegotiable', 'false');
formData.append('description', 'Price updated - firm now');

const goatId = 1;
const response = await axios.put(
  `http://localhost:5000/api/goats/listings/${goatId}`,
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }
);
```

### Example Request (cURL)

```bash
curl -X PUT http://localhost:5000/api/goats/listings/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "expectedPrice=18000" \
  -F "isNegotiable=false" \
  -F "description=Price updated - firm now"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Goat listing updated successfully",
  "data": {
    "id": 1,
    "user_id": 123,
    "goatType": "female",
    "breedName": "Sirohi",
    "age": "2 years",
    "weight": "45.50",
    "color": "White",
    "hornType": "with_horns",
    "healthStatus": "healthy",
    "purpose": "milk",
    "description": "Price updated - firm now",
    "milkCapacity": "2.50",
    "lastDeliveryDate": "2024-06-15",
    "numberOfKidsDelivered": 3,
    "photo1": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/abc.jpg",
    "photo2": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/def.jpg",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/goat-listings/videos/jkl.mp4",
    "expectedPrice": "18000.00",
    "isNegotiable": false,
    "detailsConfirmed": true,
    "termsAccepted": true,
    "latitude": "18.52040000",
    "longitude": "73.85670000",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
    "status": "active",
    "views": 45,
    "created_at": "2025-01-13T10:30:00.000Z",
    "updated_at": "2025-01-13T11:45:00.000Z"
  }
}
```

### Error Responses

**403 Forbidden - Not Owner:**
```json
{
  "success": false,
  "message": "You are not authorized to update this listing"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Goat listing not found"
}
```

---

## 7. Delete Goat Listing

**Endpoint:** `DELETE /api/goats/listings/:id`
**Access:** Protected (Authentication Required - Owner Only)

**Note:** This is a soft delete. The listing status is changed to "deleted" but the record remains in the database.

### Path Parameters

```javascript
{
  "id": 1  // Integer ID of the goat listing
}
```

### Example Request (JavaScript/Axios)

```javascript
const goatId = 1;
const response = await axios.delete(
  `http://localhost:5000/api/goats/listings/${goatId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

### Example Request (cURL)

```bash
curl -X DELETE http://localhost:5000/api/goats/listings/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Goat listing deleted successfully"
}
```

### Error Responses

**403 Forbidden - Not Owner:**
```json
{
  "success": false,
  "message": "You are not authorized to delete this listing"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Goat listing not found"
}
```

---

## 8. Mark Goat as Sold

**Endpoint:** `PATCH /api/goats/listings/:id/sold`
**Access:** Protected (Authentication Required - Owner Only)

### Path Parameters

```javascript
{
  "id": 1  // Integer ID of the goat listing
}
```

### Example Request (JavaScript/Axios)

```javascript
const goatId = 1;
const response = await axios.patch(
  `http://localhost:5000/api/goats/listings/${goatId}/sold`,
  {},
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

### Example Request (cURL)

```bash
curl -X PATCH http://localhost:5000/api/goats/listings/1/sold \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Goat listing marked as sold",
  "data": {
    "id": 1,
    "user_id": 123,
    "goatType": "female",
    "breedName": "Sirohi",
    "age": "2 years",
    "weight": "45.50",
    "color": "White",
    "hornType": "with_horns",
    "healthStatus": "healthy",
    "purpose": "milk",
    "description": "Calm nature, high milk yield",
    "milkCapacity": "2.50",
    "lastDeliveryDate": "2024-06-15",
    "numberOfKidsDelivered": 3,
    "photo1": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/abc.jpg",
    "photo2": "https://res.cloudinary.com/xxx/image/upload/v123/goat-listings/images/def.jpg",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/goat-listings/videos/jkl.mp4",
    "expectedPrice": "15000.00",
    "isNegotiable": true,
    "detailsConfirmed": true,
    "termsAccepted": true,
    "latitude": "18.52040000",
    "longitude": "73.85670000",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
    "status": "sold",
    "views": 45,
    "created_at": "2025-01-13T10:30:00.000Z",
    "updated_at": "2025-01-13T12:00:00.000Z"
  }
}
```

### Error Responses

**403 Forbidden - Not Owner:**
```json
{
  "success": false,
  "message": "You are not authorized to update this listing"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Goat listing not found"
}
```

---

## Field Validation Rules

### Enums

```javascript
goatType: ["male", "female"]
hornType: ["with_horns", "without_horns"]
healthStatus: ["healthy", "under_treatment", "vaccinated"]
purpose: ["milk", "meat", "breeding", "pet"]
status: ["active", "sold", "expired", "deleted"]
```

### Data Types

```javascript
goatType: Enum (male, female)
breedName: String (2-100 characters) - e.g., Sirohi, Jamunapari, Barbari, Beetal
age: String
weight: Decimal (0-200 kg)
color: String
hornType: Enum (with_horns, without_horns)
healthStatus: Enum (healthy, under_treatment, vaccinated)
purpose: Enum (milk, meat, breeding, pet)
description: Text
milkCapacity: Decimal (liters per day)
lastDeliveryDate: Date (YYYY-MM-DD)
numberOfKidsDelivered: Integer
expectedPrice: Decimal (positive number)
isNegotiable: Boolean
detailsConfirmed: Boolean (required - true)
termsAccepted: Boolean (required - true)
latitude: Decimal (-90 to 90)
longitude: Decimal (-180 to 180)
city: String
state: String
pincode: String (max 10 characters)
```

### File Upload Limits

```javascript
Images (photo1, photo2, photo3, photo4, photo5):
  - Min: 1 photo required
  - Max: 5 photos allowed
  - Max size per photo: 5MB
  - Formats: JPEG, PNG, WebP

Video:
  - Max: 1 video allowed
  - Max size: 25MB
  - Formats: MP4, MOV, AVI, WebM
```

---

## Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created Successfully |
| 400 | Bad Request - Validation Error |
| 401 | Unauthorized - No/Invalid Token |
| 403 | Forbidden - Not Owner |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Testing the APIs

### Using Postman

1. **Set up environment variables:**
   - `BASE_URL`: `http://localhost:5000`
   - `TOKEN`: Your JWT token from login

2. **For file uploads:**
   - Select "Body" → "form-data"
   - For text fields: Keep type as "Text"
   - For files: Change type to "File" and select your file

3. **For protected routes:**
   - Go to "Authorization" tab
   - Select "Bearer Token"
   - Enter your JWT token

### Using Thunder Client (VS Code)

1. Create a new request
2. Set method and URL
3. For auth: Add header `Authorization: Bearer YOUR_TOKEN`
4. For file uploads: Use "Form" tab and add fields/files

---

## Complete Example - Creating a Goat Listing

### HTML Form Example

```html
<form id="goatForm" enctype="multipart/form-data">
  <!-- 1. Goat Details -->
  <h3>1️⃣ Goat Details / शेळीची माहिती</h3>

  <label>Goat Type / शेळीचा प्रकार:
    <select name="goatType" required>
      <option value="">Select Type</option>
      <option value="male">Male / नर</option>
      <option value="female">Female / मादी</option>
    </select>
  </label>

  <label>Breed Name / जात:
    <input type="text" name="breedName" placeholder="e.g., Sirohi, Jamunapari, Barbari, Beetal" required>
  </label>

  <label>Age / वय:
    <input type="text" name="age" placeholder="e.g., 2 years, 18 months" required>
  </label>

  <label>Weight / वजन (किलो):
    <input type="number" step="0.01" name="weight" placeholder="in kg" required>
  </label>

  <label>Color / रंग:
    <input type="text" name="color" required>
  </label>

  <label>Horn Type / शिंग प्रकार:
    <select name="hornType" required>
      <option value="">Select Horn Type</option>
      <option value="with_horns">With horns / शिंगांसह</option>
      <option value="without_horns">Without horns / शिंगांशिवाय</option>
    </select>
  </label>

  <label>Health Status / आरोग्य स्थिती:
    <select name="healthStatus" required>
      <option value="">Select Health Status</option>
      <option value="healthy">Healthy / निरोगी</option>
      <option value="under_treatment">Under Treatment / उपचाराधीन</option>
      <option value="vaccinated">Vaccinated / लसीकरण केलेले</option>
    </select>
  </label>

  <label>Purpose / उद्देश:
    <select name="purpose" required>
      <option value="">Select Purpose</option>
      <option value="milk">Milk / दूध</option>
      <option value="meat">Meat / मांस</option>
      <option value="breeding">Breeding / प्रजनन</option>
      <option value="pet">Pet / पाळीव प्राणी</option>
    </select>
  </label>

  <label>Description / अतिरिक्त माहिती:
    <textarea name="description" placeholder="e.g., calm nature, high milk yield"></textarea>
  </label>

  <!-- 2. Production Info (for female goats) -->
  <h3>2️⃣ Production Info (for female goats) / उत्पादन माहिती</h3>

  <label>Milk Capacity / दूध उत्पादन क्षमता (लिटर/दिवस):
    <input type="number" step="0.01" name="milkCapacity" placeholder="Litres per day">
  </label>

  <label>Last Delivery Date / शेवटचा प्रसव दिनांक:
    <input type="date" name="lastDeliveryDate">
  </label>

  <label>Number of Kids Delivered / झालेली पिल्ले संख्या:
    <input type="number" name="numberOfKidsDelivered">
  </label>

  <!-- 3. Images -->
  <h3>3️⃣ Images / छायाचित्रे</h3>
  <p>Upload clear photos (min 1, max 5)</p>

  <label>Photo 1:
    <input type="file" name="photo1" accept="image/*" required>
  </label>
  <label>Photo 2:
    <input type="file" name="photo2" accept="image/*">
  </label>
  <label>Photo 3:
    <input type="file" name="photo3" accept="image/*">
  </label>
  <label>Photo 4:
    <input type="file" name="photo4" accept="image/*">
  </label>
  <label>Photo 5:
    <input type="file" name="photo5" accept="image/*">
  </label>

  <label>Video (max 1):
    <input type="file" name="video" accept="video/*">
  </label>

  <!-- 4. Pricing -->
  <h3>4️⃣ Pricing</h3>

  <label>Expected Price (₹):
    <input type="number" name="expectedPrice" required>
  </label>

  <label>
    <input type="checkbox" name="isNegotiable" value="true"> Negotiable / किंमत चर्चासत्रीय आहे का?
  </label>

  <!-- 5. Terms & Confirmation -->
  <h3>5️⃣ Terms & Confirmation</h3>

  <label>
    <input type="checkbox" name="detailsConfirmed" value="true" required>
    I confirm all the above details are true
  </label>

  <label>
    <input type="checkbox" name="termsAccepted" value="true" required>
    I agree to Animal E-Bazzar's listing terms
  </label>

  <!-- Location -->
  <h3>Location (Optional)</h3>
  <label>City:
    <input type="text" name="city">
  </label>
  <label>State:
    <input type="text" name="state">
  </label>
  <label>Pincode:
    <input type="text" name="pincode">
  </label>

  <button type="submit">Create Listing</button>
</form>

<script>
document.getElementById('goatForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const token = localStorage.getItem('token'); // Get your JWT token

  try {
    const response = await fetch('http://localhost:5000/api/goats/listings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      alert('Goat listing created successfully!');
      console.log(data.data);
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to create listing');
  }
});
</script>
```

---

## Notes

1. **Authentication**: Protected endpoints require a valid JWT token obtained from the auth endpoints.

2. **File Uploads**: Always use `multipart/form-data` content type when uploading files.

3. **Photo Requirements**: Minimum 1 photo required, maximum 5 photos allowed.

4. **Terms Confirmation**: Both `detailsConfirmed` and `termsAccepted` must be `true` for listing creation.

5. **Production Info**: Fields like `milkCapacity`, `lastDeliveryDate`, and `numberOfKidsDelivered` are optional and typically used for female goats.

6. **Cloudinary**: Old photos/videos are automatically deleted when you upload new ones during update.

7. **Soft Deletes**: Deleted listings can still be found in the database with status "deleted".

8. **View Tracking**: Views are automatically incremented when someone views a listing detail page.

9. **Distance Calculation**: Uses the Haversine formula to calculate distances accurately.

10. **Case-Insensitive Search**: City and state filters are case-insensitive.

11. **Pagination**: Use page and limit parameters to control the number of results returned.

---

## Support

For issues or questions:
- Check the health endpoint: `GET /health`
- View API documentation: `GET /api`
- Check server logs for detailed error messages
