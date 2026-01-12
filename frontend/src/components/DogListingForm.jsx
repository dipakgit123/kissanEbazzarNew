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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    isNegotiable: true,
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

      const response = await axios.post(
        `${API_URL}/api/dogs/listings`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

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
          isNegotiable: true,
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

        alert('Dog listing created successfully!');
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
      <h2 className="form-title">Dog Listing Form</h2>

      <FormAlert type="success" message={success ? 'Dog listing created successfully!' : null} />
      <FormAlert type="error" message={error} />

      <FormSection number="1" title="Dog Details">
          <div className="form-row">
          <FormSelect
            label="Dog Type"
            name="dogType"
            value={formData.dogType}
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
            placeholder="e.g., Labrador, German Shepherd, Indian, Pug"
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
            placeholder="e.g., Golden, Black, Brown"
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
            placeholder="e.g., 30"
            step="0.01"
            min="0"
            max="150"
            required
          />

          <FormInput
            label="Height (cm)"
            name="height"
            type="number"
            value={formData.height}
            onChange={handleChange}
            placeholder="e.g., 60"
            step="0.01"
            min="0"
            max="200"
            required
          />
        </div>

        <div className="form-row">
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
        </div>

        <div className="form-row">
          <FormSelect
            label="Trained"
            name="trained"
            value={formData.trained}
            onChange={handleChange}
            required
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
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

        <div className="form-row">
          <FormSelect
            label="Purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            options={[
              { value: 'guard', label: 'Guard' },
              { value: 'pet', label: 'Pet' },
              { value: 'breeding', label: 'Breeding' },
              { value: 'show', label: 'Show' }
            ]}
          />

          <FormInput
            label="Description"
            name="description"
            type="textarea"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g., playful, loyal, vaccinated..."
            rows="3"
          />
        </div>
      </FormSection>

      <FormSection number="2" title="Images (min 1, max 5 photos + 1 video)">
          <div className="form-row">
          {[1, 2, 3, 4, 5].map((num) => (
            <FormFileInput
              key={num}
              label={`Photo ${num}`}
              name={`photo${num}`}
              id={`dog-photo${num}`}
              accept="image/*"
              file={files[`photo${num}`]}
              onChange={(file) => handleFileChange(`photo${num}`, file)}
              required={num === 1}
            />
          ))}

          <FormFileInput
            label="Video (max 1)"
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
            label="Expected Price (₹)"
            name="expectedPrice"
            type="number"
            value={formData.expectedPrice}
            onChange={handleChange}
            placeholder="e.g., 25000"
            min="0"
            step="100"
            required
          />

          <FormRadioGroup
            label="Negotiable?"
            name="isNegotiable"
            options={[
              { id: 'dog-negotiable-yes', value: true, label: 'Yes' },
              { id: 'dog-negotiable-no', value: false, label: 'No' }
            ]}
            selectedValue={formData.isNegotiable}
            onChange={(value) => setFormData(prev => ({ ...prev, isNegotiable: value }))}
          />
        </div>
      </FormSection>

      <FormSection number="4" title="Terms & Confirmation">
          <FormCheckbox
          id="dog-detailsConfirmed"
          name="detailsConfirmed"
          label="I confirm all the above details are true."
          checked={formData.detailsConfirmed}
          onChange={handleChange}
          required
        />

        <FormCheckbox
          id="dog-termsAccepted"
          name="termsAccepted"
          label="I agree to Animal E-Bazzar's listing terms."
          checked={formData.termsAccepted}
          onChange={handleChange}
          required
        />
      </FormSection>

      <InfoBanner />

      <SubmitButton loading={loading} loadingText="Submitting..." submitText="Submit Dog Listing" />
    </form>
  );
};

export default DogListingForm;
