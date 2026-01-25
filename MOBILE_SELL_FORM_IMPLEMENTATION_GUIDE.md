# Mobile App Sell Form - Complete Implementation Guide

## Overview
Restructure the mobile app's sell form to match the web frontend's structure where each animal type has its own dedicated form component.

---

## Current vs Desired Structure

### Web Frontend Structure ✅
```
AnimalListingPage.jsx
├── Tabs (Horizontal scroll on mobile, grid on desktop)
│   ├── Cow Tab → AnimalListingForm
│   ├── Buffalo Tab → BuffaloListingForm  
│   ├── Goat Tab → GoatListingForm
│   ├── Horse Tab → HorseListingForm
│   ├── Dog Tab → DogListingForm
│   ├── Cat Tab → CatListingForm
│   └── Other Tab → OtherAnimalListingForm
└── Form renders based on selected tab
```

### Current Mobile Structure ❌
```
SellAnimalScreen.js
└── Single generic form for all animals
    └── Generic fields that don't match backend requirements
```

### Desired Mobile Structure ✅
```
SellAnimalScreen.js
├── Screen 1: Animal Selection (Card Grid)
│   └── Click animal → Navigate to Screen 2
└── Screen 2: Animal-Specific Form
    ├── Header with animal badge
    ├── Back button to return to selection
    └── Render specific form component
```

---

## Implementation Steps

### Step 1: Update SellAnimalScreen.js Structure

The screen should have two states:
1. **Selection State**: Show animal cards (when `selectedAnimal === null`)
2. **Form State**: Show specific form (when `selectedAnimal !== null`)

```javascript
const SellAnimalScreen = ({ navigation }) => {
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  
  // Animal selection screen
  if (!selectedAnimal) {
    return <AnimalSelectionView onSelect={setSelectedAnimal} />;
  }
  
  // Animal-specific form screen
  return (
    <View>
      <Header animal={selectedAnimal} onBack={() => setSelectedAnimal(null)} />
      {renderAnimalForm(selectedAnimal)}
    </View>
  );
};
```

### Step 2: Create Separate Form Components

Each animal needs its own form component that matches the web frontend:

#### Directory Structure
```
mobile/src/components/
└── forms/
    ├── CowListingForm.js          (maps to AnimalListingForm.jsx)
    ├── BuffaloListingForm.js       (maps to BuffaloListingForm.jsx)
    ├── GoatListingForm.js          (maps to GoatListingForm.jsx)
    ├── HorseListingForm.js         (maps to HorseListingForm.jsx)
    ├── DogListingForm.js           (maps to DogListingForm.jsx)
    ├── CatListingForm.js           (maps to CatListingForm.jsx)
    └── OtherAnimalListingForm.js   (maps to OtherAnimalListingForm.jsx)
```

### Step 3: Form Field Mappings

#### Cow/Buffalo Form Fields
Based on `BuffaloListingForm.jsx`:
```javascript
{
  breedName: '',           // Required
  age: '',                 // Required  
  milkCapacity: '',        // Required (liters/day)
  pregnancyStatus: '',     // pregnant/not_pregnant/recently_delivered/unknown
  hasHorns: 'true',        // Radio: 'true'/'false' (string!)
  healthCondition: 'good', // excellent/good/average
  expectedPrice: '',       // Required
  isNegotiable: 'true',    // Radio: 'true'/'false' (string!)
  vaccinationDetails: '',  // Optional text
  deliveryAvailable: false,// Boolean
  additionalNotes: '',     // Optional text
  frontPhoto: null,        // File
  sidePhoto: null,         // File
  milkScenePhoto: null,    // File (buffalo specific)
  video: null              // File (optional)
}
```

**API Endpoint:**
- Cow: `POST /api/animals/listings`
- Buffalo: `POST /api/buffalos/listings`

#### Dog/Cat Form Fields
Based on `DogListingForm.jsx`:
```javascript
{
  dogType: 'male',         // male/female
  breedName: '',           // Required
  age: '',                 // Required
  color: '',               // Required
  weight: '',              // Optional
  height: '',              // Optional (dogs only)
  vaccinationStatus: 'yes',// yes/no/partial
  healthCondition: 'healthy', // healthy/needs_attention
  trained: 'yes',          // yes/no (dogs)/not_applicable (cats)
  behavior: 'friendly',    // friendly/aggressive/shy/playful
  purpose: 'pet',          // pet/breeding/show (dogs)/pet/breeding (cats)
  description: '',         // Optional
  expectedPrice: '',       // Required
  isNegotiable: 'true',    // Radio: 'true'/'false' (string!)
  frontPhoto: null,        // File
  sidePhoto: null,         // File
  video: null              // File (optional)
}
```

**API Endpoint:**
- Dog: `POST /api/dogs/listings`
- Cat: `POST /api/cats/listings`

#### Goat Form Fields
Based on `GoatListingForm.jsx`:
```javascript
{
  goatType: 'male',        // male/female
  breedName: '',           // Required
  age: '',                 // Required
  weight: '',              // Required
  color: '',               // Optional
  hornType: 'with_horns',  // with_horns/without_horns/dehorned
  healthStatus: 'healthy', // healthy/sick/recovering
  purpose: 'milk',         // milk/meat/breeding/pet
  description: '',         // Optional
  milkCapacity: '',        // Optional (for milk goats)
  lastDeliveryDate: '',    // Optional
  numberOfKidsDelivered: '',// Optional
  expectedPrice: '',       // Required
  isNegotiable: 'true',    // Radio: 'true'/'false' (string!)
  frontPhoto: null,        // File
  sidePhoto: null,         // File
  video: null              // File (optional)
}
```

**API Endpoint:**
- Goat: `POST /api/goats/listings`

#### Horse Form Fields
Based on `HorseListingForm.jsx`:
```javascript
{
  gender: 'male',          // male/female
  breedName: '',           // Required
  age: '',                 // Required
  color: '',               // Required
  height: '',              // Required (in hands or cm)
  weight: '',              // Required
  healthCondition: 'good', // excellent/good/average
  trained: 'yes',          // yes/partially/no
  purpose: 'riding',       // riding/racing/breeding/work
  vaccinationDetails: '',  // Optional
  description: '',         // Optional
  expectedPrice: '',       // Required
  isNegotiable: 'true',    // Radio: 'true'/'false' (string!)
  deliveryAvailable: false,// Boolean
  frontPhoto: null,        // File
  sidePhoto: null,         // File
  video: null              // File (optional)
}
```

**API Endpoint:**
- Horse: `POST /api/horses/listings`

#### Other Animals Form Fields
Based on `OtherAnimalListingForm.jsx`:
```javascript
{
  animalType: '',          // Required: sheep/pig/rabbit/chicken/duck/turkey/camel/donkey/mule/exotic/other
  breedName: '',           // Required
  age: '',                 // Required
  gender: 'male',          // male/female
  weight: '',              // Optional
  color: '',               // Optional
  healthCondition: 'excellent', // excellent/good/average
  temperament: 'friendly', // friendly/calm/energetic/protective/independent
  isTrainedForWork: true,  // Boolean
  specialSkills: '',       // Optional
  vaccinationDetails: '',  // Optional
  expectedPrice: '',       // Required
  isNegotiable: true,      // Boolean (checkbox, not radio!)
  deliveryAvailable: true, // Boolean
  additionalNotes: '',     // Optional
  frontPhoto: null,        // File
  sidePhoto: null,         // File
  additionalPhoto: null,   // File
  video: null              // File (optional)
}
```

**API Endpoint:**
- Other: `POST /api/other-animals/listings`

---

## Key Implementation Notes

### 1. Boolean vs String Values
⚠️ **IMPORTANT:** Some forms use string values for radio buttons, others use boolean for checkboxes!

**String Values (Radio Buttons):**
- `hasHorns: 'true'` or `'false'` (Cow/Buffalo)
- `isNegotiable: 'true'` or `'false'` (Cow/Buffalo/Dog/Cat/Goat/Horse)

**Boolean Values (Checkboxes):**
- `deliveryAvailable: false` (Cow/Buffalo/Horse/Other)
- `isNegotiable: true` (Other Animals - uses checkbox!)
- `isTrainedForWork: true` (Other Animals)

### 2. FormData Submission
All forms must use `multipart/form-data`:

```javascript
const formData = new FormData();

// Text fields
formData.append('breedName', values.breedName);
formData.append('age', values.age);

// Boolean fields (convert to match backend expectations)
formData.append('hasHorns', values.hasHorns); // String 'true'/'false'
formData.append('deliveryAvailable', values.deliveryAvailable); // Boolean

// Files
if (values.frontPhoto) {
  formData.append('frontPhoto', {
    uri: values.frontPhoto,
    type: 'image/jpeg',
    name: 'front.jpg'
  });
}
```

### 3. Form Validation
Each form should validate before submission:
- Required fields must be filled
- At least one photo must be uploaded
- Price must be a positive number
- Age/weight must be valid numbers

### 4. Success Navigation
After successful submission:
```javascript
Alert.alert(
  'Success',
  'Listing created successfully!',
  [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
);
```

---

## UI Design for Mobile

### Animal Selection Screen
```
┌─────────────────────────────┐
│ ← Sell Animal               │
├─────────────────────────────┤
│ ℹ️  Quick Tips              │
│ • Select animal type below  │
│ • Fill accurate details     │
│ • Upload clear photos       │
└─────────────────────────────┘

┌──────────┬──────────┐
│   🐄     │   🐃     │
│   Cow    │  Buffalo │
│    →     │    →     │
├──────────┼──────────┤
│   🐐     │   🐴     │
│   Goat   │  Horse   │
│    →     │    →     │
├──────────┼──────────┤
│   🐕     │   🐱     │
│   Dog    │   Cat    │
│    →     │    →     │
├──────────┴──────────┤
│   🐾  Other Animals │
│         →           │
└─────────────────────┘
```

### Form Screen
```
┌─────────────────────────────┐
│ ← Sell Animal - Cow         │
├─────────────────────────────┤
│ 🐄 Cow                      │
│ Selected Animal    [Change] │
├─────────────────────────────┤
│                             │
│ [Form Fields Here]          │
│ • Breed Name                │
│ • Age                       │
│ • Milk Capacity             │
│ • Has Horns? ○Yes ○No       │
│ • Photos                    │
│ • Price                     │
│                             │
│ [Submit Listing Button]     │
│                             │
└─────────────────────────────┘
```

---

## Testing Checklist

For each animal type form:
- [ ] Animal selection works
- [ ] Form displays correct fields
- [ ] Back button returns to selection
- [ ] Required field validation works
- [ ] Photo selection works
- [ ] Photo preview displays
- [ ] Price validation works
- [ ] Form submits to correct endpoint
- [ ] Success message displays
- [ ] Navigation after success works
- [ ] Error handling works
- [ ] Form resets after submission

---

## Next Steps

1. ✅ Create plan document (this file)
2. ⏳ Create form components directory structure
3. ⏳ Implement CowListingForm component
4. ⏳ Implement BuffaloListingForm component
5. ⏳ Implement remaining form components
6. ⏳ Update SellAnimalScreen with selection logic
7. ⏳ Test each form individually
8. ⏳ Test complete flow end-to-end
9. ⏳ Update navigation and routing

---

## Priority Order

Implement in this order based on usage:
1. **Cow** (Most common)
2. **Buffalo** (Very common)
3. **Goat** (Common)
4. **Dog** (Popular pets)
5. **Cat** (Popular pets)
6. **Horse** (Less common)
7. **Other** (Catch-all)
