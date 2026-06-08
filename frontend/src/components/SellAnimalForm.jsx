import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_API } from '../config/api';
import { localizeApiMessage } from '../utils/localizeApiMessage';

const API_URL = API_BASE_API;

const SellAnimalForm = ({ onCancel, onSubmit }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    animalType: '',
    lactation: '',
    milkToday: '',
    rate: '',
    sellDays: '',
    photos: { side: null, udder: null, video: null },
    addInfoOpen: false,
    milkCapacity: '',
    delivered: '',
    pregnant: '',
    calf: '',
    negotiation: false,
    details: '',
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFile = (field, file) => {
    if (file) {
      setForm(prev => ({ ...prev, photos: { ...prev.photos, [field]: file } }));
    }
  };

  const handleRemovePhoto = (field) => {
    setForm(prev => ({ ...prev, photos: { ...prev.photos, [field]: null } }));
  };

  const getAnimalEndpoint = (animalType) => {
    const endpoints = {
      'Cow': 'animals',
      'Buffalo': 'buffalos',
      'Goat': 'goats',
      'Horse': 'horses',
      'Dog': 'dogs',
      'Cat': 'cats',
      'Bull': 'animals',
      'Other': 'other-animals'
    };
    return endpoints[animalType] || 'animals';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.animalType || !form.lactation || !form.milkToday || !form.rate) {
      toast.error(t('validation.fillRequired') || 'Please fill all required fields');
      return;
    }

    if (!form.photos.side && !form.photos.udder) {
      toast.error(t('validation.required') || 'Please upload at least one photo');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      const endpoint = getAnimalEndpoint(form.animalType);
      
      // Map form fields to backend API fields
      if (endpoint === 'buffalos' || endpoint === 'animals') {
        formData.append('breedName', form.animalType);
        formData.append('age', form.lactation);
        formData.append('milkCapacity', form.milkToday || '0');
        formData.append('pregnancyStatus', form.pregnant === 'Yes' ? 'pregnant' : 'not_pregnant');
        formData.append('hasHorns', 'false');
        formData.append('healthCondition', 'good');
        formData.append('expectedPrice', form.rate);
        formData.append('isNegotiable', form.negotiation ? 'true' : 'false');
        formData.append('vaccinationDetails', form.details || '');
        formData.append('deliveryAvailable', 'false');
        formData.append('additionalNotes', form.details || '');
        
        if (form.photos.side) formData.append('frontPhoto', form.photos.side);
        if (form.photos.udder) formData.append('sidePhoto', form.photos.udder);
        if (form.photos.video) formData.append('video', form.photos.video);
      }

      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/${endpoint}/listings`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setForm({
          animalType: '',
          lactation: '',
          milkToday: '',
          rate: '',
          sellDays: '',
          photos: { side: null, udder: null, video: null },
          addInfoOpen: false,
          milkCapacity: '',
          delivered: '',
          pregnant: '',
          calf: '',
          negotiation: false,
          details: '',
        });
        toast.success(t('sellAnimal.listingSuccess') || 'Listing created successfully!');
        if (onSubmit) {
          onSubmit(response.data.data);
        } else {
          navigate('/buy-animals');
        }
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error(
        localizeApiMessage(
          i18n,
          t,
          error.response?.data?.message || error.message,
          'listing.createError',
          'Failed to create listing. Please try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const TokenBtn = ({ active, children, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-6 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-300 ${
        active 
          ? 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white border-[#15BB73] shadow-lg' 
          : 'text-gray-700 border-gray-200 hover:border-[#15BB73] hover:bg-[#15BB73]/5'
      }`}
    >
      {children}
    </button>
  );

  const SectionHeader = ({ icon, title, required }) => (
    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
      <span className="text-2xl">{icon}</span> 
      {title}
      {required && <span className="text-red-500 text-lg">*</span>}
    </h2>
  );

  const InputWithUnit = ({ label, value, onChange, placeholder, unit, type = "number", required }) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all"
          required={required}
        />
        {unit && (
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
            {unit}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('sellAnimal.title')}
          </h1>
          <p className="text-gray-600">{t('sellAnimal.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Animal Type */}
          <section className="bg-white p-6 shadow-md rounded-xl space-y-4">
            <SectionHeader icon="🐄" title={t('sellAnimal.selectAnimalType')} required />
            <div className="flex flex-wrap gap-3">
              {['Cow', 'Buffalo', 'Goat', 'Horse', 'Dog', 'Cat', 'Other'].map(opt => (
                <TokenBtn
                  key={opt}
                  active={form.animalType === opt}
                  onClick={() => handleChange('animalType', opt)}
                >
                  {opt}
                </TokenBtn>
              ))}
            </div>
          </section>

          {/* Lactation */}
          <section className="bg-white p-6 shadow-md rounded-xl space-y-4">
            <SectionHeader icon="🥛" title={t('sellAnimal.lactation')} required />
            <div className="flex flex-wrap gap-3">
              {['Not Delivered', 'First', 'Second', 'Third', 'Other'].map(opt => (
                <TokenBtn
                  key={opt}
                  active={form.lactation === opt}
                  onClick={() => handleChange('lactation', opt)}
                >
                  {opt}
                </TokenBtn>
              ))}
            </div>
          </section>

          {/* Milk & Rate */}
          <section className="bg-white p-6 shadow-md rounded-xl grid gap-6 md:grid-cols-2">
            <InputWithUnit
              label={t('sellAnimal.milkPerDay')}
              value={form.milkToday}
              onChange={value => handleChange('milkToday', value)}
              placeholder="10"
              unit={t('healthCheck.units.liters') || 'Liters'}
              required
            />
            <InputWithUnit
              label={t('sellAnimal.price')}
              value={form.rate}
              onChange={value => handleChange('rate', value)}
              placeholder="40000"
              unit="₹"
              required
            />
          </section>

          {/* Days to sell */}
          <section className="bg-white p-6 shadow-md rounded-xl space-y-4">
            <SectionHeader icon="📅" title={t('sellAnimal.daysToSell')} />
            <div className="flex flex-wrap gap-3">
              {['1 to 3 days', '4 to 7 days', 'More than a week'].map(opt => (
                <TokenBtn 
                  key={opt} 
                  active={form.sellDays === opt} 
                  onClick={() => handleChange('sellDays', opt)}
                >
                  {opt}
                </TokenBtn>
              ))}
            </div>
          </section>

          {/* Photo upload */}
          <section className="bg-white p-6 shadow-md rounded-xl space-y-4">
            <SectionHeader icon="📷" title={t('sellAnimal.uploadPhotos')} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'side', label: t('sellAnimal.uploadSidePhoto'), required: true },
                { key: 'udder', label: t('sellAnimal.uploadUdderPhoto') }
              ].map(({ key, label, required }) => (
                <label
                  key={key}
                  className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center h-48 cursor-pointer transition-all ${
                    form.photos[key] 
                      ? 'border-[#15BB73] bg-[#15BB73]/5' 
                      : 'border-gray-300 hover:border-[#15BB73] hover:bg-gray-50'
                  }`}
                >
                  {form.photos[key] ? (
                    <>
                      <img 
                        src={URL.createObjectURL(form.photos[key])} 
                        alt={label} 
                        className="h-full w-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemovePhoto(key); }}
                        className="absolute top-2 right-2 bg-white hover:bg-red-50 text-red-600 rounded-full p-2 shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <div className="mx-auto bg-[#15BB73] rounded-full p-3 w-12 h-12 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <span className="block text-sm font-semibold text-gray-700">
                        {label} {required && <span className="text-red-500">*</span>}
                      </span>
                      <span className="text-xs text-gray-500">JPEG, PNG (max 5MB)</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={e => handleFile(key, e.target.files[0])} 
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Video upload */}
          <section className="bg-white p-6 shadow-md rounded-xl space-y-4">
            <SectionHeader icon="🎥" title={t('sellAnimal.uploadVideo')} />
            <label
              className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center h-48 cursor-pointer transition-all ${
                form.photos.video 
                  ? 'border-[#15BB73] bg-[#15BB73]/5' 
                  : 'border-gray-300 hover:border-[#15BB73] hover:bg-gray-50'
              }`}
            >
              {form.photos.video ? (
                <>
                  <video 
                    src={URL.createObjectURL(form.photos.video)} 
                    className="h-full w-full object-contain rounded-lg"
                    controls
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemovePhoto('video'); }}
                    className="absolute top-2 right-2 bg-white hover:bg-red-50 text-red-600 rounded-full p-2 shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="text-center p-4">
                  <div className="mx-auto bg-blue-500 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="block text-sm font-semibold text-gray-700">Select video</span>
                  <span className="text-xs text-gray-500">MP4, MOV (max 25MB)</span>
                </div>
              )}
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                onChange={e => handleFile('video', e.target.files[0])} 
              />
            </label>
          </section>

          {/* Additional Info Toggle */}
          <section className="bg-white p-6 shadow-md rounded-xl">
            <button
              type="button"
              onClick={() => handleChange('addInfoOpen', !form.addInfoOpen)}
              className="w-full flex justify-between items-center text-left font-semibold text-gray-800 hover:text-[#15BB73] transition-all p-3 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <svg 
                  className={`w-5 h-5 transition-transform ${form.addInfoOpen ? 'rotate-90' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <span>{t('sellAnimal.additionalInfo')}</span>
              </div>
              <span className="text-gray-400 text-sm">{form.addInfoOpen ? 'Hide' : 'Show'}</span>
            </button>
        
            {form.addInfoOpen && (
              <div className="mt-4 space-y-6 pt-4 border-t">
                <InputWithUnit
                  label={t('sellAnimal.milkCapacity')}
                  value={form.milkCapacity}
                  onChange={value => handleChange('milkCapacity', value)}
                  placeholder="12"
                  unit="Liters"
                />

                {[
                  { key: 'delivered', label: t('sellAnimal.hasDelivered'), icon: '🐣' },
                  { key: 'pregnant', label: t('sellAnimal.isPregnant'), icon: '🤰' },
                ].map(({ key, label, icon }) => (
                  <div key={key} className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="text-xl">{icon}</span>
                      {label}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {['Yes', 'No'].map(v => (
                        <TokenBtn key={v} active={form[key] === v} onClick={() => handleChange(key, v)}>
                          {v}
                        </TokenBtn>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-xl">🐄</span>
                    {t('sellAnimal.hasCalf')}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'Female Calf', label: t('sellAnimal.femaleCalf') },
                      { value: 'Male Calf', label: t('sellAnimal.maleCalf') },
                      { value: 'No Calf', label: t('sellAnimal.noCalf') }
                    ].map(({ value, label }) => (
                      <TokenBtn key={value} active={form.calf === value} onClick={() => handleChange('calf', value)}>
                        {label}
                      </TokenBtn>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t('sellAnimal.negotiable')}</p>
                    <p className="text-xs text-gray-600">{t('sellAnimal.negotiableDesc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.negotiation}
                      onChange={e => handleChange('negotiation', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#15BB73]" />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{t('sellAnimal.moreDetails')}</label>
                  <textarea
                    rows="3"
                    value={form.details}
                    onChange={e => handleChange('details', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all"
                    placeholder="More details about the animal.."
                  />
                </div>
              </div>
            )}
          </section>

          {/* Submit Button */}
          <div className="flex gap-4 sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 -mx-4 border-t shadow-lg">
            {onCancel && (
              <button 
                type="button" 
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-3 rounded-lg border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
            )}
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#15BB73] to-[#0FA568] font-semibold text-white hover:from-[#0FA568] hover:to-[#15BB73] transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('listing.submitting')}
                </>
              ) : (
                t('sellAnimal.submitListing')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellAnimalForm;
