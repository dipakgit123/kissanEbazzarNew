import React from 'react';
import { useTranslation } from 'react-i18next';
import { getBuffaloBreedOptions } from '../constants/buffaloBreeds';
import SimpleAnimalListingForm from './SimpleAnimalListingForm';

const BuffaloListingForm = () => {
  const { t, i18n } = useTranslation();

  return (
    <SimpleAnimalListingForm
      title={t('listing.createBuffaloListing', 'Create Buffalo Listing')}
      endpoint="/api/buffalos/listings"
      photoField="frontPhoto"
      breedOptions={getBuffaloBreedOptions(i18n.resolvedLanguage || i18n.language, t('common.selectOption'))}
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

export default BuffaloListingForm;
