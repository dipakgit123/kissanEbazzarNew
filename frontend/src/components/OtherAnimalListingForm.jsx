import { getAnimalGroup } from '../utils/animalExperience';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import {
  FormSection,
  FormInput,
  FormRadioGroup,
  FormCheckbox,
  FormFileInput,
  FormAlert,
  SubmitButton
} from './common';
import './AnimalListingPage.css';
import { localizeApiMessage } from '../utils/localizeApiMessage';
import { listingMediaAccept } from '../utils/listingMedia';

const OtherAnimalListingForm = ({ initialSpecies = '' }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    animalType: initialSpecies,
    breedName: '',
    age: '',
    gender: 'male',
    weight: '',
    color: '',
    healthCondition: 'good',
    isTrainedForWork: false,
    specialSkills: '',
    temperament: 'friendly',
    expectedPrice: '',
    isNegotiable: true,
    frontPhoto: null,
    sidePhoto: null,
    additionalPhoto: null,
    video: null
  });

  const handleInputChange = (e) => {
    if (!e?.target) {
      return;
    }

    const { name, value, type, checked, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'file' ? files?.[0] ?? null : type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleFileChange = (name, file) => {
    setFormData((prev) => ({
      ...prev,
      [name]: file
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      animalType: initialSpecies,
      breedName: '',
      age: '',
      gender: 'male',
      weight: '',
      color: '',
      healthCondition: 'good',
      isTrainedForWork: false,
      specialSkills: '',
      temperament: 'friendly',
      expectedPrice: '',
      isNegotiable: true,
      frontPhoto: null,
      sidePhoto: null,
      additionalPhoto: null,
      video: null
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.animalType.trim()) {
      newErrors.animalType = t('validation.required') || 'Animal type is required';
    }

    if (!formData.breedName.trim()) {
      newErrors.breedName = t('validation.required') || 'Breed/Type name is required';
    }

    if (!formData.age.trim()) {
      newErrors.age = t('validation.required') || 'Age is required';
    }

    if (!formData.expectedPrice) {
      newErrors.expectedPrice = t('validation.required') || 'Expected price is required';
    } else if (!Number.isFinite(Number(formData.expectedPrice)) || Number(formData.expectedPrice) <= 0) {
      newErrors.expectedPrice = t('listing.positivePrice');
    }

    if (!formData.frontPhoto && !formData.sidePhoto && !formData.additionalPhoto) {
      newErrors.photos = t('listing.photoRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.frontPhoto && !formData.sidePhoto && !formData.additionalPhoto) {
      toast.error(t('listing.photoRequired'));
      return;
    }

    if (!validateForm()) {
      toast.error(t('validation.fillRequired') || 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('auth.loginRequired') || 'Please login to create a listing');
      }

      const formDataToSend = new FormData();
      const fileFields = ['frontPhoto', 'sidePhoto', 'additionalPhoto', 'video'];

      Object.keys(formData).forEach((key) => {
        if (!fileFields.includes(key) && formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      fileFields.forEach((field) => {
        if (formData[field]) {
          formDataToSend.append(field, formData[field]);
        }
      });

      const endpoint = `${API_BASE_URL}/api/other-animals/listings`;
      const response = await axios.post(endpoint, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!response.data?.success) throw new Error(response.data?.message || t('listing.createError'));
      if (response.data.success) {
        setSuccess(true);
        toast.success(t('listing.createSuccess') || 'Other animal listing created successfully!');
        resetForm();
        navigate('/buy-animals');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      const nextErrorMessage =
        localizeApiMessage(
          i18n,
          t,
          error.response?.data?.message || error.response?.data?.error || error.message,
          'listing.createError',
          'Failed to create listing. Please try again.'
        );

      setErrorMessage(nextErrorMessage);
      toast.error(nextErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const genderOptions = [
    { value: 'male', label: t('animal.male') || 'Male' },
    { value: 'female', label: t('animal.female') || 'Female' }
  ];

  const healthOptions = [
    { value: 'excellent', label: t('animal.healthExcellent') || 'Excellent' },
    { value: 'good', label: t('animal.healthGood') || 'Good' },
    { value: 'average', label: t('animal.healthAverage') || 'Average' }
  ];

  const temperamentOptions = [
    { value: 'friendly', label: t('otherAnimal.friendly') || 'Friendly' },
    { value: 'calm', label: t('otherAnimal.calm') || 'Calm' },
    { value: 'energetic', label: t('otherAnimal.energetic') || 'Energetic' },
    { value: 'protective', label: t('otherAnimal.protective') || 'Protective' },
    { value: 'independent', label: t('otherAnimal.independent') || 'Independent' }
  ];

  return (
    <form className="simple-listing-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
      <fieldset disabled={isSubmitting} className="m-0 min-w-0 border-0 p-0">

      <FormAlert type="success" message={success ? t('listing.createSuccess') : null} />
      <FormAlert type="error" message={errorMessage} />

      <FormSection number="1" title={t('otherAnimal.section1') || 'Animal Type & Basic Details'}>
        <label>{t('otherAnimal.animalType')}<select required name="animalType" value={formData.animalType} onChange={handleInputChange} className="w-full border rounded-lg p-3"><option value="">{t('common.select', 'Select')}</option>{(getAnimalGroup() === 'pet' ? ['rabbit', 'exotic', 'other'] : ['sheep', 'pig', 'chicken', 'duck', 'turkey', 'camel', 'donkey', 'mule', 'rabbit', 'other']).map(species => <option key={species} value={species}>{t(`animalTypes.${species}`, species)}</option>)}</select></label>

        <FormInput
          label={t('otherAnimal.breedName') || 'Breed / Type Name'}
          name="breedName"
          value={formData.breedName}
          onChange={handleInputChange}
          placeholder={t('otherAnimal.breedPlaceholder') || 'e.g., Merino Sheep, Local Breed'}
          error={errors.breedName}
          required
        />

        <div className="form-row">
          <FormInput
            label={t('animal.age') || 'Age'}
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            placeholder={t('animal.agePlaceholder') || 'e.g., 2 years'}
            error={errors.age}
            required
          />

          <FormRadioGroup
            label={t('animal.gender') || 'Gender'}
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            options={genderOptions}
          />
        </div>
      </FormSection>

      <FormSection number="2" title={t('otherAnimal.section2') || 'Physical Details'}>
        <div className="form-row">
          <FormInput
            label={t('otherAnimal.weight') || 'Weight (kg)'}
            name="weight"
            type="number"
            value={formData.weight}
            onChange={handleInputChange}
            placeholder="e.g., 50"
          />

          <FormInput
            label={t('otherAnimal.color') || 'Color / Appearance'}
            name="color"
            value={formData.color}
            onChange={handleInputChange}
            placeholder={t('otherAnimal.colorPlaceholder') || 'e.g., White, Brown'}
          />
        </div>

        <FormRadioGroup
          label={t('animal.healthCondition') || 'Health Condition'}
          name="healthCondition"
          value={formData.healthCondition}
          onChange={handleInputChange}
          options={healthOptions}
        />
      </FormSection>

      <FormSection number="3" title={t('otherAnimal.section3') || 'Special Features & Behavior'}>
        <FormCheckbox
          label={t('otherAnimal.trainedForWork') || 'Trained for work or specific tasks'}
          name="isTrainedForWork"
          checked={formData.isTrainedForWork}
          onChange={handleInputChange}
        />

        <FormInput
          label={t('otherAnimal.specialSkills') || 'Special Skills / Abilities'}
          name="specialSkills"
          value={formData.specialSkills}
          onChange={handleInputChange}
          placeholder={t('otherAnimal.specialSkillsPlaceholder') || 'e.g., Guard animal, Show animal'}
        />

        <FormRadioGroup
          label={t('otherAnimal.temperament') || 'Temperament / Nature'}
          name="temperament"
          value={formData.temperament}
          onChange={handleInputChange}
          options={temperamentOptions}
        />
      </FormSection>

      <FormSection number="4" title={t('animal.section4') || 'Photos & Videos'}>
        <FormFileInput
          label={t('animal.frontPhoto') || 'Front Photo'}
          name="frontPhoto"
          id="other-frontPhoto"
          accept={listingMediaAccept('photo')}
          mediaKind="photo"
          file={formData.frontPhoto}
          onChange={(file) => handleFileChange('frontPhoto', file)}
          required
        />

        <FormFileInput
          label={t('animal.sidePhoto') || 'Side Photo'}
          name="sidePhoto"
          id="other-sidePhoto"
          accept={listingMediaAccept('photo')}
          mediaKind="photo"
          file={formData.sidePhoto}
          onChange={(file) => handleFileChange('sidePhoto', file)}
        />

        <FormFileInput
          label={t('otherAnimal.additionalPhoto') || 'Additional Photo'}
          name="additionalPhoto"
          id="other-additionalPhoto"
          accept={listingMediaAccept('photo')}
          mediaKind="photo"
          file={formData.additionalPhoto}
          onChange={(file) => handleFileChange('additionalPhoto', file)}
        />

        <FormFileInput
          label={t('animal.video') || 'Video'}
          name="video"
          id="other-video"
          accept={listingMediaAccept('video')}
          mediaKind="video"
          file={formData.video}
          onChange={(file) => handleFileChange('video', file)}
        />
      </FormSection>

      <FormSection number="5" title={t('animal.section3') || 'Price & Negotiation'}>
        <div className="form-row">
          <FormInput
            label={t('animal.expectedPrice') || 'Expected Price'}
            name="expectedPrice"
            type="number"
            value={formData.expectedPrice}
            onChange={handleInputChange}
            placeholder="e.g., 25000"
            error={errors.expectedPrice}
            required
          />

          <FormCheckbox
            label={t('animal.negotiable') || 'Price is negotiable'}
            name="isNegotiable"
            checked={formData.isNegotiable}
            onChange={handleInputChange}
          />
        </div>
      </FormSection>

      <SubmitButton
        loading={isSubmitting}
        loadingText={t('listing.submitting') || 'Creating Listing...'}
        submitText={t('listing.submit') || 'Submit Listing'}
      />
      </fieldset>
    </form>
  );
};

export default OtherAnimalListingForm;
