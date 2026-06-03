import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import {
  FormInput,
  FormSelect,
  FormRadioGroup,
  FormFileInput,
  FormSection,
  FormCheckbox,
  FormAlert,
  SubmitButton
} from './common';
import cowFrontGuide from '../assets/cliparts/cow_front.png';
import cowSideGuide from '../assets/cliparts/cow_side.png';
import cowTeatsGuide from '../assets/cliparts/four teats.png';
import './AnimalListingPage.css';

const API_URL = API_BASE_URL;

const AnimalListingForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    breedName: '',
    age: '',
    milkCapacity: '',
    pregnancyStatus: '',
    hasHorns: 'true',
    healthCondition: '',
    expectedPrice: '',
    isNegotiable: 'false'
  });

  const [files, setFiles] = useState({
    frontPhoto: null,
    sidePhoto: null,
    milkScenePhoto: null,
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

      const endpoint = `${API_URL}/api/animals/listings`;
      console.log('🐄 [COW] Submitting to API endpoint:', endpoint);
      
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

      console.log('✅ [COW] API Response:', response.data);
      console.log('✅ [COW] Listing created successfully at:', endpoint);

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          breedName: '',
          age: '',
          milkCapacity: '',
          pregnancyStatus: '',
          hasHorns: 'true',
          healthCondition: '',
          expectedPrice: '',
          isNegotiable: 'false'
        });
        setFiles({
          frontPhoto: null,
          sidePhoto: null,
          milkScenePhoto: null,
          video: null
        });

        toast.success(t('listing.createSuccess'));
      }
    } catch (err) {
      console.error('Error creating listing:', err);
      setError(err.response?.data?.message || err.message || t('listing.createError'));
      toast.error(err.response?.data?.message || err.message || t('listing.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="listing-form" onSubmit={handleSubmit}>
      <h2 className="form-title">{t('listing.createListing')}</h2>

      <FormAlert type="success" message={success ? t('listing.createSuccess') : null} />
      <FormAlert type="error" message={error} />

      <FormSection number="1" title={t('cowForm.section1')}>
        <div className="form-row">
          <FormInput
            label={t('sellAnimal.breed')}
            name="breedName"
            value={formData.breedName}
            onChange={handleChange}
            placeholder={t('cowForm.breedPlaceholder')}
            required
          />

          <FormInput
            label={t('sellAnimal.age')}
            name="age"
            type="number"
            value={formData.age}
            onChange={handleChange}
            placeholder={t('sellAnimal.age')}
            step="0.1"
            min="0"
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label={t('animalListing.milkPerDay')}
            name="milkCapacity"
            type="number"
            value={formData.milkCapacity}
            onChange={handleChange}
            placeholder={t('animalListing.milkPerDay')}
            step="0.01"
            min="0"
            required
          />

          <FormSelect
            label={t('cowForm.pregnancyStatus')}
            name="pregnancyStatus"
            value={formData.pregnancyStatus}
            onChange={handleChange}
            required
            options={[
              { value: '', label: t('common.selectOption') },
              { value: 'pregnant', label: t('cowForm.pregnant') },
              { value: 'not_pregnant', label: t('cowForm.notPregnant') },
              { value: 'recently_delivered', label: t('cowForm.recentlyCalved') }
            ]}
          />
        </div>

        <div className="form-row">
          <FormRadioGroup
            label={t('cowForm.hasHorns')}
            name="hasHorns"
            value={formData.hasHorns}
            onChange={handleChange}
            options={[
              { value: 'true', label: t('common.yes') },
              { value: 'false', label: t('common.no') }
            ]}
          />

          <FormSelect
            label={t('animal.healthCondition')}
            name="healthCondition"
            value={formData.healthCondition}
            onChange={handleChange}
            required
            options={[
              { value: '', label: t('common.selectOption') },
              { value: 'excellent', label: t('animal.healthExcellent') },
              { value: 'good', label: t('animal.healthGood') },
              { value: 'average', label: t('animal.healthAverage') }
            ]}
          />
        </div>
      </FormSection>

      <FormSection number="2" title={t('animal.section4')}>
        <div className="form-row">
          <FormFileInput
            label={t('animalListing.frontPhoto')}
            name="frontPhoto"
            id="frontPhoto"
            accept="image/*"
            file={files.frontPhoto}
            onChange={(file) => handleFileChange('frontPhoto', file)}
            placeholderImage={cowFrontGuide}
            placeholderAlt={t('animalListing.frontPhoto')}
          />

          <FormFileInput
            label={t('animalListing.sidePhoto')}
            name="sidePhoto"
            id="sidePhoto"
            accept="image/*"
            file={files.sidePhoto}
            onChange={(file) => handleFileChange('sidePhoto', file)}
            placeholderImage={cowSideGuide}
            placeholderAlt={t('animalListing.sidePhoto')}
          />
        </div>

        <div className="form-row">
          <FormFileInput
            label={t('cowForm.milkScenePhoto')}
            name="milkScenePhoto"
            id="milkScenePhoto"
            accept="image/*"
            file={files.milkScenePhoto}
            onChange={(file) => handleFileChange('milkScenePhoto', file)}
            placeholderImage={cowTeatsGuide}
            placeholderAlt={t('cowForm.milkScenePhoto')}
          />

          <FormFileInput
            label={t('cowForm.video')}
            name="video"
            id="video"
            accept="video/*"
            file={files.video}
            onChange={(file) => handleFileChange('video', file)}
            placeholderVariant="video"
          />
        </div>
      </FormSection>

      <FormSection number="3" title={t('animalListing.priceInfo')}>
        <div className="form-row">
          <FormInput
            label={t('sellAnimal.price')}
            name="expectedPrice"
            type="number"
            value={formData.expectedPrice}
            onChange={handleChange}
            placeholder={t('formLabels.pricePlaceholder')}
            min="0"
            step="100"
            required
          />

          <FormCheckbox
            id="isNegotiable"
            name="isNegotiable"
            label={t('animalListing.negotiable')}
            checked={formData.isNegotiable}
            onChange={handleChange}
          />
        </div>
      </FormSection>

      <SubmitButton loading={loading} loadingText={t('common.loading')} submitText={t('sellAnimal.submitListing')} />
    </form>
  );
};

export default AnimalListingForm;
