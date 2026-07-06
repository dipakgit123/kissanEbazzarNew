import React from 'react';
import { useTranslation } from 'react-i18next';
import { getGoatBreedOptions } from '../../constants/goatBreeds';
import SimpleAnimalListingForm from './SimpleAnimalListingForm';

const GoatListingForm = ({ navigation, onSuccess }) => {
  const { t, i18n } = useTranslation();

  return (
    <SimpleAnimalListingForm
      navigation={navigation}
      onSuccess={onSuccess}
      title={t('goatForm.title', { defaultValue: 'Create Goat Listing' })}
      endpoint="/api/goats/listings"
      photoField="photo1"
      genderField="goatType"
      showGender
      pregnancyMode="femaleOnly"
      breedOptions={getGoatBreedOptions(i18n.resolvedLanguage || i18n.language, t('common.selectOption', { defaultValue: 'Select breed' }))}
      defaults={{
        age: '1',
        weight: '25',
        hornType: 'with_horns',
        healthStatus: 'healthy',
        purpose: 'milk',
        isNegotiable: 'true',
        description: '',
      }}
    />
  );
};

export default GoatListingForm;
