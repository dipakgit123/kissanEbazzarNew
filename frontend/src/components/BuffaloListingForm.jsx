import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import buffaloFrontGuide from '../assets/cliparts/buffalo_front.png';
import buffaloSideGuide from '../assets/cliparts/buffalo_side.png';
import buffaloTeatsGuide from '../assets/cliparts/buffalo_teats.png';
import { getBuffaloBreedOptions } from '../constants/buffaloBreeds';
import './AnimalListingPage.css';
import { localizeApiMessage } from '../utils/localizeApiMessage';

const API_URL = API_BASE_URL;

const BuffaloListingForm = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const buffaloBreedOptions = getBuffaloBreedOptions(
    i18n.resolvedLanguage || i18n.language,
    t('common.selectOption')
  );
  const [formData, setFormData] = useState({
    breedName: '',
    age: '',
    milkCapacity: '',
    pregnancyStatus: 'unknown',
    hasHorns: 'true',
    healthCondition: 'good',
    expectedPrice: '',
    isNegotiable: true
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

    if (!files.frontPhoto && !files.sidePhoto && !files.milkScenePhoto) {
      const message = t('listing.photoRequired');
      setError(message);
      toast.error(message);
      return;
    }

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

      const endpoint = `${API_URL}/api/buffalos/listings`;
      console.log('🐃 [BUFFALO] Submitting to API endpoint:', endpoint);
      
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

      console.log('✅ [BUFFALO] API Response:', response.data);
      console.log('✅ [BUFFALO] Listing created successfully at:', endpoint);

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          breedName: '',
          age: '',
          milkCapacity: '',
          pregnancyStatus: 'unknown',
          hasHorns: 'true',
          healthCondition: 'good',
          expectedPrice: '',
          isNegotiable: true
        });
        setFiles({
          frontPhoto: null,
          sidePhoto: null,
          milkScenePhoto: null,
          video: null
        });

        toast.success(t('listing.createSuccess'));
        navigate('/buy-animals');
      }
    } catch (err) {
      console.error('Error creating listing:', err);
      const nextMessage = localizeApiMessage(
        i18n,
        t,
        err.response?.data?.message || err.message,
        'listing.createError',
        'Failed to create listing'
      );
      setError(nextMessage);
      toast.error(nextMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="listing-form" onSubmit={handleSubmit}>
      <h2 className="form-title">{t('buffaloForm.title')}</h2>

      <FormAlert type="success" message={success ? t('listing.createSuccess') : null} />
      <FormAlert type="error" message={error} />

      <FormSection number="1" title={t('buffaloForm.section1')}>
          <div className="form-row">
          <FormSelect
            label={t('cowForm.breedName')}
            name="breedName"
            value={formData.breedName}
            onChange={handleChange}
            options={buffaloBreedOptions}
            required
          />

          <FormInput
            label={t('animal.age')}
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder={t('animal.agePlaceholder')}
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label={t('cowForm.milkCapacity')}
            name="milkCapacity"
            type="number"
            value={formData.milkCapacity}
            onChange={handleChange}
            placeholder={t('cowForm.milkPlaceholder') || "e.g., 12"}
            step="0.01"
            min="0"
            max="100"
            required
          />

          <FormSelect
            label={t('cowForm.pregnancyStatus')}
            name="pregnancyStatus"
            value={formData.pregnancyStatus}
            onChange={handleChange}
            required
            options={[
              { value: 'pregnant', label: t('cowForm.pregnant') },
              { value: 'not_pregnant', label: t('cowForm.notPregnant') },
              { value: 'recently_delivered', label: t('cowForm.recentlyCalved') },
              { value: 'unknown', label: t('animal.healthGood') || 'Unknown' }
            ]}
          />
        </div>
      </FormSection>

      <FormSection number="2" title={t('buffaloForm.section2')}>
          <div className="form-row">
          <FormRadioGroup
            label={t('cowForm.hasHorns')}
            name="hasHorns"
            value={formData.hasHorns}
            onChange={handleChange}
            options={[
              { value: 'true', label: t('cowForm.yes') },
              { value: 'false', label: t('cowForm.no') }
            ]}
          />

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
        </div>
      </FormSection>

      <FormSection number="3" title={t('animal.section4')}>
          <div className="form-row">
          <FormFileInput
            label={t('animal.frontPhoto')}
            name="frontPhoto"
            id="buffalo-frontPhoto"
            accept="image/*"
            file={files.frontPhoto}
            onChange={(file) => handleFileChange('frontPhoto', file)}
            required
            placeholderImage={buffaloFrontGuide}
            placeholderAlt={t('animal.frontPhoto')}
          />

          <FormFileInput
            label={t('cowForm.sidePhoto')}
            name="sidePhoto"
            id="buffalo-sidePhoto"
            accept="image/*"
            file={files.sidePhoto}
            onChange={(file) => handleFileChange('sidePhoto', file)}
            placeholderImage={buffaloSideGuide}
            placeholderAlt={t('cowForm.sidePhoto')}
          />
        </div>

        <div className="form-row">
          <FormFileInput
            label={t('cowForm.milkScenePhoto')}
            name="milkScenePhoto"
            id="buffalo-milkScenePhoto"
            accept="image/*"
            file={files.milkScenePhoto}
            onChange={(file) => handleFileChange('milkScenePhoto', file)}
            placeholderImage={buffaloTeatsGuide}
            placeholderAlt={t('cowForm.milkScenePhoto')}
          />

          <FormFileInput
            label={t('cowForm.video')}
            name="video"
            id="buffalo-video"
            accept="video/*"
            file={files.video}
            onChange={(file) => handleFileChange('video', file)}
            placeholderVariant="video"
          />
        </div>
      </FormSection>

      <FormSection number="4" title={t('animal.section3')}>
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
            id="buffalo-isNegotiable"
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

export default BuffaloListingForm;
