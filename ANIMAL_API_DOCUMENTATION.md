# Animal Listing API Documentation

Complete API documentation for Animal listing endpoints with request/response examples.

---

## Base URL
```
http://localhost:5000/api/animals
```

---

## Authentication
Protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Table of Contents
1. [Create Animal Listing](#1-create-animal-listing) - POST `/listings` 🔒
2. [Get All Animal Listings](#2-get-all-animal-listings) - GET `/listings` 🌐
3. [Get Animal Listing by ID](#3-get-animal-listing-by-id) - GET `/listings/:id` 🌐
4. [Get Nearby Animal Listings](#4-get-nearby-animal-listings) - GET `/listings/nearby` 🌐
5. [Get My Animal Listings](#5-get-my-animal-listings) - GET `/my-listings` 🔒
6. [Update Animal Listing](#6-update-animal-listing) - PUT `/listings/:id` 🔒
7. [Delete Animal Listing](#7-delete-animal-listing) - DELETE `/listings/:id` 🔒
8. [Mark Animal as Sold](#8-mark-animal-as-sold) - PATCH `/listings/:id/sold` 🔒

🔒 = Protected (Auth Required) | 🌐 = Public

---

## 1. Create Animal Listing

**Endpoint:** `POST /api/animals/listings`
**Access:** Protected (Authentication Required)
**Content-Type:** `multipart/form-data`

### Request Body (Form Data)

#### Required Fields:
```javascript
{
  // Animal Details
  "breedName": "Gir",                        // String
  "age": "4",                                 // Number (years)
  "milkCapacity": "20.5",                    // Number (liters/day)
  "pregnancyStatus": "pregnant",             // Enum: pregnant, not_pregnant, recently_delivered, unknown
  "healthCondition": "excellent",            // Enum: excellent, good, average
  "expectedPrice": "125000"                  // Number (positive)
}
```

#### Optional Fields:
```javascript
{
  // Physical Details
  "hasHorns": "true",                        // Boolean (true/false)
  "isNegotiable": "true",                    // Boolean (true/false)
  "deliveryAvailable": "true",               // Boolean (true/false)

  // Photos & Videos
  "frontPhoto": <File>,                      // Image file (Max 5MB)
  "sidePhoto": <File>,                       // Image file (Max 5MB)
  "milkScenePhoto": <File>,                  // Image file (Max 5MB)
  "video": <File>,                           // Video file (Max 25MB)

  // Additional Information
  "vaccinationDetails": "All vaccinations up to date",  // Text
  "additionalNotes": "Very calm and healthy cow"        // Text
}
```

**Note:** Location is automatically fetched from the user's saved location if available.

### Example Request (JavaScript/Axios)

```javascript
const formData = new FormData();

// Required fields
formData.append('breedName', 'Gir');
formData.append('age', '4');
formData.append('milkCapacity', '20.5');
formData.append('pregnancyStatus', 'pregnant');
formData.append('healthCondition', 'excellent');
formData.append('expectedPrice', '125000');

// Optional fields
formData.append('hasHorns', 'true');
formData.append('isNegotiable', 'true');
formData.append('deliveryAvailable', 'true');
formData.append('vaccinationDetails', 'All vaccinations up to date');
formData.append('additionalNotes', 'Very calm and healthy cow');

// Photos and video
formData.append('frontPhoto', frontPhotoFile);
formData.append('sidePhoto', sidePhotoFile);
formData.append('milkScenePhoto', milkScenePhotoFile);
formData.append('video', videoFile);

// Make request
const response = await axios.post('http://localhost:5000/api/animals/listings', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

### Example Request (cURL)

```bash
curl -X POST http://localhost:5000/api/animals/listings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "breedName=Gir" \
  -F "age=4" \
  -F "milkCapacity=20.5" \
  -F "pregnancyStatus=pregnant" \
  -F "healthCondition=excellent" \
  -F "expectedPrice=125000" \
  -F "hasHorns=true" \
  -F "isNegotiable=true" \
  -F "deliveryAvailable=true" \
  -F "vaccinationDetails=All vaccinations up to date" \
  -F "frontPhoto=@/path/to/front.jpg" \
  -F "sidePhoto=@/path/to/side.jpg" \
  -F "milkScenePhoto=@/path/to/milk.jpg" \
  -F "video=@/path/to/video.mp4"
```

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Listing created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": 123,
    "breedName": "Gir",
    "age": 4,
    "milkCapacity": "20.50",
    "pregnancyStatus": "pregnant",
    "hasHorns": true,
    "healthCondition": "excellent",
    "expectedPrice": "125000.00",
    "isNegotiable": true,
    "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/abc.jpg",
    "frontPhotoPublicId": "animal-listings/abc",
    "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/def.jpg",
    "sidePhotoPublicId": "animal-listings/def",
    "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/ghi.jpg",
    "milkScenePhotoPublicId": "animal-listings/ghi",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/animal-listings/jkl.mp4",
    "videoPublicId": "animal-listings/jkl",
    "vaccinationDetails": "All vaccinations up to date",
    "deliveryAvailable": true,
    "additionalNotes": "Very calm and healthy cow",
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

**400 Bad Request - Missing Required Fields:**
```json
{
  "success": false,
  "message": "Required fields missing: breedName, age, milkCapacity, pregnancyStatus, healthCondition, expectedPrice"
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

## 2. Get All Animal Listings

**Endpoint:** `GET /api/animals/listings`
**Access:** Public (No Authentication Required)

### Query Parameters (All Optional)

```javascript
{
  // Pagination
  "page": 1,                          // Default: 1
  "limit": 10,                        // Default: 10

  // Filters
  "breedName": "Gir",                 // Filter by breed name (case-insensitive)
  "city": "Pune",                     // Filter by city (case-insensitive)
  "state": "Maharashtra",             // Filter by state (case-insensitive)
  "minPrice": "50000",                // Minimum price
  "maxPrice": "150000",               // Maximum price
  "pregnancyStatus": "pregnant",      // pregnant, not_pregnant, recently_delivered, unknown
  "healthCondition": "excellent",     // excellent, good, average

  // Sorting
  "sortBy": "created_at",             // Fields: created_at, expected_price, views
  "order": "DESC"                     // ASC or DESC
}
```

### Example Request (JavaScript/Axios)

```javascript
const response = await axios.get('http://localhost:5000/api/animals/listings', {
  params: {
    page: 1,
    limit: 10,
    city: 'Pune',
    minPrice: 50000,
    maxPrice: 150000,
    pregnancyStatus: 'pregnant',
    healthCondition: 'excellent',
    sortBy: 'created_at',
    order: 'DESC'
  }
});
```

### Example Request (cURL)

```bash
curl -X GET "http://localhost:5000/api/animals/listings?page=1&limit=10&city=Pune&minPrice=50000&maxPrice=150000&pregnancyStatus=pregnant&healthCondition=excellent&sortBy=created_at&order=DESC"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": 123,
        "breedName": "Gir",
        "age": 4,
        "milkCapacity": "20.50",
        "pregnancyStatus": "pregnant",
        "hasHorns": true,
        "healthCondition": "excellent",
        "expectedPrice": "125000.00",
        "isNegotiable": true,
        "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/abc.jpg",
        "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/def.jpg",
        "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/ghi.jpg",
        "video": "https://res.cloudinary.com/xxx/video/upload/v123/animal-listings/jkl.mp4",
        "vaccinationDetails": "All vaccinations up to date",
        "deliveryAvailable": true,
        "additionalNotes": "Very calm and healthy cow",
        "latitude": "18.52040000",
        "longitude": "73.85670000",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411001",
        "status": "active",
        "views": 45,
        "created_at": "2025-01-13T10:30:00.000Z",
        "updated_at": "2025-01-13T10:30:00.000Z",
        "seller": {
          "id": 123,
          "name": "Ramesh Kumar",
          "phone": "+919876543210",
          "created_at": "2024-12-01T10:00:00.000Z"
        }
      }
      // ... more listings
    ],
    "totalCount": 50,
    "currentPage": 1,
    "totalPages": 5
  }
}
```

---

## 3. Get Animal Listing by ID

**Endpoint:** `GET /api/animals/listings/:id`
**Access:** Public (No Authentication Required)

### Path Parameters

```javascript
{
  "id": "550e8400-e29b-41d4-a716-446655440000"  // UUID of the animal listing
}
```

### Example Request (JavaScript/Axios)

```javascript
const animalId = '550e8400-e29b-41d4-a716-446655440000';
const response = await axios.get(`http://localhost:5000/api/animals/listings/${animalId}`);
```

### Example Request (cURL)

```bash
curl -X GET http://localhost:5000/api/animals/listings/550e8400-e29b-41d4-a716-446655440000
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": 123,
    "breedName": "Gir",
    "age": 4,
    "milkCapacity": "20.50",
    "pregnancyStatus": "pregnant",
    "hasHorns": true,
    "healthCondition": "excellent",
    "expectedPrice": "125000.00",
    "isNegotiable": true,
    "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/abc.jpg",
    "frontPhotoPublicId": "animal-listings/abc",
    "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/def.jpg",
    "sidePhotoPublicId": "animal-listings/def",
    "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/ghi.jpg",
    "milkScenePhotoPublicId": "animal-listings/ghi",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/animal-listings/jkl.mp4",
    "videoPublicId": "animal-listings/jkl",
    "vaccinationDetails": "All vaccinations up to date",
    "deliveryAvailable": true,
    "additionalNotes": "Very calm and healthy cow",
    "latitude": "18.52040000",
    "longitude": "73.85670000",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
    "status": "active",
    "views": 46,
    "created_at": "2025-01-13T10:30:00.000Z",
    "updated_at": "2025-01-13T10:30:00.000Z",
    "seller": {
      "id": 123,
      "name": "Ramesh Kumar",
      "phone": "+919876543210",
      "created_at": "2024-12-01T10:00:00.000Z"
    }
  }
}
```

**Note:** Views are automatically incremented when this endpoint is called.

### Error Response (404 Not Found)

```json
{
  "success": false,
  "message": "Listing not found"
}
```

---

## 4. Get Nearby Animal Listings

**Endpoint:** `GET /api/animals/listings/nearby`
**Access:** Public (No Authentication Required)

### Query Parameters

```javascript
{
  "latitude": "18.5204",      // Required - Your current latitude
  "longitude": "73.8567",     // Required - Your current longitude
  "radius": "50"              // Optional - Search radius in km (default: 50)
}
```

### Example Request (JavaScript/Axios)

```javascript
const response = await axios.get('http://localhost:5000/api/animals/listings/nearby', {
  params: {
    latitude: 18.5204,
    longitude: 73.8567,
    radius: 50
  }
});
```

### Example Request (cURL)

```bash
curl -X GET "http://localhost:5000/api/animals/listings/nearby?latitude=18.5204&longitude=73.8567&radius=50"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": 123,
      "breedName": "Gir",
      "age": 4,
      "milkCapacity": "20.50",
      "pregnancyStatus": "pregnant",
      "hasHorns": true,
      "healthCondition": "excellent",
      "expectedPrice": "125000.00",
      "isNegotiable": true,
      "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/abc.jpg",
      "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/def.jpg",
      "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/ghi.jpg",
      "video": "https://res.cloudinary.com/xxx/video/upload/v123/animal-listings/jkl.mp4",
      "vaccinationDetails": "All vaccinations up to date",
      "deliveryAvailable": true,
      "additionalNotes": "Very calm and healthy cow",
      "latitude": "18.52040000",
      "longitude": "73.85670000",
      "city": "Pune",
      "state": "Maharashtra",
      "pincode": "411001",
      "status": "active",
      "views": 45,
      "created_at": "2025-01-13T10:30:00.000Z",
      "updated_at": "2025-01-13T10:30:00.000Z",
      "distance": 2.5
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "breedName": "Jersey",
      "age": 5,
      "milkCapacity": "25.00",
      "city": "Mumbai",
      "distance": 15.8,
      // ... other fields
    }
  ]
}
```

**Note:** Results are sorted by distance (nearest first) and include a `distance` field in kilometers. Returns maximum 20 listings.

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "message": "Latitude and longitude are required"
}
```

---

## 5. Get My Animal Listings

**Endpoint:** `GET /api/animals/my-listings`
**Access:** Protected (Authentication Required)

### Query Parameters (Optional)

```javascript
{
  "status": "active",  // Options: active, sold, expired, deleted, all (default: all)
  "page": 1,           // Default: 1
  "limit": 10          // Default: 10
}
```

### Example Request (JavaScript/Axios)

```javascript
const response = await axios.get('http://localhost:5000/api/animals/my-listings', {
  headers: {
    'Authorization': `Bearer ${token}`
  },
  params: {
    status: 'active',
    page: 1,
    limit: 10
  }
});
```

### Example Request (cURL)

```bash
curl -X GET "http://localhost:5000/api/animals/my-listings?status=active&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": 123,
        "breedName": "Gir",
        "age": 4,
        "milkCapacity": "20.50",
        "pregnancyStatus": "pregnant",
        "hasHorns": true,
        "healthCondition": "excellent",
        "expectedPrice": "125000.00",
        "isNegotiable": true,
        "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/abc.jpg",
        "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/def.jpg",
        "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/ghi.jpg",
        "video": "https://res.cloudinary.com/xxx/video/upload/v123/animal-listings/jkl.mp4",
        "vaccinationDetails": "All vaccinations up to date",
        "deliveryAvailable": true,
        "additionalNotes": "Very calm and healthy cow",
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
    ],
    "totalCount": 5,
    "currentPage": 1,
    "totalPages": 1
  }
}
```

---

## 6. Update Animal Listing

**Endpoint:** `PUT /api/animals/listings/:id`
**Access:** Protected (Authentication Required - Owner Only)
**Content-Type:** `multipart/form-data`

### Path Parameters

```javascript
{
  "id": "550e8400-e29b-41d4-a716-446655440000"  // UUID of the animal listing
}
```

### Request Body (Form Data - All Optional)

You can update any field(s) from the create request. Only include fields you want to update.

```javascript
{
  // Animal Details
  "breedName": "Gir",
  "age": "5",
  "milkCapacity": "22.0",
  "pregnancyStatus": "not_pregnant",
  "healthCondition": "good",
  "expectedPrice": "130000",

  // Physical Details
  "hasHorns": "false",
  "isNegotiable": "false",
  "deliveryAvailable": "false",

  // Photos & Videos (uploading new files will replace old ones)
  "frontPhoto": <New File>,
  "sidePhoto": <New File>,
  "milkScenePhoto": <New File>,
  "video": <New File>,

  // Additional Information
  "vaccinationDetails": "Updated vaccination info",
  "additionalNotes": "Updated notes"
}
```

### Example Request (JavaScript/Axios)

```javascript
const formData = new FormData();
formData.append('expectedPrice', '130000');
formData.append('isNegotiable', 'false');
formData.append('additionalNotes', 'Price updated - firm now');

const animalId = '550e8400-e29b-41d4-a716-446655440000';
const response = await axios.put(
  `http://localhost:5000/api/animals/listings/${animalId}`,
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
curl -X PUT http://localhost:5000/api/animals/listings/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "expectedPrice=130000" \
  -F "isNegotiable=false" \
  -F "additionalNotes=Price updated - firm now"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Listing updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": 123,
    "breedName": "Gir",
    "age": 4,
    "milkCapacity": "20.50",
    "pregnancyStatus": "pregnant",
    "hasHorns": true,
    "healthCondition": "excellent",
    "expectedPrice": "130000.00",
    "isNegotiable": false,
    "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/abc.jpg",
    "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/def.jpg",
    "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/ghi.jpg",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/animal-listings/jkl.mp4",
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

**404 Not Found - Not Owner:**
```json
{
  "success": false,
  "message": "Listing not found or unauthorized"
}
```

---

## 7. Delete Animal Listing

**Endpoint:** `DELETE /api/animals/listings/:id`
**Access:** Protected (Authentication Required - Owner Only)

**Note:** This is a soft delete. The listing status is changed to "deleted" but the record remains in the database.

### Path Parameters

```javascript
{
  "id": "550e8400-e29b-41d4-a716-446655440000"  // UUID of the animal listing
}
```

### Example Request (JavaScript/Axios)

```javascript
const animalId = '550e8400-e29b-41d4-a716-446655440000';
const response = await axios.delete(
  `http://localhost:5000/api/animals/listings/${animalId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

### Example Request (cURL)

```bash
curl -X DELETE http://localhost:5000/api/animals/listings/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Listing deleted successfully"
}
```

### Error Response (404 Not Found)

```json
{
  "success": false,
  "message": "Listing not found or unauthorized"
}
```

---

## 8. Mark Animal as Sold

**Endpoint:** `PATCH /api/animals/listings/:id/sold`
**Access:** Protected (Authentication Required - Owner Only)

### Path Parameters

```javascript
{
  "id": "550e8400-e29b-41d4-a716-446655440000"  // UUID of the animal listing
}
```

### Example Request (JavaScript/Axios)

```javascript
const animalId = '550e8400-e29b-41d4-a716-446655440000';
const response = await axios.patch(
  `http://localhost:5000/api/animals/listings/${animalId}/sold`,
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
curl -X PATCH http://localhost:5000/api/animals/listings/550e8400-e29b-41d4-a716-446655440000/sold \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Listing marked as sold",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": 123,
    "breedName": "Gir",
    "age": 4,
    "milkCapacity": "20.50",
    "pregnancyStatus": "pregnant",
    "hasHorns": true,
    "healthCondition": "excellent",
    "expectedPrice": "125000.00",
    "isNegotiable": true,
    "frontPhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/abc.jpg",
    "sidePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/def.jpg",
    "milkScenePhoto": "https://res.cloudinary.com/xxx/image/upload/v123/animal-listings/ghi.jpg",
    "video": "https://res.cloudinary.com/xxx/video/upload/v123/animal-listings/jkl.mp4",
    "vaccinationDetails": "All vaccinations up to date",
    "deliveryAvailable": true,
    "additionalNotes": "Very calm and healthy cow",
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

### Error Response (404 Not Found)

```json
{
  "success": false,
  "message": "Listing not found or unauthorized"
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
breedName: String (required)
age: Number (required, years)
milkCapacity: Number (required, liters/day)
pregnancyStatus: Enum (required)
healthCondition: Enum (required)
expectedPrice: Number (required, positive)
hasHorns: Boolean (optional)
isNegotiable: Boolean (optional)
deliveryAvailable: Boolean (optional)
vaccinationDetails: Text (optional)
additionalNotes: Text (optional)
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
| 404 | Not Found or Unauthorized |
| 500 | Internal Server Error |

---

## Complete Example - Creating an Animal Listing

### HTML Form Example

```html
<form id="animalForm" enctype="multipart/form-data">
  <!-- Animal Details -->
  <input type="text" name="breedName" placeholder="Breed Name (e.g., Gir, Jersey)" required>
  <input type="number" name="age" placeholder="Age (years)" required>
  <input type="number" step="0.01" name="milkCapacity" placeholder="Milk Capacity (liters/day)" required>

  <select name="pregnancyStatus" required>
    <option value="">Select Pregnancy Status</option>
    <option value="pregnant">Pregnant</option>
    <option value="not_pregnant">Not Pregnant</option>
    <option value="recently_delivered">Recently Delivered</option>
    <option value="unknown">Unknown</option>
  </select>

  <select name="healthCondition" required>
    <option value="">Select Health Condition</option>
    <option value="excellent">Excellent</option>
    <option value="good">Good</option>
    <option value="average">Average</option>
  </select>

  <input type="number" name="expectedPrice" placeholder="Expected Price (₹)" required>

  <!-- Optional Fields -->
  <label>
    <input type="checkbox" name="hasHorns" value="true"> Has Horns
  </label>
  <label>
    <input type="checkbox" name="isNegotiable" value="true"> Price Negotiable
  </label>
  <label>
    <input type="checkbox" name="deliveryAvailable" value="true"> Delivery Available
  </label>

  <!-- Photos -->
  <label>Front Photo:
    <input type="file" name="frontPhoto" accept="image/*">
  </label>
  <label>Side Photo:
    <input type="file" name="sidePhoto" accept="image/*">
  </label>
  <label>Milk Scene Photo:
    <input type="file" name="milkScenePhoto" accept="image/*">
  </label>
  <label>Video:
    <input type="file" name="video" accept="video/*">
  </label>

  <!-- Additional Info -->
  <textarea name="vaccinationDetails" placeholder="Vaccination Details"></textarea>
  <textarea name="additionalNotes" placeholder="Additional Notes"></textarea>

  <button type="submit">Create Listing</button>
</form>

<script>
document.getElementById('animalForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const token = localStorage.getItem('token'); // Get your JWT token

  try {
    const response = await fetch('http://localhost:5000/api/animals/listings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      alert('Animal listing created successfully!');
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

6. **Distance Calculation**: Uses the Haversine formula for accurate distance calculations in the nearby endpoint.

7. **Auto Location**: When creating a listing, location is automatically fetched from the user's saved location.

8. **Pagination**: Use page and limit parameters to control the number of results returned.

9. **Case-Insensitive Search**: City, state, and breed name filters are case-insensitive.

---

## Support

For issues or questions:
- Check the health endpoint: `GET /health`
- View API documentation: `GET /api`
- Check server logs for detailed error messages
