import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import {
  FormInput,
  FormSelect,
  FormCheckbox,
  FormRadioGroup,
  FormFileInput,
  FormSection,
  FormAlert,
  InfoBanner,
  SubmitButton
} from './common';
import './AnimalListingPage.css';

const API_URL = API_BASE_URL;

const CatListingForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    catType: 'male',
    breedName: '',
    age: '',
    color: '',
    weight: '',
    eyeColor: '',
    furType: 'short',
    vaccinationStatus: 'yes',
    healthCondition: 'healthy',
    behavior: 'friendly',
    description: '',
    expectedPrice: '',
    isNegotiable: 'true',
    detailsConfirmed: false,
    termsAccepted: false
  });

  const [files, setFiles] = useState({
    photo1: null,
    photo2: null,
    photo3: null,
    photo4: null,
    photo5: null,
    video: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (name, file) => {
    setFiles(prev => ({
      ...prev,
      [name]: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      Object.keys(files).forEach(key => {
        if (files[key]) {
          formDataToSend.append(key, files[key]);
        }
      });

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(t('auth.loginToContinue'));
      }

      const endpoint = `${API_URL}/api/cats/listings`;
      console.log('🐱 [CAT] Submitting to API endpoint:', endpoint);
      
      const response = await axios.post(
        endpoint,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('✅ [CAT] API Response:', response.data);
      console.log('✅ [CAT] Listing created successfully at:', endpoint);

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          catType: 'male',
          breedName: '',
          age: '',
          color: '',
          weight: '',
          eyeColor: '',
          furType: 'short',
          vaccinationStatus: 'yes',
          healthCondition: 'healthy',
          behavior: 'friendly',
          description: '',
          expectedPrice: '',
          isNegotiable: 'true',
          detailsConfirmed: false,
          termsAccepted: false
        });
        setFiles({
          photo1: null,
          photo2: null,
          photo3: null,
          photo4: null,
          photo5: null,
          video: null
        });

        alert(t('listing.createSuccess'));
      }
    } catch (err) {
      console.error('Error creating listing:', err);
      setError(err.response?.data?.message || err.message || t('listing.createError'));
      alert(`Error: ${err.response?.data?.message || err.message || t('listing.createError')}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="listing-form" onSubmit={handleSubmit}>
      <h2 className="form-title">{t('catForm.title')}</h2>

      <FormAlert type="success" message={success ? t('listing.createSuccess') : null} />
      <FormAlert type="error" message={error} />

      <FormSection number="1" title="Cat Details">
          <div className="form-row">
          <FormSelect
            label={t('animal.gender')}
            name="catType"
            value={formData.catType}
            onChange={handleChange}
            required
            options={[
              { value: 'male', label: t('animal.male') },
              { value: 'female', label: t('animal.female') }
            ]}
          />

          <FormInput
            label={t('cowForm.breedName')}
            name="breedName"
            value={formData.breedName}
            onChange={handleChange}
            placeholder={t('animal.agePlaceholder') || "e.g., Persian, Siamese, Indian, Maine Coon"}
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label={t('animal.age')}
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder={t('animal.agePlaceholder')}
            required
          />

          <FormInput
            label={t('animalListing.color')}
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder={t('otherAnimal.colorPlaceholder') || "e.g., White, Black, Brown"}
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label={t('animalListing.weight')}
            name="weight"
            type="number"
            value={formData.weight}
            onChange={handleChange}
            placeholder={t('goatForm.weightPlaceholder') || "e.g., 4.5"}
            step="0.01"
            min="0"
            max="50"
            required
          />

          <FormInput
            label={t('catForm.eyeColor')}
            name="eyeColor"
            value={formData.eyeColor}
            onChange={handleChange}
            placeholder={t('catForm.eyeColorPlaceholder')}
            required
          />
        </div>

        <div className="form-row">
          <FormSelect
            label={t('catForm.furType')}
            name="furType"
            value={formData.furType}
            onChange={handleChange}
            required
            options={[
              { value: 'short', label: t('catForm.furShort') },
              { value: 'long', label: t('catForm.furLong') },
              { value: 'curly', label: t('catForm.furCurly') }
            ]}
          />

          <FormSelect
            label={t('animal.vaccination')}
            name="vaccinationStatus"
            value={formData.vaccinationStatus}
            onChange={handleChange}
            required
            options={[
              { value: 'yes', label: t('cowForm.yes') },
              { value: 'no', label: t('cowForm.no') }
            ]}
          />
        </div>

        <div className="form-row">
          <FormSelect
            label={t('animal.healthCondition')}
            name="healthCondition"
            value={formData.healthCondition}
            onChange={handleChange}
            required
            options={[
              { value: 'healthy', label: t('animal.healthGood') },
              { value: 'under_treatment', label: t('animal.underTreatment') }
            ]}
          />

          <FormSelect
            label={t('catForm.behavior')}
            name="behavior"
            value={formData.behavior}
            onChange={handleChange}
            required
            options={[
              { value: 'friendly', label: t('catForm.behaviorFriendly') },
              { value: 'aggressive', label: t('catForm.behaviorAggressive') },
              { value: 'calm', label: t('catForm.behaviorCalm') }
            ]}
          />
        </div>

        <FormInput
          label={t('sellAnimal.description')}
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          placeholder={t('animal.additionalNotesPlaceholder') || "e.g., playful, good with kids..."}
          rows="3"
        />
      </FormSection>

      <FormSection number="2" title={t('catForm.imagesTitle')}>
          <div className="form-row">
          <FormFileInput
            label={t('animal.frontPhoto')}
            name="photo1"
            id="cat-photo1"
            accept="image/*"
            file={files.photo1}
            onChange={(file) => handleFileChange('photo1', file)}
            required
          />

          <FormFileInput
            label={t('animal.sidePhoto')}
            name="photo2"
            id="cat-photo2"
            accept="image/*"
            file={files.photo2}
            onChange={(file) => handleFileChange('photo2', file)}
          />
        </div>

        <div className="form-row">
          <FormFileInput
            label={t('formLabels.photo') + ' 3'}
            name="photo3"
            id="cat-photo3"
            accept="image/*"
            file={files.photo3}
            onChange={(file) => handleFileChange('photo3', file)}
          />

          <FormFileInput
            label={t('formLabels.photo') + ' 4'}
            name="photo4"
            id="cat-photo4"
            accept="image/*"
            file={files.photo4}
            onChange={(file) => handleFileChange('photo4', file)}
          />
        </div>

        <div className="form-row">
          <FormFileInput
            label={t('formLabels.photo') + ' 5'}
            name="photo5"
            id="cat-photo5"
            accept="image/*"
            file={files.photo5}
            onChange={(file) => handleFileChange('photo5', file)}
          />

          <FormFileInput
            label={t('animal.video')}
            name="video"
            id="cat-video"
            accept="video/*"
            file={files.video}
            onChange={(file) => handleFileChange('video', file)}
          />
        </div>
      </FormSection>

      <FormSection number="3" title={t('formLabels.pricing')}>
          <div className="form-row">
          <FormInput
            label={t('sellAnimal.price') + ' (₹)'}
            name="expectedPrice"
            type="number"
            value={formData.expectedPrice}
            onChange={handleChange}
            placeholder={t('formLabels.pricePlaceholder')}
            min="0"
            step="100"
            required
          />

          <FormRadioGroup
            label={t('animal.negotiable')}
            name="isNegotiable"
            value={formData.isNegotiable}
            onChange={handleChange}
            options={[
              { value: 'true', label: t('cowForm.yes') },
              { value: 'false', label: t('cowForm.no') }
            ]}
          />
        </div>
      </FormSection>

      <FormSection number="4" title={t('listing.termsConfirmation')}>
          <FormCheckbox
          id="cat-detailsConfirmed"
          name="detailsConfirmed"
          label={t('listing.confirmDetails')}
          checked={formData.detailsConfirmed}
          onChange={handleChange}
          required
        />

        <FormCheckbox
          id="cat-termsAccepted"
          name="termsAccepted"
          label={t('listing.agreeTerms')}
          checked={formData.termsAccepted}
          onChange={handleChange}
          required
        />
      </FormSection>

      <InfoBanner />

      <SubmitButton loading={loading} loadingText={t('listing.submitting')} submitText={t('listing.submit')} />
    </form>
  );
};

export default CatListingForm;
