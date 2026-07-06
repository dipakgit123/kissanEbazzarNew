import { repairMojibakeText } from '../utils/textEncoding';

export const CAT_BREEDS = [
  {
    value: 'Persian Cat',
    labels: {
      en: 'Persian Cat',
      mr: 'पर्शियन मांजर',
      hi: 'पर्शियन बिल्ली'
    }
  },
  {
    value: 'Siamese Cat',
    labels: {
      en: 'Siamese Cat',
      mr: 'सायामी मांजर',
      hi: 'सियामी बिल्ली'
    }
  },
  {
    value: 'Maine Coon',
    labels: {
      en: 'Maine Coon',
      mr: 'मेन कून',
      hi: 'मेन कून'
    }
  },
  {
    value: 'British Shorthair',
    labels: {
      en: 'British Shorthair',
      mr: 'ब्रिटिश शॉर्टहेअर',
      hi: 'ब्रिटिश शॉर्टहेयर'
    }
  },
  {
    value: 'Bengal Cat',
    labels: {
      en: 'Bengal Cat',
      mr: 'बंगाल मांजर',
      hi: 'बंगाल बिल्ली'
    }
  },
  {
    value: 'Ragdoll',
    labels: {
      en: 'Ragdoll',
      mr: 'रॅगडॉल',
      hi: 'रैगडॉल'
    }
  },
  {
    value: 'Russian Blue',
    labels: {
      en: 'Russian Blue',
      mr: 'रशियन ब्लू',
      hi: 'रशियन ब्लू'
    }
  },
  {
    value: 'Himalayan Cat',
    labels: {
      en: 'Himalayan Cat',
      mr: 'हिमालयन मांजर',
      hi: 'हिमालयन बिल्ली'
    }
  },
  {
    value: 'Scottish Fold',
    labels: {
      en: 'Scottish Fold',
      mr: 'स्कॉटिश फोल्ड',
      hi: 'स्कॉटिश फोल्ड'
    }
  },
  {
    value: 'American Shorthair',
    labels: {
      en: 'American Shorthair',
      mr: 'अमेरिकन शॉर्टहेअर',
      hi: 'अमेरिकन शॉर्टहेयर'
    }
  },
  {
    value: 'Exotic Shorthair',
    labels: {
      en: 'Exotic Shorthair',
      mr: 'एक्झॉटिक शॉर्टहेअर',
      hi: 'एक्सॉटिक शॉर्टहेयर'
    }
  },
  {
    value: 'Abyssinian',
    labels: {
      en: 'Abyssinian',
      mr: 'अबिसिनियन',
      hi: 'एबिसिनियन'
    }
  },
  {
    value: 'Burmese Cat',
    labels: {
      en: 'Burmese Cat',
      mr: 'बर्मी मांजर',
      hi: 'बर्मी बिल्ली'
    }
  },
  {
    value: 'Oriental Shorthair',
    labels: {
      en: 'Oriental Shorthair',
      mr: 'ओरिएंटल शॉर्टहेअर',
      hi: 'ओरिएंटल शॉर्टहेयर'
    }
  },
  {
    value: 'Turkish Angora',
    labels: {
      en: 'Turkish Angora',
      mr: 'तुर्किश अंगोरा',
      hi: 'तुर्किश अंगोरा'
    }
  },
  {
    value: 'Norwegian Forest Cat',
    labels: {
      en: 'Norwegian Forest Cat',
      mr: 'नॉर्वेजियन फॉरेस्ट मांजर',
      hi: 'नॉर्वेजियन फॉरेस्ट कैट'
    }
  },
  {
    value: 'Bombay Cat',
    labels: {
      en: 'Bombay Cat',
      mr: 'बॉम्बे मांजर',
      hi: 'बॉम्बे बिल्ली'
    }
  },
  {
    value: 'Indian Billi (Desi Cat)',
    labels: {
      en: 'Indian Billi (Desi Cat)',
      mr: 'देशी मांजर',
      hi: 'देसी बिल्ली'
    }
  },
  {
    value: 'Indian Street Cat',
    labels: {
      en: 'Indian Street Cat',
      mr: 'भारतीय रस्त्यावरील मांजर',
      hi: 'भारतीय सड़क बिल्ली'
    }
  },
  {
    value: 'Mixed Breed Cat',
    labels: {
      en: 'Mixed Breed Cat',
      mr: 'मिश्र जातीचे मांजर',
      hi: 'मिश्रित नस्ल की बिल्ली'
    }
  },
  {
    value: 'Other',
    labels: {
      en: 'Other',
      mr: 'इतर',
      hi: 'अन्य'
    }
  }
];

export const getCatBreedOptions = (language, selectLabel) => {
  const locale = language?.startsWith('mr') ? 'mr' : language?.startsWith('hi') ? 'hi' : 'en';

  return [
    { value: '', label: selectLabel },
    ...CAT_BREEDS.map((breed) => ({
      value: breed.value,
      label: repairMojibakeText(breed.labels[locale] || breed.labels.en)
    }))
  ];
};
