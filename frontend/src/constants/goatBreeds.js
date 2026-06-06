export const GOAT_BREEDS = [
  {
    value: 'Osmanabadi',
    labels: {
      en: 'Osmanabadi',
      mr: 'उस्मानाबादी',
      hi: 'उस्मानाबादी'
    }
  },
  {
    value: 'Sangamneri',
    labels: {
      en: 'Sangamneri',
      mr: 'संगमनेरी',
      hi: 'संगमनेरी'
    }
  },
  {
    value: 'Sirohi',
    labels: {
      en: 'Sirohi',
      mr: 'सिरोही',
      hi: 'सिरोही'
    }
  },
  {
    value: 'Jamunapari',
    labels: {
      en: 'Jamunapari',
      mr: 'जमुनापारी',
      hi: 'जमुनापारी'
    }
  },
  {
    value: 'Beetal',
    labels: {
      en: 'Beetal',
      mr: 'बीटल',
      hi: 'बीटल'
    }
  },
  {
    value: 'Barbari',
    labels: {
      en: 'Barbari',
      mr: 'बारबरी',
      hi: 'बारबरी'
    }
  },
  {
    value: 'Black Bengal',
    labels: {
      en: 'Black Bengal',
      mr: 'ब्लॅक बंगाल',
      hi: 'ब्लैक बंगाल'
    }
  },
  {
    value: 'Malabari',
    labels: {
      en: 'Malabari',
      mr: 'मालाबारी',
      hi: 'मालाबारी'
    }
  },
  {
    value: 'Jakhrana',
    labels: {
      en: 'Jakhrana',
      mr: 'जाखराना',
      hi: 'जाखराना'
    }
  },
  {
    value: 'Surti',
    labels: {
      en: 'Surti',
      mr: 'सुरती',
      hi: 'सुरती'
    }
  },
  {
    value: 'Marwari',
    labels: {
      en: 'Marwari',
      mr: 'मारवाडी',
      hi: 'मारवाड़ी'
    }
  },
  {
    value: 'Sojat',
    labels: {
      en: 'Sojat',
      mr: 'सोजत',
      hi: 'सोजत'
    }
  },
  {
    value: 'Zalawadi',
    labels: {
      en: 'Zalawadi',
      mr: 'झालावाडी',
      hi: 'झालावाड़ी'
    }
  },
  {
    value: 'Gohilwadi',
    labels: {
      en: 'Gohilwadi',
      mr: 'गोहिलवाडी',
      hi: 'गोहिलवाड़ी'
    }
  },
  {
    value: 'Kutchi',
    labels: {
      en: 'Kutchi',
      mr: 'कच्छी',
      hi: 'कच्छी'
    }
  },
  {
    value: 'Mehsana',
    labels: {
      en: 'Mehsana',
      mr: 'मेहसाणा',
      hi: 'मेहसाणा'
    }
  },
  {
    value: 'Attappady Black',
    labels: {
      en: 'Attappady Black',
      mr: 'अट्टापडी ब्लॅक',
      hi: 'अट्टापडी ब्लैक'
    }
  },
  {
    value: 'Kanni Adu',
    labels: {
      en: 'Kanni Adu',
      mr: 'कन्नी अडू',
      hi: 'कन्नी अडू'
    }
  },
  {
    value: 'Salem Black',
    labels: {
      en: 'Salem Black',
      mr: 'सालेम ब्लॅक',
      hi: 'सालेम ब्लैक'
    }
  },
  {
    value: 'Kodi Adu',
    labels: {
      en: 'Kodi Adu',
      mr: 'कोडी अडू',
      hi: 'कोडी अडू'
    }
  },
  {
    value: 'Changthangi',
    labels: {
      en: 'Changthangi',
      mr: 'चांगथांगी',
      hi: 'चांगथांगी'
    }
  },
  {
    value: 'Chegu',
    labels: {
      en: 'Chegu',
      mr: 'चेगू',
      hi: 'चेगू'
    }
  },
  {
    value: 'Gaddi',
    labels: {
      en: 'Gaddi',
      mr: 'गड्डी',
      hi: 'गद्दी'
    }
  },
  {
    value: 'Berari',
    labels: {
      en: 'Berari',
      mr: 'बेरारी',
      hi: 'बेरारी'
    }
  },
  {
    value: 'Konkan Kanyal',
    labels: {
      en: 'Konkan Kanyal',
      mr: 'कोकण कन्याल',
      hi: 'कोंकण कन्याल'
    }
  },
  {
    value: 'Bundelkhandi',
    labels: {
      en: 'Bundelkhandi',
      mr: 'बुंदेलखंडी',
      hi: 'बुंदेलखंडी'
    }
  },
  {
    value: 'Jharkhand Black',
    labels: {
      en: 'Jharkhand Black',
      mr: 'झारखंड ब्लॅक',
      hi: 'झारखंड ब्लैक'
    }
  },
  {
    value: 'Assam Hill',
    labels: {
      en: 'Assam Hill',
      mr: 'आसाम हिल',
      hi: 'असम हिल'
    }
  },
  {
    value: 'Local Goat',
    labels: {
      en: 'Local Goat',
      mr: 'देशी शेळी',
      hi: 'देसी बकरी'
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

export const getGoatBreedOptions = (language, selectLabel) => {
  const locale = language === 'mr' || language === 'hi' ? language : 'en';

  return [
    { value: '', label: selectLabel },
    ...GOAT_BREEDS.map((breed) => ({
      value: breed.value,
      label: breed.labels[locale] || breed.labels.en
    }))
  ];
};
