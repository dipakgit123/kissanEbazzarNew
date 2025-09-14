import { useState } from 'react';
import farmerImage from '../assets/images/6101100.jpg';

// Icons (using simple SVG icons)
const UserIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PinIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
  </svg>
);

const LoginForm = ({ onSubmit }) => {
  // State for form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    state: '',
    district: '',
    taluka: '',
    village: '',
    pincode: ''
  });

  // State for validation errors
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    state: '',
    district: '',
    taluka: '',
    village: '',
    pincode: ''
  });

  // Validation patterns
  const patterns = {
    name: /^[A-Za-z\s]{2,50}$/,
    pincode: /^[0-9]{6}$/,
    location: /^[A-Za-z\s]{2,50}$/
  };

  // Validation messages
  const validationMessages = {
    firstName: 'First name should contain only letters and be 2-50 characters long',
    lastName: 'Last name should contain only letters and be 2-50 characters long',
    state: 'State name should contain only letters and be 2-50 characters long',
    district: 'District name should contain only letters and be 2-50 characters long',
    taluka: 'Taluka name should contain only letters and be 2-50 characters long',
    village: 'Village name should contain only letters and be 2-50 characters long',
    pincode: 'Pincode should be a 6-digit number'
  };

  // Validate a single field
  const validateField = (name, value) => {
    let isValid = true;
    let errorMessage = '';

    switch (name) {
      case 'firstName':
      case 'lastName':
      case 'state':
      case 'district':
      case 'taluka':
      case 'village':
        // Only letters and spaces allowed for text fields
        isValid = patterns.name.test(value);
        errorMessage = isValid ? '' : validationMessages[name];
        break;
      case 'pincode':
        // Only 6-digit numbers allowed for pincode
        isValid = patterns.pincode.test(value);
        errorMessage = isValid ? '' : validationMessages[name];
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));

    return isValid;
  };

  // Handle input change with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    // Validate on change
    validateField(name, value);
  };

  // Validate all fields before submission
  const validateForm = () => {
    let isValid = true;
    
    // Validate each field
    Object.keys(formData).forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });
    
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    if (validateForm()) {
      console.log('Form submitted:', formData);
      // Pass form data to parent component
      onSubmit(formData);
    } else {
      console.log('Form has errors');
      alert('Please fix the errors in the form before submitting.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] p-4">
      <div className="bg-[#FEFEFE] rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl flex flex-col lg:flex-row backdrop-blur-sm border border-white/20">
        {/* Image Side */}
        <div className="lg:w-2/5 relative overflow-hidden h-80 lg:h-[500px] bg-gradient-to-br from-[#15BB73]/10 to-[#0FA568]/20">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-20 h-20 bg-[#15BB73]/20 rounded-full blur-xl"></div>
            <div className="absolute top-32 right-8 w-16 h-16 bg-[#0FA568]/30 rounded-full blur-lg"></div>
            <div className="absolute bottom-20 left-16 w-12 h-12 bg-[#15BB73]/25 rounded-full blur-md"></div>
          </div>
          
          {/* Main Image */}
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={farmerImage} 
              alt="Farmer" 
              className="w-full h-full object-cover object-center transform scale-105 hover:scale-110 transition-transform duration-700" 
            />
          </div>
          
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000600] via-[#000600]/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#15BB73]/20 via-transparent to-[#0FA568]/20"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#000600]/40"></div>
          
          {/* Decorative Elements */}
          <div className="absolute top-6 left-6 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <div className="absolute top-6 right-6 w-10 h-10 bg-[#15BB73]/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-[#15BB73]/30">
            <svg className="w-5 h-5 text-[#15BB73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          
          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[#15BB73] to-[#0FA568] rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-[#15BB73] bg-clip-text text-transparent">
                  Kissan E-Bazzar
                </h2>
              </div>
              <p className="text-sm text-white/90 font-medium mb-4 leading-relaxed">
                Connecting farmers directly to consumers with modern technology and seamless experience
              </p>
              
              {/* Feature Points */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-xs text-white/80">
                  <div className="w-1.5 h-1.5 bg-[#15BB73] rounded-full"></div>
                  <span>Secure & Reliable Platform</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-white/80">
                  <div className="w-1.5 h-1.5 bg-[#15BB73] rounded-full"></div>
                  <span>Direct Farmer-Consumer Connection</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-white/80">
                  <div className="w-1.5 h-1.5 bg-[#15BB73] rounded-full"></div>
                  <span>Easy Registration Process</span>
                </div>
              </div>
              
              {/* Progress Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-[#15BB73] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <div className="text-xs text-white/60 font-medium">
                  Step 1 of 3
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Side */}
        <div className="p-4 lg:p-6 lg:w-3/5 flex flex-col justify-center">
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-gradient-to-r from-[#15BB73] to-[#0FA568] rounded-md flex items-center justify-center shadow-md">
                <UserIcon />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#000600] mb-1">Welcome</h2>
                <div className="h-0.5 w-10 bg-gradient-to-r from-[#15BB73] to-[#0FA568] rounded-full"></div>
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium">Please enter your details to continue</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Personal Information Section */}
            <div className="bg-gradient-to-r from-[#15BB73]/5 to-[#0FA568]/5 rounded-lg p-3 border border-[#15BB73]/10">
              <div className="flex items-center space-x-2 mb-2">
                <UserIcon />
                <h3 className="text-sm font-bold text-[#000600]">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="group">
                  <label htmlFor="firstName" className="block text-xs font-bold text-[#000600] mb-1 group-focus-within:text-[#15BB73] transition-colors">
                    First Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full pl-8 pr-2 py-2 border-2 ${errors.firstName ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-[#15BB73]/50'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 shadow-sm hover:shadow-md`}
                      required
                      placeholder="Enter your first name"
                    />
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                      <UserIcon />
                    </div>
                  </div>
                  {errors.firstName && <p className="text-red-500 text-xs mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.firstName}
                  </p>}
                </div>
                <div className="group">
                  <label htmlFor="lastName" className="block text-xs font-bold text-[#000600] mb-1 group-focus-within:text-[#15BB73] transition-colors">
                    Last Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full pl-8 pr-2 py-2 border-2 ${errors.lastName ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-[#15BB73]/50'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 shadow-sm hover:shadow-md`}
                      required
                      placeholder="Enter your last name"
                    />
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                      <UserIcon />
                    </div>
                  </div>
                  {errors.lastName && <p className="text-red-500 text-xs mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.lastName}
                  </p>}
                </div>
              </div>
            </div>



            {/* Location Information Section */}
            <div className="bg-gradient-to-r from-[#15BB73]/5 to-[#0FA568]/5 rounded-lg p-3 border border-[#15BB73]/10">
              <div className="flex items-center space-x-2 mb-2">
                <LocationIcon />
                <h3 className="text-sm font-bold text-[#000600]">Location Information</h3>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="group">
                    <label htmlFor="state" className="block text-xs font-bold text-[#000600] mb-1 group-focus-within:text-[#15BB73] transition-colors">
                      State
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-2 py-2 border-2 ${errors.state ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-[#15BB73]/50'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 shadow-sm hover:shadow-md`}
                        required
                        placeholder="Enter your state"
                      />
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                        <LocationIcon />
                      </div>
                    </div>
                    {errors.state && <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.state}
                    </p>}
                  </div>
                  <div className="group">
                    <label htmlFor="district" className="block text-xs font-bold text-[#000600] mb-1 group-focus-within:text-[#15BB73] transition-colors">
                      District
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-2 py-2 border-2 ${errors.district ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-[#15BB73]/50'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 shadow-sm hover:shadow-md`}
                        required
                        placeholder="Enter your district"
                      />
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                        <LocationIcon />
                      </div>
                    </div>
                    {errors.district && <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.district}
                    </p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="group">
                    <label htmlFor="taluka" className="block text-xs font-bold text-[#000600] mb-1 group-focus-within:text-[#15BB73] transition-colors">
                      Taluka
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="taluka"
                        name="taluka"
                        value={formData.taluka}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-2 py-2 border-2 ${errors.taluka ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-[#15BB73]/50'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 shadow-sm hover:shadow-md`}
                        required
                        placeholder="Enter your taluka"
                      />
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                        <LocationIcon />
                      </div>
                    </div>
                    {errors.taluka && <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.taluka}
                    </p>}
                  </div>
                  <div className="group">
                    <label htmlFor="village" className="block text-xs font-bold text-[#000600] mb-1 group-focus-within:text-[#15BB73] transition-colors">
                      Village
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="village"
                        name="village"
                        value={formData.village}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-2 py-2 border-2 ${errors.village ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-[#15BB73]/50'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 shadow-sm hover:shadow-md`}
                        required
                        placeholder="Enter your village"
                      />
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                        <LocationIcon />
                      </div>
                    </div>
                    {errors.village && <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.village}
                    </p>}
                  </div>
                </div>
                
                <div className="group">
                  <label htmlFor="pincode" className="block text-xs font-bold text-[#000600] mb-1 group-focus-within:text-[#15BB73] transition-colors">
                    Pincode
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className={`w-full pl-8 pr-2 py-2 border-2 ${errors.pincode ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-[#15BB73]/50'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 shadow-sm hover:shadow-md`}
                      required
                      placeholder="Enter your 6-digit pincode"
                    />
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                      <PinIcon />
                    </div>
                  </div>
                  {errors.pincode && <p className="text-red-500 text-xs mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.pincode}
                  </p>}
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white py-2.5 px-4 rounded-lg hover:from-[#0FA568] hover:to-[#15BB73] transition-all duration-500 font-bold text-sm relative overflow-hidden group shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="relative z-10 flex items-center justify-center space-x-1.5">
                  <span>Submit Details</span>
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              {/* Progress indicator */}
              <div className="mt-2 flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-[#15BB73] rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
