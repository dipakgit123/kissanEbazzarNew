# Complete Translation Guide for All Remaining Screens

## ✅ Already Translated (4/25)
1. ✅ LoginScreen.js
2. ✅ VetLoginScreen.js  
3. ✅ HomeScreen.js
4. ✅ ProfileScreen.js

## 🔄 Quick Translation Pattern for Each Screen

### Step 1: Add Import
```javascript
import { useTranslation } from 'react-i18next';
```

### Step 2: Add Hook
```javascript
const { t } = useTranslation();
```

### Step 3: Replace Text

---

## 📋 BuyAnimalsScreen.js

**Import & Hook:** ✅ Already added

**Replace all text:**
```javascript
// Title
"Buy Animals" → {t('buyAnimals.title')}

// Search
placeholder="Search by breed, location..." → placeholder={t('buyAnimals.searchPlaceholder')}

// Categories
"Categories" → {t('buyAnimals.categories')}
"All" → {t('buyAnimals.all')}

// Sort
"Sort By" → {t('buyAnimals.sortBy')}
"Newest First" → {t('buyAnimals.newestFirst')}
"Price: Low to High" → {t('buyAnimals.priceLowToHigh')}
"Price: High to Low" → {t('buyAnimals.priceHighToLow')}
"Nearest First" → {t('buyAnimals.nearestFirst')}

// Results
"animals found" → {t('buyAnimals.results')}
"No Animals Found" → {t('buyAnimals.noAnimalsFound')}
"Try adjusting your filters..." → {t('buyAnimals.noAnimalsFoundDesc')}
```

---

## 📋 AIAssistantScreen.js

**Text to Replace:**
```javascript
"AI Assistant" → {t('aiAssistant.title')}
"Ask me anything" → {t('aiAssistant.subtitle')}
placeholder="Ask about animal care..." → placeholder={t('aiAssistant.placeholder')}
"Quick Questions:" → {t('aiAssistant.quickQuestions')}
"Hello! 👋 I'm your AI assistant..." → {t('aiAssistant.greeting')}
"🐄 Cow health tips" → {t('aiAssistant.cowHealth')}
"🐃 Buffalo care guide" → {t('aiAssistant.buffaloCare')}
"💉 Vaccination schedule" → {t('aiAssistant.vaccination')}
"🤰 Pregnancy care" → {t('aiAssistant.pregnancyCare')}
"🌾 Feeding recommendations" → {t('aiAssistant.feeding')}
"🏥 Common diseases" → {t('aiAssistant.diseases')}
```

---

## 📋 AIHealthCheckScreen.js

**Text to Replace:**
```javascript
"AI Health Check" → {t('aiHealthCheck.title')}
"Select Animal Type" → {t('aiHealthCheck.selectAnimal')}
"Upload Photo" → {t('aiHealthCheck.uploadPhoto')}
"Upload a clear photo of your animal" → {t('aiHealthCheck.uploadPhotoDesc')}
"Take Photo" → {t('aiHealthCheck.takePhoto')}
"Choose from Gallery" → {t('aiHealthCheck.choosePhoto')}
"Describe Symptoms" → {t('aiHealthCheck.symptoms')}
placeholder="Describe any symptoms..." → placeholder={t('aiHealthCheck.symptomsPlaceholder')}
"Analyze Health" → {t('aiHealthCheck.analyze')}
"Analyzing..." → {t('aiHealthCheck.analyzing')}
"Health Analysis Results" → {t('aiHealthCheck.results')}
"Health Status" → {t('aiHealthCheck.healthStatus')}
"Recommendations" → {t('aiHealthCheck.recommendations')}
"Need Consultation?" → {t('aiHealthCheck.consultation')}
"Find Veterinarian" → {t('aiHealthCheck.findVet')}
```

---

## 📋 VetDashboardScreen.js

**Text to Replace:**
```javascript
"Dashboard" → {t('vetDashboard.title')}
"Welcome back," → {t('vetDashboard.welcomeBack')}
"Quick Actions" → {t('vetDashboard.quickActions')}
"Appointments" → {t('vetDashboard.appointments')}
"My Profile" → {t('vetDashboard.myProfile')}
"Call History" → {t('vetDashboard.callHistory')}
"Reports" → {t('vetDashboard.reports')}
"Statistics" → {t('vetDashboard.statistics')}
"Total Appointments" → {t('vetDashboard.totalAppointments')}
"Today's Appointments" → {t('vetDashboard.todayAppointments')}
"Pending" → {t('vetDashboard.pending')}
"Total Earnings" → {t('vetDashboard.totalEarnings')}
"Recent Appointments" → {t('vetDashboard.recentAppointments')}
"No recent appointments" → {t('vetDashboard.noAppointments')}
"Availability Status" → {t('vetDashboard.availabilityStatus')}
"Regular Hours Only" → {t('vetDashboard.regularHours')}
"Update Availability" → {t('vetDashboard.updateAvailability')}
```

---

## 📋 CallHistoryScreen.js

**Text to Replace:**
```javascript
"Call History" → {t('callHistory.title')}
"All" → {t('callHistory.all')}
"Outgoing" → {t('callHistory.outgoing')}
"Incoming" → {t('callHistory.incoming')}
"Missed" → {t('callHistory.missed')}
"Today" → {t('callHistory.today')}
"Yesterday" → {t('callHistory.yesterday')}
"Not connected" → {t('callHistory.notConnected')}
"No Call History" → {t('callHistory.noCallHistory')}
"Your call logs will appear here..." → {t('callHistory.noCallHistoryDesc')}
"Are you sure you want to delete..." → {t('callHistory.deleteConfirm')}
"Long press on any call log..." → {t('callHistory.longPressDelete')}
```

---

## 📋 LocationSetupScreen.js

**Text to Replace:**
```javascript
"Location Setup" → {t('locationSetup.title')}
"Set your location to find nearby animals..." → {t('locationSetup.infoMessage')}
"Use Current Location" → {t('locationSetup.useCurrentLocation')}
"OR ENTER MANUALLY" → {t('locationSetup.orEnterManually')}
"Address" → {t('locationSetup.addressLabel')}
placeholder="Enter your full address" → placeholder={t('locationSetup.addressPlaceholder')}
"City" → {t('locationSetup.cityLabel')}
"State" → {t('locationSetup.stateLabel')}
"Pincode" → {t('locationSetup.pincodeLabel')}
"GPS Coordinates" → {t('locationSetup.gpsCoordinates')}
"Latitude" → {t('locationSetup.latitude')}
"Longitude" → {t('locationSetup.longitude')}
"Save Location" → {t('locationSetup.saveLocation')}
"Location captured successfully!" → {t('locationSetup.locationCaptured')}
"Failed to get location..." → {t('locationSetup.locationError')}
"Location updated successfully" → {t('locationSetup.locationUpdated')}
```

---

## 📋 VeterinarianScreen.js

**Text to Replace:**
```javascript
"Veterinarians" → {t('veterinarian.title')}
"Find Nearby Veterinarians" → {t('veterinarian.findNearby')}
placeholder="Search veterinarians..." → placeholder={t('veterinarian.searchPlaceholder')}
"Specialization" → {t('veterinarian.specialization')}
"years experience" → {t('veterinarian.experience')}
"Consultation Fee" → {t('veterinarian.consultationFee')}
"Available" → {t('veterinarian.available')}
"Unavailable" → {t('veterinarian.unavailable')}
"Emergency Available" → {t('veterinarian.emergencyAvailable')}
"Book Appointment" → {t('veterinarian.bookAppointment')}
"Call" → {t('veterinarian.call')}
"View Profile" → {t('veterinarian.viewProfile')}
"Services" → {t('veterinarian.services')}
"Reviews" → {t('veterinarian.reviews')}
"Rating" → {t('veterinarian.rating')}
```

---

## 📋 PregnancyCalendarScreen.js

**Text to Replace:**
```javascript
"Pregnancy Calendar" → {t('pregnancy.title')}
"Add New Record" → {t('pregnancy.addRecord')}
"Animal Type" → {t('pregnancy.animalType')}
"Breeding Date" → {t('pregnancy.breedingDate')}
"Expected Delivery" → {t('pregnancy.expectedDelivery')}
"days remaining" → {t('pregnancy.daysRemaining')}
"Status" → {t('pregnancy.status')}
"Active" → {t('pregnancy.active')}
"Completed" → {t('pregnancy.completed')}
"Notes" → {t('pregnancy.notes')}
"Add notes..." → {t('pregnancy.addNotes')}
"Pregnancy Milestones" → {t('pregnancy.milestones')}
"Health Checkups" → {t('pregnancy.healthCheckups')}
"Reminders" → {t('pregnancy.reminders')}
```

---

## 📋 SellAnimalScreen.js

**Text to Replace:**
```javascript
"Sell Your Animal" → {t('sellAnimal.title')}
"Select the category of animal..." → {t('sellAnimal.subtitle')}
"How it works" → {t('sellAnimal.howItWorks')}
"1. Select the animal category" → {t('sellAnimal.step1')}
"2. Fill in the details" → {t('sellAnimal.step2')}
"3. Upload photos" → {t('sellAnimal.step3')}
"4. Set your price" → {t('sellAnimal.step4')}
"5. Publish your listing" → {t('sellAnimal.step5')}
```

---

## 📋 VetRegistrationScreen.js

**Text to Replace:**
```javascript
"Veterinarian Registration" → {t('vetAuth.registrationTitle')}
"Personal Information" → {t('vetAuth.personalInfo')}
"Professional Information" → {t('vetAuth.professionalInfo')}
"Practice Details" → {t('vetAuth.practiceDetails')}
"Location & Documents" → {t('vetAuth.locationDocuments')}
"Qualification" → {t('vetAuth.qualification')}
"License Number" → {t('vetAuth.licenseNumber')}
"Years of Experience" → {t('vetAuth.experienceYears')}
"Clinic Name" → {t('vetAuth.clinicName')}
"Clinic Address" → {t('vetAuth.clinicAddress')}
"Consultation Fee (₹)" → {t('vetAuth.consultationFee')}
"Services Offered" → {t('vetAuth.servicesOffered')}
"Available for Emergency Services" → {t('vetAuth.emergencyServices')}
"Profile Photo" → {t('vetAuth.profilePhoto')}
"License Certificate" → {t('vetAuth.licenseCertificate')}
"Your registration will be verified..." → {t('vetAuth.verificationNote')}
"Submit Registration" → {t('vetAuth.submitRegistration')}
```

---

## 📋 NotificationsScreen.js

**Text to Replace:**
```javascript
"Notifications" → {t('notifications.title')}
"Mark all as read" → {t('notifications.markAllRead')}
"No Notifications" → {t('notifications.noNotifications')}
"You're all caught up!" → {t('notifications.noNotificationsDesc')}
"New" → {t('notifications.new')}
"Today" → {t('notifications.today')}
"Yesterday" → {t('notifications.yesterday')}
"Older" → {t('notifications.older')}
```

---

## 🚀 Quick Implementation Script

For each screen, follow these 3 steps:

### 1. Add Import (Top of file)
```javascript
import { useTranslation } from 'react-i18next';
```

### 2. Add Hook (In component)
```javascript
const { t } = useTranslation();
```

### 3. Find & Replace
Use your editor's find & replace:
- Find: `"Buy Animals"`
- Replace: `{t('buyAnimals.title')}`

---

## 🎯 All Translation Keys Are Ready!

Every translation key mentioned above is already available in:
- `/mobile/src/i18n/locales/en.json`
- `/mobile/src/i18n/locales/hi.json`
- `/mobile/src/i18n/locales/mr.json`

---

## ✅ Completion Checklist

- [x] LoginScreen
- [x] VetLoginScreen
- [x] HomeScreen
- [x] ProfileScreen
- [ ] BuyAnimalsScreen
- [ ] AIAssistantScreen
- [ ] AIHealthCheckScreen
- [ ] VetDashboardScreen
- [ ] VetRegistrationScreen
- [ ] CallHistoryScreen
- [ ] LocationSetupScreen
- [ ] VeterinarianScreen
- [ ] PregnancyCalendarScreen
- [ ] SellAnimalScreen
- [ ] AnimalDetailScreen
- [ ] CategoryListingsScreen
- [ ] CreateListingScreen
- [ ] MapScreen
- [ ] NotificationsScreen
- [ ] OTPVerificationScreen
- [ ] ProfileCompletionScreen
- [ ] ServicesScreen
- [ ] VetDetailScreen
- [ ] VetOTPVerificationScreen
- [ ] WishlistScreen

---

## 📝 Testing Translations

After translating, test with:

```javascript
// Add language switcher to any screen
import LanguageSwitcher from '../components/LanguageSwitcher';

const [showLangPicker, setShowLangPicker] = useState(false);

<TouchableOpacity onPress={() => setShowLangPicker(true)}>
  <Text>Change Language</Text>
</TouchableOpacity>

<LanguageSwitcher 
  visible={showLangPicker}
  onClose={() => setShowLangPicker(false)}
/>
```

---

**Status**: 4/25 screens complete, 21 remaining
**All Translation Keys**: Ready and available
**Infrastructure**: Complete and working
