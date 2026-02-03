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

const GoatListingForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    goatType: 'male',
    breedName: '',
    age: '',
    weight: '',
    color: '',
    hornType: 'with_horns',
    healthStatus: 'healthy',
    purpose: 'milk',
    description: '',
    milkCapacity: '',
    lastDeliveryDate: '',
    numberOfKidsDelivered: '',
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

      const endpoint = `${API_URL}/api/goats/listings`;
      console.log('🐐 [GOAT] Submitting to API endpoint:', endpoint);
      
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

      console.log('✅ [GOAT] API Response:', response.data);
      console.log('✅ [GOAT] Listing created successfully at:', endpoint);

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          goatType: 'male',
          breedName: '',
          age: '',
          weight: '',
          color: '',
          hornType: 'with_horns',
          healthStatus: 'healthy',
          purpose: 'milk',
          description: '',
          milkCapacity: '',
          lastDeliveryDate: '',
          numberOfKidsDelivered: '',
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
      <h2 className="form-title">{t('goatForm.title')}</h2>

      <FormAlert type="success" message={success ? t('listing.createSuccess') : null} />
      <FormAlert type="error" message={error} />

      <FormSection number="1" title={t('goatForm.section1')}>
          <div className="form-row">
          <FormSelect
            label={t('animal.gender')}
            name="goatType"
            value={formData.goatType}
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
            placeholder="e.g., Boer, Sirohi, Jamunapari"
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
            label={t('animalListing.weight')}
            name="weight"
            type="number"
            value={formData.weight}
            onChange={handleChange}
            placeholder={t('goatForm.weightPlaceholder')}
            step="0.01"
            min="0"
            max="200"
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label={t('animalListing.color')}
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder={t('otherAnimal.colorPlaceholder') || "e.g., White, Black, Brown"}
            required
          />

          <FormSelect
            label={t('goatForm.hornType')}
            name="hornType"
            value={formData.hornType}
            onChange={handleChange}
            required
            options={[
              { value: 'with_horns', label: t('cowForm.yes') },
              { value: 'without_horns', label: t('cowForm.no') }
            ]}
          />
        </div>

        <div className="form-row">
          <FormSelect
            label={t('animal.healthCondition')}
            name="healthStatus"
            value={formData.healthStatus}
            onChange={handleChange}
            required
            options={[
              { value: 'healthy', label: t('animal.healthGood') },
              { value: 'under_treatment', label: t('animal.underTreatment') },
              { value: 'vaccinated', label: t('animal.vaccinated') }
            ]}
          />

          <FormSelect
            label={t('goatForm.purpose')}
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            options={[
              { value: 'milk', label: t('goatForm.purposeMilk') },
              { value: 'meat', label: t('goatForm.purposeMeat') },
              { value: 'breeding', label: t('goatForm.purposeBreeding') },
              { value: 'pet', label: t('goatForm.purposePet') }
            ]}
          />
        </div>

        <FormInput
          label={t('sellAnimal.description')}
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          placeholder={t('animal.additionalNotesPlaceholder')}
          rows="3"
        />
      </FormSection>

      {formData.goatType === 'female' && (
        <FormSection number="2" title={t('goatForm.productionInfo')}>
            <div className="form-row">
            <FormInput
              label={t('cowForm.milkCapacity')}
              name="milkCapacity"
              type="number"
              value={formData.milkCapacity}
              onChange={handleChange}
              placeholder={t('cowForm.milkPlaceholder') || "e.g., 2.5"}
              step="0.01"
              min="0"
            />

            <FormInput
              label={t('goatForm.lastDeliveryDate')}
              name="lastDeliveryDate"
              type="date"
              value={formData.lastDeliveryDate}
              onChange={handleChange}
            />

            <FormInput
              label="Number of Kids Delivered"
              name="numberOfKidsDelivered"
              type="number"
              value={formData.numberOfKidsDelivered}
              onChange={handleChange}
              placeholder="e.g., 2"
              min="0"
            />
          </div>
        </FormSection>
      )}

      <FormSection number={formData.goatType === 'female' ? '3' : '2'} title={t('animal.section4')}>
          <div className="form-row">
          {[1, 2, 3, 4, 5].map((num) => (
            <FormFileInput
              key={num}
              label={t('formLabels.photo') + ' ' + num}
              name={`photo${num}`}
              id={`goat-photo${num}`}
              accept="image/*"
              file={files[`photo${num}`]}
              onChange={(file) => handleFileChange(`photo${num}`, file)}
              required={num === 1}
            />
          ))}

          <FormFileInput
            label={t('animal.video')}
            name="video"
            id="goat-video"
            accept="video/*"
            file={files.video}
            onChange={(file) => handleFileChange('video', file)}
          />
        </div>
      </FormSection>

      <FormSection number={formData.goatType === 'female' ? '4' : '3'} title={t('animal.section3')}>
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

      <FormSection number={formData.goatType === 'female' ? '5' : '4'} title={t('listing.termsConfirmation')}>
          <FormCheckbox
          id="goat-detailsConfirmed"
          name="detailsConfirmed"
          label={t('listing.confirmDetails')}
          checked={formData.detailsConfirmed}
          onChange={handleChange}
          required
        />

        <FormCheckbox
          id="goat-termsAccepted"
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

export default GoatListingForm;
