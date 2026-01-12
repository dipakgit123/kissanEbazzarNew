# i18n (Internationalization) Implementation Guide

## Overview
Successfully implemented multi-language support for the Animal Bazaar web frontend with support for **English**, **Hindi (हिन्दी)**, and **Marathi (मराठी)**.

## 🚀 Installation

The following packages have been installed:
- `i18next` - Core i18n functionality
- `react-i18next` - React bindings for i18next
- `i18next-browser-languagedetector` - Automatic language detection
- `i18next-http-backend` - Backend support for loading translations

## 📁 File Structure

```
frontend/
├── src/
│   ├── i18n/
│   │   ├── config.js                          # i18n configuration
│   │   └── locales/
│   │       ├── en/
│   │       │   └── translation.json           # English translations
│   │       ├── hi/
│   │       │   └── translation.json           # Hindi translations
│   │       └── mr/
│   │           └── translation.json           # Marathi translations
│   ├── components/
│   │   ├── LanguageSwitcher.jsx               # Language switcher component
│   │   ├── Layout.jsx                         # Updated with translations
│   │   ├── LoginForm.jsx                      # Updated with translations
│   │   └── HomePage.jsx                       # Updated with translations
│   └── main.jsx                               # i18n initialization
```

## 🌐 Supported Languages

| Language | Code | Native Name | Flag |
|----------|------|-------------|------|
| English  | en   | English     | 🇬🇧   |
| Hindi    | hi   | हिन्दी      | 🇮🇳   |
| Marathi  | mr   | मराठी       | 🇮🇳   |

## 🔑 Translation Keys

### Common Keys (`common.*`)
- `welcome`, `loading`, `submit`, `cancel`, `save`, `delete`, `edit`
- `search`, `filter`, `close`, `yes`, `no`, `back`, `next`, `skip`
- `logout`, `login`, `register`, `profile`, `settings`

### Header Keys (`header.*`)
- `home`, `sell`, `veterinarian`, `pregnancy`, `healthCheck`
- `wishlist`, `map`, `profile`

### Authentication Keys (`auth.*`)
- `phoneNumber`, `enterPhone`, `sendOTP`, `verifyOTP`, `enterOTP`, `resendOTP`
- `welcomeBack`, `loginToContinue`, `invalidPhone`, `otpSent`, `loginSuccess`

### Home Page Keys (`home.*`)
- `title`, `subtitle`, `searchPlaceholder`, `categories`
- `nearbyAnimals`, `recentlyAdded`, `viewAll`, `noAnimalsFound`
- `distance`, `price`, `age`, `breed`, `location`

### Animal Types Keys (`animalTypes.*`)
- `cow`, `buffalo`, `goat`, `dog`, `cat`, `horse`, `all`

### Profile Keys (`profile.*`)
- `myProfile`, `editProfile`, `name`, `email`, `phone`, `address`
- `city`, `state`, `pincode`, `updateProfile`, `myListings`, `savedAnimals`

### Sell Animal Keys (`sellAnimal.*`)
- `title`, `selectAnimalType`, `animalDetails`, `animalName`, `breed`
- `age`, `ageUnit`, `years`, `months`, `price`, `description`
- `photos`, `uploadPhotos`, `location`, `contactDetails`, `submitListing`

### Veterinarian Keys (`veterinarian.*`)
- `title`, `nearbyVets`, `bookAppointment`, `specialization`
- `experience`, `rating`, `availability`, `contactNumber`, `clinicAddress`

### Pregnancy Keys (`pregnancy.*`)
- `title`, `addPregnancy`, `animalName`, `breedingDate`, `expectedDate`
- `daysRemaining`, `currentStage`, `notes`, `addNote`, `viewHistory`

### Health Check Keys (`healthCheck.*`)
- `title`, `uploadPhoto`, `analyzing`, `results`, `recommendations`
- `symptoms`, `takePhoto`, `uploadFromGallery`, `consultVet`

### Wishlist Keys (`wishlist.*`)
- `title`, `empty`, `addedOn`, `removeFromWishlist`
- `contactSeller`, `viewDetails`

### Location Keys (`location.*`)
- `setupLocation`, `locationRequired`, `allowLocation`, `enterManually`
- `detectingLocation`, `locationDetected`, `currentLocation`

### Footer Keys (`footer.*`)
- `aboutUs`, `contactUs`, `termsAndConditions`, `privacyPolicy`
- `followUs`, `copyright`

## 🎨 Language Switcher Component

The `LanguageSwitcher` component provides:
- Dropdown menu with language options
- Country flags for visual identification
- Current language indicator
- Smooth transitions and hover effects
- Persistent language selection in localStorage

### Location
The language switcher is located in the header, next to the "Sell Now" button.

## 💻 Usage in Components

### Basic Usage

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

### With Variables

```jsx
// In translation file:
// "welcome": "Welcome, {{name}}!"

const { t } = useTranslation();
return <h1>{t('welcome', { name: userName })}</h1>;
```

### Changing Language Programmatically

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };
  
  return (
    <button onClick={() => changeLanguage('hi')}>
      Switch to Hindi
    </button>
  );
}
```

## 🔧 Configuration Details

### Language Detection Order
1. localStorage (previously selected language)
2. Browser navigator language
3. Fallback to English (en)

### Default Settings
- **Default Language**: English (en)
- **Fallback Language**: English (en)
- **Debug Mode**: Disabled (set to `false` in production)

## ✅ Components Updated

The following components have been fully translated:

1. **Layout.jsx**
   - Header navigation links
   - Bottom navigation menu
   - Language switcher integration

2. **LoginForm.jsx**
   - Phone number input
   - OTP verification
   - Error messages
   - Button labels

3. **HomePage.jsx**
   - Search placeholder
   - Animal type categories
   - Navigation elements

## 📱 Testing the Implementation

### Manual Testing Steps

1. **Start the Development Server**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Access the Application**
   - Open http://localhost:5173 in your browser

3. **Test Language Switching**
   - Look for the language switcher in the header (flag icon with dropdown)
   - Click on the language switcher
   - Select each language (English, Hindi, Marathi)
   - Verify that UI text changes appropriately

4. **Test Persistence**
   - Select a language other than English
   - Refresh the page
   - Verify the selected language is maintained

5. **Test Different Pages**
   - Navigate to Login page and verify translations
   - Navigate to Home page and verify translations
   - Test navigation menu items

### Expected Behavior

- ✅ Language switcher appears in header
- ✅ Clicking switcher shows dropdown with 3 language options
- ✅ Selected language is highlighted with checkmark
- ✅ UI text changes immediately when language is selected
- ✅ Language preference persists across page refreshes
- ✅ No console errors related to missing translation keys

## 🎯 Key Features

1. **Automatic Language Detection**
   - Detects browser language on first visit
   - Falls back to English if unsupported language

2. **Persistent Language Selection**
   - Selected language saved to localStorage
   - Preference maintained across sessions

3. **Comprehensive Coverage**
   - 14+ translation categories
   - 100+ translation keys
   - All major UI elements covered

4. **Easy to Extend**
   - Simple JSON structure
   - Add new languages by creating new locale files
   - Add new keys to existing translation files

## 🔄 Adding More Translations

### To Add a New Language

1. Create new folder: `frontend/src/i18n/locales/[language-code]/`
2. Create `translation.json` with all translation keys
3. Import in `config.js`:
   ```js
   import translationXX from './locales/xx/translation.json';
   ```
4. Add to resources object in `config.js`
5. Update `LanguageSwitcher.jsx` to include new language option

### To Add New Translation Keys

1. Add key to all language files:
   ```json
   {
     "mySection": {
       "myKey": "My translated text"
     }
   }
   ```

2. Use in component:
   ```jsx
   {t('mySection.myKey')}
   ```

## 🐛 Troubleshooting

### Missing Translation Keys
If you see the translation key instead of translated text:
- Check if the key exists in all translation files
- Verify the key path is correct
- Check browser console for i18next warnings

### Language Not Changing
- Clear browser localStorage
- Check if `localStorage.setItem('language', lng)` is being called
- Verify i18n config is imported in main.jsx

### Translations Not Loading
- Check file paths in config.js
- Verify JSON syntax in translation files
- Check browser console for import errors

## 📝 Best Practices

1. **Consistent Key Naming**
   - Use camelCase for keys
   - Group related translations under sections
   - Use descriptive key names

2. **Complete Translations**
   - Ensure all keys exist in all language files
   - Provide fallback text for missing translations
   - Test all languages thoroughly

3. **Performance**
   - Translations are bundled at build time
   - No runtime loading delays
   - Efficient language switching

4. **Maintenance**
   - Keep translation files organized
   - Document new keys in this guide
   - Regular review of translation accuracy

## 📚 Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Browser Language Detector](https://github.com/i18next/i18next-browser-languageDetector)

## 🎉 Summary

The i18n implementation is complete and ready for use! The application now supports:
- ✅ 3 languages (English, Hindi, Marathi)
- ✅ 100+ translated UI elements
- ✅ Automatic language detection
- ✅ Persistent language preferences
- ✅ Easy to extend and maintain

Users can now enjoy the Animal Bazaar platform in their preferred language!
