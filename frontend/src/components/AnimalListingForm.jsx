import React from 'react';
import { useTranslation } from 'react-i18next';
import { getCowBreedOptions } from '../constants/cowBreeds';
import SimpleAnimalListingForm from './SimpleAnimalListingForm';

const AnimalListingForm = () => {
  const { t, i18n } = useTranslation();

  return (
    <SimpleAnimalListingForm
      title={t('listing.createCowListing', 'Create Cow Listing')}
      endpoint="/api/animals/listings"
      photoField="frontPhoto"
      breedOptions={getCowBreedOptions(i18n.resolvedLanguage || i18n.language, t('common.selectOption'))}
      pregnancyMode="always"
      defaults={{
        age: '3',
        milkCapacity: '0',
        hasHorns: 'true',
        healthCondition: 'good',
        isNegotiable: 'true',
        additionalNotes: ''
      }}
    />
  );
};

export default AnimalListingForm;
