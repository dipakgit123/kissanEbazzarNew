# API Endpoint Testing Guide

## Testing Each Animal Form Submission

### 🌐 WEB APP TESTING

#### Test 1: Cow Form
1. Navigate to: `http://localhost:5174/sell-animal`
2. Select "Cow" tab
3. Fill required fields:
   - Breed Name: "Holstein"
   - Age: "3 years"
   - Milk Capacity: "15 liters"
   - Price: "50000"
4. Upload at least one photo
5. Click Submit
6. **Expected API Call:** `POST /api/animals/listings`
7. Check browser console for success/error

#### Test 2: Buffalo Form
1. Select "Buffalo" tab
2. Fill required fields
3. Submit
4. **Expected API Call:** `POST /api/buffalos/listings`

#### Test 3: Goat Form
1. Select "Goat" tab
2. Fill required fields
3. Submit
4. **Expected API Call:** `POST /api/goats/listings`

#### Test 4: Horse Form
1. Select "Horse" tab
2. Fill required fields
3. Submit
4. **Expected API Call:** `POST /api/horses/listings`

#### Test 5: Dog Form
1. Select "Dog" tab
2. Fill required fields
3. Submit
4. **Expected API Call:** `POST /api/dogs/listings`

#### Test 6: Cat Form
1. Select "Cat" tab
2. Fill required fields
3. Submit
4. **Expected API Call:** `POST /api/cats/listings`

#### Test 7: Other Animals Form
1. Select "Other" tab
2. Fill required fields
3. Submit
4. **Expected API Call:** `POST /api/other-animals/listings`

---

### 📱 MOBILE APP TESTING

#### Test Each Animal Type:
1. Open mobile app
2. Navigate to "Sell Animal" screen
3. For each animal type (Cow, Buffalo, Goat, Horse, Dog, Cat, Other):
   - Select animal type
   - Fill required fields
   - Upload photos
   - Submit
   - Check console logs for API endpoint

---

## Results Template

| Animal Type | Web Endpoint | Status | Mobile Endpoint | Status |
|------------|--------------|--------|-----------------|--------|
| Cow | /api/animals/listings | ⏳ | /api/animals/listings | ⏳ |
| Buffalo | /api/buffalos/listings | ⏳ | /api/buffalos/listings | ⏳ |
| Goat | /api/goats/listings | ⏳ | /api/goats/listings | ⏳ |
| Horse | /api/horses/listings | ⏳ | /api/horses/listings | ⏳ |
| Dog | /api/dogs/listings | ⏳ | /api/dogs/listings | ⏳ |
| Cat | /api/cats/listings | ⏳ | /api/cats/listings | ⏳ |
| Other | /api/other-animals/listings | ⏳ | /api/other-animals/listings | ⏳ |
