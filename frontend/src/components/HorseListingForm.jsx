import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import {
  FormInput,
  FormSelect,
  FormCheckbox,
  FormFileInput,
  FormSection,
  FormAlert,
  SubmitButton
} from './common';
import './AnimalListingPage.css';

const API_URL = API_BASE_URL;

const HorseListingForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    gender: 'male',
    breedName: '',
    age: '',
    color: '',
    height: '',
    weight: '',
    healthCondition: 'good',
    trained: 'yes',
    purpose: 'riding',
    vaccinationDetails: '',
    description: '',
    expectedPrice: '',
    isNegotiable: 'true'
  });

  const [files, setFiles] = useState({
    frontPhoto: null,
    sidePhoto: null,
    fullBodyPhoto: null,
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

      const endpoint = `${API_URL}/api/horses/listings`;
      console.log('🐴 [HORSE] Submitting to API endpoint:', endpoint);
      
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

      console.log('✅ [HORSE] API Response:', response.data);
      console.log('✅ [HORSE] Listing created successfully at:', endpoint);

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          gender: 'male',
          breedName: '',
          age: '',
          color: '',
          height: '',
          weight: '',
          healthCondition: 'good',
          trained: 'yes',
          purpose: 'riding',
          vaccinationDetails: '',
          description: '',
          expectedPrice: '',
          isNegotiable: 'true'
        });
        setFiles({
          frontPhoto: null,
          sidePhoto: null,
          fullBodyPhoto: null,
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
      <h2 className="form-title">{t('horseForm.title')}</h2>

      <FormAlert type="success" message={success ? t('listing.createSuccess') : null} />
      <FormAlert type="error" message={error} />

      <FormSection number="1" title={t('horseForm.section1')}>
          <div className="form-row">
          <FormSelect
            label={t('animal.gender')}
            name="gender"
            value={formData.gender}
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
            placeholder={t('horseForm.breedPlaceholder')}
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
            placeholder={t('horseForm.colorPlaceholder') || "e.g., Brown, Black, White"}
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label={t('horseForm.height')}
            name="height"
            type="number"
            value={formData.height}
            onChange={handleChange}
            placeholder={t('horseForm.heightPlaceholder')}
            step="0.1"
            min="0"
            required
            infoText="1 hand = 4 inches = 10.16 cm"
          />

          <FormInput
            label={t('animalListing.weight')}
            name="weight"
            type="number"
            value={formData.weight}
            onChange={handleChange}
            placeholder={t('goatForm.weightPlaceholder') || "e.g., 450"}
            step="0.01"
            min="0"
            required
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
              { value: 'excellent', label: t('animal.healthExcellent') },
              { value: 'good', label: t('animal.healthGood') },
              { value: 'average', label: t('animal.healthAverage') }
            ]}
          />

          <FormSelect
            label={t('horseForm.trained')}
            name="trained"
            value={formData.trained}
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
            label={t('horseForm.purpose')}
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            options={[
              { value: 'riding', label: t('horseForm.purposeRiding') },
              { value: 'racing', label: t('horseForm.purposeRacing') },
              { value: 'breeding', label: t('horseForm.purposeBreeding') }
            ]}
          />

          <FormInput
            label={t('animal.vaccination')}
            name="vaccinationDetails"
            type="textarea"
            value={formData.vaccinationDetails}
            onChange={handleChange}
            placeholder={t('formLabels.vaccinationPlaceholder')}
            rows="2"
          />
        </div>

        <FormInput
          label={t('sellAnimal.description')}
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          placeholder={t('animal.additionalInfoPlaceholder')}
          rows="3"
        />
      </FormSection>

      <FormSection number="2" title={t('animal.section4')}>
          <div className="form-row">
          <FormFileInput
            label={t('animal.frontPhoto')}
            name="frontPhoto"
            id="horse-frontPhoto"
            accept="image/*"
            file={files.frontPhoto}
            onChange={(file) => handleFileChange('frontPhoto', file)}
          />

          <FormFileInput
            label={t('cowForm.sidePhoto')}
            name="sidePhoto"
            id="horse-sidePhoto"
            accept="image/*"
            file={files.sidePhoto}
            onChange={(file) => handleFileChange('sidePhoto', file)}
          />
        </div>

        <div className="form-row">
          <FormFileInput
            label="Full Body Photo"
            name="fullBodyPhoto"
            id="horse-fullBodyPhoto"
            accept="image/*"
            file={files.fullBodyPhoto}
            onChange={(file) => handleFileChange('fullBodyPhoto', file)}
          />

          <FormFileInput
            label={t('cowForm.video')}
            name="video"
            id="horse-video"
            accept="video/*"
            file={files.video}
            onChange={(file) => handleFileChange('video', file)}
          />
        </div>
      </FormSection>

      <FormSection number="3" title={t('animal.section3')}>
          <div className="form-row">
          <FormInput
            label={t('sellAnimal.price') + ' (₹)'}
            name="expectedPrice"
            type="number"
            value={formData.expectedPrice}
            onChange={handleChange}
            placeholder={t('formLabels.pricePlaceholder')}
            min="0"
            step="1000"
            required
          />

          <FormCheckbox
            id="horse-isNegotiable"
            name="isNegotiable"
            label={t('animal.negotiable')}
            checked={formData.isNegotiable}
            onChange={handleChange}
          />
        </div>
      </FormSection>

      <SubmitButton loading={loading} loadingText={t('listing.submitting')} submitText={t('listing.submit')} />
    </form>
  );
};

export default HorseListingForm;
