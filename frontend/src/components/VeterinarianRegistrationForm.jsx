import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VeterinarianRegistrationForm = () => {
  const navigate = useNavigate();
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
            onClick={() => navigate('/veterinarian/login')}
            className="w-full bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Go to Veterinarian Login
          </button>
          <Link
            to="/"
            className="block text-center mt-4 text-gray-600 hover:text-gray-800"
          >
            Back to Home Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Veterinarian Registration</h1>
              <p className="text-sm text-gray-600">पशु चिकित्सक पंजीकरण</p>
            </div>
          </div>
          <Link
            to="/veterinarian/login"
            className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-all text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </div>

        {/* Compact Progress Steps */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Personal Info', icon: '👤' },
              { num: 2, label: 'Documents', icon: '📄' },
              { num: 3, label: 'Location', icon: '📍' }
            ].map((s, index) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center">
                  {/* Step Circle */}
                  <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    step >= s.num
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s.num ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-lg">{s.icon}</span>
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <div className="ml-3">
                    <p className={`text-xs font-semibold ${
                      step >= s.num ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {s.label}
                    </p>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < 2 && (
                  <div className={`flex-1 h-1 mx-3 rounded-full transition-all duration-500 ${
                    step > s.num ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-sm">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">

          {/* Step 1: Personal & Professional Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-3">
                <span className="bg-blue-100 text-blue-600 w-7 h-7 rounded-lg flex items-center justify-center mr-2 text-base">👤</span>
                Personal & Professional Information
              </h2>

              {/* Full Name */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name / पूरा नाम <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number / फ़ोन नंबर <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email (Optional) / ईमेल
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Qualification & Specialization Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Qualification */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Qualification / योग्यता <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <select
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
                    >
                      {qualifications.map(q => (
                        <option key={q.value} value={q.value}>{q.label}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Specialization */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Specialization / विशेषज्ञता <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
                    >
                      {specializations.map(s => (
                        <option key={s.value} value={s.value}>
                          {s.label} - {s.labelHindi}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Experience & Consultation Fee Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Experience */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Years of Experience / अनुभव (वर्ष) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      name="experience_years"
                      value={formData.experience_years}
                      onChange={handleChange}
                      placeholder="5"
                      min="0"
                      max="50"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Consultation Fee */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Consultation Fee (₹) / परामर्श शुल्क
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      name="consultation_fee"
                      value={formData.consultation_fee}
                      onChange={handleChange}
                      placeholder="500"
                      min="0"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Services - Compact Grid */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Services Offered / प्रदान की जाने वाली सेवाएं
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {serviceOptions.map(service => (
                    <label
                      key={service.value}
                      className={`flex items-center p-2 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.services.includes(service.value)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service.value)}
                        onChange={() => handleServiceChange(service.value)}
                        className="w-4 h-4 text-blue-500 rounded"
                      />
                      <span className="ml-2 text-xs font-medium text-gray-700">{service.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Emergency Available - Compact */}
              <div className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <input
                  type="checkbox"
                  id="emergency_available"
                  name="emergency_available"
                  checked={formData.emergency_available}
                  onChange={handleChange}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                />
                <label htmlFor="emergency_available" className="ml-3 flex-1 cursor-pointer">
                  <p className="text-sm font-semibold text-gray-800">
                    24/7 Emergency Available
                  </p>
                  <p className="text-xs text-gray-600">आपातकालीन कॉल के लिए उपलब्ध</p>
                </label>
              </div>

              {/* Profile Photo - Compact */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                    {files.profile_photo ? (
                      <img
                        src={URL.createObjectURL(files.profile_photo)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  {files.profile_photo && (
                    <button
                      type="button"
                      onClick={() => handleFileChange('profile_photo', null)}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('profile_photo', e.target.files[0])}
                      className="sr-only"
                    />
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {files.profile_photo ? 'Change' : 'Upload'} Photo
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Optional • Max 5MB</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Documents & License */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-3">
                <span className="bg-blue-100 text-blue-600 w-7 h-7 rounded-lg flex items-center justify-center mr-2 text-base">📄</span>
                License & Documents
              </h2>

              {/* License Number */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Veterinary License Number / लाइसेंस नंबर <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                    placeholder="e.g., MH/VET/2020/12345"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <p className="text-gray-500 text-xs mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Clinic Name (Optional) / क्लिनिक का नाम
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="clinic_name"
                    value={formData.clinic_name}
                    onChange={handleChange}
                    placeholder="e.g., Krishna Veterinary Clinic"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-3">
                <span className="bg-blue-100 text-blue-600 w-7 h-7 rounded-lg flex items-center justify-center mr-2 text-base">📍</span>
                Location Details
              </h2>

              {/* Get Current Location Button */}
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {locationLoading ? (
                  <>
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Getting Location...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Get Current Location / वर्तमान स्थान प्राप्त करें</span>
                  </>
                )}
              </button>

              {formData.latitude && formData.longitude && (
                <div className="bg-green-50 border border-green-500 rounded-lg p-3">
                  <p className="text-green-800 font-semibold text-sm flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Location Captured: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                  </p>
                </div>
              )}

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-500">or enter manually</span>
                </div>
              </div>

              {/* City, State, Pincode Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* City */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City / शहर <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g., Pune"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* State */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State / राज्य <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g., Maharashtra"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Pincode */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pincode / पिनकोड <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Clinic Address */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Address / पूरा पता
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <textarea
                    name="clinic_address"
                    value={formData.clinic_address}
                    onChange={handleChange}
                    placeholder="Enter your clinic or practice address"
                    rows="3"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  />
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
          <div className="flex justify-between mt-6 pt-5 border-t border-gray-200">
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submit Registration
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Compact Info Box */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Next Steps:</strong> Documents verified in 24-48 hours → Get notified → Profile goes live → Start connecting with farmers
          </p>
        </div>
      </div>
    </div>
  );
};

export default VeterinarianRegistrationForm;
