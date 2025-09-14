import React, { useState } from 'react';

const EditProfileForm = ({ onCancel, onSave, initialData = {} }) => {
  const [form, setForm] = useState({
    name: '',
    language: 'English',
    address: '',
    whatsapp: '',
    phone: initialData.phone || '',
    birthday: '',
    animals: '',
    work: '',
    experience: '',
    reason: '',
    education: '',
    ...initialData,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) onSave(form);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#000600] mb-4">
            Edit Your Profile
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete your profile to help other farmers connect with you and build trust in the marketplace.
          </p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl space-y-8 border border-white/20"
        >
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center">
            {/* Profile Photo */}
            <div className="relative group">
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-[#15BB73] to-[#0FA568] flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-2xl transform group-hover:scale-105 transition-all duration-300">
                {form.name ? form.name[0].toUpperCase() : '?'}
              </div>
              <button 
                type="button" 
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold text-[#15BB73] border-2 border-[#15BB73] hover:bg-[#15BB73] hover:text-white transition-all duration-300 transform hover:scale-105"
              >
                Add Photo
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md mt-6">
              <p className="text-sm mb-3 flex items-center justify-center gap-2 text-gray-600">
                <span className="font-semibold">Complete your profile and earn 10</span>
                <span role="img" aria-label="coin" className="text-lg">🪙</span>
              </p>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 bg-gradient-to-r from-[#15BB73] to-[#0FA568] rounded-full transition-all duration-500" 
                  style={{ width: '33%' }} 
                />
              </div>
            </div>
          </div>

          {/* Form Fields - Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-lg font-semibold text-[#000600] mb-3">Your name</label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 bg-white/50 backdrop-blur-sm"
                placeholder="Enter your full name"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-lg font-semibold text-[#000600] mb-3">Selected language</label>
              <select 
                name="language" 
                value={form.language} 
                onChange={handleChange} 
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#15BB73]/20 focus:border-[#15BB73] bg-white transition-all duration-300"
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Marathi</option>
              </select>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-lg font-semibold text-[#000600] mb-3">Your address</label>
              <input 
                name="address" 
                value={form.address} 
                onChange={handleChange} 
                placeholder="Enter your complete address" 
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-lg font-semibold text-[#000600] mb-3">WhatsApp number</label>
              <input 
                name="whatsapp" 
                value={form.whatsapp} 
                onChange={handleChange} 
                placeholder="Enter WhatsApp number" 
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>

            {/* Phone (readonly) */}
            <div>
              <label className="block text-lg font-semibold text-[#000600] mb-3">Phone/mobile</label>
              <input 
                value={form.phone} 
                readOnly 
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-600"
              />
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-lg font-semibold text-[#000600] mb-3">Birthday</label>
              <input 
                type="date" 
                name="birthday" 
                value={form.birthday} 
                onChange={handleChange} 
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>

            {/* Number of animals */}
            <div>
              <label className="block text-lg font-semibold text-[#000600] mb-3">Number of animals</label>
              <input 
                name="animals" 
                value={form.animals} 
                onChange={handleChange} 
                placeholder="Enter number of animals"
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>

            {/* Work */}
            <div>
              <label className="block text-lg font-semibold text-[#000600] mb-3">Work</label>
              <select 
                name="work" 
                value={form.work} 
                onChange={handleChange} 
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#15BB73]/20 focus:border-[#15BB73] bg-white transition-all duration-300"
              >
                <option value="">Select your profession</option>
                <option>Farmer</option>
                <option>Trader</option>
                <option>Other</option>
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-lg font-semibold text-[#000600] mb-3">Years of animal husbandry</label>
              <select 
                name="experience" 
                value={form.experience} 
                onChange={handleChange} 
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#15BB73]/20 focus:border-[#15BB73] bg-white transition-all duration-300"
              >
                <option value="">Select experience</option>
                <option>0-1</option>
                <option>1-3</option>
                <option>3-5</option>
                <option>5+</option>
              </select>
            </div>

            {/* Reason for using app */}
            <div>
              <label className="block text-lg font-semibold text-[#000600] mb-3">Why use Kissan E-Bazzar app?</label>
              <select 
                name="reason" 
                value={form.reason} 
                onChange={handleChange} 
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#15BB73]/20 focus:border-[#15BB73] bg-white transition-all duration-300"
              >
                <option value="">Select your purpose</option>
                <option>Buy animals</option>
                <option>Sell animals</option>
                <option>Community</option>
              </select>
            </div>

            {/* Education */}
            <div>
              <label className="block text-lg font-semibold text-[#000600] mb-3">Education level</label>
              <select 
                name="education" 
                value={form.education} 
                onChange={handleChange} 
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#15BB73]/20 focus:border-[#15BB73] bg-white transition-all duration-300"
              >
                <option value="">Select education level</option>
                <option>Primary</option>
                <option>Secondary</option>
                <option>Tertiary</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onCancel} 
              className="px-8 py-4 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-105"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#15BB73] to-[#0FA568] font-semibold text-white hover:from-[#0FA568] hover:to-[#15BB73] transition-all duration-300 shadow-lg shadow-[#15BB73]/30 transform hover:scale-105 hover:shadow-xl hover:shadow-[#15BB73]/40"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileForm;