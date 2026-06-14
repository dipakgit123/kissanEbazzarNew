export const COW_BREEDS = [
  {
    value: 'Holstein Friesian (HF)',
    labels: {
      en: 'Holstein Friesian (HF)',
      mr: 'होल्स्टीन फ्रिजियन (HF)',
      hi: 'होल्स्टीन फ्रिज़ियन (HF)'
    }
  },
  {
    value: 'HF Cross',
    labels: {
      en: 'HF Cross',
      mr: 'HF क्रॉस',
      hi: 'HF क्रॉस'
    }
  },
  {
    value: 'Jersey',
    labels: {
      en: 'Jersey',
      mr: 'जर्सी',
      hi: 'जर्सी'
    }
  },
  {
    value: 'Jersey Cross',
    labels: {
      en: 'Jersey Cross',
      mr: 'जर्सी क्रॉस',
      hi: 'जर्सी क्रॉस'
    }
  },
  {
    value: 'Gir',
    labels: {
      en: 'Gir',
      mr: 'गीर',
      hi: 'गिर'
    }
  },
  {
    value: 'Sahiwal',
    labels: {
      en: 'Sahiwal',
      mr: 'साहीवाल',
      hi: 'साहीवाल'
    }
  },
  {
    value: 'Tharparkar',
    labels: {
      en: 'Tharparkar',
      mr: 'थारपारकर',
      hi: 'थारपारकर'
    }
  },
  {
    value: 'Rathi',
    labels: {
      en: 'Rathi',
      mr: 'राठी',
      hi: 'राठी'
    }
  },
  {
    value: 'Red Sindhi',
    labels: {
      en: 'Red Sindhi',
      mr: 'लाल सिंधी',
      hi: 'लाल सिंधी'
    }
  },
  {
    value: 'Kankrej',
    labels: {
      en: 'Kankrej',
      mr: 'कांकरेज',
      hi: 'कांकरेज'
    }
  },
  {
    value: 'Deoni',
    labels: {
      en: 'Deoni',
      mr: 'देवणी',
      hi: 'देवनी'
    }
  },
  {
    value: 'Khillar',
    labels: {
      en: 'Khillar',
      mr: 'खिल्लार',
      hi: 'खिल्लार'
    }
  },
  {
    value: 'Dangi',
    labels: {
      en: 'Dangi',
      mr: 'डांगी',
      hi: 'डांगी'
    }
  },
  {
    value: 'Gaolao',
    labels: {
      en: 'Gaolao',
      mr: 'गवळाऊ',
      hi: 'गाओलाओ'
    }
  },
  {
    value: 'Lal Kandhari',
    labels: {
      en: 'Lal Kandhari',
      mr: 'लाल कंधारी',
      hi: 'लाल कंधारी'
    }
  },
  {
    value: 'Krishna Valley',
    labels: {
      en: 'Krishna Valley',
      mr: 'कृष्णा व्हॅली',
      hi: 'कृष्णा वैली'
    }
  },
  {
    value: 'Hariana',
    labels: {
      en: 'Hariana',
      mr: 'हरियाणा',
      hi: 'हरियाणा'
    }
  },
  {
    value: 'Ongole',
    labels: {
      en: 'Ongole',
      mr: 'ओंगोल',
      hi: 'ओंगोल'
    }
  },
  {
    value: 'Brown Swiss Cross',
    labels: {
      en: 'Brown Swiss Cross',
      mr: 'ब्राउन स्विस क्रॉस',
      hi: 'ब्राउन स्विस क्रॉस'
    }
  },
  {
    value: 'Desi / Local Cow',
    labels: {
      en: 'Desi / Local Cow',
      mr: 'देशी / स्थानिक गाय',
      hi: 'देसी / स्थानीय गाय'
    }
  }
];

export const getCowBreedOptions = (language, selectLabel) => {
  const locale = language === 'mr' || language === 'hi' ? language : 'en';

  return [
    { value: '', label: selectLabel },
    ...COW_BREEDS.map((breed) => ({
      value: breed.value,
      label: breed.labels[locale] || breed.labels.en
    }))
  ];
};
