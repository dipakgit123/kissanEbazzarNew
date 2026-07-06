import React from 'react';
import { useTranslation } from 'react-i18next';
import { getHorseBreedOptions } from '../../constants/horseBreeds';
import SimpleAnimalListingForm from './SimpleAnimalListingForm';

const HorseListingForm = ({ navigation, onSuccess }) => {
  const { t, i18n } = useTranslation();

  return (
    <SimpleAnimalListingForm
      navigation={navigation}
      onSuccess={onSuccess}
      title={t('horseForm.title', { defaultValue: 'Create Horse Listing' })}
      endpoint="/api/horses/listings"
      photoField="frontPhoto"
      genderField="gender"
      showGender
      pregnancyMode="femaleOnly"
      breedOptions={getHorseBreedOptions(i18n.resolvedLanguage || i18n.language, t('common.selectOption', { defaultValue: 'Select breed' }))}
      defaults={{
        age: '3',
        purpose: 'riding',
        healthCondition: 'good',
        isNegotiable: 'true',
        additionalNotes: '',
      }}
    />
  );
};

export default HorseListingForm;
