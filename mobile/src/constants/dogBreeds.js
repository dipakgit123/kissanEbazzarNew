import { repairMojibakeText } from '../utils/textEncoding';

export const DOG_BREEDS = [
  {
    value: 'Labrador Retriever',
    labels: {
      en: 'Labrador Retriever',
      mr: 'लॅब्राडोर रिट्रिव्हर',
      hi: 'लैब्राडोर रिट्रीवर'
    }
  },
  {
    value: 'German Shepherd',
    labels: {
      en: 'German Shepherd',
      mr: 'जर्मन शेफर्ड',
      hi: 'जर्मन शेफर्ड'
    }
  },
  {
    value: 'Golden Retriever',
    labels: {
      en: 'Golden Retriever',
      mr: 'गोल्डन रिट्रिव्हर',
      hi: 'गोल्डन रिट्रीवर'
    }
  },
  {
    value: 'Rottweiler',
    labels: {
      en: 'Rottweiler',
      mr: 'रॉटवायलर',
      hi: 'रॉटवायलर'
    }
  },
  {
    value: 'Doberman',
    labels: {
      en: 'Doberman',
      mr: 'डोबरमन',
      hi: 'डोबरमैन'
    }
  },
  {
    value: 'Beagle',
    labels: {
      en: 'Beagle',
      mr: 'बीगल',
      hi: 'बीगल'
    }
  },
  {
    value: 'Pug',
    labels: {
      en: 'Pug',
      mr: 'पग',
      hi: 'पग'
    }
  },
  {
    value: 'Shih Tzu',
    labels: {
      en: 'Shih Tzu',
      mr: 'शिह त्झू',
      hi: 'शिह त्ज़ू'
    }
  },
  {
    value: 'Siberian Husky',
    labels: {
      en: 'Siberian Husky',
      mr: 'सायबेरियन हस्की',
      hi: 'साइबेरियन हस्की'
    }
  },
  {
    value: 'Great Dane',
    labels: {
      en: 'Great Dane',
      mr: 'ग्रेट डेन',
      hi: 'ग्रेट डेन'
    }
  },
  {
    value: 'Pomeranian',
    labels: {
      en: 'Pomeranian',
      mr: 'पोमेरेनियन',
      hi: 'पोमेरेनियन'
    }
  },
  {
    value: 'French Bulldog',
    labels: {
      en: 'French Bulldog',
      mr: 'फ्रेंच बुलडॉग',
      hi: 'फ्रेंच बुलडॉग'
    }
  },
  {
    value: 'American Bully',
    labels: {
      en: 'American Bully',
      mr: 'अमेरिकन बुली',
      hi: 'अमेरिकन बुली'
    }
  },
  {
    value: 'Cane Corso',
    labels: {
      en: 'Cane Corso',
      mr: 'केन कोर्सो',
      hi: 'केन कोर्सो'
    }
  },
  {
    value: 'Pit Bull',
    labels: {
      en: 'Pit Bull',
      mr: 'पिट बुल',
      hi: 'पिट बुल'
    }
  },
  {
    value: 'Belgian Malinois',
    labels: {
      en: 'Belgian Malinois',
      mr: 'बेल्जियन मॅलिनॉइस',
      hi: 'बेल्जियन मैलिनोइस'
    }
  },
  {
    value: 'Mudhol Hound',
    labels: {
      en: 'Mudhol Hound',
      mr: 'मुधोळ हाउंड',
      hi: 'मुधोल हाउंड'
    }
  },
  {
    value: 'Rajapalayam',
    labels: {
      en: 'Rajapalayam',
      mr: 'राजापालयम',
      hi: 'राजापालयम'
    }
  },
  {
    value: 'Indian Pariah Dog',
    labels: {
      en: 'Indian Pariah Dog',
      mr: 'देशी कुत्रा',
      hi: 'देसी कुत्ता'
    }
  },
  {
    value: 'Kombai',
    labels: {
      en: 'Kombai',
      mr: 'कोम्बई',
      hi: 'कोम्बई'
    }
  }
];

export const getDogBreedOptions = (language, selectLabel) => {
  const locale = language?.startsWith('mr') ? 'mr' : language?.startsWith('hi') ? 'hi' : 'en';

  return [
    { value: '', label: selectLabel },
    ...DOG_BREEDS.map((breed) => ({
      value: breed.value,
      label: repairMojibakeText(breed.labels[locale] || breed.labels.en)
    }))
  ];
};
