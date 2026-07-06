import React from 'react';
import { useTranslation } from 'react-i18next';
import { getBuffaloBreedOptions } from '../../constants/buffaloBreeds';
import SimpleAnimalListingForm from './SimpleAnimalListingForm';

const BuffaloListingForm = ({ navigation, onSuccess }) => {
  const { t, i18n } = useTranslation();

  return (
    <SimpleAnimalListingForm
      navigation={navigation}
      onSuccess={onSuccess}
      title={t('listing.createBuffaloListing', { defaultValue: 'Create Buffalo Listing' })}
      endpoint="/api/buffalos/listings"
      photoField="frontPhoto"
      breedOptions={getBuffaloBreedOptions(i18n.resolvedLanguage || i18n.language, t('common.selectOption', { defaultValue: 'Select breed' }))}
      pregnancyMode="always"
      defaults={{
        age: '3',
        milkCapacity: '0',
        hasHorns: 'true',
        healthCondition: 'good',
        isNegotiable: 'true',
        additionalNotes: '',
      }}
    />
  );
};

export default BuffaloListingForm;
