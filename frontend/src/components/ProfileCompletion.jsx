import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { userService } from '../services/api';

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ProfileCompletion = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    postal_code: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name || formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Please enter your full name (at least 2 characters)';
    }

    if (!formData.postal_code || formData.postal_code.trim().length < 4) {
      newErrors.postal_code = 'Please enter a valid postal code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setIsLoading(true);

    try {
      const response = await userService.completeProfile({
        full_name: formData.full_name.trim(),
        postal_code: formData.postal_code.trim()
      });

      if (response.success) {
        toast.success('Profile completed successfully!');

        // Update user data in localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          full_name: formData.full_name,
          ...response.location
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Call completion callback
        if (onComplete) {
          setTimeout(() => onComplete(response), 1500);
        }
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      toast.error(error.message || 'Failed to complete profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] p-4">
      <Toaster position="top-right" />

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#15BB73]/10 to-[#0FA568]/20 rounded-full mb-4">
            <UserIcon />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Complete Your Profile</h2>
          <p className="text-gray-600 mt-2">
            Help us personalize your experience
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border-2 ${
                  errors.full_name ? 'border-red-400' : 'border-gray-200'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all`}
                placeholder="Enter your full name"
                autoFocus
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            {errors.full_name && (
              <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pincode / Postal Code <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border-2 ${
                  errors.postal_code ? 'border-red-400' : 'border-gray-200'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all`}
                placeholder="Enter your pincode"
                maxLength="10"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            {errors.postal_code && (
              <p className="text-red-500 text-sm mt-1">{errors.postal_code}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              We'll automatically fetch your location details based on your pincode
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-[#15BB73]/10 border border-[#15BB73]/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-[#15BB73] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Why do we need this?</p>
                <p className="text-xs">Your name helps us personalize your experience, and your pincode helps us connect you with nearby farmers and customers in your area.</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? 'Completing Profile...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletion;
