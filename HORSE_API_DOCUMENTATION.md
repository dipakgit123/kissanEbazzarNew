# Horse Listing API Documentation

Complete API documentation for Horse listing endpoints with request/response examples.

---

## Base URL
```
http://localhost:5000/api/horses
```

---

## Authentication
Protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Table of Contents
1. [Create Horse Listing](#1-create-horse-listing) - POST `/listings` 🔒
2. [Get All Horse Listings](#2-get-all-horse-listings) - GET `/listings` 🌐
3. [Get Horse Listing by ID](#3-get-horse-listing-by-id) - GET `/listings/:id` 🌐
4. [Get Nearby Horse Listings](#4-get-nearby-horse-listings) - GET `/listings/nearby` 🌐
5. [Get My Horse Listings](#5-get-my-horse-listings) - GET `/my-listings` 🔒
6. [Update Horse Listing](#6-update-horse-listing) - PUT `/listings/:id` 🔒
7. [Delete Horse Listing](#7-delete-horse-listing) - DELETE `/listings/:id` 🔒
8. [Mark Horse as Sold](#8-mark-horse-as-sold) - PATCH `/listings/:id/sold` 🔒

🔒 = Protected (Auth Required) | 🌐 = Public

---

## 1. Create Horse Listing

**Endpoint:** `POST /api/horses/listings`
**Access:** Protected (Authentication Required)
**Content-Type:** `multipart/form-data`

### Request Body (Form Data)

#### Required Fields:
```javascript
{
  // 1. Horse Details / घोड्याची माहिती
  "breedName": "Marwari",                    // String (2-100 chars)
  "age": "5 years",                          // String
  "gender": "male",                          // Enum: male, female
  "purpose": "racing",                       // Enum: riding, racing, breeding

  // 2. Physical Details / शारीरिक माहिती
  "healthCondition": "excellent",            // Enum: excellent, good, average

  // 3. Price & Negotiation / किंमत आणि चर्चा
  "expectedPrice": "250000",                 // Number (positive)
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
  "fullBodyPhoto": <File>,                   // Image file (Max 5MB, JPEG/PNG/WebP)
  "video": <File>,                           // Video file (Max 25MB, MP4/MOV/AVI/WebM)

  // 5. Additional Information
  "vaccinationDetails": "All vaccinations completed, last deworming on 01/12/2024",  // Text
  "additionalNotes": "Well-trained, suitable for beginners",                         // Text

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
formData.append('breedName', 'Marwari');
formData.append('age', '5 years');
formData.append('gender', 'male');
formData.append('purpose', 'racing');
formData.append('healthCondition', 'excellent');
formData.append('expectedPrice', '250000');
formData.append('isNegotiable', 'true');
formData.append('deliveryAvailable', 'true');

// Optional fields
formData.append('vaccinationDetails', 'All vaccinations completed');
formData.append('additionalNotes', 'Well-trained, suitable for beginners');
formData.append('city', 'Pune');
formData.append('state', 'Maharashtra');
formData.append('pincode', '411001');
formData.append('latitude', '18.5204');
formData.append('longitude', '73.8567');

// Photos
formData.append('frontPhoto', frontPhotoFile);
formData.append('sidePhoto', sidePhotoFile);
formData.append('fullBodyPhoto', fullBodyPhotoFile);
formData.append('video', videoFile);

// Make request
const response = await axios.post('http://localhost:5000/api/horses/listings', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

### Example Request (cURL)

```bash
curl -X POST http://localhost:5000/api/horses/listings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "breedName=Marwari" \
  -F "age=5 years" \
  -F "gender=male" \
  -F "purpose=racing" \
  -F "healthCondition=excellent" \
  -F "expectedPrice=250000" \
  -F "isNegotiable=true" \
  -F "deliveryAvailable=true" \
  -F "vaccinationDetails=All vaccinations completed" \
  -F "city=Pune" \
  -F "state=Maharashtra" \
  -F "pincode=411001" \
  -F "frontPhoto=@/path/to/front.jpg" \
  -F "sidePhoto=@/path/to/side.jpg" \
  -F "fullBodyPhoto=@/path/to/fullbody.jpg" \
  -F "video=@/path/to/video.mp4"
```

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Horse listing created successfully",
  "data": {
    "id": 1,
    "user_id": 123,
    "breedName": "Marwari",
    "age": "5 years",
    "gender": "male",
    "purpose": "racing",
    "healthCondition": "excellent",
    "expectedPrice": "250000.00",
    "isNegotiable": true,
    "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/abc.jpg",
    "frontPhotoPublicId": "horse-listings/images/abc",
    "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/def.jpg",
    "sidePhotoPublicId": "horse-listings/images/def",
    "fullBodyPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/ghi.jpg",
    "fullBodyPhotoPublicId": "horse-listings/images/ghi",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/horse-listings/videos/jkl.mp4",
    "videoPublicId": "horse-listings/videos/jkl",
    "vaccinationDetails": "All vaccinations completed",
    "deliveryAvailable": true,
    "additionalNotes": "Well-trained, suitable for beginners",
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
      "msg": "Gender must be either male or female",
      "param": "gender",
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

## 2. Get All Horse Listings

**Endpoint:** `GET /api/horses/listings`
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
  "minPrice": "100000",               // Minimum price
  "maxPrice": "500000",               // Maximum price
  "gender": "male",                   // male, female
  "purpose": "racing",                // riding, racing, breeding
  "healthCondition": "excellent",     // excellent, good, average
  "deliveryAvailable": "true",        // true/false

  // Sorting
  "sortBy": "created_at",             // Fields: created_at, expectedPrice, views
  "sortOrder": "DESC"                 // ASC or DESC
}
```

### Example Request (JavaScript/Axios)

```javascript
const response = await axios.get('http://localhost:5000/api/horses/listings', {
  params: {
    page: 1,
    limit: 10,
    city: 'Pune',
    minPrice: 100000,
    maxPrice: 500000,
    gender: 'male',
    purpose: 'racing',
    healthCondition: 'excellent',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  }
});
```

### Example Request (cURL)

```bash
curl -X GET "http://localhost:5000/api/horses/listings?page=1&limit=10&city=Pune&minPrice=100000&maxPrice=500000&gender=male&purpose=racing&healthCondition=excellent&sortBy=created_at&sortOrder=DESC"
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
        "breedName": "Marwari",
        "age": "5 years",
        "gender": "male",
        "purpose": "racing",
        "healthCondition": "excellent",
        "expectedPrice": "250000.00",
        "isNegotiable": true,
        "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/abc.jpg",
        "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/def.jpg",
        "fullBodyPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/ghi.jpg",
        "video": "https://res.cloudinary.com/xxx/video/upload/v123/horse-listings/videos/jkl.mp4",
        "vaccinationDetails": "All vaccinations completed",
        "deliveryAvailable": true,
        "additionalNotes": "Well-trained, suitable for beginners",
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

## 3. Get Horse Listing by ID

**Endpoint:** `GET /api/horses/listings/:id`
**Access:** Public (No Authentication Required)

### Path Parameters

```javascript
{
  "id": 1  // Integer ID of the horse listing
}
```

### Example Request (JavaScript/Axios)

```javascript
const horseId = 1;
const response = await axios.get(`http://localhost:5000/api/horses/listings/${horseId}`);
```

### Example Request (cURL)

```bash
curl -X GET http://localhost:5000/api/horses/listings/1
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 123,
    "breedName": "Marwari",
    "age": "5 years",
    "gender": "male",
    "purpose": "racing",
    "healthCondition": "excellent",
    "expectedPrice": "250000.00",
    "isNegotiable": true,
    "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/abc.jpg",
    "frontPhotoPublicId": "horse-listings/images/abc",
    "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/def.jpg",
    "sidePhotoPublicId": "horse-listings/images/def",
    "fullBodyPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/ghi.jpg",
    "fullBodyPhotoPublicId": "horse-listings/images/ghi",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/horse-listings/videos/jkl.mp4",
    "videoPublicId": "horse-listings/videos/jkl",
    "vaccinationDetails": "All vaccinations completed",
    "deliveryAvailable": true,
    "additionalNotes": "Well-trained, suitable for beginners",
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
  "message": "Horse listing not found"
}
```

---

## 4. Get Nearby Horse Listings

**Endpoint:** `GET /api/horses/listings/nearby`
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
const response = await axios.get('http://localhost:5000/api/horses/listings/nearby', {
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
curl -X GET "http://localhost:5000/api/horses/listings/nearby?latitude=18.5204&longitude=73.8567&radius=50&limit=10"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "breedName": "Marwari",
      "age": "5 years",
      "gender": "male",
      "purpose": "racing",
      "healthCondition": "excellent",
      "expectedPrice": "250000.00",
      "isNegotiable": true,
      "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/abc.jpg",
      "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/def.jpg",
      "fullBodyPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/ghi.jpg",
      "video": "https://res.cloudinary.com/xxx/video/upload/v123/horse-listings/videos/jkl.mp4",
      "vaccinationDetails": "All vaccinations completed",
      "deliveryAvailable": true,
      "additionalNotes": "Well-trained, suitable for beginners",
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
      "breedName": "Kathiawari",
      "age": "6 years",
      "gender": "female",
      "purpose": "riding",
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

## 5. Get My Horse Listings

**Endpoint:** `GET /api/horses/my-listings`
**Access:** Protected (Authentication Required)

### Query Parameters (Optional)

```javascript
{
  "status": "active"  // Options: active, sold, expired, deleted, all (default: active)
}
```

### Example Request (JavaScript/Axios)

```javascript
const response = await axios.get('http://localhost:5000/api/horses/my-listings', {
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
curl -X GET "http://localhost:5000/api/horses/my-listings?status=active" \
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
      "breedName": "Marwari",
      "age": "5 years",
      "gender": "male",
      "purpose": "racing",
      "healthCondition": "excellent",
      "expectedPrice": "250000.00",
      "isNegotiable": true,
      "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/abc.jpg",
      "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/def.jpg",
      "fullBodyPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/ghi.jpg",
      "video": "https://res.cloudinary.com/xxx/video/upload/v123/horse-listings/videos/jkl.mp4",
      "vaccinationDetails": "All vaccinations completed",
      "deliveryAvailable": true,
      "additionalNotes": "Well-trained, suitable for beginners",
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

## 6. Update Horse Listing

**Endpoint:** `PUT /api/horses/listings/:id`
**Access:** Protected (Authentication Required - Owner Only)
**Content-Type:** `multipart/form-data`

### Path Parameters

```javascript
{
  "id": 1  // Integer ID of the horse listing
}
```

### Request Body (Form Data - All Optional)

You can update any field(s) from the create request. Only include fields you want to update.

```javascript
{
  // Horse Details
  "breedName": "Marwari",
  "age": "6 years",
  "gender": "male",
  "purpose": "breeding",

  // Physical Details
  "healthCondition": "good",

  // Price & Negotiation
  "expectedPrice": "280000",
  "isNegotiable": "false",

  // Photos & Videos (uploading new files will replace old ones)
  "frontPhoto": <New File>,
  "sidePhoto": <New File>,
  "fullBodyPhoto": <New File>,
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
formData.append('expectedPrice', '280000');
formData.append('isNegotiable', 'false');
formData.append('additionalNotes', 'Price updated - firm now');

const horseId = 1;
const response = await axios.put(
  `http://localhost:5000/api/horses/listings/${horseId}`,
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
curl -X PUT http://localhost:5000/api/horses/listings/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "expectedPrice=280000" \
  -F "isNegotiable=false" \
  -F "additionalNotes=Price updated - firm now"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Horse listing updated successfully",
  "data": {
    "id": 1,
    "user_id": 123,
    "breedName": "Marwari",
    "age": "5 years",
    "gender": "male",
    "purpose": "racing",
    "healthCondition": "excellent",
    "expectedPrice": "280000.00",
    "isNegotiable": false,
    "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/abc.jpg",
    "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/def.jpg",
    "fullBodyPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/ghi.jpg",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/horse-listings/videos/jkl.mp4",
    "vaccinationDetails": "All vaccinations completed",
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
  "message": "Horse listing not found"
}
```

---

## 7. Delete Horse Listing

**Endpoint:** `DELETE /api/horses/listings/:id`
**Access:** Protected (Authentication Required - Owner Only)

**Note:** This is a soft delete. The listing status is changed to "deleted" but the record remains in the database.

### Path Parameters

```javascript
{
  "id": 1  // Integer ID of the horse listing
}
```

### Example Request (JavaScript/Axios)

```javascript
const horseId = 1;
const response = await axios.delete(
  `http://localhost:5000/api/horses/listings/${horseId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

### Example Request (cURL)

```bash
curl -X DELETE http://localhost:5000/api/horses/listings/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Horse listing deleted successfully"
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
  "message": "Horse listing not found"
}
```

---

## 8. Mark Horse as Sold

**Endpoint:** `PATCH /api/horses/listings/:id/sold`
**Access:** Protected (Authentication Required - Owner Only)

### Path Parameters

```javascript
{
  "id": 1  // Integer ID of the horse listing
}
```

### Example Request (JavaScript/Axios)

```javascript
const horseId = 1;
const response = await axios.patch(
  `http://localhost:5000/api/horses/listings/${horseId}/sold`,
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
curl -X PATCH http://localhost:5000/api/horses/listings/1/sold \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Horse listing marked as sold",
  "data": {
    "id": 1,
    "user_id": 123,
    "breedName": "Marwari",
    "age": "5 years",
    "gender": "male",
    "purpose": "racing",
    "healthCondition": "excellent",
    "expectedPrice": "250000.00",
    "isNegotiable": true,
    "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/abc.jpg",
    "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/def.jpg",
    "fullBodyPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/horse-listings/images/ghi.jpg",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/horse-listings/videos/jkl.mp4",
    "vaccinationDetails": "All vaccinations completed",
    "deliveryAvailable": true,
    "additionalNotes": "Well-trained, suitable for beginners",
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
  "message": "Horse listing not found"
}
```

---

## Field Validation Rules

### Enums

```javascript
gender: ["male", "female"]
purpose: ["riding", "racing", "breeding"]
healthCondition: ["excellent", "good", "average"]
status: ["active", "sold", "expired", "deleted"]
```

### Data Types

```javascript
breedName: String (2-100 characters)
age: String
gender: Enum (male, female)
purpose: Enum (riding, racing, breeding)
healthCondition: Enum (excellent, good, average)
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
Images (frontPhoto, sidePhoto, fullBodyPhoto):
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

## Complete Example - Creating a Horse Listing

### HTML Form Example

```html
<form id="horseForm" enctype="multipart/form-data">
  <!-- Horse Details -->
  <input type="text" name="breedName" placeholder="Breed Name" required>
  <input type="text" name="age" placeholder="Age (e.g., 5 years)" required>

  <select name="gender" required>
    <option value="">Select Gender</option>
    <option value="male">Male / नर</option>
    <option value="female">Female / मादी</option>
  </select>

  <select name="purpose" required>
    <option value="">Select Purpose</option>
    <option value="riding">Riding / स्वारी</option>
    <option value="racing">Racing / शर्यत</option>
    <option value="breeding">Breeding / प्रजनन</option>
  </select>

  <!-- Physical Details -->
  <select name="healthCondition" required>
    <option value="">Select Health Condition</option>
    <option value="excellent">Excellent / उत्कृष्ट</option>
    <option value="good">Good / चांगली</option>
    <option value="average">Average / मध्यम</option>
  </select>

  <!-- Price -->
  <input type="number" name="expectedPrice" placeholder="Expected Price (₹)" required>
  <label>
    <input type="checkbox" name="isNegotiable" value="true"> Negotiable / किंमत चर्चासत्रीय आहे का?
  </label>

  <!-- Photos -->
  <label>Front Photo:
    <input type="file" name="frontPhoto" accept="image/*">
  </label>
  <label>Side Photo:
    <input type="file" name="sidePhoto" accept="image/*">
  </label>
  <label>Full Body Photo:
    <input type="file" name="fullBodyPhoto" accept="image/*">
  </label>
  <label>Video:
    <input type="file" name="video" accept="video/*">
  </label>

  <!-- Additional Info -->
  <textarea name="vaccinationDetails" placeholder="Vaccination Details / लसीकरण माहिती"></textarea>
  <label>
    <input type="checkbox" name="deliveryAvailable" value="true"> Delivery Available / डिलिव्हरीची सोय
  </label>
  <textarea name="additionalNotes" placeholder="Additional Notes"></textarea>

  <!-- Location -->
  <input type="text" name="city" placeholder="City">
  <input type="text" name="state" placeholder="State">
  <input type="text" name="pincode" placeholder="Pincode">

  <button type="submit">Create Listing</button>
</form>

<script>
document.getElementById('horseForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const token = localStorage.getItem('token'); // Get your JWT token

  try {
    const response = await fetch('http://localhost:5000/api/horses/listings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      alert('Horse listing created successfully!');
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

9. **Photo Types**: Horse listings use three photos - front, side, and full body (unlike animals/buffalos which use milk scene photo).

10. **Gender & Purpose**: These are specific to horses and allow filtering based on intended use.

---

## Support

For issues or questions:
- Check the health endpoint: `GET /health`
- View API documentation: `GET /api`
- Check server logs for detailed error messages
