import React, { useState, useRef } from 'react';
import { userService } from '../services/api';

const EditProfileForm = ({ onCancel, onSave, initialData = {}, loading = false, onPhotoUpdate }) => {
  const [form, setForm] = useState({
    name: initialData.name || initialData.full_name || '',
    phone: initialData.phone || initialData.phone_number || '',
    address: initialData.address || '',
    pincode: initialData.pincode || initialData.postal_code || '',
  });

  const [profilePhoto, setProfilePhoto] = useState(initialData.profile_photo || null);
  const [photoPreview, setPhotoPreview] = useState(initialData.profile_photo || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingPhoto(true);
    try {
      const response = await userService.uploadProfilePhoto(file);
      if (response.success) {
        setProfilePhoto(response.profile_photo);
        setPhotoPreview(response.profile_photo);
        if (onPhotoUpdate) {
          onPhotoUpdate(response.profile_photo);
        }
      } else {
        alert(response.message || 'Failed to upload photo');
        setPhotoPreview(profilePhoto); // Revert preview
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert(error.message || 'Failed to upload photo');
      setPhotoPreview(profilePhoto); // Revert preview
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!profilePhoto) return;

    setUploadingPhoto(true);
    try {
      const response = await userService.deleteProfilePhoto();
      if (response.success) {
        setProfilePhoto(null);
        setPhotoPreview(null);
        if (onPhotoUpdate) {
          onPhotoUpdate(null);
        }
      } else {
        alert(response.message || 'Failed to remove photo');
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      alert(error.message || 'Failed to remove photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name || form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!form.address || form.address.trim().length < 5) {
      newErrors.address = 'Please enter a valid address';
    }

    if (!form.pincode || !/^\d{6}$/.test(form.pincode.trim())) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm() && onSave) {
      onSave({
        full_name: form.name.trim(),
        address: form.address.trim(),
        postal_code: form.pincode.trim(),
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#15BB73] to-[#0FA568] px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Profile Photo Section */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative group">
            {/* Photo Display */}
            <div
              onClick={!uploadingPhoto ? handlePhotoClick : undefined}
              className={`h-24 w-24 rounded-full overflow-hidden flex items-center justify-center shadow-lg cursor-pointer transition-all ${
                uploadingPhoto ? 'opacity-50' : 'hover:opacity-90'
              } ${photoPreview ? 'bg-gray-200' : 'bg-gradient-to-br from-[#15BB73] to-[#0FA568]'}`}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {form.name ? form.name[0].toUpperCase() : '?'}
                </span>
              )}

              {/* Upload overlay */}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}

              {/* Camera icon overlay on hover */}
              {!uploadingPhoto && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Photo actions */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handlePhotoClick}
              disabled={uploadingPhoto}
              className="text-sm text-[#15BB73] hover:text-[#0FA568] font-medium disabled:opacity-50"
            >
              {photoPreview ? 'Change Photo' : 'Add Photo'}
            </button>
            {photoPreview && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  className="text-sm text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all ${
              errors.name ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder="Enter your full name"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Phone Field (readonly) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            value={form.phone}
            readOnly
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-gray-400 text-xs mt-1">Phone number cannot be changed</p>
        </div>

        {/* Address Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={2}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all resize-none ${
              errors.address ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder="Enter your complete address"
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        {/* Pincode Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Pincode <span className="text-red-500">*</span>
          </label>
          <input
            name="pincode"
            value={form.pincode}
            onChange={handleChange}
            maxLength={6}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all ${
              errors.pincode ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder="Enter 6-digit pincode"
          />
          {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading || uploadingPhoto}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploadingPhoto}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#15BB73] to-[#0FA568] font-semibold text-white hover:from-[#0FA568] hover:to-[#15BB73] transition-all shadow-lg shadow-[#15BB73]/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileForm;
