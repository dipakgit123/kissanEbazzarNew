import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VeterinarianRegistrationForm = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Info
    full_name: '',
    phone_number: '',
    email: '',

    // Professional Info
    specialization: 'general',
    experience_years: '',
    qualification: 'BVSc',
    services: [],
    consultation_fee: '',
    emergency_available: false,

    // License Info
    license_number: '',

    // Clinic Info
    clinic_name: '',
    clinic_address: '',

    // Location
    latitude: '',
    longitude: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [files, setFiles] = useState({
    profile_photo: null,
    license_document: null,
    degree_certificate: null,
    aadhar_document: null
  });

  const specializations = [
    { value: 'general', label: 'General Practice', labelHindi: 'सामान्य अभ्यास' },
    { value: 'large_animal', label: 'Large Animals (Cow, Buffalo, Horse)', labelHindi: 'बड़े जानवर' },
    { value: 'small_animal', label: 'Small Animals (Dog, Cat, Goat)', labelHindi: 'छोटे जानवर' },
    { value: 'livestock', label: 'Livestock', labelHindi: 'पशुधन' },
    { value: 'surgery', label: 'Surgery', labelHindi: 'सर्जरी' },
    { value: 'emergency', label: 'Emergency Care', labelHindi: 'आपातकालीन देखभाल' },
    { value: 'reproduction', label: 'Reproduction & Breeding', labelHindi: 'प्रजनन' }
  ];

  const serviceOptions = [
    { value: 'checkup', label: 'General Checkup', labelHindi: 'सामान्य जांच' },
    { value: 'vaccination', label: 'Vaccination', labelHindi: 'टीकाकरण' },
    { value: 'surgery', label: 'Surgery', labelHindi: 'सर्जरी' },
    { value: 'emergency', label: 'Emergency Care', labelHindi: 'आपातकालीन देखभाल' },
    { value: 'pregnancy', label: 'Pregnancy Care', labelHindi: 'गर्भावस्था देखभाल' },
    { value: 'dental', label: 'Dental Care', labelHindi: 'दंत चिकित्सा' },
    { value: 'deworming', label: 'Deworming', labelHindi: 'कृमि निवारण' },
    { value: 'artificial_insemination', label: 'Artificial Insemination', labelHindi: 'कृत्रिम गर्भाधान' }
  ];

  const qualifications = [
    { value: 'BVSc', label: 'BVSc (Bachelor of Veterinary Science)' },
    { value: 'BVSc & AH', label: 'BVSc & AH' },
    { value: 'MVSc', label: 'MVSc (Master of Veterinary Science)' },
    { value: 'PhD', label: 'PhD in Veterinary Science' },
    { value: 'Diploma', label: 'Diploma in Veterinary' }
  ];

  // Get current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          if (data.address) {
            setFormData(prev => ({
              ...prev,
              city: data.address.city || data.address.town || data.address.village || '',
              state: data.address.state || '',
              pincode: data.address.postcode || '',
              clinic_address: data.display_name || ''
            }));
          }
        } catch (err) {
          console.error('Geocoding error:', err);
        }

        setLocationLoading(false);
      },
      (error) => {
        setError('Unable to get your location. Please enter manually.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleServiceChange = (serviceValue) => {
    setFormData(prev => {
      const services = prev.services.includes(serviceValue)
        ? prev.services.filter(s => s !== serviceValue)
        : [...prev.services, serviceValue];
      return { ...prev, services };
    });
  };

  const handleFileChange = (name, file) => {
    setFiles(prev => ({
      ...prev,
      [name]: file
    }));
  };

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        if (!formData.full_name || !formData.phone_number) {
          setError('Please fill in your name and phone number');
          return false;
        }
        if (!/^\+91[0-9]{10}$/.test(formData.phone_number)) {
          setError('Phone number must be in format: +91XXXXXXXXXX');
          return false;
        }
        break;
      case 2:
        if (!formData.license_number) {
          setError('License number is required');
          return false;
        }
        if (!files.license_document) {
          setError('Please upload your license document');
          return false;
        }
        break;
      case 3:
        if (!formData.latitude || !formData.longitude) {
          setError('Please set your location');
          return false;
        }
        if (!formData.city || !formData.state || !formData.pincode) {
          setError('Please complete your location details');
          return false;
        }
        break;
      default:
        break;
    }
    setError(null);
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'services') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append files
      Object.keys(files).forEach(key => {
        if (files[key]) {
          formDataToSend.append(key, files[key]);
        }
      });

      const response = await axios.post(
        `${API_URL}/api/veterinarians/register`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-2">पंजीकरण सफल!</p>
          <p className="text-gray-600 mb-6">
            Your application has been submitted. Our team will verify your documents and notify you once approved.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            आपका आवेदन जमा हो गया है। हमारी टीम आपके दस्तावेजों की जांच करेगी।
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> Verification usually takes 24-48 hours.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#000600] mb-2">
            Veterinarian Registration
          </h1>
          <p className="text-lg text-gray-600">पशु चिकित्सक पंजीकरण</p>
          <p className="text-gray-500 mt-2">
            Join our network of verified veterinarians
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s
                  ? 'bg-[#15BB73] text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 ${step > s ? 'bg-[#15BB73]' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between mb-8 px-4">
          <span className={`text-sm ${step >= 1 ? 'text-[#15BB73] font-medium' : 'text-gray-400'}`}>
            Personal Info
          </span>
          <span className={`text-sm ${step >= 2 ? 'text-[#15BB73] font-medium' : 'text-gray-400'}`}>
            Documents
          </span>
          <span className={`text-sm ${step >= 3 ? 'text-[#15BB73] font-medium' : 'text-gray-400'}`}>
            Location
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8">

          {/* Step 1: Personal & Professional Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Personal & Professional Information
              </h2>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name / पूरा नाम <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Dr. John Doe"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number / फ़ोन नंबर <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+919876543210"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional) / ईमेल
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="doctor@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                />
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualification / योग्यता <span className="text-red-500">*</span>
                </label>
                <select
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                >
                  {qualifications.map(q => (
                    <option key={q.value} value={q.value}>{q.label}</option>
                  ))}
                </select>
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization / विशेषज्ञता <span className="text-red-500">*</span>
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                >
                  {specializations.map(s => (
                    <option key={s.value} value={s.value}>
                      {s.label} - {s.labelHindi}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience / अनुभव (वर्ष) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleChange}
                  placeholder="5"
                  min="0"
                  max="50"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                  required
                />
              </div>

              {/* Consultation Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Fee (₹) / परामर्श शुल्क
                </label>
                <input
                  type="number"
                  name="consultation_fee"
                  value={formData.consultation_fee}
                  onChange={handleChange}
                  placeholder="500"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                />
              </div>

              {/* Services */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Services Offered / प्रदान की जाने वाली सेवाएं
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {serviceOptions.map(service => (
                    <label
                      key={service.value}
                      className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                        formData.services.includes(service.value)
                          ? 'border-[#15BB73] bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service.value)}
                        onChange={() => handleServiceChange(service.value)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                        formData.services.includes(service.value)
                          ? 'bg-[#15BB73] border-[#15BB73]'
                          : 'border-gray-300'
                      }`}>
                        {formData.services.includes(service.value) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">{service.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Emergency Available */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emergency_available"
                  name="emergency_available"
                  checked={formData.emergency_available}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#15BB73] border-gray-300 rounded focus:ring-[#15BB73]"
                />
                <label htmlFor="emergency_available" className="ml-3 text-gray-700">
                  Available for 24/7 Emergency Calls / आपातकालीन कॉल के लिए उपलब्ध
                </label>
              </div>

              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo / प्रोफ़ाइल फ़ोटो
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {files.profile_photo ? (
                      <img
                        src={URL.createObjectURL(files.profile_photo)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-gray-700 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('profile_photo', e.target.files[0])}
                      className="sr-only"
                    />
                    Choose Photo
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Documents & License */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                License & Documents
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> Your documents will be verified by our team.
                  Please ensure all documents are clear and readable.
                </p>
              </div>

              {/* License Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Veterinary License Number / लाइसेंस नंबर <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  placeholder="e.g., MH/VET/2020/12345"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                  required
                />
                <p className="text-gray-500 text-sm mt-1">
                  State Veterinary Council Registration Number
                </p>
              </div>

              {/* License Document */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Document / लाइसेंस दस्तावेज़ <span className="text-red-500">*</span>
                </label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center ${
                  files.license_document ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}>
                  {files.license_document ? (
                    <div className="flex items-center justify-center space-x-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-700 font-medium">{files.license_document.name}</span>
                      <button
                        type="button"
                        onClick={() => handleFileChange('license_document', null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange('license_document', e.target.files[0])}
                        className="sr-only"
                      />
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-gray-600">Click to upload license document</span>
                      <p className="text-gray-400 text-sm mt-1">PDF or Image (max 10MB)</p>
                    </label>
                  )}
                </div>
              </div>

              {/* Degree Certificate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Degree Certificate / डिग्री प्रमाणपत्र
                </label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center ${
                  files.degree_certificate ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}>
                  {files.degree_certificate ? (
                    <div className="flex items-center justify-center space-x-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-700 font-medium">{files.degree_certificate.name}</span>
                      <button
                        type="button"
                        onClick={() => handleFileChange('degree_certificate', null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange('degree_certificate', e.target.files[0])}
                        className="sr-only"
                      />
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-gray-600">Click to upload degree certificate</span>
                      <p className="text-gray-400 text-sm mt-1">PDF or Image (max 10MB)</p>
                    </label>
                  )}
                </div>
              </div>

              {/* Aadhar Document */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhar Card (Optional) / आधार कार्ड
                </label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center ${
                  files.aadhar_document ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}>
                  {files.aadhar_document ? (
                    <div className="flex items-center justify-center space-x-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-700 font-medium">{files.aadhar_document.name}</span>
                      <button
                        type="button"
                        onClick={() => handleFileChange('aadhar_document', null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange('aadhar_document', e.target.files[0])}
                        className="sr-only"
                      />
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-gray-600">Click to upload Aadhar card</span>
                      <p className="text-gray-400 text-sm mt-1">PDF or Image (max 10MB)</p>
                    </label>
                  )}
                </div>
              </div>

              {/* Clinic Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clinic Name (Optional) / क्लिनिक का नाम
                </label>
                <input
                  type="text"
                  name="clinic_name"
                  value={formData.clinic_name}
                  onChange={handleChange}
                  placeholder="e.g., Krishna Veterinary Clinic"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Location Details
              </h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  <strong>Important:</strong> Your location helps farmers find you nearby.
                  Please provide accurate location details.
                </p>
              </div>

              {/* Get Current Location Button */}
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {locationLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Getting Location...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Get Current Location / वर्तमान स्थान प्राप्त करें</span>
                  </>
                )}
              </button>

              {formData.latitude && formData.longitude && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-700 text-sm flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Location captured: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                  </p>
                </div>
              )}

              <div className="text-center text-gray-500 text-sm">or enter manually</div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City / शहर <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Pune"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                  required
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State / राज्य <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g., Maharashtra"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                  required
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode / पिनकोड <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g., 411001"
                  pattern="[0-9]{6}"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                  required
                />
              </div>

              {/* Clinic Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address / पूरा पता
                </label>
                <textarea
                  name="clinic_address"
                  value={formData.clinic_address}
                  onChange={handleChange}
                  placeholder="Enter your clinic or practice address"
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                />
              </div>

              {/* Manual Lat/Long */}
              {!formData.latitude && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="e.g., 18.5204"
                      step="any"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="e.g., 73.8567"
                      step="any"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto flex items-center px-6 py-3 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Next
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="ml-auto flex items-center px-8 py-3 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Registration
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">After Registration:</h3>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li className="flex items-start">
              <span className="text-[#15BB73] mr-2">1.</span>
              Your documents will be verified by our team (24-48 hours)
            </li>
            <li className="flex items-start">
              <span className="text-[#15BB73] mr-2">2.</span>
              You will receive a notification once approved
            </li>
            <li className="flex items-start">
              <span className="text-[#15BB73] mr-2">3.</span>
              Your profile will be visible to farmers in your area
            </li>
            <li className="flex items-start">
              <span className="text-[#15BB73] mr-2">4.</span>
              You can update your availability and services anytime
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VeterinarianRegistrationForm;
