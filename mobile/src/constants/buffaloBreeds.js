import { repairMojibakeText } from '../utils/textEncoding';

export const BUFFALO_BREEDS = [
  {
    value: 'Murrah',
    labels: {
      en: 'Murrah',
      mr: 'मुर्रा',
      hi: 'मुर्रा'
    }
  },
  {
    value: 'Jaffarabadi',
    labels: {
      en: 'Jaffarabadi',
      mr: 'जाफराबादी',
      hi: 'जाफराबादी'
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
    value: 'Surti',
    labels: {
      en: 'Surti',
      mr: 'सुरती',
      hi: 'सुरती'
    }
  },
  {
    value: 'Pandharpuri',
    labels: {
      en: 'Pandharpuri',
      mr: 'पंढरपुरी',
      hi: 'पंढरपुरी'
    }
  },
  {
    value: 'Nagpuri',
    labels: {
      en: 'Nagpuri',
      mr: 'नागपुरी',
      hi: 'नागपुरी'
    }
  },
  {
    value: 'Nili Ravi',
    labels: {
      en: 'Nili Ravi',
      mr: 'नीली रवी',
      hi: 'नीली रवि'
    }
  },
  {
    value: 'Bhadawari',
    labels: {
      en: 'Bhadawari',
      mr: 'भदावरी',
      hi: 'भदावरी'
    }
  },
  {
    value: 'Toda',
    labels: {
      en: 'Toda',
      mr: 'टोडा',
      hi: 'टोडा'
    }
  },
  {
    value: 'Banni',
    labels: {
      en: 'Banni',
      mr: 'बन्नी',
      hi: 'बन्नी'
    }
  },
  {
    value: 'Marathwadi',
    labels: {
      en: 'Marathwadi',
      mr: 'मराठवाडी',
      hi: 'मराठवाड़ी'
    }
  },
  {
    value: 'Chilika',
    labels: {
      en: 'Chilika',
      mr: 'चिलिका',
      hi: 'चिलिका'
    }
  },
  {
    value: 'Kalahandi',
    labels: {
      en: 'Kalahandi',
      mr: 'कालाहांडी',
      hi: 'कालाहांडी'
    }
  },
  {
    value: 'Luit',
    labels: {
      en: 'Luit',
      mr: 'लुईत',
      hi: 'लुईत'
    }
  },
  {
    value: 'Bargur Buffalo',
    labels: {
      en: 'Bargur Buffalo',
      mr: 'बरगूर म्हैस',
      hi: 'बरगूर भैंस'
    }
  },
  {
    value: 'Godavari',
    labels: {
      en: 'Godavari',
      mr: 'गोदावरी',
      hi: 'गोदावरी'
    }
  },
  {
    value: 'Tarai',
    labels: {
      en: 'Tarai',
      mr: 'तराई',
      hi: 'तराई'
    }
  },
  {
    value: 'Swamp Buffalo',
    labels: {
      en: 'Swamp Buffalo',
      mr: 'दलदली म्हैस',
      hi: 'दलदली भैंस'
    }
  },
  {
    value: 'Local Buffalo',
    labels: {
      en: 'Local Buffalo',
      mr: 'स्थानिक म्हैस',
      hi: 'स्थानीय भैंस'
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

export const getBuffaloBreedOptions = (language, selectLabel) => {
  const locale = language?.startsWith('mr') ? 'mr' : language?.startsWith('hi') ? 'hi' : 'en';

  return [
    { value: '', label: selectLabel },
    ...BUFFALO_BREEDS.map((breed) => ({
      value: breed.value,
      label: repairMojibakeText(breed.labels[locale] || breed.labels.en)
    }))
  ];
};
