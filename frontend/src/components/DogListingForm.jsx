import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import {
  FormInput,
  FormSelect,
  FormCheckbox,
  FormRadioGroup,
  FormFileInput,
  FormSection,
  FormAlert,
  SubmitButton
} from './common';
import './AnimalListingPage.css';

const API_URL = API_BASE_URL;

const DogListingForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    dogType: 'male',
    breedName: '',
    age: '',
    color: '',
    weight: '',
    height: '',
    vaccinationStatus: 'yes',
    healthCondition: 'healthy',
    trained: 'yes',
    behavior: 'friendly',
    purpose: 'pet',
    description: '',
    expectedPrice: '',
    isNegotiable: 'true'
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

      const endpoint = `${API_URL}/api/dogs/listings`;
      console.log('🐕 [DOG] Submitting to API endpoint:', endpoint);
      
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

      console.log('✅ [DOG] API Response:', response.data);
      console.log('✅ [DOG] Listing created successfully at:', endpoint);

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          dogType: 'male',
          breedName: '',
          age: '',
          color: '',
          weight: '',
          height: '',
          vaccinationStatus: 'yes',
          healthCondition: 'healthy',
          trained: 'yes',
          behavior: 'friendly',
          purpose: 'pet',
          description: '',
          expectedPrice: '',
          isNegotiable: 'true'
        });
        setFiles({
          photo1: null,
          photo2: null,
          photo3: null,
          photo4: null,
          photo5: null,
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
      <h2 className="form-title">{t('dogForm.title')}</h2>

      <FormAlert type="success" message={success ? t('listing.createSuccess') : null} />
      <FormAlert type="error" message={error} />

      <FormSection number="1" title="Dog Details">
          <div className="form-row">
          <FormSelect
            label={t('animal.gender')}
            name="dogType"
            value={formData.dogType}
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
            placeholder={t('dogForm.breedPlaceholder')}
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
            placeholder={t('otherAnimal.colorPlaceholder') || "e.g., Golden, Black, Brown"}
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
            placeholder={t('goatForm.weightPlaceholder') || "e.g., 30"}
            step="0.01"
            min="0"
            max="150"
            required
          />

          <FormInput
            label={t('animalListing.height')}
            name="height"
            type="number"
            value={formData.height}
            onChange={handleChange}
            placeholder={t('dogForm.heightPlaceholder')}
            step="0.01"
            min="0"
            max="200"
            required
          />
        </div>

        <div className="form-row">
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
        </div>

        <div className="form-row">
          <FormSelect
            label={t('dogForm.trained')}
            name="trained"
            value={formData.trained}
            onChange={handleChange}
            required
            options={[
              { value: 'yes', label: t('cowForm.yes') },
              { value: 'no', label: t('cowForm.no') }
            ]}
          />

          <FormSelect
            label={t('dogForm.behavior')}
            name="behavior"
            value={formData.behavior}
            onChange={handleChange}
            required
            options={[
              { value: 'friendly', label: t('dogForm.behaviorFriendly') },
              { value: 'aggressive', label: t('dogForm.behaviorAggressive') },
              { value: 'calm', label: t('dogForm.behaviorCalm') }
            ]}
          />
        </div>

        <div className="form-row">
          <FormSelect
            label={t('dogForm.purpose')}
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            options={[
              { value: 'guard', label: t('dogForm.purposeGuard') },
              { value: 'pet', label: t('dogForm.purposePet') },
              { value: 'breeding', label: t('dogForm.purposeBreeding') },
              { value: 'show', label: t('dogForm.purposeShow') }
            ]}
          />

          <FormInput
            label={t('sellAnimal.description')}
            name="description"
            type="textarea"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('animal.additionalNotesPlaceholder') || "e.g., playful, loyal, vaccinated..."}
            rows="3"
          />
        </div>
      </FormSection>

      <FormSection number="2" title={t('dogForm.imagesTitle')}>
          <div className="form-row">
          {[1, 2, 3, 4, 5].map((num) => (
            <FormFileInput
              key={num}
              label={t('formLabels.photo') + ' ' + num}
              name={`photo${num}`}
              id={`dog-photo${num}`}
              accept="image/*"
              file={files[`photo${num}`]}
              onChange={(file) => handleFileChange(`photo${num}`, file)}
              required={num === 1}
            />
          ))}

          <FormFileInput
            label={t('animal.video')}
            name="video"
            id="dog-video"
            accept="video/*"
            file={files.video}
            onChange={(file) => handleFileChange('video', file)}
          />
        </div>
      </FormSection>

      <FormSection number="3" title="Pricing">
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

      <SubmitButton loading={loading} loadingText={t('listing.submitting')} submitText={t('listing.submit')} />
    </form>
  );
};

export default DogListingForm;
