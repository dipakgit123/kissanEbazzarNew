# Dog Listing API Documentation

Complete API documentation for Dog listing endpoints in the Kissan E-Bazzar platform.

---

## Base URL
```
http://localhost:5000/api/dogs
```

---

## Authentication
Protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints Overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/listings` | Protected | Create a new dog listing |
| GET | `/listings` | Public | Get all dog listings with filters |
| GET | `/listings/nearby` | Public | Get nearby dog listings |
| GET | `/listings/:id` | Public | Get single dog listing |
| PUT | `/listings/:id` | Protected | Update dog listing |
| DELETE | `/listings/:id` | Protected | Delete dog listing |
| GET | `/my-listings` | Protected | Get user's own listings |
| PATCH | `/listings/:id/sold` | Protected | Mark listing as sold |

---

## 1. Create Dog Listing

**Endpoint:** `POST /api/dogs/listings`
**Access:** Protected (requires authentication)
**Content-Type:** `multipart/form-data`

### Request Body

#### 1️⃣ Dog Details / कुत्र्याची माहिती

| Field | Type | Required | Description | Marathi |
|-------|------|----------|-------------|---------|
| `dogType` | enum | Yes | Male or Female | नर / मादी |
| `breedName` | string | Yes | Dog breed name | जात |
| `age` | string | Yes | Age in months or years | वय |
| `color` | string | Yes | Color of the dog | रंग |
| `weight` | number | Yes | Weight in kg (0-150) | वजन |
| `height` | number | Yes | Height in cm (0-200) | उंची |
| `vaccinationStatus` | enum | Yes | Yes / No | लसीकरण स्थिती |
| `healthCondition` | enum | Yes | Healthy / Under Treatment | निरोगी / उपचाराधीन |
| `trained` | enum | Yes | Yes / No | प्रशिक्षित |
| `behavior` | enum | Yes | Friendly / Aggressive / Calm | मैत्रीपूर्ण / आक्रमक / शांत |
| `purpose` | enum | Yes | Guard / Pet / Breeding / Show | सुरक्षा / पाळीव / प्रजनन / प्रदर्शन |
| `description` | text | No | Additional information | अतिरिक्त माहिती |

**Enum Values:**
- `dogType`: `male`, `female`
- `vaccinationStatus`: `yes`, `no`
- `healthCondition`: `healthy`, `under_treatment`
- `trained`: `yes`, `no`
- `behavior`: `friendly`, `aggressive`, `calm`
- `purpose`: `guard`, `pet`, `breeding`, `show`

#### 2️⃣ Images / छायाचित्रे

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `photo1` | file | At least 1 | First photo (front view) |
| `photo2` | file | No | Second photo (side view) |
| `photo3` | file | No | Third photo (full body) |
| `photo4` | file | No | Fourth photo |
| `photo5` | file | No | Fifth photo |
| `video` | file | No | Video (max 1) |

**Image Requirements:**
- Min: 1 photo required
- Max: 5 photos + 1 video
- Formats: JPEG, PNG, WebP
- Max size: 5MB per image, 25MB for video

#### 3️⃣ Pricing / किंमत

| Field | Type | Required | Description | Marathi |
|-------|------|----------|-------------|---------|
| `expectedPrice` | number | Yes | Expected price in ₹ | अपेक्षित किंमत |
| `isNegotiable` | boolean | Yes | Price negotiable? | किंमत चर्चनीय आहे का? |

#### 4️⃣ Terms & Confirmation

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `detailsConfirmed` | boolean | Yes | Confirm all details are true |
| `termsAccepted` | boolean | Yes | Accept Animal E-Bazzar's terms |

#### 5️⃣ Location (Optional)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `latitude` | number | No | Location latitude |
| `longitude` | number | No | Location longitude |
| `city` | string | No | City name |
| `state` | string | No | State name |
| `pincode` | string | No | Pincode |

### Example Request (JavaScript/Axios)

```javascript
const formData = new FormData();

// Dog Details
formData.append('dogType', 'male');
formData.append('breedName', 'Labrador');
formData.append('age', '2 years');
formData.append('color', 'Golden');
formData.append('weight', '30');
formData.append('height', '60');
formData.append('vaccinationStatus', 'yes');
formData.append('healthCondition', 'healthy');
formData.append('trained', 'yes');
formData.append('behavior', 'friendly');
formData.append('purpose', 'pet');
formData.append('description', 'Playful Labrador, loyal and vaccinated');

// Images
formData.append('photo1', frontPhotoFile);
formData.append('photo2', sidePhotoFile);
formData.append('video', videoFile);

// Pricing
formData.append('expectedPrice', '25000');
formData.append('isNegotiable', 'true');

// Terms
formData.append('detailsConfirmed', 'true');
formData.append('termsAccepted', 'true');

// Location
formData.append('city', 'Mumbai');
formData.append('state', 'Maharashtra');
formData.append('latitude', '19.0760');
formData.append('longitude', '72.8777');

const response = await axios.post('http://localhost:5000/api/dogs/listings', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

### Example Response

```json
{
  "success": true,
  "message": "Dog listing created successfully",
  "data": {
    "id": 1,
    "user_id": 123,
    "dogType": "male",
    "breedName": "Labrador",
    "age": "2 years",
    "color": "Golden",
    "weight": "30.00",
    "height": "60.00",
    "vaccinationStatus": "yes",
    "healthCondition": "healthy",
    "trained": "yes",
    "behavior": "friendly",
    "purpose": "pet",
    "description": "Playful Labrador, loyal and vaccinated",
    "photo1": "https://cloudinary.com/...",
    "photo2": "https://cloudinary.com/...",
    "video": "https://cloudinary.com/...",
    "expectedPrice": "25000.00",
    "isNegotiable": true,
    "detailsConfirmed": true,
    "termsAccepted": true,
    "city": "Mumbai",
    "state": "Maharashtra",
    "latitude": "19.07600000",
    "longitude": "72.87770000",
    "status": "active",
    "views": 0,
    "created_at": "2025-01-13T10:30:00.000Z",
    "updated_at": "2025-01-13T10:30:00.000Z"
  }
}
```

---

## 2. Get All Dog Listings

**Endpoint:** `GET /api/dogs/listings`
**Access:** Public

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `page=1` |
| `limit` | number | Items per page (default: 10) | `limit=20` |
| `city` | string | Filter by city | `city=Mumbai` |
| `state` | string | Filter by state | `state=Maharashtra` |
| `minPrice` | number | Minimum price | `minPrice=10000` |
| `maxPrice` | number | Maximum price | `maxPrice=50000` |
| `dogType` | enum | Filter by gender | `dogType=male` |
| `purpose` | enum | Filter by purpose | `purpose=pet` |
| `behavior` | enum | Filter by behavior | `behavior=friendly` |
| `healthCondition` | enum | Filter by health | `healthCondition=healthy` |
| `trained` | enum | Filter by training status | `trained=yes` |
| `vaccinationStatus` | enum | Filter by vaccination | `vaccinationStatus=yes` |
| `sortBy` | string | Sort field (default: created_at) | `sortBy=expectedPrice` |
| `sortOrder` | string | ASC or DESC (default: DESC) | `sortOrder=ASC` |

### Example Request

```javascript
const response = await axios.get('http://localhost:5000/api/dogs/listings', {
  params: {
    page: 1,
    limit: 10,
    city: 'Mumbai',
    purpose: 'pet',
    behavior: 'friendly',
    trained: 'yes',
    minPrice: 10000,
    maxPrice: 50000,
    sortBy: 'expectedPrice',
    sortOrder: 'ASC'
  }
});
```

### Example Response

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": 1,
        "dogType": "male",
        "breedName": "Labrador",
        "age": "2 years",
        "color": "Golden",
        "weight": "30.00",
        "height": "60.00",
        "trained": "yes",
        "behavior": "friendly",
        "purpose": "pet",
        "expectedPrice": "25000.00",
        "isNegotiable": true,
        "photo1": "https://cloudinary.com/...",
        "city": "Mumbai",
        "state": "Maharashtra",
        "views": 45,
        "user": {
          "id": 123,
          "phone_number": "+919876543210",
          "city": "Mumbai",
          "state": "Maharashtra"
        }
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

---

## 3. Get Nearby Dog Listings

**Endpoint:** `GET /api/dogs/listings/nearby`
**Access:** Public

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `latitude` | number | Yes | Your latitude |
| `longitude` | number | Yes | Your longitude |
| `radius` | number | No | Search radius in km (default: 50) |
| `limit` | number | No | Max results (default: 10) |

### Example Request

```javascript
const response = await axios.get('http://localhost:5000/api/dogs/listings/nearby', {
  params: {
    latitude: 19.0760,
    longitude: 72.8777,
    radius: 25,
    limit: 10
  }
});
```

### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "dogType": "male",
      "breedName": "Labrador",
      "expectedPrice": "25000.00",
      "photo1": "https://cloudinary.com/...",
      "city": "Mumbai",
      "distance": 5.2,
      "user": {
        "id": 123,
        "phone_number": "+919876543210"
      }
    }
  ]
}
```

---

## 4. Get Single Dog Listing

**Endpoint:** `GET /api/dogs/listings/:id`
**Access:** Public

### Example Request

```javascript
const response = await axios.get('http://localhost:5000/api/dogs/listings/1');
```

### Example Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 123,
    "dogType": "male",
    "breedName": "Labrador",
    "age": "2 years",
    "color": "Golden",
    "weight": "30.00",
    "height": "60.00",
    "vaccinationStatus": "yes",
    "healthCondition": "healthy",
    "trained": "yes",
    "behavior": "friendly",
    "purpose": "pet",
    "description": "Playful Labrador, loyal and vaccinated",
    "photo1": "https://cloudinary.com/...",
    "photo2": "https://cloudinary.com/...",
    "video": "https://cloudinary.com/...",
    "expectedPrice": "25000.00",
    "isNegotiable": true,
    "city": "Mumbai",
    "state": "Maharashtra",
    "status": "active",
    "views": 46,
    "user": {
      "id": 123,
      "phone_number": "+919876543210",
      "city": "Mumbai",
      "state": "Maharashtra"
    }
  }
}
```

---

## 5. Update Dog Listing

**Endpoint:** `PUT /api/dogs/listings/:id`
**Access:** Protected (owner only)
**Content-Type:** `multipart/form-data`

### Example Request

```javascript
const formData = new FormData();
formData.append('expectedPrice', '23000');
formData.append('isNegotiable', 'false');
formData.append('description', 'Updated description');

const response = await axios.put('http://localhost:5000/api/dogs/listings/1', formData, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 6. Delete Dog Listing

**Endpoint:** `DELETE /api/dogs/listings/:id`
**Access:** Protected (owner only)

### Example Request

```javascript
const response = await axios.delete('http://localhost:5000/api/dogs/listings/1', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example Response

```json
{
  "success": true,
  "message": "Dog listing deleted successfully"
}
```

---

## 7. Get My Dog Listings

**Endpoint:** `GET /api/dogs/my-listings`
**Access:** Protected

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: active, sold, expired, all |

### Example Request

```javascript
const response = await axios.get('http://localhost:5000/api/dogs/my-listings', {
  headers: {
    'Authorization': `Bearer ${token}`
  },
  params: {
    status: 'active'
  }
});
```

---

## 8. Mark Dog as Sold

**Endpoint:** `PATCH /api/dogs/listings/:id/sold`
**Access:** Protected (owner only)

### Example Request

```javascript
const response = await axios.patch('http://localhost:5000/api/dogs/listings/1/sold', {}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example Response

```json
{
  "success": true,
  "message": "Dog listing marked as sold",
  "data": {
    "id": 1,
    "status": "sold"
  }
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Dog type must be either male or female",
      "param": "dogType",
      "location": "body"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "You are not authorized to update this listing"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Dog listing not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Failed to create dog listing",
  "error": "Error details..."
}
```

---

## Field Validation Rules

| Field | Validation |
|-------|-----------|
| `dogType` | Must be 'male' or 'female' |
| `breedName` | 2-100 characters, required |
| `age` | Required, string |
| `color` | Required, string |
| `weight` | 0-150 kg, required |
| `height` | 0-200 cm, required |
| `vaccinationStatus` | Must be 'yes' or 'no' |
| `healthCondition` | Must be 'healthy' or 'under_treatment' |
| `trained` | Must be 'yes' or 'no' |
| `behavior` | Must be 'friendly', 'aggressive', or 'calm' |
| `purpose` | Must be 'guard', 'pet', 'breeding', or 'show' |
| `expectedPrice` | Positive number, required |
| `isNegotiable` | Boolean, required |
| `detailsConfirmed` | Boolean, required |
| `termsAccepted` | Boolean, required |
| `photo1` | At least 1 photo required |
| `photo2-5` | Optional |
| `video` | Optional, max 1 |

---

## HTML Form Example (Bilingual)

```html
<form id="dogListingForm" enctype="multipart/form-data">
  <!-- Dog Details / कुत्र्याची माहिती -->
  <h3>Dog Details / कुत्र्याची माहिती</h3>

  <label>Dog Type / कुत्र्याचा प्रकार *</label>
  <select name="dogType" required>
    <option value="male">Male / नर</option>
    <option value="female">Female / मादी</option>
  </select>

  <label>Breed Name / जात *</label>
  <input type="text" name="breedName" placeholder="e.g. Labrador, German Shepherd" required>

  <label>Age / वय *</label>
  <input type="text" name="age" placeholder="in months or years" required>

  <label>Color / रंग *</label>
  <input type="text" name="color" required>

  <label>Weight (kg) / वजन *</label>
  <input type="number" name="weight" step="0.01" min="0" max="150" required>

  <label>Height (cm) / उंची *</label>
  <input type="number" name="height" step="0.01" min="0" max="200" required>

  <label>Vaccination Status / लसीकरण स्थिती *</label>
  <select name="vaccinationStatus" required>
    <option value="yes">Yes / होय</option>
    <option value="no">No / नाही</option>
  </select>

  <label>Health Condition / आरोग्य स्थिती *</label>
  <select name="healthCondition" required>
    <option value="healthy">Healthy / निरोगी</option>
    <option value="under_treatment">Under Treatment / उपचाराधीन</option>
  </select>

  <label>Trained / प्रशिक्षित *</label>
  <select name="trained" required>
    <option value="yes">Yes / होय</option>
    <option value="no">No / नाही</option>
  </select>

  <label>Behavior / स्वभाव *</label>
  <select name="behavior" required>
    <option value="friendly">Friendly / मैत्रीपूर्ण</option>
    <option value="aggressive">Aggressive / आक्रमक</option>
    <option value="calm">Calm / शांत</option>
  </select>

  <label>Purpose / उद्देश *</label>
  <select name="purpose" required>
    <option value="guard">Guard / सुरक्षा</option>
    <option value="pet">Pet / पाळीव</option>
    <option value="breeding">Breeding / प्रजनन</option>
    <option value="show">Show / प्रदर्शन</option>
  </select>

  <label>Description / अतिरिक्त माहिती</label>
  <textarea name="description" placeholder="e.g. playful, loyal, vaccinated"></textarea>

  <!-- Images / छायाचित्रे -->
  <h3>Images / छायाचित्रे</h3>
  <label>Photo 1 (Front) *</label>
  <input type="file" name="photo1" accept="image/*" required>

  <label>Photo 2 (Side)</label>
  <input type="file" name="photo2" accept="image/*">

  <label>Photo 3 (Full Body)</label>
  <input type="file" name="photo3" accept="image/*">

  <label>Photo 4</label>
  <input type="file" name="photo4" accept="image/*">

  <label>Photo 5</label>
  <input type="file" name="photo5" accept="image/*">

  <label>Video (Optional)</label>
  <input type="file" name="video" accept="video/*">

  <!-- Pricing / किंमत -->
  <h3>Pricing / किंमत</h3>
  <label>Expected Price (₹) / अपेक्षित किंमत *</label>
  <input type="number" name="expectedPrice" step="0.01" min="0" required>

  <label>Negotiable / किंमत चर्चनीय आहे का? *</label>
  <select name="isNegotiable" required>
    <option value="true">Yes / होय</option>
    <option value="false">No / नाही</option>
  </select>

  <!-- Terms & Confirmation -->
  <h3>Terms & Confirmation</h3>
  <label>
    <input type="checkbox" name="detailsConfirmed" value="true" required>
    I confirm all the above details are true
  </label>

  <label>
    <input type="checkbox" name="termsAccepted" value="true" required>
    I agree to Animal E-Bazzar's listing terms / मी एनिमल ई-बझारच्या नियमांना सहमती देतो
  </label>

  <button type="submit">Submit Dog Listing</button>
</form>
```

---

## Testing with cURL

### Create Dog Listing
```bash
curl -X POST http://localhost:5000/api/dogs/listings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "dogType=male" \
  -F "breedName=Labrador" \
  -F "age=2 years" \
  -F "color=Golden" \
  -F "weight=30" \
  -F "height=60" \
  -F "vaccinationStatus=yes" \
  -F "healthCondition=healthy" \
  -F "trained=yes" \
  -F "behavior=friendly" \
  -F "purpose=pet" \
  -F "expectedPrice=25000" \
  -F "isNegotiable=true" \
  -F "detailsConfirmed=true" \
  -F "termsAccepted=true" \
  -F "photo1=@/path/to/front.jpg" \
  -F "city=Mumbai" \
  -F "state=Maharashtra"
```

### Get All Listings
```bash
curl http://localhost:5000/api/dogs/listings?page=1&limit=10&purpose=pet&trained=yes
```

---

## Notes

1. **Authentication**: Use WhatsApp OTP authentication to get JWT token
2. **File Uploads**: All images and videos are stored on Cloudinary
3. **Soft Delete**: Deleted listings are marked as 'deleted', not removed from database
4. **View Counter**: Automatically increments when listing is viewed
5. **Location**: Latitude/longitude enable nearby search feature
6. **Validation**: All required fields must be provided with correct data types
7. **Training Status**: Indicates if the dog has received professional training
8. **Purpose Field**: Helps buyers find dogs matching their specific needs

---

## Support

For API issues or questions, contact the development team or check the main API documentation at `/api` endpoint.
