const OTHER_ANIMAL_BREEDS = {
  sheep: [
    { value: 'Merino', labels: { en: 'Merino', mr: 'मेरिनो', hi: 'मेरिनो' } },
    { value: 'Deccani Sheep', labels: { en: 'Deccani Sheep', mr: 'दख्खनी मेंढी', hi: 'दक्कनी भेड़' } },
    { value: 'Nellore Sheep', labels: { en: 'Nellore Sheep', mr: 'नेल्लोर मेंढी', hi: 'नेल्लोर भेड़' } },
    { value: 'Madgyal', labels: { en: 'Madgyal', mr: 'माडग्याल', hi: 'माडग्याल' } },
    { value: 'Local Sheep', labels: { en: 'Local Sheep', mr: 'स्थानिक मेंढी', hi: 'स्थानीय भेड़' } },
  ],
  pig: [
    { value: 'Large White Yorkshire', labels: { en: 'Large White Yorkshire', mr: 'लार्ज व्हाइट यॉर्कशायर', hi: 'लार्ज व्हाइट यॉर्कशायर' } },
    { value: 'Landrace', labels: { en: 'Landrace', mr: 'लँडरेस', hi: 'लैंडरेस' } },
    { value: 'Duroc', labels: { en: 'Duroc', mr: 'ड्युरॉक', hi: 'ड्यूरॉक' } },
    { value: 'Ghungroo', labels: { en: 'Ghungroo', mr: 'घुंगरू', hi: 'घुंगरू' } },
    { value: 'Local Pig', labels: { en: 'Local Pig', mr: 'स्थानिक डुक्कर', hi: 'स्थानीय सुअर' } },
  ],
  rabbit: [
    { value: 'New Zealand White', labels: { en: 'New Zealand White', mr: 'न्यूझीलंड व्हाईट', hi: 'न्यूज़ीलैंड व्हाइट' } },
    { value: 'Soviet Chinchilla', labels: { en: 'Soviet Chinchilla', mr: 'सोव्हिएत चिन्चिला', hi: 'सोवियत चिनचिला' } },
    { value: 'Californian', labels: { en: 'Californian', mr: 'कॅलिफोर्नियन', hi: 'कैलिफोर्नियन' } },
    { value: 'Grey Giant', labels: { en: 'Grey Giant', mr: 'ग्रे जायंट', hi: 'ग्रे जायंट' } },
    { value: 'Local Rabbit', labels: { en: 'Local Rabbit', mr: 'स्थानिक ससा', hi: 'स्थानीय खरगोश' } },
  ],
  chicken: [
    { value: 'Kadaknath', labels: { en: 'Kadaknath', mr: 'कडकनाथ', hi: 'कड़कनाथ' } },
    { value: 'Aseel', labels: { en: 'Aseel', mr: 'असील', hi: 'असील' } },
    { value: 'Giriraja', labels: { en: 'Giriraja', mr: 'गिरीराजा', hi: 'गिरिराजा' } },
    { value: 'Vanaraja', labels: { en: 'Vanaraja', mr: 'वनराजा', hi: 'वनराजा' } },
    { value: 'Local Chicken', labels: { en: 'Local Chicken', mr: 'स्थानिक कोंबडी', hi: 'स्थानीय मुर्गी' } },
  ],
  duck: [
    { value: 'Khaki Campbell', labels: { en: 'Khaki Campbell', mr: 'खाकी कॅम्पबेल', hi: 'खाकी कैंपबेल' } },
    { value: 'Indian Runner', labels: { en: 'Indian Runner', mr: 'इंडियन रनर', hi: 'इंडियन रनर' } },
    { value: 'Muscovy', labels: { en: 'Muscovy', mr: 'मस्कोवी', hi: 'मस्कोवी' } },
    { value: 'Pekin', labels: { en: 'Pekin', mr: 'पेकिन', hi: 'पेकिन' } },
    { value: 'Local Duck', labels: { en: 'Local Duck', mr: 'स्थानिक बदक', hi: 'स्थानीय बतख' } },
  ],
  turkey: [
    { value: 'Broad Breasted Bronze', labels: { en: 'Broad Breasted Bronze', mr: 'ब्रॉड ब्रेस्टेड ब्रॉन्झ', hi: 'ब्रॉड ब्रेस्टेड ब्रॉन्ज' } },
    { value: 'White Holland', labels: { en: 'White Holland', mr: 'व्हाईट हॉलंड', hi: 'व्हाइट हॉलैंड' } },
    { value: 'Beltsville Small White', labels: { en: 'Beltsville Small White', mr: 'बेल्ट्सव्हिल स्मॉल व्हाईट', hi: 'बेल्ट्सविल स्मॉल व्हाइट' } },
    { value: 'Local Turkey', labels: { en: 'Local Turkey', mr: 'स्थानिक टर्की', hi: 'स्थानीय टर्की' } },
  ],
  camel: [
    { value: 'Bikaneri', labels: { en: 'Bikaneri', mr: 'बिकानेरी', hi: 'बीकानेरी' } },
    { value: 'Jaisalmeri', labels: { en: 'Jaisalmeri', mr: 'जैसलमेरी', hi: 'जैसलमेरी' } },
    { value: 'Kachchhi', labels: { en: 'Kachchhi', mr: 'कच्छी', hi: 'कच्छी' } },
    { value: 'Mewari', labels: { en: 'Mewari', mr: 'मेवारी', hi: 'मेवारी' } },
    { value: 'Local Camel', labels: { en: 'Local Camel', mr: 'स्थानिक उंट', hi: 'स्थानीय ऊंट' } },
  ],
  donkey: [
    { value: 'Halari', labels: { en: 'Halari', mr: 'हलारी', hi: 'हलारी' } },
    { value: 'Spiti Donkey', labels: { en: 'Spiti Donkey', mr: 'स्पिती गाढव', hi: 'स्पीति गधा' } },
    { value: 'Local Donkey', labels: { en: 'Local Donkey', mr: 'स्थानिक गाढव', hi: 'स्थानीय गधा' } },
  ],
  mule: [
    { value: 'Pack Mule', labels: { en: 'Pack Mule', mr: 'पॅक म्यूल', hi: 'पैक म्यूल' } },
    { value: 'Riding Mule', labels: { en: 'Riding Mule', mr: 'रायडिंग म्यूल', hi: 'राइडिंग म्यूल' } },
    { value: 'Local Mule', labels: { en: 'Local Mule', mr: 'स्थानिक म्यूल', hi: 'स्थानीय म्यूल' } },
  ],
  exotic: [
    { value: 'Emu', labels: { en: 'Emu', mr: 'इमू', hi: 'इमू' } },
    { value: 'Ostrich', labels: { en: 'Ostrich', mr: 'शहामृग', hi: 'शुतुरमुर्ग' } },
    { value: 'Guinea Fowl', labels: { en: 'Guinea Fowl', mr: 'गिनी फाउल', hi: 'गिनी फाउल' } },
    { value: 'Other Exotic', labels: { en: 'Other Exotic', mr: 'इतर विदेशी', hi: 'अन्य विदेशी' } },
  ],
  other: [
    { value: 'Mixed Breed', labels: { en: 'Mixed Breed', mr: 'मिश्र जाती', hi: 'मिश्रित नस्ल' } },
    { value: 'Local Breed', labels: { en: 'Local Breed', mr: 'स्थानिक जाती', hi: 'स्थानीय नस्ल' } },
    { value: 'Other', labels: { en: 'Other', mr: 'इतर', hi: 'अन्य' } },
  ],
};

export const getOtherAnimalBreedOptions = (
  animalType,
  language,
  selectLabel
) => {
  const locale = language === 'mr' || language === 'hi' ? language : 'en';
  const breeds = OTHER_ANIMAL_BREEDS[animalType] || OTHER_ANIMAL_BREEDS.other;

  return [
    { value: '', label: selectLabel },
    ...breeds.map((breed) => ({
      value: breed.value,
      label: breed.labels[locale] || breed.labels.en,
    })),
  ];
};
