import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
        throw new Error('Please login to create a listing');
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

        alert('Cat listing created successfully!');
      }
    } catch (err) {
      console.error('Error creating listing:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create listing');
      alert(`Error: ${err.response?.data?.message || err.message || 'Failed to create listing'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="listing-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Cat Listing Form</h2>

      <FormAlert type="success" message={success ? 'Cat listing created successfully!' : null} />
      <FormAlert type="error" message={error} />

      <FormSection number="1" title="Cat Details">
          <div className="form-row">
          <FormSelect
            label="Cat Type"
            name="catType"
            value={formData.catType}
            onChange={handleChange}
            required
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' }
            ]}
          />

          <FormInput
            label="Breed Name"
            name="breedName"
            value={formData.breedName}
            onChange={handleChange}
            placeholder="e.g., Persian, Siamese, Indian, Maine Coon"
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="e.g., 6 months or 2 years"
            required
          />

          <FormInput
            label="Color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="e.g., White, Black, Brown"
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Weight (kg)"
            name="weight"
            type="number"
            value={formData.weight}
            onChange={handleChange}
            placeholder="e.g., 4.5"
            step="0.01"
            min="0"
            max="50"
            required
          />

          <FormInput
            label="Eye Color"
            name="eyeColor"
            value={formData.eyeColor}
            onChange={handleChange}
            placeholder="e.g., Blue, Green, Yellow"
            required
          />
        </div>

        <div className="form-row">
          <FormSelect
            label="Fur Type"
            name="furType"
            value={formData.furType}
            onChange={handleChange}
            required
            options={[
              { value: 'short', label: 'Short' },
              { value: 'long', label: 'Long' },
              { value: 'curly', label: 'Curly' }
            ]}
          />

          <FormSelect
            label="Vaccination Status"
            name="vaccinationStatus"
            value={formData.vaccinationStatus}
            onChange={handleChange}
            required
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
          />
        </div>

        <div className="form-row">
          <FormSelect
            label="Health Condition"
            name="healthCondition"
            value={formData.healthCondition}
            onChange={handleChange}
            required
            options={[
              { value: 'healthy', label: 'Healthy' },
              { value: 'under_treatment', label: 'Under Treatment' }
            ]}
          />

          <FormSelect
            label="Behavior"
            name="behavior"
            value={formData.behavior}
            onChange={handleChange}
            required
            options={[
              { value: 'friendly', label: 'Friendly' },
              { value: 'aggressive', label: 'Aggressive' },
              { value: 'calm', label: 'Calm' }
            ]}
          />
        </div>

        <FormInput
          label="Description"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          placeholder="e.g., playful, good with kids..."
          rows="3"
        />
      </FormSection>

      <FormSection number="2" title="Images (min 1, max 5 photos + 1 video)">
          <div className="form-row">
          <FormFileInput
            label="Photo 1 (Front View)"
            name="photo1"
            id="cat-photo1"
            accept="image/*"
            file={files.photo1}
            onChange={(file) => handleFileChange('photo1', file)}
            required
          />

          <FormFileInput
            label="Photo 2 (Side View)"
            name="photo2"
            id="cat-photo2"
            accept="image/*"
            file={files.photo2}
            onChange={(file) => handleFileChange('photo2', file)}
          />
        </div>

        <div className="form-row">
          <FormFileInput
            label="Photo 3 (Full Body)"
            name="photo3"
            id="cat-photo3"
            accept="image/*"
            file={files.photo3}
            onChange={(file) => handleFileChange('photo3', file)}
          />

          <FormFileInput
            label="Photo 4"
            name="photo4"
            id="cat-photo4"
            accept="image/*"
            file={files.photo4}
            onChange={(file) => handleFileChange('photo4', file)}
          />
        </div>

        <div className="form-row">
          <FormFileInput
            label="Photo 5"
            name="photo5"
            id="cat-photo5"
            accept="image/*"
            file={files.photo5}
            onChange={(file) => handleFileChange('photo5', file)}
          />

          <FormFileInput
            label="Video (max 1)"
            name="video"
            id="cat-video"
            accept="video/*"
            file={files.video}
            onChange={(file) => handleFileChange('video', file)}
          />
        </div>
      </FormSection>

      <FormSection number="3" title="Pricing">
          <div className="form-row">
          <FormInput
            label="Expected Price (₹)"
            name="expectedPrice"
            type="number"
            value={formData.expectedPrice}
            onChange={handleChange}
            placeholder="e.g., 15000"
            min="0"
            step="100"
            required
          />

          <FormRadioGroup
            label="Negotiable?"
            name="isNegotiable"
            value={formData.isNegotiable}
            onChange={handleChange}
            options={[
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' }
            ]}
          />
        </div>
      </FormSection>

      <FormSection number="4" title="Terms & Confirmation">
          <FormCheckbox
          id="cat-detailsConfirmed"
          name="detailsConfirmed"
          label="I confirm all the above details are true."
          checked={formData.detailsConfirmed}
          onChange={handleChange}
          required
        />

        <FormCheckbox
          id="cat-termsAccepted"
          name="termsAccepted"
          label="I agree to Animal E-Bazzar's listing terms."
          checked={formData.termsAccepted}
          onChange={handleChange}
          required
        />
      </FormSection>

      <InfoBanner />

      <SubmitButton loading={loading} loadingText="Submitting..." submitText="Submit Cat Listing" />
    </form>
  );
};

export default CatListingForm;
