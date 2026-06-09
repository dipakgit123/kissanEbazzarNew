import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { locationService, userService } from '../services/api';

const getMapEmbedUrl = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return '';
  }

  const delta = 0.01;
  const bbox = [
    (lng - delta).toFixed(6),
    (lat - delta).toFixed(6),
    (lng + delta).toFixed(6),
    (lat + delta).toFixed(6)
  ].join('%2C');

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}`;
};

const EditProfileForm = ({ onCancel, onSave, initialData = {}, loading = false, onPhotoUpdate }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: initialData.name || initialData.full_name || '',
    phone: initialData.phone || initialData.phone_number || '',
    address: initialData.address || '',
    pincode: initialData.pincode || initialData.postal_code || '',
    city: initialData.city || '',
    state: initialData.state || '',
    country: initialData.country || 'India',
    latitude: initialData.latitude || '',
    longitude: initialData.longitude || '',
  });

  const [profilePhoto, setProfilePhoto] = useState(initialData.profile_photo || null);
  const [photoPreview, setPhotoPreview] = useState(initialData.profile_photo || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [lookingUpPincode, setLookingUpPincode] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const lastLookupRef = useRef('');

  useEffect(() => {
    setForm({
      name: initialData.name || initialData.full_name || '',
      phone: initialData.phone || initialData.phone_number || '',
      address: initialData.address || '',
      pincode: initialData.pincode || initialData.postal_code || '',
      city: initialData.city || '',
      state: initialData.state || '',
      country: initialData.country || 'India',
      latitude: initialData.latitude || '',
      longitude: initialData.longitude || '',
    });
    const photo = initialData.profile_photo || null;
    setProfilePhoto(photo);
    setPhotoPreview(photo);
  }, [
    initialData.name,
    initialData.full_name,
    initialData.phone,
    initialData.phone_number,
    initialData.address,
    initialData.pincode,
    initialData.postal_code,
    initialData.city,
    initialData.state,
    initialData.country,
    initialData.latitude,
    initialData.longitude,
    initialData.profile_photo
  ]);

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

  const applyLocationData = (locationData) => {
    setForm((prev) => ({
      ...prev,
      address: locationData.address || prev.address,
      pincode: locationData.pincode || prev.pincode,
      city: locationData.city || prev.city,
      state: locationData.state || prev.state,
      country: locationData.country || prev.country,
      latitude: locationData.latitude || prev.latitude,
      longitude: locationData.longitude || prev.longitude,
    }));
  };

  const reverseGeocodeCoordinates = async (latitude, longitude) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location details');
    }

    const data = await response.json();
    const address = data.address || {};

    return {
      address: data.display_name || '',
      pincode: address.postcode || '',
      city: address.city || address.town || address.village || address.county || '',
      state: address.state || '',
      country: address.country || 'India',
      latitude: String(latitude),
      longitude: String(longitude),
    };
  };

  const searchLocationOnMap = async (query) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search location');
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const result = data[0];
    const address = result.address || {};

    return {
      address: result.display_name || '',
      pincode: address.postcode || '',
      city: address.city || address.town || address.village || address.county || '',
      state: address.state || '',
      country: address.country || 'India',
      latitude: result.lat,
      longitude: result.lon,
    };
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t('location.locationRequired', { defaultValue: 'Geolocation is not supported by your browser' }));
      return;
    }

    setResolvingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const locationData = await reverseGeocodeCoordinates(latitude, longitude);
          applyLocationData(locationData);
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          toast.error(t('profile.locationLookupFailed', { defaultValue: 'Failed to detect your current location' }));
        } finally {
          setResolvingLocation(false);
        }
      },
      () => {
        setResolvingLocation(false);
        toast.error(t('profile.locationLookupFailed', { defaultValue: 'Failed to detect your current location' }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFindOnMap = async () => {
    const normalizedAddress = form.address.trim();
    const normalizedPincode = form.pincode.trim();
    const normalizedCity = form.city.trim();
    const normalizedState = form.state.trim();
    const normalizedCountry = (form.country || 'India').trim();

    const query = [normalizedAddress, normalizedPincode, normalizedCity, normalizedState, normalizedCountry]
      .filter(Boolean)
      .join(', ');

    if (!query) {
      setErrors((prev) => ({
        ...prev,
        address: t('profile.enterLocationToSearch', { defaultValue: 'Enter address or pincode to find the real location' }),
      }));
      return;
    }

    setResolvingLocation(true);

    try {
      if (/^\d{6}$/.test(normalizedPincode)) {
        try {
          const pincodeResponse = await locationService.lookupPincode(normalizedPincode);
          if (pincodeResponse?.success && pincodeResponse?.data) {
            const locationData = pincodeResponse.data;
            if (locationData.latitude != null && locationData.longitude != null) {
              applyLocationData({
                address: locationData.address || normalizedAddress,
                pincode: locationData.postal_code || normalizedPincode,
                city: locationData.city || normalizedCity,
                state: locationData.state || normalizedState,
                country: locationData.country || normalizedCountry,
                latitude: String(locationData.latitude),
                longitude: String(locationData.longitude),
              });
              setErrors((prev) => ({ ...prev, address: '', pincode: '' }));
              return;
            }
          }
        } catch (error) {
          console.warn('Pincode lookup fallback failed during map search:', error);
        }
      }

      const queryCandidates = [
        query,
        [normalizedPincode, normalizedCity, normalizedState, normalizedCountry].filter(Boolean).join(', '),
        [normalizedAddress, normalizedCity, normalizedState, normalizedCountry].filter(Boolean).join(', '),
        [normalizedCity, normalizedState, normalizedCountry].filter(Boolean).join(', '),
        [normalizedPincode, normalizedCountry].filter(Boolean).join(', ')
      ].filter((value, index, array) => value && array.indexOf(value) === index);

      let resolvedLocation = null;
      for (const queryCandidate of queryCandidates) {
        resolvedLocation = await searchLocationOnMap(queryCandidate);
        if (resolvedLocation) {
          break;
        }
      }

      if (!resolvedLocation) {
        throw new Error('Location not found');
      }

      applyLocationData({
        address: resolvedLocation.address || normalizedAddress,
        pincode: resolvedLocation.pincode || normalizedPincode,
        city: resolvedLocation.city || normalizedCity,
        state: resolvedLocation.state || normalizedState,
        country: resolvedLocation.country || normalizedCountry,
        latitude: resolvedLocation.latitude,
        longitude: resolvedLocation.longitude,
      });
      setErrors((prev) => ({ ...prev, address: '', pincode: '' }));
    } catch (error) {
      console.error('Location search error:', error);
      toast.error(t('profile.locationLookupFailed', { defaultValue: 'Failed to find this location on the map' }));
    } finally {
      setResolvingLocation(false);
    }
  };

  useEffect(() => {
    const normalizedPincode = form.pincode.trim();

    if (!/^\d{6}$/.test(normalizedPincode)) {
      return;
    }

    if (lastLookupRef.current === normalizedPincode) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLookingUpPincode(true);
      try {
        const response = await locationService.lookupPincode(normalizedPincode);
        if (response?.success && response?.data) {
          const locationData = response.data;
          applyLocationData({
            address: locationData.address || form.address,
            pincode: locationData.postal_code || normalizedPincode,
            city: locationData.city || form.city,
            state: locationData.state || form.state,
            country: locationData.country || form.country,
            latitude: locationData.latitude != null ? String(locationData.latitude) : form.latitude,
            longitude: locationData.longitude != null ? String(locationData.longitude) : form.longitude,
          });
          setErrors((prev) => ({ ...prev, pincode: '' }));
          lastLookupRef.current = normalizedPincode;
        }
      } catch (error) {
        console.error('Pincode lookup error:', error);
        setErrors((prev) => ({
          ...prev,
          pincode: t('profile.pincodeLookupFailed', { defaultValue: 'Could not fetch location from this pincode' }),
        }));
      } finally {
        setLookingUpPincode(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [form.address, form.city, form.country, form.latitude, form.longitude, form.pincode, form.state, t]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.photoFileType'));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.photoSizeLimit'));
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
        const newPhoto = response.user?.profile_photo || null;
        setProfilePhoto(newPhoto);
        setPhotoPreview(newPhoto);
        if (onPhotoUpdate) {
          onPhotoUpdate(newPhoto);
        }
      } else {
        toast.error(t('profile.photoUploadFailed'));
        setPhotoPreview(profilePhoto); // Revert preview
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(t('profile.photoUploadFailed'));
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
        toast.error(t('profile.photoRemoveFailed'));
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error(t('profile.photoRemoveFailed'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name || form.name.trim().length < 2) {
      newErrors.name = t('profile.validation.nameMin');
    }

    if (!form.address || form.address.trim().length < 5) {
      newErrors.address = t('profile.validation.addressValid');
    }

    if (!form.pincode || !/^\d{6}$/.test(form.pincode.trim())) {
      newErrors.pincode = t('profile.validation.pincodeValid');
    }

    if (form.latitude && Number.isNaN(Number(form.latitude))) {
      newErrors.address = t('profile.validation.invalidCoordinates');
    }

    if (form.longitude && Number.isNaN(Number(form.longitude))) {
      newErrors.address = t('profile.validation.invalidCoordinates');
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
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      });
    }
  };

  const mapEmbedUrl = getMapEmbedUrl(form.latitude, form.longitude);
  const isFetchingAddress = lookingUpPincode || resolvingLocation;
  const fetchingAddressMessage = lookingUpPincode
    ? t('profile.fetchingAddressFromPincode', { defaultValue: 'Your address is being fetched from the pincode...' })
    : t('profile.fetchingAddressFromLocation', { defaultValue: 'Your address is being fetched from your location...' });

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#15BB73] to-[#0FA568] px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{t('profile.editProfile')}</h2>
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
              {photoPreview ? t('profile.changePhoto') || 'Change Photo' : t('profile.addPhoto') || 'Add Photo'}
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
                  {t('profile.removePhoto') || 'Remove'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t('profile.name')} <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all ${
              errors.name ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder={t('profile.namePlaceholder') || 'Enter your full name'}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Phone Field (readonly) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t('profile.phone')}
          </label>
          <input
            value={form.phone}
            readOnly
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-gray-400 text-xs mt-1">{t('profile.phoneCannotChange') || 'Phone number cannot be changed'}</p>
        </div>

        {/* Address Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t('profile.address')} <span className="text-red-500">*</span>
          </label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={2}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all resize-none ${
              errors.address ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder={t('profile.addressPlaceholder') || 'Enter your complete address'}
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        {isFetchingAddress && (
          <div className="rounded-2xl border border-[#15BB73]/20 bg-[#15BB73]/8 px-4 py-3">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 animate-spin text-[#15BB73]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <p className="text-sm font-semibold text-[#0F8F5D]">
                  {t('profile.fetchingAddressTitle', { defaultValue: 'Fetching location details' })}
                </p>
                <p className="text-xs text-[#3A6E57]">
                  {fetchingAddressMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-[#15BB73]/20 bg-[#15BB73]/5 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleFindOnMap}
              disabled={resolvingLocation || uploadingPhoto}
              className="flex-1 rounded-xl border border-[#15BB73]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F8F5D] hover:bg-[#F3FFF9] transition-colors disabled:opacity-50"
            >
              {resolvingLocation ? t('common.loading', { defaultValue: 'Loading...' }) : t('profile.findOnMap', { defaultValue: 'Find real location on map' })}
            </button>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={resolvingLocation || uploadingPhoto}
              className="flex-1 rounded-xl border border-[#15BB73]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F8F5D] hover:bg-[#F3FFF9] transition-colors disabled:opacity-50"
            >
              {t('profile.useCurrentLocation', { defaultValue: 'Use current location' })}
            </button>
          </div>

          {mapEmbedUrl ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <iframe
                title="Selected location map"
                src={mapEmbedUrl}
                className="h-48 w-full border-0"
                loading="lazy"
              />
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              {t('profile.mapHint', { defaultValue: 'Search your address or use current location to verify the real place on the map.' })}
            </p>
          )}
        </div>

        {/* Pincode Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t('profile.pincode')} <span className="text-red-500">*</span>
          </label>
          <input
            name="pincode"
            value={form.pincode}
            onChange={handleChange}
            maxLength={6}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all ${
              errors.pincode ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder={t('profile.pincodePlaceholder') || 'Enter 6-digit pincode'}
          />
          {lookingUpPincode && (
            <p className="text-[#0F8F5D] text-xs mt-1">
              {t('profile.pincodeLookupLoading', { defaultValue: 'Looking up address from pincode...' })}
            </p>
          )}
          {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('profile.city', { defaultValue: 'City' })}
            </label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all"
              placeholder={t('profile.cityPlaceholder') || 'City'}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('profile.state', { defaultValue: 'State' })}
            </label>
            <input
              name="state"
              value={form.state}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all"
              placeholder={t('profile.statePlaceholder') || 'State'}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t('footer.country', { defaultValue: 'Country' })}
          </label>
          <input
            name="country"
            value={form.country}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all"
            placeholder={t('footer.country', { defaultValue: 'Country' })}
          />
        </div>

        {(form.latitude || form.longitude) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Latitude
              </label>
              <input
                value={form.latitude}
                readOnly
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Longitude
              </label>
              <input
                value={form.longitude}
                readOnly
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading || uploadingPhoto}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading || uploadingPhoto || resolvingLocation}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#15BB73] to-[#0FA568] font-semibold text-white hover:from-[#0FA568] hover:to-[#15BB73] transition-all shadow-lg shadow-[#15BB73]/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('profile.saving') || 'Saving...'}
              </>
            ) : t('profile.updateProfile')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileForm;
