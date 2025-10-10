import React, { useState } from 'react';

const animalOptions = ['Cow', 'Buffalo'];
const lactationOptions = ['Not Delivered', 'First', 'Second', 'Other'];

const SellAnimalForm = ({ onCancel, onSubmit }) => {
  const [form, setForm] = useState({
    animalType: '',
    lactation: '',
    milkToday: '',
    rate: '',
    sellDays: '',
    sellKind: '',
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

  const handleSubmit = e => {
    e.preventDefault();
    if (onSubmit) onSubmit(form);
  };

  // Reusable styled components
  const TokenBtn = ({ active, children, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-6 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
        active 
          ? 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white border-[#15BB73] shadow-lg shadow-[#15BB73]/30' 
          : 'text-gray-700 border-gray-200 hover:border-[#15BB73] hover:bg-[#15BB73]/5 hover:text-[#15BB73]'
      }`}
    >
      {children}
    </button>
  );

  const SectionHeader = ({ icon, title, required }) => (
    <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-[#000600]">
      <span className="text-3xl" role="img" aria-hidden="true">{icon}</span> 
      {title}
      {required && <span className="text-red-500 ml-2 text-xl">*</span>}
    </h2>
  );

  const InputWithUnit = ({ label, value, onChange, placeholder, unit, type = "number" }) => (
    <div className="space-y-3">
      <label className="block text-lg font-semibold text-[#000600]">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 bg-white/50 backdrop-blur-sm"
        />
        {unit && (
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">
            {unit}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#000600] mb-4">
            Sell Your Animal
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            List your animal for sale and connect with potential buyers. Fill out the details below to create your listing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Which Animal */}
          <section className="bg-white/80 backdrop-blur-sm p-8 shadow-xl rounded-2xl space-y-6 border border-white/20">
            <SectionHeader icon="🐄" title="Which Animal" required />
            <div className="flex flex-wrap gap-3">
              {animalOptions.map(opt => (
                <TokenBtn
                  key={opt}
                  active={form.animalType === opt}
                  onClick={() => handleChange('animalType', opt)}
                >
                  {opt}
                </TokenBtn>
              ))}
              <select
                value={form.animalType.startsWith('Other') ? form.animalType : ''}
                onChange={e => handleChange('animalType', e.target.value)}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium bg-white hover:border-[#15BB73] hover:bg-[#15BB73]/5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#15BB73]/20"
              >
                <option value="">Other</option>
                <option value="Dog">Dog</option>
                <option value="Goat">Goat</option>
                <option value="Bull">Bull</option>
                <option value="Cow">Cow</option>
                <option value="Buffalo">Buffalo</option>
              </select>
            </div>
          </section>

          {/* Lactation */}
          <section className="bg-white/80 backdrop-blur-sm p-8 shadow-xl rounded-2xl space-y-6 border border-white/20">
            <SectionHeader icon="🥛" title="Which Lactation" required />
            <div className="flex flex-wrap gap-3">
              {lactationOptions.map(opt => (
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
          <section className="bg-white/80 backdrop-blur-sm p-8 shadow-xl rounded-2xl grid gap-8 md:grid-cols-2 border border-white/20">
            <InputWithUnit
              label="Current Milk per day"
              value={form.milkToday}
              onChange={value => handleChange('milkToday', value)}
              placeholder="For ex: 10"
              unit="Liters"
              required
            />
            <InputWithUnit
              label="Rate"
              value={form.rate}
              onChange={value => handleChange('rate', value)}
              placeholder="For ex: 40000"
              unit="₹"
              required
            />
          </section>

          {/* Days to sell */}
          <section className="bg-white/80 backdrop-blur-sm p-8 shadow-xl rounded-2xl space-y-6 border border-white/20">
            <SectionHeader icon="📅" title="In how many days do you want to sell?" />
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
      // ... (previous imports and code remain the same until photo upload section)

          {/* Photo upload */}
          <section className="bg-white/80 backdrop-blur-sm p-8 shadow-xl rounded-2xl space-y-6 border border-white/20">
            <SectionHeader icon="📷" title="Upload photo (at least one)" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {['side', 'udder'].map(field => (
                <label
                  key={field}
                  className={`group relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center h-64 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    form.photos[field] 
                      ? 'border-[#15BB73] bg-gradient-to-br from-[#15BB73]/10 to-[#0FA568]/10' 
                      : 'border-gray-300 hover:border-[#15BB73] hover:bg-gradient-to-br hover:from-[#15BB73]/5 hover:to-[#0FA568]/5'
                  }`}
                >
                  {form.photos[field] ? (
                    <>
                      <img 
                        src={URL.createObjectURL(form.photos[field])} 
                        alt={field} 
                        className="h-full w-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemovePhoto(field); }}
                        className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-600 hover:text-red-600 rounded-full p-2 shadow-lg transition-all duration-300 transform hover:scale-110"
                      >
                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute inset-0 bg-black bg-opacity-30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <span className="text-white font-semibold text-lg">Change Photo</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <div className="mx-auto bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <span className="block text-lg font-semibold text-gray-700 mb-2">Select {field} photo</span>
                      <span className="text-sm text-gray-500">JPEG, PNG (max 5MB)</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={e => handleFile(field, e.target.files[0])} 
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Video upload */}
          <section className="bg-white/80 backdrop-blur-sm p-8 shadow-xl rounded-2xl space-y-6 border border-white/20">
            <SectionHeader icon="🎥" title="Upload video (optional)" />
            <label
              className={`group relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center h-64 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                form.photos.video 
                  ? 'border-[#15BB73] bg-gradient-to-br from-[#15BB73]/10 to-[#0FA568]/10' 
                  : 'border-gray-300 hover:border-[#15BB73] hover:bg-gradient-to-br hover:from-[#15BB73]/5 hover:to-[#0FA568]/5'
              }`}
            >
              {form.photos.video ? (
                <>
                  <video 
                    src={URL.createObjectURL(form.photos.video)} 
                    className="h-full w-full object-contain rounded-xl"
                    controls
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemovePhoto('video'); }}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-600 hover:text-red-600 rounded-full p-2 shadow-lg transition-all duration-300 transform hover:scale-110"
                  >
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute inset-0 bg-black bg-opacity-30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="text-white font-semibold text-lg">Change Video</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <div className="mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="block text-lg font-semibold text-gray-700 mb-2">Select video</span>
                  <span className="text-sm text-gray-500">MP4, MOV (max 25MB)</span>
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
          <section className="bg-white/80 backdrop-blur-sm p-8 shadow-xl rounded-2xl border border-white/20">
            <button
              type="button"
              onClick={() => handleChange('addInfoOpen', !form.addInfoOpen)}
              className="w-full flex justify-between items-center text-left font-semibold text-[#000600] hover:text-[#15BB73] transition-all duration-300 p-4 rounded-xl hover:bg-[#15BB73]/5"
            >
              <div className="flex items-center gap-3">
                <svg 
                  className={`w-6 h-6 transition-transform duration-300 ${form.addInfoOpen ? 'rotate-90' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-xl">Add more information</span>
              </div>
              <span className="text-gray-400 font-medium">{form.addInfoOpen ? 'Hide' : 'Show'}</span>
            </button>
        
            {form.addInfoOpen && (
              <div className="mt-6 space-y-8 pt-6 border-t border-gray-200">
                <InputWithUnit
                  label="Milk Capacity per day"
                  value={form.milkCapacity}
                  onChange={value => handleChange('milkCapacity', value)}
                  placeholder="For ex: 12"
                  unit="Liters"
                />

                {/* delivered / pregnant yes-no toggles */}
                {[
                  { key: 'delivered', label: 'Has it delivered?', icon: '🐣' },
                  { key: 'pregnant', label: 'Is it pregnant?', icon: '🤰' },
                ].map(({ key, label, icon }) => (
                  <div key={key} className="space-y-4">
                    <p className="text-lg font-semibold text-[#000600] flex items-center gap-3">
                      <span role="img" aria-hidden="true" className="text-2xl">{icon}</span>
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

                {/* Calf */}
                <div className="space-y-4">
                  <p className="text-lg font-semibold text-[#000600] flex items-center gap-3">
                    <span role="img" aria-hidden="true" className="text-2xl">🐄</span>
                    Does the animal have a calf?
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {['Female Calf', 'Male Calf', 'No Calf'].map(v => (
                      <TokenBtn key={v} active={form.calf === v} onClick={() => handleChange('calf', v)}>
                        {v}
                      </TokenBtn>
                    ))}
                  </div>
                </div>

                {/* Negotiation switch */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#15BB73]/5 to-[#0FA568]/5 rounded-xl border border-[#15BB73]/20">
                  <div>
                    <p className="text-lg font-semibold text-[#000600]">Negotiation on the animal rate</p>
                    <p className="text-sm text-gray-600">Negotiating attracts more buyer calls</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.negotiation}
                      onChange={e => handleChange('negotiation', e.target.checked)}
                    />
                    <div className="w-14 h-7 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#15BB73] peer-checked:to-[#0FA568]" />
                  </label>
                </div>

                {/* More details */}
                <div className="space-y-3">
                  <label className="block text-lg font-semibold text-[#000600]">More Details</label>
                  <textarea
                    rows="4"
                    value={form.details}
                    onChange={e => handleChange('details', e.target.value)}
                    className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="More details about the animal.."
                  />
                </div>
              </div>
            )}
          </section>

          {/* Submit / cancel */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 sticky bottom-0 bg-white/90 backdrop-blur-md p-6 -mx-4 border-t border-gray-200 shadow-lg">
            {onCancel && (
              <button 
                type="button" 
                onClick={onCancel} 
                className="px-8 py-4 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-105"
              >
                Cancel
              </button>
            )}
            <button 
              type="submit" 
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#15BB73] to-[#0FA568] font-semibold text-white hover:from-[#0FA568] hover:to-[#15BB73] transition-all duration-300 shadow-lg shadow-[#15BB73]/30 transform hover:scale-105 hover:shadow-xl hover:shadow-[#15BB73]/40"
            >
              Post Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellAnimalForm;