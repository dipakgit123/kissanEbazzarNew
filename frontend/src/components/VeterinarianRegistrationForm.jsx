import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import LanguageSwitcher from './LanguageSwitcher';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

const VeterinarianRegistrationForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [dragActive, setDragActive] = useState({});

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
    { value: 'general', label: t('vetRegistration.specializations.general') },
    { value: 'large_animal', label: t('vetRegistration.specializations.largeAnimal') },
    { value: 'small_animal', label: t('vetRegistration.specializations.smallAnimal') },
    { value: 'livestock', label: t('vetRegistration.specializations.livestock') },
    { value: 'surgery', label: t('vetRegistration.specializations.surgery') },
    { value: 'emergency', label: t('vetRegistration.specializations.emergency') },
    { value: 'reproduction', label: t('vetRegistration.specializations.reproduction') }
  ];

  const serviceOptions = [
    { value: 'checkup', label: t('vetRegistration.services.checkup'), icon: '🩺' },
    { value: 'vaccination', label: t('vetRegistration.services.vaccination'), icon: '💉' },
    { value: 'surgery', label: t('vetRegistration.services.surgery'), icon: '🔬' },
    { value: 'emergency', label: t('vetRegistration.services.emergency'), icon: '🚨' },
    { value: 'pregnancy', label: t('vetRegistration.services.pregnancy'), icon: '🤰' },
    { value: 'dental', label: t('vetRegistration.services.dental'), icon: '🦷' },
    { value: 'deworming', label: t('vetRegistration.services.deworming'), icon: '💊' },
    { value: 'artificial_insemination', label: t('vetRegistration.services.artificialInsemination'), icon: '🧬' }
  ];

  const qualifications = [
    { value: 'BVSc', label: t('vetRegistration.qualifications.bvsc') },
    { value: 'BVSc & AH', label: t('vetRegistration.qualifications.bvscAh') },
    { value: 'MVSc', label: t('vetRegistration.qualifications.mvsc') },
    { value: 'PhD', label: t('vetRegistration.qualifications.phd') },
    { value: 'Diploma', label: t('vetRegistration.qualifications.diploma') }
  ];

  // Get current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError(t('location.locationRequired'));
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
        setError(t('vetRegistration.locationRequired'));
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

  // Handle drag and drop
  const handleDrag = (e, fieldName) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [fieldName]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleDrop = (e, fieldName) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [fieldName]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(fieldName, e.dataTransfer.files[0]);
    }
  };

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        if (!formData.full_name || !formData.phone_number) {
          setError(t('vetRegistration.fillAllRequired'));
          return false;
        }
        if (!/^\+91[0-9]{10}$/.test(formData.phone_number)) {
          setError(t('vetRegistration.phoneFormat'));
          return false;
        }
        break;
      case 2:
        if (!formData.license_number) {
          setError(t('vetRegistration.licenseRequired'));
          return false;
        }
        if (!files.license_document) {
          setError(t('vetRegistration.licenseDocRequired'));
          return false;
        }
        break;
      case 3:
        if (!formData.latitude || !formData.longitude) {
          setError(t('vetRegistration.locationRequired'));
          return false;
        }
        if (!formData.city || !formData.state || !formData.pincode) {
          setError(t('vetRegistration.locationDetailsRequired'));
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
      setError(err.response?.data?.message || t('vetRegistration.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center border border-gray-100">
          {/* Success Icon */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="absolute w-24 h-24 bg-green-100 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('vetRegistration.successTitle')}</h2>
          <p className="text-xl text-gray-600 mb-8">{t('vetRegistration.registrationSuccess')}</p>
          
          {/* Description */}
          <p className="text-gray-700 leading-relaxed mb-2">
            {t('vetRegistration.successMessage')}
          </p>
          <p className="text-gray-500 text-sm mb-8">
            {t('vetRegistration.successMessageHindi')}
          </p>

          {/* Timeline */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center justify-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('vetRegistration.whatHappensNext')}
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mr-3 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{t('vetRegistration.step1Complete')}</p>
                  <p className="text-xs text-gray-600">{t('vetRegistration.step1CompleteDesc')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{t('vetRegistration.step2Progress')}</p>
                  <p className="text-xs text-gray-600">{t('vetRegistration.step2ProgressDesc')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{t('vetRegistration.step3Live')}</p>
                  <p className="text-xs text-gray-600">{t('vetRegistration.step3LiveDesc')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => navigate('/veterinarian/login')}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold hover:shadow-xl transition-all transform hover:-translate-y-0.5 mb-4"
          >
            {t('vetRegistration.goToLogin')}
          </button>
          <Link
            to="/"
            className="block text-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
          >
            ← {t('vetRegistration.backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Language Switcher - Top Right */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        
        {/* Modern Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{t('vetRegistration.title')}</h1>
          <p className="text-lg text-gray-600 mb-1">{t('vetRegistration.title')}</p>
          <p className="text-sm text-gray-500">{t('vetRegistration.subtitle')}</p>
          
          {/* Back Link */}
          <Link
            to="/veterinarian/login"
            className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium mt-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('vetRegistration.backToLogin')}
          </Link>
        </div>

        {/* Modern Progress Stepper */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: t('vetRegistration.step1'), sublabel: t('vetRegistration.step1Sub'), icon: '👤' },
              { num: 2, label: t('vetRegistration.step2'), sublabel: t('vetRegistration.step2Sub'), icon: '📄' },
              { num: 3, label: t('vetRegistration.step3'), sublabel: t('vetRegistration.step3Sub'), icon: '📍' }
            ].map((s, index) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center flex-1">
                  {/* Step Circle */}
                  <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 ${
                    step >= s.num
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-110'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s.num ? (
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-2xl">{s.icon}</span>
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <div className="mt-3 text-center">
                    <p className={`text-sm font-bold ${
                      step >= s.num ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {s.label}
                    </p>
                    <p className={`text-xs ${
                      step >= s.num ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {s.sublabel}
                    </p>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < 2 && (
                  <div className={`h-1 w-full max-w-[100px] mx-4 rounded-full transition-all duration-500 -mt-8 ${
                    step > s.num ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Step 1: Personal & Professional Info */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Section Card: Personal Information */}
              <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('vetRegistration.personalInfo')}</h2>
                    <p className="text-sm text-gray-500">{t('vetRegistration.basicDetails')}</p>
                  </div>
                </div>
                
                <div className="h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 mb-6"></div>
                
                <div className="space-y-5">

                  {/* Full Name */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('vetRegistration.fullName')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Dr. John Doe"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone & Email Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Phone Number */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('vetRegistration.phone')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleChange}
                          placeholder="+919876543210"
                          className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('vetRegistration.emailOptional')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="doctor@example.com"
                          className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Card: Professional Information */}
              <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('vetRegistration.professionalInfo')}</h2>
                    <p className="text-sm text-gray-500">{t('vetRegistration.qualifications')}</p>
                  </div>
                </div>
                
                <div className="h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 mb-6"></div>
                
                <div className="space-y-5">

                  {/* Qualification & Specialization Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Qualification */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('vetRegistration.qualification')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <select
                          name="qualification"
                          value={formData.qualification}
                          onChange={handleChange}
                          className="w-full pl-12 pr-10 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all appearance-none bg-white text-gray-900"
                        >
                          {qualifications.map(q => (
                            <option key={q.value} value={q.value}>{q.label}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Specialization */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('vetRegistration.specialization')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <select
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleChange}
                          className="w-full pl-12 pr-10 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all appearance-none bg-white text-gray-900"
                        >
                          {specializations.map(s => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Experience & Consultation Fee Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Experience */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('vetRegistration.experience')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <input
                          type="number"
                          name="experience_years"
                          value={formData.experience_years}
                          onChange={handleChange}
                          placeholder={t('vetRegistration.experiencePlaceholder')}
                          min="0"
                          max="50"
                          className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>

                    {/* Consultation Fee */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('vetRegistration.consultationFeeOptional')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-400 font-medium">₹</span>
                        </div>
                        <input
                          type="number"
                          name="consultation_fee"
                          value={formData.consultation_fee}
                          onChange={handleChange}
                          placeholder="500"
                          min="0"
                          className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clinic Name */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('vetRegistration.clinicNameOptional')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="clinic_name"
                        value={formData.clinic_name}
                        onChange={handleChange}
                        placeholder="e.g., Krishna Veterinary Clinic"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Card: Services Offered */}
              <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('vetRegistration.servicesOffered')}</h2>
                    <p className="text-sm text-gray-500">{t('vetRegistration.selectServices')}</p>
                  </div>
                </div>
                
                <div className="h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 mb-6"></div>

                {/* Services - Pill Style Chips */}
                <div className="flex flex-wrap gap-3">
                  {serviceOptions.map(service => (
                    <button
                      key={service.value}
                      type="button"
                      onClick={() => handleServiceChange(service.value)}
                      className={`inline-flex items-center px-5 py-3 rounded-full font-medium transition-all duration-200 ${
                        formData.services.includes(service.value)
                          ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      <span className="text-lg mr-2">{service.icon}</span>
                      <span className="text-sm">{service.label}</span>
                      {formData.services.includes(service.value) && (
                        <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emergency Available & Profile Photo */}
              <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
                <div className="space-y-5">
                  {/* Emergency Toggle */}
                  <div className="flex items-start p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                    <input
                      type="checkbox"
                      id="emergency_available"
                      name="emergency_available"
                      checked={formData.emergency_available}
                      onChange={handleChange}
                      className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-500 mt-0.5"
                    />
                    <label htmlFor="emergency_available" className="ml-4 flex-1 cursor-pointer">
                      <div className="flex items-center mb-1">
                        <span className="text-xl mr-2">🚨</span>
                        <p className="text-sm font-bold text-gray-900">
                          {t('vetRegistration.emergencyAvailable')}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600">{t('vetRegistration.emergencyDesc')}</p>
                    </label>
                  </div>

                  {/* Profile Photo Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t('vetRegistration.profilePhotoOptional')}
                    </label>
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                          {files.profile_photo ? (
                            <img
                              src={URL.createObjectURL(files.profile_photo)}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                        {files.profile_photo && (
                          <button
                            type="button"
                            onClick={() => handleFileChange('profile_photo', null)}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="cursor-pointer inline-flex items-center px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange('profile_photo', e.target.files[0])}
                            className="sr-only"
                          />
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {files.profile_photo ? t('vetRegistration.changePhoto') : t('vetRegistration.uploadPhoto')}
                        </label>
                        <p className="text-xs text-gray-500 mt-2">{t('vetRegistration.supportedFormats')} • {t('vetRegistration.maxFileSize')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Documents & License */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Section Card: License Information */}
              <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('vetRegistration.licenseInfo')}</h2>
                    <p className="text-sm text-gray-500">{t('vetRegistration.licenseDetails')}</p>
                  </div>
                </div>
                
                <div className="h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 mb-6"></div>

                <div className="space-y-5">
                  {/* License Number */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('vetRegistration.licenseNumber')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="license_number"
                        value={formData.license_number}
                        onChange={handleChange}
                        placeholder={t('vetRegistration.licenseNumberPlaceholder')}
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-gray-900 placeholder-gray-400"
                        required
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-2 flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('vetRegistration.licenseNumberHelper')}
                    </p>
                  </div>

                  {/* License Document Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t('vetRegistration.licenseDocument')} <span className="text-red-500">*</span>
                    </label>
                    <div 
                      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                        dragActive.license_document 
                          ? 'border-amber-500 bg-amber-50' 
                          : files.license_document 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-300 hover:border-amber-400 hover:bg-gray-50'
                      }`}
                      onDragEnter={(e) => handleDrag(e, 'license_document')}
                      onDragLeave={(e) => handleDrag(e, 'license_document')}
                      onDragOver={(e) => handleDrag(e, 'license_document')}
                      onDrop={(e) => handleDrop(e, 'license_document')}
                    >
                      {files.license_document ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-green-700 font-semibold text-sm">{files.license_document.name}</p>
                            <p className="text-green-600 text-xs mt-1">{(files.license_document.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFileChange('license_document', null)}
                            className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange('license_document', e.target.files[0])}
                            className="sr-only"
                          />
                          <div className="space-y-3">
                            <div className="flex items-center justify-center">
                              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-gray-700 font-semibold">{t('vetRegistration.dropLicenseHere')} <span className="text-amber-600">{t('vetRegistration.browse')}</span></p>
                              <p className="text-gray-500 text-sm mt-1">Supports: PDF, JPG, PNG (Max 10MB)</p>
                            </div>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Card: Additional Documents */}
              <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('vetRegistration.additionalDocuments')}</h2>
                    <p className="text-sm text-gray-500">{t('vetRegistration.additionalDocumentsDesc')}</p>
                  </div>
                </div>
                
                <div className="h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 mb-6"></div>

                <div className="space-y-5">
                  {/* Degree Certificate */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t('vetRegistration.degreeOptional')}
                    </label>
                    <div 
                      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                        dragActive.degree_certificate 
                          ? 'border-teal-500 bg-teal-50' 
                          : files.degree_certificate 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                      }`}
                      onDragEnter={(e) => handleDrag(e, 'degree_certificate')}
                      onDragLeave={(e) => handleDrag(e, 'degree_certificate')}
                      onDragOver={(e) => handleDrag(e, 'degree_certificate')}
                      onDrop={(e) => handleDrop(e, 'degree_certificate')}
                    >
                      {files.degree_certificate ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-green-700 font-semibold text-sm">{files.degree_certificate.name}</p>
                            <p className="text-green-600 text-xs mt-1">{(files.degree_certificate.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFileChange('degree_certificate', null)}
                            className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange('degree_certificate', e.target.files[0])}
                            className="sr-only"
                          />
                          <div className="space-y-3">
                            <div className="flex items-center justify-center">
                              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-gray-700 font-semibold">{t('vetRegistration.dropDegreeHere')} <span className="text-teal-600">{t('vetRegistration.browse')}</span></p>
                              <p className="text-gray-500 text-sm mt-1">Supports: PDF, JPG, PNG (Max 10MB)</p>
                            </div>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Aadhar Document */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t('vetRegistration.aadharOptional')}
                    </label>
                    <div 
                      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                        dragActive.aadhar_document 
                          ? 'border-teal-500 bg-teal-50' 
                          : files.aadhar_document 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                      }`}
                      onDragEnter={(e) => handleDrag(e, 'aadhar_document')}
                      onDragLeave={(e) => handleDrag(e, 'aadhar_document')}
                      onDragOver={(e) => handleDrag(e, 'aadhar_document')}
                      onDrop={(e) => handleDrop(e, 'aadhar_document')}
                    >
                      {files.aadhar_document ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-green-700 font-semibold text-sm">{files.aadhar_document.name}</p>
                            <p className="text-green-600 text-xs mt-1">{(files.aadhar_document.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFileChange('aadhar_document', null)}
                            className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange('aadhar_document', e.target.files[0])}
                            className="sr-only"
                          />
                          <div className="space-y-3">
                            <div className="flex items-center justify-center">
                              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-gray-700 font-semibold">{t('vetRegistration.dropAadharHere')} <span className="text-teal-600">{t('vetRegistration.browse')}</span></p>
                              <p className="text-gray-500 text-sm mt-1">Supports: PDF, JPG, PNG (Max 10MB)</p>
                            </div>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Section Card: Location Setup */}
              <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Location Details</h2>
                    <p className="text-sm text-gray-500">Set your clinic or practice location</p>
                  </div>
                </div>
                
                <div className="h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 mb-6"></div>

                {/* Get Current Location - Prominent Action Card */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200 mb-6">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{t('vetRegistration.quickLocationSetup')}</h3>
                      <p className="text-sm text-gray-600">{t('vetRegistration.useGpsDescription')}</p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {locationLoading ? (
                      <>
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-lg">{t('vetRegistration.detectingLocationText')}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-lg">{t('vetRegistration.useCurrentLocation')}</span>
                      </>
                    )}
                  </button>
                  
                  {formData.latitude && formData.longitude && (
                    <div className="mt-4 bg-white border-2 border-green-400 rounded-xl p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-bold text-green-800">Location Captured Successfully!</p>
                          <p className="text-xs text-green-700 mt-1">
                            Coordinates: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-white text-sm text-gray-500 font-medium">{t('vetRegistration.orEnterManually')}</span>
                  </div>
                </div>

                {/* Address Fields */}
                <div className="space-y-5">
                  {/* City, State, Pincode Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* City */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('vetRegistration.city')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="e.g., Pune"
                          className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>

                    {/* State */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('vetRegistration.state')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="e.g., Maharashtra"
                          className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>

                    {/* Pincode */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('vetRegistration.pincode')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          placeholder="e.g., 411001"
                          pattern="[0-9]{6}"
                          className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clinic Address */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('vetRegistration.clinicAddressOptional')}
                    </label>
                    <div className="relative">
                      <div className="absolute top-3.5 left-0 pl-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <textarea
                        name="clinic_address"
                        value={formData.clinic_address}
                        onChange={handleChange}
                        placeholder="Enter full address of your clinic or practice location"
                        rows="3"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Element: Security Badge */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">🔒 Your documents are securely verified</h3>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      All information submitted is encrypted and handled according to data protection regulations. Your personal data is safe with us and will only be used for verification purposes.
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      आपकी सभी जानकारी एन्क्रिप्टेड और सुरक्षित है
                    </p>
                  </div>
                </div>
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
          <div className="flex justify-between items-center mt-8 pt-6 gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition-all text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto flex items-center px-8 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
              >
                Next Step
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="ml-auto flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('vetRegistration.submitting')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('vetRegistration.submit')}
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">What happens after submission?</p>
              <p className="text-sm text-gray-700">
                Documents verified in 24-48 hours → Get notified → Profile goes live → Start connecting with farmers
              </p>
              <p className="text-xs text-gray-600 mt-2">
                आपके दस्तावेज़ 24-48 घंटों में सत्यापित किए जाएंगे
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VeterinarianRegistrationForm;
