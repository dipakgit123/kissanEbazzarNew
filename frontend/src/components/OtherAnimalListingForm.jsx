import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import {
  FormSection,
  FormInput,
  FormSelect,
  FormRadioGroup,
  FormCheckbox,
  FormFileInput,
  FormAlert,
  SubmitButton,
  InfoBanner
} from './common';
import './AnimalListingPage.css';

const OtherAnimalListingForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Animal Type & Details
    animalType: '',
    breedName: '',
    age: '',
    gender: 'male',
    
    // Physical Details
    weight: '',
    color: '',
    healthCondition: 'good',
    
    // Special Features (varies by animal)
    isTrainedForWork: false,
    specialSkills: '',
    temperament: 'friendly',
    
    // Price & Negotiation
    expectedPrice: '',
    isNegotiable: true,
    
    // Photos & Videos
    frontPhoto: null,
    sidePhoto: null,
    additionalPhoto: null,
    video: null,
    
    // Additional Information
    vaccinationDetails: '',
    deliveryAvailable: false,
    additionalNotes: '',
    
    // Location (will be auto-populated)
    latitude: '',
    longitude: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Get user location on component mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
          
          // Reverse geocode to get address
          fetchAddressFromCoords(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error(t('location.error') || 'Could not get your location');
        }
      );
    }
  }, []);

  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'AnimalEBazzar/1.0'
          }
        }
      );
      
      if (response.data && response.data.address) {
        const address = response.data.address;
        setFormData(prev => ({
          ...prev,
          city: address.city || address.town || address.village || '',
          state: address.state || '',
          pincode: address.postcode || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      // Don't show error to user, just log it
    }
  };

  const handleInputChange = (e) => {
    // Handle direct value (for radio buttons and custom onChange)
    if (typeof e === 'string' || typeof e === 'number') {
      // This is called from a component that passes value directly
      return;
    }
    
    // Handle event object
    if (e && e.target) {
      const { name, value, type, checked, files } = e.target;
      
      if (type === 'file') {
        setFormData(prev => ({
          ...prev,
          [name]: files[0]
        }));
      } else if (type === 'checkbox') {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
      
      // Clear error for this field
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: null
        }));
      }
    }
  };

  const handleFileChange = (name, file) => {
    setFormData(prev => ({
      ...prev,
      [name]: file
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.animalType?.trim()) {
      newErrors.animalType = t('validation.required') || 'Animal type is required';
    }
    if (!formData.breedName?.trim()) {
      newErrors.breedName = t('validation.required') || 'Breed/Type name is required';
    }
    if (!formData.age?.trim()) {
      newErrors.age = t('validation.required') || 'Age is required';
    }
    if (!formData.expectedPrice) {
      newErrors.expectedPrice = t('validation.required') || 'Expected price is required';
    } else if (parseFloat(formData.expectedPrice) <= 0) {
      newErrors.expectedPrice = 'Price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(t('validation.fillRequired') || 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error(t('auth.loginRequired') || 'Please login to create a listing');
        navigate('/login');
        return;
      }

      const formDataToSend = new FormData();
      
      // Append all text fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '' && 
            !['frontPhoto', 'sidePhoto', 'additionalPhoto', 'video'].includes(key)) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append files
      if (formData.frontPhoto) {
        formDataToSend.append('frontPhoto', formData.frontPhoto);
      }
      if (formData.sidePhoto) {
        formDataToSend.append('sidePhoto', formData.sidePhoto);
      }
      if (formData.additionalPhoto) {
        formDataToSend.append('additionalPhoto', formData.additionalPhoto);
      }
      if (formData.video) {
        formDataToSend.append('video', formData.video);
      }

      const endpoint = `${API_BASE_URL}/api/other-animals/listings`;
      console.log('🐾 [OTHER ANIMAL] Submitting to API endpoint:', endpoint);
      console.log('🐾 [OTHER ANIMAL] Animal Type:', formData.animalType);
      
      const response = await axios.post(
        endpoint,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('✅ [OTHER ANIMAL] API Response:', response.data);
      console.log('✅ [OTHER ANIMAL] Listing created successfully at:', endpoint);

      if (response.data.success) {
        toast.success(t('listing.createSuccess') || 'Other animal listing created successfully!');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          t('listing.createError') || 
                          'Failed to create listing. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const animalTypeOptions = [
    { value: '', label: t('otherAnimal.selectType') || 'Select Animal Type' },
    { value: 'sheep', label: t('animalTypes.sheep') || 'Sheep' },
    { value: 'pig', label: t('animalTypes.pig') || 'Pig' },
    { value: 'rabbit', label: t('animalTypes.rabbit') || 'Rabbit' },
    { value: 'chicken', label: t('animalTypes.chicken') || 'Chicken' },
    { value: 'duck', label: t('animalTypes.duck') || 'Duck' },
    { value: 'turkey', label: t('animalTypes.turkey') || 'Turkey' },
    { value: 'camel', label: t('animalTypes.camel') || 'Camel' },
    { value: 'donkey', label: t('animalTypes.donkey') || 'Donkey' },
    { value: 'mule', label: t('animalTypes.mule') || 'Mule' },
    { value: 'exotic', label: t('animalTypes.exotic') || 'Exotic Animal' },
    { value: 'other', label: t('animalTypes.other') || 'Other' }
  ];

  const genderOptions = [
    { value: 'male', label: t('animal.male') || 'Male' },
    { value: 'female', label: t('animal.female') || 'Female' }
  ];

  const healthOptions = [
    { value: 'excellent', label: t('animal.healthExcellent') || 'Excellent' },
    { value: 'good', label: t('animal.healthGood') || 'Good' },
    { value: 'average', label: t('animal.healthAverage') || 'Average' }
  ];

  const temperamentOptions = [
    { value: 'friendly', label: t('otherAnimal.friendly') || 'Friendly' },
    { value: 'calm', label: t('otherAnimal.calm') || 'Calm' },
    { value: 'energetic', label: t('otherAnimal.energetic') || 'Energetic' },
    { value: 'protective', label: t('otherAnimal.protective') || 'Protective' },
    { value: 'independent', label: t('otherAnimal.independent') || 'Independent' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Toaster position="top-right" />
      
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          {t('otherAnimal.listingTitle') || 'List Other Animal for Sale'}
        </h1>

        <InfoBanner
          message={t('otherAnimal.infoBanner') || 'Please provide accurate information about your animal. This helps buyers make informed decisions.'}
          type="info"
        />

        <form onSubmit={handleSubmit} className="space-y-8 mt-6">
          {/* Section 1: Animal Type & Details */}
          <FormSection
            title={t('otherAnimal.section1') || '1. Animal Type & Basic Details'}
            description={t('otherAnimal.section1Desc') || 'Provide basic information about the animal'}
          >
            <FormInput
              label={t('otherAnimal.animalType') || 'Animal Type'}
              name="animalType"
              value={formData.animalType}
              onChange={handleInputChange}
              placeholder={t('otherAnimal.animalTypePlaceholder') || 'e.g., Sheep, Pig, Rabbit, Camel'}
              error={errors.animalType}
              required
            />

            <FormInput
              label={t('otherAnimal.breedName') || 'Breed / Type Name'}
              name="breedName"
              value={formData.breedName}
              onChange={handleInputChange}
              placeholder={t('otherAnimal.breedPlaceholder') || 'e.g., Merino Sheep, Local Breed'}
              error={errors.breedName}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('animal.age') || 'Age'}
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                placeholder={t('animal.agePlaceholder') || 'e.g., 2 years, 6 months'}
                error={errors.age}
                required
              />

              <FormRadioGroup
                label={t('animal.gender') || 'Gender'}
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                options={genderOptions}
              />
            </div>
          </FormSection>

          {/* Section 2: Physical Details */}
          <FormSection
            title={t('otherAnimal.section2') || '2. Physical Details'}
            description={t('otherAnimal.section2Desc') || 'Describe the physical characteristics'}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('otherAnimal.weight') || 'Weight (kg)'}
                name="weight"
                type="number"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="e.g., 50"
              />

              <FormInput
                label={t('otherAnimal.color') || 'Color / Appearance'}
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder={t('otherAnimal.colorPlaceholder') || 'e.g., White, Brown'}
              />
            </div>

            <FormRadioGroup
              label={t('animal.healthCondition') || 'Health Condition'}
              name="healthCondition"
              value={formData.healthCondition}
              onChange={handleInputChange}
              options={healthOptions}
            />
          </FormSection>

          {/* Section 3: Special Features */}
          <FormSection
            title={t('otherAnimal.section3') || '3. Special Features & Behavior'}
            description={t('otherAnimal.section3Desc') || 'Any special training or behavioral traits'}
          >
            <FormCheckbox
              label={t('otherAnimal.trainedForWork') || 'Trained for work or specific tasks'}
              name="isTrainedForWork"
              checked={formData.isTrainedForWork}
              onChange={handleInputChange}
            />

            <FormInput
              label={t('otherAnimal.specialSkills') || 'Special Skills / Abilities'}
              name="specialSkills"
              value={formData.specialSkills}
              onChange={handleInputChange}
              placeholder={t('otherAnimal.specialSkillsPlaceholder') || 'e.g., Guard animal, Show animal, Breeding quality'}
            />

            <FormRadioGroup
              label={t('otherAnimal.temperament') || 'Temperament / Nature'}
              name="temperament"
              value={formData.temperament}
              onChange={handleInputChange}
              options={temperamentOptions}
            />
          </FormSection>

          {/* Section 4: Price & Negotiation */}
          <FormSection
            title={t('animal.section3') || '4. Price & Negotiation'}
            description={t('animal.section3Desc') || 'Set your expected price'}
          >
            <FormInput
              label={t('animal.expectedPrice') || 'Expected Price (₹)'}
              name="expectedPrice"
              type="number"
              value={formData.expectedPrice}
              onChange={handleInputChange}
              placeholder="e.g., 25000"
              error={errors.expectedPrice}
              required
            />

            <FormCheckbox
              label={t('animal.negotiable') || 'Price is negotiable'}
              name="isNegotiable"
              checked={formData.isNegotiable}
              onChange={handleInputChange}
            />
          </FormSection>

          {/* Section 5: Photos & Videos */}
          <FormSection
            title={t('animal.section4') || '5. Photos & Videos'}
            description={t('animal.section4Desc') || 'Upload clear photos and videos'}
          >
            <FormFileInput
              label={t('animal.frontPhoto') || 'Front Photo'}
              name="frontPhoto"
              accept="image/*"
              onChange={(file) => handleFileChange('frontPhoto', file)}
              helperText={t('animal.photoHelper') || 'Clear front view of the animal'}
            />

            <FormFileInput
              label={t('animal.sidePhoto') || 'Side Photo'}
              name="sidePhoto"
              accept="image/*"
              onChange={(file) => handleFileChange('sidePhoto', file)}
              helperText={t('animal.photoHelper') || 'Side view of the animal'}
            />

            <FormFileInput
              label={t('otherAnimal.additionalPhoto') || 'Additional Photo'}
              name="additionalPhoto"
              accept="image/*"
              onChange={(file) => handleFileChange('additionalPhoto', file)}
              helperText={t('otherAnimal.additionalPhotoHelper') || 'Any other relevant photo'}
            />

            <FormFileInput
              label={t('animal.video') || 'Video (Optional)'}
              name="video"
              accept="video/*"
              onChange={(file) => handleFileChange('video', file)}
              helperText={t('animal.videoHelper') || 'Short video showing the animal'}
            />
          </FormSection>

          {/* Section 6: Additional Information */}
          <FormSection
            title={t('animal.section5') || '6. Additional Information'}
            description={t('animal.section5Desc') || 'Any other important details'}
          >
            <FormInput
              label={t('animal.vaccination') || 'Vaccination Details'}
              name="vaccinationDetails"
              value={formData.vaccinationDetails}
              onChange={handleInputChange}
              placeholder={t('animal.vaccinationPlaceholder') || 'List vaccines given and dates'}
              multiline
            />

            <FormCheckbox
              label={t('animal.deliveryAvailable') || 'Home delivery available'}
              name="deliveryAvailable"
              checked={formData.deliveryAvailable}
              onChange={handleInputChange}
            />

            <FormInput
              label={t('animal.additionalNotes') || 'Additional Notes'}
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleInputChange}
              placeholder={t('animal.additionalNotesPlaceholder') || 'Any other information buyers should know'}
              multiline
            />
          </FormSection>

          {/* Submit Button */}
          <SubmitButton
            loading={isSubmitting}
            loadingText={t('listing.submitting') || 'Creating Listing...'}
            submitText={t('listing.submit') || 'Submit Listing'}
          />
        </form>
      </div>
    </div>
  );
};

export default OtherAnimalListingForm;
