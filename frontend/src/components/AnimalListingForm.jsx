 import React, { useState } from 'react';
import axios from 'axios';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AnimalListingForm = () => {
  const [formData, setFormData] = useState({
    breedName: '',
    age: '',
    milkCapacity: '',
    pregnancyStatus: '',
    hasHorns: true,
    healthCondition: '',
    expectedPrice: '',
    isNegotiable: false,
    vaccinationDetails: '',
    deliveryAvailable: false,
    additionalNotes: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: ''
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
        throw new Error('Please login to create a listing');
      }

      const response = await axios.post(
        `${API_URL}/api/animals/listings`,
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
          breedName: '',
          age: '',
          milkCapacity: '',
          pregnancyStatus: '',
          hasHorns: true,
          healthCondition: '',
          expectedPrice: '',
          isNegotiable: false,
          vaccinationDetails: '',
          deliveryAvailable: false,
          additionalNotes: '',
          city: '',
          state: '',
          pincode: '',
          latitude: '',
          longitude: ''
        });
        setFiles({
          frontPhoto: null,
          sidePhoto: null,
          milkScenePhoto: null,
          video: null
        });

        alert('Animal listing created successfully!');
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
      <h2 className="form-title">Animal Listing Form</h2>

      <FormAlert type="success" message={success ? 'Animal listing created successfully!' : null} />
      <FormAlert type="error" message={error} />

      <FormSection number="1" title="Animal Details">
        <div className="form-row">
          <FormInput
            label="Breed Name"
            name="breedName"
            value={formData.breedName}
            onChange={handleChange}
            placeholder="e.g., Gir, Sahiwal, HF"
            required
          />

          <FormInput
            label="Age (years)"
            name="age"
            type="number"
            value={formData.age}
            onChange={handleChange}
            placeholder="e.g., 3.5"
            step="0.1"
            min="0"
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Milk Capacity (liters/day)"
            name="milkCapacity"
            type="number"
            value={formData.milkCapacity}
            onChange={handleChange}
            placeholder="e.g., 15"
            step="0.01"
            min="0"
            required
          />

          <FormSelect
            label="Pregnancy Status"
            name="pregnancyStatus"
            value={formData.pregnancyStatus}
            onChange={handleChange}
            required
            options={[
              { value: '', label: 'Select Status' },
              { value: 'pregnant', label: 'Pregnant' },
              { value: 'not_pregnant', label: 'Not Pregnant' },
              { value: 'recently_delivered', label: 'Recently Delivered' }
            ]}
          />
        </div>

        <div className="form-row">
          <FormRadioGroup
            label="Has Horns?"
            name="hasHorns"
            options={[
              { id: 'horns-yes', value: true, label: 'Yes' },
              { id: 'horns-no', value: false, label: 'No' }
            ]}
            selectedValue={formData.hasHorns}
            onChange={(value) => setFormData(prev => ({ ...prev, hasHorns: value }))}
          />

          <FormSelect
            label="Health Condition"
            name="healthCondition"
            value={formData.healthCondition}
            onChange={handleChange}
            required
            options={[
              { value: '', label: 'Select Condition' },
              { value: 'excellent', label: 'Excellent' },
              { value: 'good', label: 'Good' },
              { value: 'average', label: 'Average' }
            ]}
          />
        </div>
      </FormSection>

      <FormSection number="2" title="Photos & Videos">
        <div className="form-row">
          <FormFileInput
            label="Front Photo"
            name="frontPhoto"
            id="frontPhoto"
            accept="image/*"
            file={files.frontPhoto}
            onChange={(file) => handleFileChange('frontPhoto', file)}
          />

          <FormFileInput
            label="Side Photo"
            name="sidePhoto"
            id="sidePhoto"
            accept="image/*"
            file={files.sidePhoto}
            onChange={(file) => handleFileChange('sidePhoto', file)}
          />
        </div>

        <div className="form-row">
          <FormFileInput
            label="Milk Scene Photo"
            name="milkScenePhoto"
            id="milkScenePhoto"
            accept="image/*"
            file={files.milkScenePhoto}
            onChange={(file) => handleFileChange('milkScenePhoto', file)}
          />

          <FormFileInput
            label="Video"
            name="video"
            id="video"
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
            placeholder="e.g., 50000"
            min="0"
            step="100"
            required
          />

          <FormCheckbox
            id="isNegotiable"
            name="isNegotiable"
            label="Price is Negotiable"
            checked={formData.isNegotiable}
            onChange={handleChange}
          />
        </div>
      </FormSection>

      <FormSection number="4" title="Additional Information">
        <FormInput
          label="Vaccination Details"
          name="vaccinationDetails"
          type="textarea"
          value={formData.vaccinationDetails}
          onChange={handleChange}
          placeholder="Enter vaccination history..."
          rows="3"
        />

        <FormInput
          label="Additional Notes"
          name="additionalNotes"
          type="textarea"
          value={formData.additionalNotes}
          onChange={handleChange}
          placeholder="Any other important information..."
          rows="3"
        />

        <FormCheckbox
          id="deliveryAvailable"
          name="deliveryAvailable"
          label="Delivery Available"
          checked={formData.deliveryAvailable}
          onChange={handleChange}
        />
      </FormSection>

      <FormSection number="5" title="Location">
        <div className="form-row">
          <FormInput
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter city"
          />

          <FormInput
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="Enter state"
          />

          <FormInput
            label="Pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="Enter pincode"
            pattern="[0-9]{6}"
          />
        </div>
      </FormSection>

      <SubmitButton loading={loading} loadingText="Submitting..." submitText="Submit Listing" />
    </form>
  );
};

export default AnimalListingForm;
