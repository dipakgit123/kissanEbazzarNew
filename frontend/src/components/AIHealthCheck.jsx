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

// Reusable Card Component
const ResultCard = ({ title, icon, children, className = '', gradient = '' }) => (
  <div className={`bg-white rounded-2xl shadow-md overflow-hidden ${className}`}>
    {gradient && <div className={`h-1 ${gradient}`}></div>}
    <div className="p-5">
      <h4 className="font-semibold text-gray-800 mb-4 flex items-center text-base">
        <span className="text-xl mr-2">{icon}</span>
        {title}
      </h4>
      {children}
    </div>
  </div>
);

// Info Row Component
const InfoRow = ({ label, value, valueClass = 'text-gray-700' }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
    <span className="text-gray-500 text-sm">{label}</span>
    <span className={`font-medium ${valueClass}`}>{value}</span>
  </div>
);

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
    if (score >= 7) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (score >= 4) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    return 'bg-gradient-to-r from-red-400 to-red-600';
  };

  const getUrgencyStyle = (urgency) => {
    if (!urgency) return { bg: 'bg-gray-100', text: 'text-gray-700' };
    const lower = urgency.toLowerCase();
    if (lower.includes('आणीबाणी') || lower.includes('emergency')) return { bg: 'bg-red-100', text: 'text-red-700' };
    if (lower.includes('लवकर') || lower.includes('consult')) return { bg: 'bg-orange-100', text: 'text-orange-700' };
    if (lower.includes('निरीक्षण') || lower.includes('monitor')) return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-green-100', text: 'text-green-700' };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[#15BB73] to-[#0FA568] rounded-xl mb-3 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">AI प्राणी आरोग्य तपासणी</h1>
          <p className="text-gray-500 text-sm mt-1">फोटो अपलोड करा आणि AI-आधारित आरोग्य विश्लेषण मिळवा</p>
        </div>

        {!result ? (
          /* Input Form */
          <div className="bg-white rounded-2xl shadow-lg p-6">

            {/* Step 1: Animal Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-[#15BB73] text-white rounded-full text-xs mr-2">1</span>
                प्राणी निवडा
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {animalTypes.map((animal) => (
                  <button
                    key={animal.id}
                    onClick={() => setSelectedAnimal(animal.id)}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                      selectedAnimal === animal.id
                        ? 'border-[#15BB73] bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <span className="text-2xl mb-1">{animal.emoji}</span>
                    <span className="text-xs font-medium text-gray-700">{animal.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-[#15BB73] text-white rounded-full text-xs mr-2">2</span>
                फोटो अपलोड करा
              </label>

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#15BB73] hover:bg-green-50 transition-all"
                >
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 font-medium">क्लिक करा किंवा ड्रॅग करा</p>
                  <p className="text-gray-400 text-sm mt-1">JPG, PNG, WebP (Max 10MB)</p>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img src={previewUrl} alt="Preview" className="max-h-48 rounded-xl shadow-md" />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600"
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
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-400 text-white rounded-full text-xs mr-2">3</span>
                अतिरिक्त माहिती (ऐच्छिक)
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="वय (उदा: 2 वर्षे)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent text-sm"
                />
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="लक्षणे (उदा: खात नाही, ताप)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent text-sm"
                />
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="इतर माहिती..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-transparent text-sm sm:col-span-2"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={analyzeHealth}
              disabled={!selectedAnimal || !selectedFile || loading}
              className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center ${
                !selectedAnimal || !selectedFile || loading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white hover:shadow-lg'
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
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
            <p className="mt-4 text-xs text-gray-500 text-center">
              ⚠️ हे AI-आधारित विश्लेषण केवळ माहितीसाठी आहे. योग्य उपचारांसाठी पशुवैद्यकाचा सल्ला घ्या.
            </p>
          </div>
        ) : (
          /* Results Section */
          <div className="space-y-4">

            {/* Top Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              {/* Health Score */}
              <div className="bg-white rounded-2xl shadow-md p-4 text-center">
                <p className="text-xs text-gray-500 mb-2">आरोग्य स्कोअर</p>
                <div className={`w-16 h-16 mx-auto rounded-full ${getHealthScoreColor(result.healthScore || 5)} flex items-center justify-center mb-2`}>
                  <span className="text-2xl font-bold text-white">{result.healthScore || '?'}</span>
                </div>
                <p className="font-semibold text-gray-800 text-sm">{result.overallHealth || '-'}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyStyle(result.urgencyLevel).bg} ${getUrgencyStyle(result.urgencyLevel).text}`}>
                  {result.urgencyLevel || 'सामान्य'}
                </span>
              </div>

              {/* Body Condition */}
              <div className="bg-white rounded-2xl shadow-md p-4 text-center">
                <p className="text-xs text-gray-500 mb-2">शरीर स्थिती</p>
                <div className="text-4xl mb-2">
                  {Number(result.bodyConditionScore) <= 2 ? '⚠️' : Number(result.bodyConditionScore) >= 4 ? '⚠️' : '✅'}
                </div>
                <p className="font-semibold text-gray-800 text-sm">
                  {Number(result.bodyConditionScore) <= 2 ? 'कमी वजन' : Number(result.bodyConditionScore) >= 4 ? 'जास्त वजन' : 'सामान्य'}
                </p>
                <p className="text-xs text-gray-400 mt-1">{result.bodyConditionScore || '3'}/5</p>
              </div>

              {/* Animal Type */}
              <div className="bg-white rounded-2xl shadow-md p-4 text-center">
                <p className="text-xs text-gray-500 mb-2">प्राणी</p>
                <div className="text-4xl mb-2">
                  {animalTypes.find(a => a.id === selectedAnimal)?.emoji || '🐾'}
                </div>
                <p className="font-semibold text-gray-800 text-sm">{result.animalType || '-'}</p>
              </div>
            </div>

            {/* Age & Breeding Info - Side by Side */}
            <div className="grid md:grid-cols-2 gap-4">

              {/* Age Estimation */}
              {result.estimatedAge && (
                <ResultCard title="अंदाजे वय" icon="📅" gradient="bg-gradient-to-r from-purple-400 to-indigo-500">
                  <div className="text-center mb-3">
                    <span className="text-3xl font-bold text-purple-600">
                      {result.estimatedAge.years || '0'} वर्षे {result.estimatedAge.months || '0'} महिने
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{result.estimatedAge.ageDescription}</p>
                  {result.estimatedAge.ageIndicators?.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">वय ओळखण्याचे निकष:</p>
                      <ul className="space-y-1">
                        {result.estimatedAge.ageIndicators.map((ind, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start">
                            <span className="text-purple-400 mr-1">•</span>{ind}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </ResultCard>
              )}

              {/* Breeding Readiness */}
              {result.breedingReadiness && (
                <ResultCard
                  title="गाभण/प्रजनन तयारी"
                  icon="🐄"
                  gradient={result.breedingReadiness.isReadyForMating ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-amber-500'}
                >
                  <div className="flex items-center mb-3">
                    <span className={`text-3xl mr-3 ${result.breedingReadiness.isReadyForMating ? 'text-green-500' : 'text-orange-500'}`}>
                      {result.breedingReadiness.isReadyForMating ? '✅' : '⏳'}
                    </span>
                    <div>
                      <p className="font-bold text-gray-800">{result.breedingReadiness.matingReadinessStatus}</p>
                      <p className="text-sm text-purple-600 font-semibold">{result.breedingReadiness.daysUntilMatingReady}</p>
                    </div>
                  </div>
                  <InfoRow label="योग्य गाभण वय" value={result.breedingReadiness.optimalMatingAge} />
                  <div className="mt-3 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">{result.breedingReadiness.matingAdvice}</p>
                  </div>
                </ResultCard>
              )}
            </div>

            {/* Pregnancy Info */}
            {result.pregnancyInfo && (
              <ResultCard
                title="गर्भधारणा माहिती"
                icon="🤰"
                gradient={result.pregnancyInfo.canGetPregnant ? 'bg-gradient-to-r from-pink-400 to-rose-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center mb-3">
                      <span className={`text-3xl mr-3 ${result.pregnancyInfo.canGetPregnant ? 'text-pink-500' : 'text-gray-400'}`}>
                        {result.pregnancyInfo.canGetPregnant ? '✅' : '⏳'}
                      </span>
                      <div>
                        <p className="font-bold text-gray-800">{result.pregnancyInfo.pregnancyReadinessStatus}</p>
                        <p className="text-sm text-pink-600 font-semibold">{result.pregnancyInfo.daysUntilPregnancyReady}</p>
                      </div>
                    </div>
                    <InfoRow label="गर्भधारणा कालावधी" value={result.pregnancyInfo.gestationPeriod} />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">सल्ला:</p>
                    <p className="text-sm text-gray-600">{result.pregnancyInfo.pregnancyAdvice}</p>
                  </div>
                </div>
              </ResultCard>
            )}

            {/* Health Observations */}
            <div className="grid md:grid-cols-2 gap-4">

              {/* Visible Signs */}
              {result.visibleSigns?.length > 0 && (
                <ResultCard title="दिसणारी चिन्हे" icon="👁️" gradient="bg-gradient-to-r from-blue-400 to-cyan-500">
                  <ul className="space-y-2">
                    {result.visibleSigns.map((sign, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        <span className="text-gray-700">{sign}</span>
                      </li>
                    ))}
                  </ul>
                </ResultCard>
              )}

              {/* Healthy Indicators */}
              {result.healthyIndicators?.length > 0 && (
                <ResultCard title="चांगली चिन्हे" icon="💪" gradient="bg-gradient-to-r from-green-400 to-teal-500">
                  <ul className="space-y-2">
                    {result.healthyIndicators.map((ind, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700">{ind}</span>
                      </li>
                    ))}
                  </ul>
                </ResultCard>
              )}
            </div>

            {/* Potential Issues */}
            {result.potentialIssues?.length > 0 && (
              <ResultCard title="संभाव्य समस्या" icon="⚠️" gradient="bg-gradient-to-r from-orange-400 to-red-500">
                <div className="space-y-3">
                  {result.potentialIssues.map((issue, i) => (
                    <div key={i} className={`p-3 rounded-xl border-l-4 ${
                      issue.likelihood === 'उच्च' || issue.likelihood === 'High' ? 'border-red-500 bg-red-50' :
                      issue.likelihood === 'कमी' || issue.likelihood === 'Low' ? 'border-green-500 bg-green-50' :
                      'border-yellow-500 bg-yellow-50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <h5 className="font-semibold text-gray-800 text-sm">{issue.condition}</h5>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          issue.likelihood === 'उच्च' || issue.likelihood === 'High' ? 'bg-red-200 text-red-800' :
                          issue.likelihood === 'कमी' || issue.likelihood === 'Low' ? 'bg-green-200 text-green-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {issue.likelihood}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{issue.description}</p>
                    </div>
                  ))}
                </div>
              </ResultCard>
            )}

            {/* Recommendations & Diet */}
            <div className="grid md:grid-cols-2 gap-4">
              {result.recommendations?.length > 0 && (
                <ResultCard title="शिफारसी" icon="💡" gradient="bg-gradient-to-r from-green-400 to-emerald-500">
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </ResultCard>
              )}

              {result.dietarySuggestions?.length > 0 && (
                <ResultCard title="आहार सल्ला" icon="🍽️" gradient="bg-gradient-to-r from-yellow-400 to-orange-500">
                  <ul className="space-y-2">
                    {result.dietarySuggestions.map((diet, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <span className="text-orange-500 mr-2">•</span>
                        <span className="text-gray-700">{diet}</span>
                      </li>
                    ))}
                  </ul>
                </ResultCard>
              )}
            </div>

            {/* When to See Vet */}
            {result.whenToSeeVet && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                  <span className="text-xl mr-2">🏥</span>
                  पशुवैद्यकाला कधी भेटावे
                </h4>
                <p className="text-red-700 text-sm">{result.whenToSeeVet}</p>
              </div>
            )}

            {/* Disclaimer */}
            {result.disclaimer && (
              <p className="text-xs text-gray-500 text-center bg-gray-100 rounded-xl p-3">
                ⚠️ {result.disclaimer}
              </p>
            )}

            {/* Try Again Button */}
            <div className="text-center pt-2">
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-white border-2 border-[#15BB73] text-[#15BB73] rounded-xl font-semibold hover:bg-[#15BB73] hover:text-white transition-all"
              >
                नवीन तपासणी करा
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-14 h-14 border-4 border-[#15BB73] border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-lg font-semibold text-[#15BB73] mb-1">विश्लेषण करत आहे...</h3>
          <p className="text-gray-500 text-sm">AI तुमच्या प्राण्याची तपासणी करत आहे</p>
        </div>
      )}
    </div>
  );
};

export default AIHealthCheck;
