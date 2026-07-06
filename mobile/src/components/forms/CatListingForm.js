import React from 'react';
import { useTranslation } from 'react-i18next';
import { getCatBreedOptions } from '../../constants/catBreeds';
import SimpleAnimalListingForm from './SimpleAnimalListingForm';

const CatListingForm = ({ navigation, onSuccess }) => {
  const { t, i18n } = useTranslation();

  return (
    <SimpleAnimalListingForm
      navigation={navigation}
      onSuccess={onSuccess}
      title={t('catForm.title', { defaultValue: 'Create Cat Listing' })}
      endpoint="/api/cats/listings"
      photoField="photo1"
      genderField="catType"
      showGender
      pregnancyMode="femaleOnly"
      breedOptions={getCatBreedOptions(i18n.resolvedLanguage || i18n.language, t('common.selectOption', { defaultValue: 'Select breed' }))}
      defaults={{
        age: '1',
        furType: 'short',
        vaccinationStatus: 'yes',
        healthCondition: 'healthy',
        behavior: 'friendly',
        isNegotiable: 'true',
        description: '',
      }}
    />
  );
};

export default CatListingForm;
