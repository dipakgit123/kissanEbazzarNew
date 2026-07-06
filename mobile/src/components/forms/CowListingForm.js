import React from 'react';
import { useTranslation } from 'react-i18next';
import { getCowBreedOptions } from '../../constants/cowBreeds';
import SimpleAnimalListingForm from './SimpleAnimalListingForm';

const CowListingForm = ({ navigation, onSuccess }) => {
  const { t, i18n } = useTranslation();

  return (
    <SimpleAnimalListingForm
      navigation={navigation}
      onSuccess={onSuccess}
      title={t('listing.createCowListing', { defaultValue: 'Create Cow Listing' })}
      endpoint="/api/animals/listings"
      photoField="frontPhoto"
      breedOptions={getCowBreedOptions(i18n.resolvedLanguage || i18n.language, t('common.selectOption', { defaultValue: 'Select breed' }))}
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

export default CowListingForm;
