# Buffalo Listing API Documentation

Complete API documentation for Buffalo listing endpoints with request/response examples.

---

## Base URL
```
http://localhost:5000/api/buffalos
```

---

## Authentication
Protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Table of Contents
1. [Create Buffalo Listing](#1-create-buffalo-listing) - POST `/listings` 🔒
2. [Get All Buffalo Listings](#2-get-all-buffalo-listings) - GET `/listings` 🌐
3. [Get Buffalo Listing by ID](#3-get-buffalo-listing-by-id) - GET `/listings/:id` 🌐
4. [Get Nearby Buffalo Listings](#4-get-nearby-buffalo-listings) - GET `/listings/nearby` 🌐
5. [Get My Buffalo Listings](#5-get-my-buffalo-listings) - GET `/my-listings` 🔒
6. [Update Buffalo Listing](#6-update-buffalo-listing) - PUT `/listings/:id` 🔒
7. [Delete Buffalo Listing](#7-delete-buffalo-listing) - DELETE `/listings/:id` 🔒
8. [Mark Buffalo as Sold](#8-mark-buffalo-as-sold) - PATCH `/listings/:id/sold` 🔒

🔒 = Protected (Auth Required) | 🌐 = Public

---

## 1. Create Buffalo Listing

**Endpoint:** `POST /api/buffalos/listings`
**Access:** Protected (Authentication Required)
**Content-Type:** `multipart/form-data`

### Request Body (Form Data)

#### Required Fields:
```javascript
{
  // 1. Buffalo Details / म्हशीची माहिती
  "breedName": "Murrah",                    // String (2-100 chars)
  "age": "3 years",                          // String
  "milkCapacity": "15.5",                    // Number (0-100)
  "pregnancyStatus": "pregnant",             // Enum: pregnant, not_pregnant, recently_delivered, unknown

  // 2. Physical Details / शारीरिक माहिती
  "hasHorns": "true",                        // Boolean (true/false)
  "healthCondition": "excellent",            // Enum: excellent, good, average

  // 3. Price & Negotiation / किंमत आणि चर्चा
  "expectedPrice": "85000",                  // Number (positive)
  "isNegotiable": "true",                    // Boolean (true/false)

  // 5. Additional Information / अतिरिक्त माहिती
  "deliveryAvailable": "true"                // Boolean (true/false)
}
```

#### Optional Fields:
```javascript
{
  // 4. Photos & Videos / छायाचित्रे आणि व्हिडिओ
  "frontPhoto": <File>,                      // Image file (Max 5MB, JPEG/PNG/WebP)
  "sidePhoto": <File>,                       // Image file (Max 5MB, JPEG/PNG/WebP)
  "milkScenePhoto": <File>,                  // Image file (Max 5MB, JPEG/PNG/WebP)
  "video": <File>,                           // Video file (Max 25MB, MP4/MOV/AVI/WebM)

  // 5. Additional Information
  "vaccinationDetails": "All vaccinations up to date. Last deworming on 01/01/2025",  // Text
  "additionalNotes": "Very calm temperament, good for first-time buyers",             // Text

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
formData.append('breedName', 'Murrah');
formData.append('age', '3 years');
formData.append('milkCapacity', '15.5');
formData.append('pregnancyStatus', 'pregnant');
formData.append('hasHorns', 'true');
formData.append('healthCondition', 'excellent');
formData.append('expectedPrice', '85000');
formData.append('isNegotiable', 'true');
formData.append('deliveryAvailable', 'true');

// Optional fields
formData.append('vaccinationDetails', 'All vaccinations up to date');
formData.append('additionalNotes', 'Very calm temperament');
formData.append('city', 'Pune');
formData.append('state', 'Maharashtra');
formData.append('pincode', '411001');
formData.append('latitude', '18.5204');
formData.append('longitude', '73.8567');

// Photos
formData.append('frontPhoto', frontPhotoFile);
formData.append('sidePhoto', sidePhotoFile);
formData.append('milkScenePhoto', milkScenePhotoFile);
formData.append('video', videoFile);

// Make request
const response = await axios.post('http://localhost:5000/api/buffalos/listings', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

### Example Request (cURL)

```bash
curl -X POST http://localhost:5000/api/buffalos/listings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "breedName=Murrah" \
  -F "age=3 years" \
  -F "milkCapacity=15.5" \
  -F "pregnancyStatus=pregnant" \
  -F "hasHorns=true" \
  -F "healthCondition=excellent" \
  -F "expectedPrice=85000" \
  -F "isNegotiable=true" \
  -F "deliveryAvailable=true" \
  -F "vaccinationDetails=All vaccinations up to date" \
  -F "city=Pune" \
  -F "state=Maharashtra" \
  -F "pincode=411001" \
  -F "frontPhoto=@/path/to/front.jpg" \
  -F "sidePhoto=@/path/to/side.jpg" \
  -F "milkScenePhoto=@/path/to/milk.jpg" \
  -F "video=@/path/to/video.mp4"
```

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Buffalo listing created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "breedName": "Murrah",
    "age": "3 years",
    "milkCapacity": "15.50",
    "pregnancyStatus": "pregnant",
    "hasHorns": true,
    "healthCondition": "excellent",
    "expectedPrice": "85000.00",
    "isNegotiable": true,
    "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/abc.jpg",
    "frontPhotoPublicId": "buffalo-listings/images/abc",
    "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/def.jpg",
    "sidePhotoPublicId": "buffalo-listings/images/def",
    "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/ghi.jpg",
    "milkScenePhotoPublicId": "buffalo-listings/images/ghi",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/buffalo-listings/videos/jkl.mp4",
    "videoPublicId": "buffalo-listings/videos/jkl",
    "vaccinationDetails": "All vaccinations up to date",
    "deliveryAvailable": true,
    "additionalNotes": "Very calm temperament",
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
      "msg": "Breed name is required",
      "param": "breedName",
      "location": "body"
    },
    {
      "msg": "Milk capacity must be between 0 and 100 liters",
      "param": "milkCapacity",
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

## 2. Get All Buffalo Listings

**Endpoint:** `GET /api/buffalos/listings`
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
  "minPrice": "50000",                // Minimum price
  "maxPrice": "100000",               // Maximum price
  "pregnancyStatus": "pregnant",      // pregnant, not_pregnant, recently_delivered, unknown
  "healthCondition": "excellent",     // excellent, good, average
  "hasHorns": "true",                 // true/false
  "deliveryAvailable": "true",        // true/false

  // Sorting
  "sortBy": "created_at",             // Fields: created_at, expectedPrice, views
  "sortOrder": "DESC"                 // ASC or DESC
}
```

### Example Request (JavaScript/Axios)

```javascript
const response = await axios.get('http://localhost:5000/api/buffalos/listings', {
  params: {
    page: 1,
    limit: 10,
    city: 'Pune',
    minPrice: 50000,
    maxPrice: 100000,
    pregnancyStatus: 'pregnant',
    healthCondition: 'excellent',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  }
});
```

### Example Request (cURL)

```bash
curl -X GET "http://localhost:5000/api/buffalos/listings?page=1&limit=10&city=Pune&minPrice=50000&maxPrice=100000&pregnancyStatus=pregnant&healthCondition=excellent&sortBy=created_at&sortOrder=DESC"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "breedName": "Murrah",
        "age": "3 years",
        "milkCapacity": "15.50",
        "pregnancyStatus": "pregnant",
        "hasHorns": true,
        "healthCondition": "excellent",
        "expectedPrice": "85000.00",
        "isNegotiable": true,
        "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/abc.jpg",
        "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/def.jpg",
        "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/ghi.jpg",
        "video": "https://res.cloudinary.com/xxx/video/upload/v123/buffalo-listings/videos/jkl.mp4",
        "vaccinationDetails": "All vaccinations up to date",
        "deliveryAvailable": true,
        "additionalNotes": "Very calm temperament",
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
          "id": "123e4567-e89b-12d3-a456-426614174000",
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

## 3. Get Buffalo Listing by ID

**Endpoint:** `GET /api/buffalos/listings/:id`
**Access:** Public (No Authentication Required)

### Path Parameters

```javascript
{
  "id": "550e8400-e29b-41d4-a716-446655440000"  // UUID of the buffalo listing
}
```

### Example Request (JavaScript/Axios)

```javascript
const buffaloId = '550e8400-e29b-41d4-a716-446655440000';
const response = await axios.get(`http://localhost:5000/api/buffalos/listings/${buffaloId}`);
```

### Example Request (cURL)

```bash
curl -X GET http://localhost:5000/api/buffalos/listings/550e8400-e29b-41d4-a716-446655440000
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "breedName": "Murrah",
    "age": "3 years",
    "milkCapacity": "15.50",
    "pregnancyStatus": "pregnant",
    "hasHorns": true,
    "healthCondition": "excellent",
    "expectedPrice": "85000.00",
    "isNegotiable": true,
    "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/abc.jpg",
    "frontPhotoPublicId": "buffalo-listings/images/abc",
    "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/def.jpg",
    "sidePhotoPublicId": "buffalo-listings/images/def",
    "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/ghi.jpg",
    "milkScenePhotoPublicId": "buffalo-listings/images/ghi",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/buffalo-listings/videos/jkl.mp4",
    "videoPublicId": "buffalo-listings/videos/jkl",
    "vaccinationDetails": "All vaccinations up to date",
    "deliveryAvailable": true,
    "additionalNotes": "Very calm temperament",
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
      "id": "123e4567-e89b-12d3-a456-426614174000",
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
  "message": "Buffalo listing not found"
}
```

---

## 4. Get Nearby Buffalo Listings

**Endpoint:** `GET /api/buffalos/listings/nearby`
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
const response = await axios.get('http://localhost:5000/api/buffalos/listings/nearby', {
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
curl -X GET "http://localhost:5000/api/buffalos/listings/nearby?latitude=18.5204&longitude=73.8567&radius=50&limit=10"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "breedName": "Murrah",
      "age": "3 years",
      "milkCapacity": "15.50",
      "pregnancyStatus": "pregnant",
      "hasHorns": true,
      "healthCondition": "excellent",
      "expectedPrice": "85000.00",
      "isNegotiable": true,
      "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/abc.jpg",
      "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/def.jpg",
      "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/ghi.jpg",
      "video": "https://res.cloudinary.com/xxx/video/upload/v123/buffalo-listings/videos/jkl.mp4",
      "vaccinationDetails": "All vaccinations up to date",
      "deliveryAvailable": true,
      "additionalNotes": "Very calm temperament",
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
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "phone_number": "+919876543210",
        "city": "Pune",
        "state": "Maharashtra"
      },
      "distance": 2.5
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "breedName": "Jaffarabadi",
      "age": "4 years",
      "milkCapacity": "18.00",
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

## 5. Get My Buffalo Listings

**Endpoint:** `GET /api/buffalos/my-listings`
**Access:** Protected (Authentication Required)

### Query Parameters (Optional)

```javascript
{
  "status": "active"  // Options: active, sold, expired, deleted, all (default: active)
}
```

### Example Request (JavaScript/Axios)

```javascript
const response = await axios.get('http://localhost:5000/api/buffalos/my-listings', {
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
curl -X GET "http://localhost:5000/api/buffalos/my-listings?status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "breedName": "Murrah",
      "age": "3 years",
      "milkCapacity": "15.50",
      "pregnancyStatus": "pregnant",
      "hasHorns": true,
      "healthCondition": "excellent",
      "expectedPrice": "85000.00",
      "isNegotiable": true,
      "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/abc.jpg",
      "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/def.jpg",
      "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/ghi.jpg",
      "video": "https://res.cloudinary.com/xxx/video/upload/v123/buffalo-listings/videos/jkl.mp4",
      "vaccinationDetails": "All vaccinations up to date",
      "deliveryAvailable": true,
      "additionalNotes": "Very calm temperament",
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

## 6. Update Buffalo Listing

**Endpoint:** `PUT /api/buffalos/listings/:id`
**Access:** Protected (Authentication Required - Owner Only)
**Content-Type:** `multipart/form-data`

### Path Parameters

```javascript
{
  "id": "550e8400-e29b-41d4-a716-446655440000"  // UUID of the buffalo listing
}
```

### Request Body (Form Data - All Optional)

You can update any field(s) from the create request. Only include fields you want to update.

```javascript
{
  // Buffalo Details
  "breedName": "Murrah",
  "age": "4 years",
  "milkCapacity": "16.0",
  "pregnancyStatus": "not_pregnant",

  // Physical Details
  "hasHorns": "false",
  "healthCondition": "good",

  // Price & Negotiation
  "expectedPrice": "90000",
  "isNegotiable": "false",

  // Photos & Videos (uploading new files will replace old ones)
  "frontPhoto": <New File>,
  "sidePhoto": <New File>,
  "milkScenePhoto": <New File>,
  "video": <New File>,

  // Additional Information
  "vaccinationDetails": "Updated vaccination info",
  "deliveryAvailable": "false",
  "additionalNotes": "Updated notes",

  // Location
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```

### Example Request (JavaScript/Axios)

```javascript
const formData = new FormData();
formData.append('expectedPrice', '90000');
formData.append('isNegotiable', 'false');
formData.append('additionalNotes', 'Price updated - firm now');

const buffaloId = '550e8400-e29b-41d4-a716-446655440000';
const response = await axios.put(
  `http://localhost:5000/api/buffalos/listings/${buffaloId}`,
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
curl -X PUT http://localhost:5000/api/buffalos/listings/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "expectedPrice=90000" \
  -F "isNegotiable=false" \
  -F "additionalNotes=Price updated - firm now"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Buffalo listing updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "breedName": "Murrah",
    "age": "3 years",
    "milkCapacity": "15.50",
    "pregnancyStatus": "pregnant",
    "hasHorns": true,
    "healthCondition": "excellent",
    "expectedPrice": "90000.00",
    "isNegotiable": false,
    "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/abc.jpg",
    "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/def.jpg",
    "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/ghi.jpg",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/buffalo-listings/videos/jkl.mp4",
    "vaccinationDetails": "All vaccinations up to date",
    "deliveryAvailable": true,
    "additionalNotes": "Price updated - firm now",
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
  "message": "Buffalo listing not found"
}
```

---

## 7. Delete Buffalo Listing

**Endpoint:** `DELETE /api/buffalos/listings/:id`
**Access:** Protected (Authentication Required - Owner Only)

**Note:** This is a soft delete. The listing status is changed to "deleted" but the record remains in the database.

### Path Parameters

```javascript
{
  "id": "550e8400-e29b-41d4-a716-446655440000"  // UUID of the buffalo listing
}
```

### Example Request (JavaScript/Axios)

```javascript
const buffaloId = '550e8400-e29b-41d4-a716-446655440000';
const response = await axios.delete(
  `http://localhost:5000/api/buffalos/listings/${buffaloId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

### Example Request (cURL)

```bash
curl -X DELETE http://localhost:5000/api/buffalos/listings/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Buffalo listing deleted successfully"
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
  "message": "Buffalo listing not found"
}
```

---

## 8. Mark Buffalo as Sold

**Endpoint:** `PATCH /api/buffalos/listings/:id/sold`
**Access:** Protected (Authentication Required - Owner Only)

### Path Parameters

```javascript
{
  "id": "550e8400-e29b-41d4-a716-446655440000"  // UUID of the buffalo listing
}
```

### Example Request (JavaScript/Axios)

```javascript
const buffaloId = '550e8400-e29b-41d4-a716-446655440000';
const response = await axios.patch(
  `http://localhost:5000/api/buffalos/listings/${buffaloId}/sold`,
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
curl -X PATCH http://localhost:5000/api/buffalos/listings/550e8400-e29b-41d4-a716-446655440000/sold \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Buffalo listing marked as sold",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "breedName": "Murrah",
    "age": "3 years",
    "milkCapacity": "15.50",
    "pregnancyStatus": "pregnant",
    "hasHorns": true,
    "healthCondition": "excellent",
    "expectedPrice": "85000.00",
    "isNegotiable": true,
    "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/abc.jpg",
    "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/def.jpg",
    "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/buffalo-listings/images/ghi.jpg",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/buffalo-listings/videos/jkl.mp4",
    "vaccinationDetails": "All vaccinations up to date",
    "deliveryAvailable": true,
    "additionalNotes": "Very calm temperament",
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
  "message": "Buffalo listing not found"
}
```

---

## Field Validation Rules

### Enums

```javascript
pregnancyStatus: ["pregnant", "not_pregnant", "recently_delivered", "unknown"]
healthCondition: ["excellent", "good", "average"]
status: ["active", "sold", "expired", "deleted"]
```

### Data Types

```javascript
breedName: String (2-100 characters)
age: String
milkCapacity: Decimal (0-100)
hasHorns: Boolean
expectedPrice: Decimal (positive number)
isNegotiable: Boolean
deliveryAvailable: Boolean
vaccinationDetails: Text
additionalNotes: Text
latitude: Decimal (-90 to 90)
longitude: Decimal (-180 to 180)
city: String
state: String
pincode: String (max 10 characters)
```

### File Upload Limits

```javascript
Images (frontPhoto, sidePhoto, milkScenePhoto):
  - Max size: 5MB
  - Formats: JPEG, PNG, WebP

Video:
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

## Complete Example - Creating a Buffalo Listing

### HTML Form Example

```html
<form id="buffaloForm" enctype="multipart/form-data">
  <!-- Buffalo Details -->
  <input type="text" name="breedName" placeholder="Breed Name" required>
  <input type="text" name="age" placeholder="Age (e.g., 3 years)" required>
  <input type="number" step="0.01" name="milkCapacity" placeholder="Milk Capacity (liters/day)" required>
  <select name="pregnancyStatus" required>
    <option value="pregnant">Pregnant</option>
    <option value="not_pregnant">Not Pregnant</option>
    <option value="recently_delivered">Recently Delivered</option>
    <option value="unknown">Unknown</option>
  </select>

  <!-- Physical Details -->
  <label>
    <input type="radio" name="hasHorns" value="true" checked> Has Horns
  </label>
  <label>
    <input type="radio" name="hasHorns" value="false"> No Horns
  </label>

  <select name="healthCondition" required>
    <option value="excellent">Excellent</option>
    <option value="good">Good</option>
    <option value="average">Average</option>
  </select>

  <!-- Price -->
  <input type="number" name="expectedPrice" placeholder="Expected Price (₹)" required>
  <label>
    <input type="checkbox" name="isNegotiable" value="true"> Negotiable
  </label>

  <!-- Photos -->
  <input type="file" name="frontPhoto" accept="image/*">
  <input type="file" name="sidePhoto" accept="image/*">
  <input type="file" name="milkScenePhoto" accept="image/*">
  <input type="file" name="video" accept="video/*">

  <!-- Additional Info -->
  <textarea name="vaccinationDetails" placeholder="Vaccination Details"></textarea>
  <label>
    <input type="checkbox" name="deliveryAvailable" value="true"> Delivery Available
  </label>
  <textarea name="additionalNotes" placeholder="Additional Notes"></textarea>

  <!-- Location -->
  <input type="text" name="city" placeholder="City">
  <input type="text" name="state" placeholder="State">
  <input type="text" name="pincode" placeholder="Pincode">

  <button type="submit">Create Listing</button>
</form>

<script>
document.getElementById('buffaloForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const token = localStorage.getItem('token'); // Get your JWT token

  try {
    const response = await fetch('http://localhost:5000/api/buffalos/listings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      alert('Buffalo listing created successfully!');
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

3. **Cloudinary**: Old photos/videos are automatically deleted when you upload new ones during update.

4. **Soft Deletes**: Deleted listings can still be found in the database with status "deleted".

5. **View Tracking**: Views are automatically incremented when someone views a listing detail page.

6. **Distance Calculation**: Uses the Haversine formula to calculate distances accurately.

7. **Case-Insensitive Search**: City and state filters are case-insensitive.

8. **Pagination**: Use page and limit parameters to control the number of results returned.

---

## Support

For issues or questions:
- Check the health endpoint: `GET /health`
- View API documentation: `GET /api`
- Check server logs for detailed error messages
