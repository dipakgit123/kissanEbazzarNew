import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  FormInput,
  FormSelect,
  FormCheckbox,
  FormFileInput,
  FormSection,
  FormAlert,
  InfoBanner,
  SubmitButton
} from './common';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    isNegotiable: true,
    deliveryAvailable: false
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
        throw new Error('Please login to create a listing');
      }

      const response = await axios.post(
        `${API_URL}/api/horses/listings`,
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
          isNegotiable: true,
          deliveryAvailable: false
        });
        setFiles({
          frontPhoto: null,
          sidePhoto: null,
          fullBodyPhoto: null,
          video: null
        });

        alert('Horse listing created successfully!');
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
      <h2 className="form-title">Horse Listing Form</h2>

      <FormAlert type="success" message={success ? 'Horse listing created successfully!' : null} />
      <FormAlert type="error" message={error} />

      <FormSection number="1" title="Horse Details">
          <div className="form-row">
          <FormSelect
            label="Gender"
            name="gender"
            value={formData.gender}
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
            placeholder="e.g., Marwari, Kathiawari, Arabian"
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="e.g., 5 years"
            required
          />

          <FormInput
            label="Color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="e.g., Brown, Black, White"
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Height (hands)"
            name="height"
            type="number"
            value={formData.height}
            onChange={handleChange}
            placeholder="e.g., 15.2"
            step="0.1"
            min="0"
            required
            infoText="1 hand = 4 inches = 10.16 cm"
          />

          <FormInput
            label="Weight (kg)"
            name="weight"
            type="number"
            value={formData.weight}
            onChange={handleChange}
            placeholder="e.g., 450"
            step="0.01"
            min="0"
            required
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
              { value: 'excellent', label: 'Excellent' },
              { value: 'good', label: 'Good' },
              { value: 'average', label: 'Average' }
            ]}
          />

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
        </div>

        <div className="form-row">
          <FormSelect
            label="Purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            options={[
              { value: 'riding', label: 'Riding' },
              { value: 'racing', label: 'Racing' },
              { value: 'breeding', label: 'Breeding' }
            ]}
          />

          <FormInput
            label="Vaccination Details"
            name="vaccinationDetails"
            type="textarea"
            value={formData.vaccinationDetails}
            onChange={handleChange}
            placeholder="Enter vaccination history..."
            rows="2"
          />
        </div>

        <FormInput
          label="Description"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          placeholder="Any additional information..."
          rows="3"
        />
      </FormSection>

      <FormSection number="2" title="Photos & Videos">
          <div className="form-row">
          <FormFileInput
            label="Front Photo"
            name="frontPhoto"
            id="horse-frontPhoto"
            accept="image/*"
            file={files.frontPhoto}
            onChange={(file) => handleFileChange('frontPhoto', file)}
          />

          <FormFileInput
            label="Side Photo"
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
            label="Video"
            name="video"
            id="horse-video"
            accept="video/*"
            file={files.video}
            onChange={(file) => handleFileChange('video', file)}
          />
        </div>
      </FormSection>

      <FormSection number="3" title="Price & Negotiation">
          <div className="form-row">
          <FormInput
            label="Expected Price (₹)"
            name="expectedPrice"
            type="number"
            value={formData.expectedPrice}
            onChange={handleChange}
            placeholder="e.g., 150000"
            min="0"
            step="1000"
            required
          />

          <FormCheckbox
            id="horse-isNegotiable"
            name="isNegotiable"
            label="Price is Negotiable"
            checked={formData.isNegotiable}
            onChange={handleChange}
          />
        </div>
      </FormSection>

      <FormSection number="4" title="Additional Information">
          <FormCheckbox
          id="horse-deliveryAvailable"
          name="deliveryAvailable"
          label="Delivery Available"
          checked={formData.deliveryAvailable}
          onChange={handleChange}
        />
      </FormSection>

      <InfoBanner />

      <SubmitButton loading={loading} loadingText="Submitting..." submitText="Submit Horse Listing" />
    </form>
  );
};

export default HorseListingForm;
