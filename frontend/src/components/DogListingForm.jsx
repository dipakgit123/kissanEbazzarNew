import React from 'react';
import { useTranslation } from 'react-i18next';
import { getDogBreedOptions } from '../constants/dogBreeds';
import SimpleAnimalListingForm from './SimpleAnimalListingForm';

const DogListingForm = () => {
  const { t, i18n } = useTranslation();

  return (
    <SimpleAnimalListingForm
      title={t('dogForm.title', 'Create Dog Listing')}
      endpoint="/api/dogs/listings"
      photoField="photo1"
      genderField="dogType"
      showGender
      pregnancyMode="femaleOnly"
      breedOptions={getDogBreedOptions(i18n.resolvedLanguage || i18n.language, t('common.selectOption'))}
      defaults={{
        age: '1',
        vaccinationStatus: 'yes',
        healthCondition: 'healthy',
        trained: 'yes',
        behavior: 'friendly',
        purpose: 'pet',
        isNegotiable: 'true',
        description: ''
      }}
    />
  );
};

export default DogListingForm;
