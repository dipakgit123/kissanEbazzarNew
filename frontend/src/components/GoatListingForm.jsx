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
        `${API_URL}/api/goats/listings`,
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

        alert('Goat listing created successfully!');
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
      <h2 className="form-title">Goat Listing Form</h2>

      <FormAlert type="success" message={success ? 'Goat listing created successfully!' : null} />
      <FormAlert type="error" message={error} />

      <FormSection number="1" title="Goat Details">
          <div className="form-row">
          <FormSelect
            label="Goat Type"
            name="goatType"
            value={formData.goatType}
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
            placeholder="e.g., Boer, Sirohi, Jamunapari"
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="e.g., 2 years"
            required
          />

          <FormInput
            label="Weight (kg)"
            name="weight"
            type="number"
            value={formData.weight}
            onChange={handleChange}
            placeholder="e.g., 40"
            step="0.01"
            min="0"
            max="200"
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="e.g., White, Black, Brown"
            required
          />

          <FormSelect
            label="Horn Type"
            name="hornType"
            value={formData.hornType}
            onChange={handleChange}
            required
            options={[
              { value: 'with_horns', label: 'With Horns' },
              { value: 'without_horns', label: 'Without Horns' }
            ]}
          />
        </div>

        <div className="form-row">
          <FormSelect
            label="Health Status"
            name="healthStatus"
            value={formData.healthStatus}
            onChange={handleChange}
            required
            options={[
              { value: 'healthy', label: 'Healthy' },
              { value: 'under_treatment', label: 'Under Treatment' },
              { value: 'vaccinated', label: 'Vaccinated' }
            ]}
          />

          <FormSelect
            label="Purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            options={[
              { value: 'milk', label: 'Milk' },
              { value: 'meat', label: 'Meat' },
              { value: 'breeding', label: 'Breeding' },
              { value: 'pet', label: 'Pet' }
            ]}
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

      {formData.goatType === 'female' && (
        <FormSection number="2" title="Production Info (For Female Goats)">
            <div className="form-row">
            <FormInput
              label="Milk Capacity (liters/day)"
              name="milkCapacity"
              type="number"
              value={formData.milkCapacity}
              onChange={handleChange}
              placeholder="e.g., 2.5"
              step="0.01"
              min="0"
            />

            <FormInput
              label="Last Delivery Date"
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

      <FormSection number={formData.goatType === 'female' ? '3' : '2'} title="Images (min 1, max 5 photos + 1 video)">
          <div className="form-row">
          {[1, 2, 3, 4, 5].map((num) => (
            <FormFileInput
              key={num}
              label={`Photo ${num}`}
              name={`photo${num}`}
              id={`goat-photo${num}`}
              accept="image/*"
              file={files[`photo${num}`]}
              onChange={(file) => handleFileChange(`photo${num}`, file)}
              required={num === 1}
            />
          ))}

          <FormFileInput
            label="Video (max 1)"
            name="video"
            id="goat-video"
            accept="video/*"
            file={files.video}
            onChange={(file) => handleFileChange('video', file)}
          />
        </div>
      </FormSection>

      <FormSection number={formData.goatType === 'female' ? '4' : '3'} title="Pricing">
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
            options={[
              { id: 'goat-negotiable-yes', value: true, label: 'Yes' },
              { id: 'goat-negotiable-no', value: false, label: 'No' }
            ]}
            selectedValue={formData.isNegotiable}
            onChange={(value) => setFormData(prev => ({ ...prev, isNegotiable: value }))}
          />
        </div>
      </FormSection>

      <FormSection number={formData.goatType === 'female' ? '5' : '4'} title="Terms & Confirmation">
          <FormCheckbox
          id="goat-detailsConfirmed"
          name="detailsConfirmed"
          label="I confirm all the above details are true."
          checked={formData.detailsConfirmed}
          onChange={handleChange}
          required
        />

        <FormCheckbox
          id="goat-termsAccepted"
          name="termsAccepted"
          label="I agree to Animal E-Bazzar's listing terms."
          checked={formData.termsAccepted}
          onChange={handleChange}
          required
        />
      </FormSection>

      <InfoBanner />

      <SubmitButton loading={loading} loadingText="Submitting..." submitText="Submit Goat Listing" />
    </form>
  );
};

export default GoatListingForm;
