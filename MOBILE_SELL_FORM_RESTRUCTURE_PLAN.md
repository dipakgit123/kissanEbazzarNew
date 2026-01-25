# Mobile App Sell Form Restructuring Plan

## Current Issue
The mobile app has a single generic form with all animal types in one screen, while the web frontend has a tab-based structure where clicking on an animal type opens its specific form.

## Current Structure (Mobile)
```
SellAnimalScreen
├── Animal Type Selection (cards)
├── Single Generic Form
│   ├── Lactation
│   ├── Milk Today
│   ├── Price
│   ├── Photos
│   └── Additional Details
```

## Desired Structure (Like Web Frontend)
```
SellAnimalScreen
├── Animal Selection Screen
│   └── Animal Type Cards (Cow, Buffalo, Goat, Horse, Dog, Cat, Other)
│
└── When Animal Selected → Show Specific Form
    ├── Cow Form (AnimalListingForm)
    ├── Buffalo Form (BuffaloListingForm)
    ├── Goat Form (GoatListingForm)
    ├── Horse Form (HorseListingForm)
    ├── Dog Form (DogListingForm)
    ├── Cat Form (CatListingForm)
    └── Other Form (OtherAnimalListingForm)
```

## Implementation Steps

### Step 1: Create Animal-Specific Form Components
Create separate form components for each animal type in mobile app:
- `mobile/src/components/forms/CowListingForm.js`
- `mobile/src/components/forms/BuffaloListingForm.js`
- `mobile/src/components/forms/GoatListingForm.js`
- `mobile/src/components/forms/HorseListingForm.js`
- `mobile/src/components/forms/DogListingForm.js`
- `mobile/src/components/forms/CatListingForm.js`
- `mobile/src/components/forms/OtherAnimalListingForm.js`

### Step 2: Restructure SellAnimalScreen
- Show animal selection grid initially
- When animal is clicked, show its specific form
- Add back button to return to animal selection
- Display selected animal badge in form header

### Step 3: Form Features to Include
Each form should have fields specific to that animal type:

**Cow/Buffalo Form:**
- Breed Name
- Age/Lactation
- Milk Capacity
- Pregnancy Status
- Has Horns
- Health Condition
- Price & Negotiation
- Photos (Front, Side, Milk Scene)
- Video (optional)

**Dog/Cat Form:**
- Breed Name
- Age
- Color
- Weight
- Vaccination Status
- Health Condition
- Trained Status
- Behavior
- Price & Negotiation
- Photos
- Video (optional)

**Goat Form:**
- Breed Name
- Age
- Weight
- Color
- Horn Type
- Health Status
- Purpose (Milk/Meat)
- Price & Negotiation
- Photos
- Video (optional)

**Horse Form:**
- Gender
- Breed Name
- Age
- Color
- Height
- Weight
- Health Condition
- Trained Status
- Purpose
- Price & Negotiation
- Photos
- Video (optional)

**Other Animals Form:**
- Animal Type (Sheep, Pig, Rabbit, etc.)
- Breed Name
- Age
- Gender
- Weight
- Color
- Health Condition
- Trained for Work
- Special Skills
- Price & Negotiation
- Photos
- Video (optional)

### Step 4: Update API Endpoints
Ensure each form submits to the correct endpoint:
- Cow: `/api/animals/listings`
- Buffalo: `/api/buffalos/listings`
- Dog: `/api/dogs/listings`
- Cat: `/api/cats/listings`
- Goat: `/api/goats/listings`
- Horse: `/api/horses/listings`
- Other: `/api/other-animals/listings`

## Benefits of This Structure

1. **Consistency:** Mobile matches web frontend structure
2. **Better UX:** Users see only relevant fields for their animal type
3. **Easier Maintenance:** Separate forms are easier to update
4. **Proper Validation:** Each form can have specific validation rules
5. **Better API Integration:** Direct mapping to backend endpoints

## Next Steps

1. Create form components directory structure
2. Implement each animal-specific form component
3. Update SellAnimalScreen to use tab/selection structure
4. Test each form individually
5. Ensure all API endpoints are working correctly
