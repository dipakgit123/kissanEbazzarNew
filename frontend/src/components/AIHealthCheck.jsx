import React, { useState, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const animalTypes = [
  { id: 'cow', name: 'गाय', nameEn: 'Cow', emoji: '🐄' },
  { id: 'buffalo', name: 'म्हैस', nameEn: 'Buffalo', emoji: '🐃' },
  { id: 'horse', name: 'घोडा', nameEn: 'Horse', emoji: '🐴' },
  { id: 'goat', name: 'शेळी', nameEn: 'Goat', emoji: '🐐' },
  { id: 'sheep', name: 'मेंढी', nameEn: 'Sheep', emoji: '🐑' },
  { id: 'dog', name: 'कुत्रा', nameEn: 'Dog', emoji: '🐕' },
  { id: 'cat', name: 'मांजर', nameEn: 'Cat', emoji: '🐈' },
];

const AIHealthCheck = () => {
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('कृपया एक प्रतिमा फाइल निवडा');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('फाइल आकार 10MB पेक्षा कमी असावा');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const analyzeHealth = async () => {
    if (!selectedAnimal || !selectedFile) {
      setError('कृपया प्राणी प्रकार निवडा आणि प्रतिमा अपलोड करा');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('animalType', selectedAnimal);
      formData.append('symptoms', symptoms);
      formData.append('age', age);
      formData.append('additionalInfo', additionalInfo);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/health-check/upload-and-analyze`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || 'विश्लेषण अयशस्वी. कृपया पुन्हा प्रयत्न करा.');
      }
    } catch (err) {
      setError('प्रतिमा विश्लेषण अयशस्वी. कृपया तुमचे कनेक्शन तपासा.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedAnimal(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setSymptoms('');
    setAge('');
    setAdditionalInfo('');
    setResult(null);
    setError(null);
  };

  const getHealthScoreColor = (score) => {
    if (score >= 7) return 'from-emerald-500 to-green-600';
    if (score >= 4) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getHealthScoreBg = (score) => {
    if (score >= 7) return 'bg-emerald-50 border-emerald-200';
    if (score >= 4) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const getUrgencyStyle = (urgency) => {
    if (!urgency) return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    const lower = urgency.toLowerCase();
    if (lower.includes('आणीबाणी') || lower.includes('emergency')) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    if (lower.includes('लवकर') || lower.includes('consult')) return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    if (lower.includes('निरीक्षण') || lower.includes('monitor')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#15BB73] to-[#0D9B5C] rounded-2xl mb-4 shadow-lg shadow-green-200">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">AI प्राणी आरोग्य तपासणी</h1>
          <p className="text-gray-500">फोटो अपलोड करा आणि AI-आधारित आरोग्य विश्लेषण मिळवा</p>
        </div>

        {!result ? (
          /* Input Form */
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 md:p-8">

            {/* Step 1: Animal Selection */}
            <div className="mb-8">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-4">
                <span className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-[#15BB73] to-[#0D9B5C] text-white rounded-full text-xs font-bold mr-3 shadow-sm">1</span>
                प्राणी निवडा
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                {animalTypes.map((animal) => (
                  <button
                    key={animal.id}
                    onClick={() => setSelectedAnimal(animal.id)}
                    className={`flex flex-col items-center p-3 md:p-4 rounded-2xl border-2 transition-all duration-200 ${
                      selectedAnimal === animal.id
                        ? 'border-[#15BB73] bg-gradient-to-b from-green-50 to-emerald-50 shadow-lg shadow-green-100 scale-105'
                        : 'border-gray-100 hover:border-green-200 hover:bg-green-50/50 hover:shadow-md'
                    }`}
                  >
                    <span className="text-3xl md:text-4xl mb-1">{animal.emoji}</span>
                    <span className="text-xs font-semibold text-gray-700">{animal.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Image Upload */}
            <div className="mb-8">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-4">
                <span className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-[#15BB73] to-[#0D9B5C] text-white rounded-full text-xs font-bold mr-3 shadow-sm">2</span>
                फोटो अपलोड करा
              </label>

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-[#15BB73] hover:bg-gradient-to-b hover:from-green-50/50 hover:to-transparent transition-all duration-300 group"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                    <svg className="w-8 h-8 text-gray-400 group-hover:text-[#15BB73] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-semibold mb-1">क्लिक करा किंवा ड्रॅग करा</p>
                  <p className="text-gray-400 text-sm">JPG, PNG, WebP (Max 10MB)</p>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img src={previewUrl} alt="Preview" className="max-h-52 rounded-2xl shadow-lg" />
                  <button
                    onClick={removeImage}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 hover:scale-110 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>

            {/* Step 3: Additional Info */}
            <div className="mb-8">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-4">
                <span className="flex items-center justify-center w-7 h-7 bg-gray-300 text-white rounded-full text-xs font-bold mr-3">3</span>
                अतिरिक्त माहिती (ऐच्छिक)
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="वय (उदा: 2 वर्षे)"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent focus:bg-white transition-all text-sm"
                />
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="लक्षणे (उदा: खात नाही, ताप)"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent focus:bg-white transition-all text-sm"
                />
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="इतर माहिती..."
                  rows={2}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent focus:bg-white transition-all text-sm sm:col-span-2 resize-none"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center">
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={analyzeHealth}
              disabled={!selectedAnimal || !selectedFile || loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center ${
                !selectedAnimal || !selectedFile || loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#15BB73] to-[#0D9B5C] text-white hover:shadow-xl hover:shadow-green-200 hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  विश्लेषण करत आहे...
                </span>
              ) : (
                'आरोग्य तपासणी करा'
              )}
            </button>

            {/* Disclaimer */}
            <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
              ⚠️ हे AI-आधारित विश्लेषण केवळ माहितीसाठी आहे. योग्य उपचारांसाठी पशुवैद्यकाचा सल्ला घ्या.
            </p>
          </div>
        ) : (
          /* Results Section - Redesigned */
          <div className="space-y-6">

            {/* Summary Header Card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden">
              {/* Top colored bar */}
              <div className={`h-2 bg-gradient-to-r ${getHealthScoreColor(result.healthScore || 5)}`}></div>

              <div className="p-6 md:p-8">
                {/* Three column summary */}
                <div className="grid grid-cols-3 gap-4 md:gap-8">
                  {/* Health Score */}
                  <div className="text-center">
                    <p className="text-xs md:text-sm text-gray-500 font-medium mb-3">आरोग्य स्कोअर</p>
                    <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full bg-gradient-to-br ${getHealthScoreColor(result.healthScore || 5)} flex items-center justify-center shadow-lg`}>
                      <span className="text-3xl md:text-4xl font-bold text-white">{result.healthScore || '?'}</span>
                    </div>
                    <p className="mt-3 font-bold text-gray-800">{result.overallHealth || '-'}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${getUrgencyStyle(result.urgencyLevel).bg} ${getUrgencyStyle(result.urgencyLevel).text} ${getUrgencyStyle(result.urgencyLevel).border}`}>
                      {result.urgencyLevel || 'सामान्य'}
                    </span>
                  </div>

                  {/* Body Condition */}
                  <div className="text-center border-x border-gray-100 px-2">
                    <p className="text-xs md:text-sm text-gray-500 font-medium mb-3">शरीर स्थिती</p>
                    <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full flex items-center justify-center ${
                      Number(result.bodyConditionScore) <= 2 || Number(result.bodyConditionScore) >= 4
                        ? 'bg-amber-50 border-2 border-amber-200'
                        : 'bg-emerald-50 border-2 border-emerald-200'
                    }`}>
                      <span className="text-4xl md:text-5xl">
                        {Number(result.bodyConditionScore) <= 2 || Number(result.bodyConditionScore) >= 4 ? '⚠️' : '✅'}
                      </span>
                    </div>
                    <p className="mt-3 font-bold text-gray-800">
                      {Number(result.bodyConditionScore) <= 2 ? 'कमी वजन' : Number(result.bodyConditionScore) >= 4 ? 'जास्त वजन' : 'सामान्य'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{result.bodyConditionScore || '3'} (मध्यम)/5</p>
                  </div>

                  {/* Animal Type */}
                  <div className="text-center">
                    <p className="text-xs md:text-sm text-gray-500 font-medium mb-3">प्राणी</p>
                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-100 flex items-center justify-center">
                      <span className="text-4xl md:text-5xl">
                        {animalTypes.find(a => a.id === selectedAnimal)?.emoji || '🐾'}
                      </span>
                    </div>
                    <p className="mt-3 font-bold text-gray-800">{result.animalType || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Age & Breeding Info */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Age Estimation */}
              {result.estimatedAge && (
                <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  <div className="p-6">
                    <div className="flex items-center mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mr-3">
                        <span className="text-xl">📅</span>
                      </div>
                      <h3 className="font-bold text-gray-800">अंदाजे वय</h3>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 mb-4 text-center">
                      <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {result.estimatedAge.years || '0'} वर्षे {result.estimatedAge.months || '0'} महिने
                      </p>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{result.estimatedAge.ageDescription}</p>

                    {result.estimatedAge.ageIndicators?.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">वय ओळखण्याचे निकष:</p>
                        <ul className="space-y-2">
                          {result.estimatedAge.ageIndicators.map((ind, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 mr-2 flex-shrink-0"></span>
                              {ind}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Breeding Readiness */}
              {result.breedingReadiness && (
                <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden">
                  <div className={`h-1.5 bg-gradient-to-r ${result.breedingReadiness.isReadyForMating ? 'from-emerald-500 to-green-500' : 'from-amber-500 to-orange-500'}`}></div>
                  <div className="p-6">
                    <div className="flex items-center mb-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${result.breedingReadiness.isReadyForMating ? 'bg-gradient-to-br from-emerald-100 to-green-100' : 'bg-gradient-to-br from-amber-100 to-orange-100'}`}>
                        <span className="text-xl">🐄</span>
                      </div>
                      <h3 className="font-bold text-gray-800">गाभण/प्रजनन तयारी</h3>
                    </div>

                    <div className={`rounded-2xl p-5 mb-4 ${result.breedingReadiness.isReadyForMating ? 'bg-gradient-to-br from-emerald-50 to-green-50' : 'bg-gradient-to-br from-amber-50 to-orange-50'}`}>
                      <div className="flex items-center">
                        <span className="text-4xl mr-4">
                          {result.breedingReadiness.isReadyForMating ? '✅' : '⏳'}
                        </span>
                        <div>
                          <p className="font-bold text-gray-800 text-lg">{result.breedingReadiness.matingReadinessStatus}</p>
                          <p className={`text-sm font-semibold ${result.breedingReadiness.isReadyForMating ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {result.breedingReadiness.daysUntilMatingReady}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm text-gray-500">योग्य गाभण वय</span>
                      <span className="font-semibold text-gray-800">{result.breedingReadiness.optimalMatingAge}</span>
                    </div>

                    <div className="mt-4 bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 leading-relaxed">{result.breedingReadiness.matingAdvice}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pregnancy Info */}
            {result.pregnancyInfo && (
              <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden">
                <div className={`h-1.5 bg-gradient-to-r ${result.pregnancyInfo.canGetPregnant ? 'from-pink-500 to-rose-500' : 'from-gray-400 to-gray-500'}`}></div>
                <div className="p-6">
                  <div className="flex items-center mb-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${result.pregnancyInfo.canGetPregnant ? 'bg-gradient-to-br from-pink-100 to-rose-100' : 'bg-gray-100'}`}>
                      <span className="text-xl">🤰</span>
                    </div>
                    <h3 className="font-bold text-gray-800">गर्भधारणा माहिती</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className={`rounded-2xl p-5 mb-4 ${result.pregnancyInfo.canGetPregnant ? 'bg-gradient-to-br from-pink-50 to-rose-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center">
                          <span className="text-4xl mr-4">
                            {result.pregnancyInfo.canGetPregnant ? '✅' : '⏳'}
                          </span>
                          <div>
                            <p className="font-bold text-gray-800">{result.pregnancyInfo.pregnancyReadinessStatus}</p>
                            <p className={`text-sm font-semibold ${result.pregnancyInfo.canGetPregnant ? 'text-pink-600' : 'text-gray-500'}`}>
                              {result.pregnancyInfo.daysUntilPregnancyReady}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                        <span className="text-sm text-gray-500">गर्भधारणा कालावधी</span>
                        <span className="font-semibold text-gray-800">{result.pregnancyInfo.gestationPeriod}</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">सल्ला:</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{result.pregnancyInfo.pregnancyAdvice}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Health Observations */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Visible Signs */}
              {result.visibleSigns?.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                  <div className="p-6">
                    <div className="flex items-center mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mr-3">
                        <span className="text-xl">👁️</span>
                      </div>
                      <h3 className="font-bold text-gray-800">दिसणारी चिन्हे</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.visibleSigns.map((sign, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700 leading-relaxed">{sign}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Healthy Indicators */}
              {result.healthyIndicators?.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  <div className="p-6">
                    <div className="flex items-center mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mr-3">
                        <span className="text-xl">💪</span>
                      </div>
                      <h3 className="font-bold text-gray-800">चांगली चिन्हे</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.healthyIndicators.map((ind, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-700 leading-relaxed">{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Potential Issues */}
            {result.potentialIssues?.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                <div className="p-6">
                  <div className="flex items-center mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mr-3">
                      <span className="text-xl">⚠️</span>
                    </div>
                    <h3 className="font-bold text-gray-800">संभाव्य समस्या</h3>
                  </div>
                  <div className="space-y-4">
                    {result.potentialIssues.map((issue, i) => {
                      const isHigh = issue.likelihood === 'उच्च' || issue.likelihood === 'High';
                      const isLow = issue.likelihood === 'कमी' || issue.likelihood === 'Low';
                      return (
                        <div key={i} className={`rounded-2xl p-4 border-l-4 ${
                          isHigh ? 'bg-red-50 border-red-500' :
                          isLow ? 'bg-emerald-50 border-emerald-500' :
                          'bg-amber-50 border-amber-500'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-gray-800">{issue.condition}</h5>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              isHigh ? 'bg-red-100 text-red-700' :
                              isLow ? 'bg-emerald-100 text-emerald-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {issue.likelihood}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{issue.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations & Diet */}
            <div className="grid md:grid-cols-2 gap-6">
              {result.recommendations?.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-500"></div>
                  <div className="p-6">
                    <div className="flex items-center mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mr-3">
                        <span className="text-xl">💡</span>
                      </div>
                      <h3 className="font-bold text-gray-800">शिफारसी</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-700 leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {result.dietarySuggestions?.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-amber-500 to-yellow-500"></div>
                  <div className="p-6">
                    <div className="flex items-center mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center mr-3">
                        <span className="text-xl">🍽️</span>
                      </div>
                      <h3 className="font-bold text-gray-800">आहार सल्ला</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.dietarySuggestions.map((diet, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700 leading-relaxed">{diet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* When to See Vet */}
            {result.whenToSeeVet && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-3xl p-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-2xl">🏥</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-red-800 text-lg mb-2">पशुवैद्यकाला कधी भेटावे</h4>
                    <p className="text-red-700 leading-relaxed">{result.whenToSeeVet}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            {result.disclaimer && (
              <div className="bg-gray-100 rounded-2xl p-4 text-center">
                <p className="text-sm text-gray-500 leading-relaxed">
                  ⚠️ {result.disclaimer}
                </p>
              </div>
            )}

            {/* Try Again Button */}
            <div className="text-center pt-4">
              <button
                onClick={resetForm}
                className="inline-flex items-center px-8 py-4 bg-white border-2 border-[#15BB73] text-[#15BB73] rounded-2xl font-bold text-lg hover:bg-[#15BB73] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-green-100"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                नवीन तपासणी करा
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-[#15BB73] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="mt-6 text-xl font-bold text-gray-800">विश्लेषण करत आहे...</h3>
          <p className="mt-2 text-gray-500">AI तुमच्या प्राण्याची तपासणी करत आहे</p>
        </div>
      )}
    </div>
  );
};

export default AIHealthCheck;
