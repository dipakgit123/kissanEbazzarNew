export const HORSE_BREEDS = [
  {
    value: 'Marwari',
    labels: {
      en: 'Marwari',
      mr: 'मरवाडी',
      hi: 'मारवाड़ी'
    }
  },
  {
    value: 'Kathiawari',
    labels: {
      en: 'Kathiawari',
      mr: 'काठियावाडी',
      hi: 'काठियावाड़ी'
    }
  },
  {
    value: 'Bhimthadi',
    labels: {
      en: 'Bhimthadi',
      mr: 'भिमथडी',
      hi: 'भीमथड़ी'
    }
  },
  {
    value: 'Manipuri',
    labels: {
      en: 'Manipuri',
      mr: 'मणिपुरी',
      hi: 'मणिपुरी'
    }
  },
  {
    value: 'Spiti',
    labels: {
      en: 'Spiti',
      mr: 'स्पिती',
      hi: 'स्पीति'
    }
  },
  {
    value: 'Zanskari',
    labels: {
      en: 'Zanskari',
      mr: 'झांस्करी',
      hi: 'ज़ांस्कारी'
    }
  },
  {
    value: 'Bhutia',
    labels: {
      en: 'Bhutia',
      mr: 'भुटिया',
      hi: 'भूटिया'
    }
  },
  {
    value: 'Chummarti',
    labels: {
      en: 'Chummarti',
      mr: 'चुम्मार्ती',
      hi: 'चुम्मार्ती'
    }
  },
  {
    value: 'Deccani',
    labels: {
      en: 'Deccani',
      mr: 'दख्खनी',
      hi: 'दक्कनी'
    }
  },
  {
    value: 'Sikang',
    labels: {
      en: 'Sikang',
      mr: 'सिकांग',
      hi: 'सिकांग'
    }
  },
  {
    value: 'Tangan',
    labels: {
      en: 'Tangan',
      mr: 'तंगण',
      hi: 'तंगण'
    }
  },
  {
    value: 'Kachchhi Sindhi',
    labels: {
      en: 'Kachchhi Sindhi',
      mr: 'कच्छी सिंधी',
      hi: 'कच्छी सिंधी'
    }
  },
  {
    value: 'Arunachali Pony',
    labels: {
      en: 'Arunachali Pony',
      mr: 'अरुणाचली पोनी',
      hi: 'अरुणाचली पोनी'
    }
  },
  {
    value: 'Andamani Pony',
    labels: {
      en: 'Andamani Pony',
      mr: 'अंदमानी पोनी',
      hi: 'अंडमानी पोनी'
    }
  },
  {
    value: 'Local Horse',
    labels: {
      en: 'Local Horse',
      mr: 'देशी घोडा',
      hi: 'देसी घोड़ा'
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

export const getHorseBreedOptions = (language, selectLabel) => {
  const locale = language === 'mr' || language === 'hi' ? language : 'en';

  return [
    { value: '', label: selectLabel },
    ...HORSE_BREEDS.map((breed) => ({
      value: breed.value,
      label: breed.labels[locale] || breed.labels.en
    }))
  ];
};
