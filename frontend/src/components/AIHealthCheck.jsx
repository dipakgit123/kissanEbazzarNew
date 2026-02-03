import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

const AIHealthCheck = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const animalTypes = [
    { id: 'cow', name: t('animalTypes.cow'), emoji: '🐄' },
    { id: 'buffalo', name: t('animalTypes.buffalo'), emoji: '🐃' },
    { id: 'horse', name: t('animalTypes.horse'), emoji: '🐴' },
    { id: 'goat', name: t('animalTypes.goat'), emoji: '🐐' },
    { id: 'sheep', name: t('animalTypes.sheep'), emoji: '🐑' },
    { id: 'dog', name: t('animalTypes.dog'), emoji: '🐕' },
    { id: 'cat', name: t('animalTypes.cat'), emoji: '🐈' },
    { id: 'other', name: t('animalTypes.other'), emoji: '🐾' },
  ];
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
        setError(t('healthCheck.errorImageFile'));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t('healthCheck.errorFileSize'));
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
      setError(t('healthCheck.errorSelectAnimal'));
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
        setError(data.message || t('healthCheck.errorAnalysisFailed'));
      }
    } catch (err) {
      setError(t('healthCheck.errorConnectionFailed'));
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
    if (lower.includes('आणीबाणी') || lower.includes('emergency') || lower.includes('आपत्कालीन')) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    if (lower.includes('लवकर') || lower.includes('consult') || lower.includes('तातडीचे') || lower.includes('urgent')) return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    if (lower.includes('निरीक्षण') || lower.includes('monitor')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  };

  const getBodyConditionText = (score) => {
    const numScore = Number(score);
    if (numScore <= 2) return t('healthCheck.underweight');
    if (numScore >= 4) return t('healthCheck.overweight');
    return t('healthCheck.normal');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-green-50/30 to-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {!result ? (
          /* Input Form */
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-4 md:p-6 border border-gray-100">

            {/* Progress Steps Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-3">
                {[1, 2, 3].map((step) => (
                  <React.Fragment key={step}>
                    <div className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-all ${
                        step === 1 ? 'bg-gradient-to-br from-[#15BB73] to-[#0D9B5C] text-white shadow-md shadow-green-200' :
                        step === 2 ? 'bg-gray-200 text-gray-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {step}
                      </div>
                      <span className={`ml-2 text-xs font-semibold hidden sm:inline ${
                        step === 1 ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        {step === 1 && t('healthCheck.step1')}
                        {step === 2 && t('healthCheck.step2')}
                        {step === 3 && t('healthCheck.step3')}
                      </span>
                    </div>
                    {step < 3 && (
                      <div className={`h-0.5 w-8 ${step === 1 ? 'bg-gray-300' : 'bg-gray-200'}`}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Step 1: Animal Selection */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-bold text-gray-800 mb-3 font-devanagari">
                <span className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-[#15BB73] to-[#0D9B5C] text-white rounded-full text-xs font-bold mr-2 shadow-md">1</span>
                {t('healthCheck.step1')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {animalTypes.map((animal) => (
                  <button
                    key={animal.id}
                    onClick={() => setSelectedAnimal(animal.id)}
                    className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 font-bold text-sm font-devanagari ${
                      selectedAnimal === animal.id
                        ? 'border-[#15BB73] bg-gradient-to-b from-green-50 to-emerald-50 text-[#15BB73] shadow-lg shadow-green-100 scale-105 ring-2 ring-green-100'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50 hover:shadow-md text-gray-700'
                    }`}
                  >
                    {animal.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6"></div>

            {/* Step 2: Image Upload */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-bold text-gray-800 mb-3 font-devanagari">
                <span className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-[#15BB73] to-[#0D9B5C] text-white rounded-full text-xs font-bold mr-2 shadow-md">2</span>
                {t('healthCheck.step2')}
              </label>

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#15BB73] hover:bg-gradient-to-b hover:from-green-50/50 hover:to-transparent transition-all duration-300 group bg-gradient-to-b from-gray-50 to-white"
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 group-hover:from-green-100 group-hover:to-emerald-50 flex items-center justify-center transition-all duration-300 shadow-inner">
                    <svg className="w-7 h-7 text-gray-400 group-hover:text-[#15BB73] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-800 font-bold text-sm mb-1 font-devanagari">{t('healthCheck.clickOrDrag')}</p>
                  <p className="text-gray-500 text-xs">{t('healthCheck.fileFormats')}</p>
                </div>
              ) : (
                <div className="relative inline-block group">
                  <img src={previewUrl} alt="Preview" className="max-h-48 rounded-2xl shadow-lg border-2 border-white ring-1 ring-gray-100" />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:from-red-600 hover:to-red-700 hover:scale-110 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {/* Check mark overlay on selected image */}
                  <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6"></div>

            {/* Step 3: Additional Info */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-bold text-gray-800 mb-3 font-devanagari">
                <span className="flex items-center justify-center w-7 h-7 bg-gray-300 text-white rounded-full text-xs font-bold mr-2">3</span>
                {t('healthCheck.additionalInfo')}
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder={t('healthCheck.agePlaceholder')}
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-[#15BB73] focus:bg-white transition-all text-sm font-devanagari"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder={t('healthCheck.symptomsPlaceholder')}
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-[#15BB73] focus:bg-white transition-all text-sm font-devanagari"
                  />
                </div>
                <div className="relative sm:col-span-2">
                  <div className="absolute left-3 top-3 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <textarea
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder={t('healthCheck.additionalInfoPlaceholder')}
                    rows={2}
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-[#15BB73] focus:bg-white transition-all text-sm font-devanagari resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-2xl text-red-700 text-sm flex items-start shadow-lg">
                <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-devanagari">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={analyzeHealth}
              disabled={!selectedAnimal || !selectedFile || loading}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center shadow-lg font-devanagari ${
                !selectedAnimal || !selectedFile || loading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#15BB73] to-[#0D9B5C] text-white hover:shadow-xl hover:shadow-green-300/50 hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  {t('healthCheck.analyzing')}
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('healthCheck.startHealthCheck')}
                </>
              )}
            </button>

            {/* Disclaimer */}
            <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-800 text-center leading-relaxed flex items-start justify-center font-devanagari">
                <svg className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{t('healthCheck.disclaimer')}</span>
              </p>
            </div>
          </div>
        ) : (
          /* Results Section - Premium Redesigned */
          <div className="space-y-6">


            {/* SECTION 1: HEALTH OVERVIEW */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 font-devanagari">{t('healthCheck.sectionOverview')}</h2>
              </div>

              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 border border-gray-100">
                {/* Top colored bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${getHealthScoreColor(result.healthScore || 5)} rounded-full mb-6`}></div>

                {/* Three column summary */}
                <div className="grid grid-cols-3 gap-4 md:gap-8">
                  {/* Health Score */}
                  <div className="text-center">
                    <p className="text-xs md:text-sm text-gray-500 font-semibold mb-3 font-devanagari">{t('healthCheck.healthScore')}</p>
                    <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full bg-gradient-to-br ${getHealthScoreColor(result.healthScore || 5)} flex items-center justify-center shadow-lg`}>
                      <span className="text-3xl md:text-4xl font-bold text-white">{result.healthScore || '?'}</span>
                    </div>
                    <p className="mt-3 font-bold text-gray-800 font-devanagari">{result.overallHealth || '-'}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold border font-devanagari ${getUrgencyStyle(result.urgencyLevel).bg} ${getUrgencyStyle(result.urgencyLevel).text} ${getUrgencyStyle(result.urgencyLevel).border}`}>
                      {result.urgencyLevel || t('healthCheck.normal')}
                    </span>
                  </div>

                  {/* Body Condition */}
                  <div className="text-center border-x border-gray-100 px-2">
                    <p className="text-xs md:text-sm text-gray-500 font-semibold mb-3 font-devanagari">{t('healthCheck.bodyCondition')}</p>
                    <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full flex items-center justify-center ${
                      Number(result.bodyConditionScore) <= 2 || Number(result.bodyConditionScore) >= 4
                        ? 'bg-amber-50 border-2 border-amber-200'
                        : 'bg-emerald-50 border-2 border-emerald-200'
                    }`}>
                      <span className="text-4xl md:text-5xl">
                        {Number(result.bodyConditionScore) <= 2 || Number(result.bodyConditionScore) >= 4 ? '⚠️' : '✅'}
                      </span>
                    </div>
                    <p className="mt-3 font-bold text-gray-800 font-devanagari">
                      {getBodyConditionText(result.bodyConditionScore)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-devanagari">{result.bodyConditionScore || '3'} ({t('healthCheck.average')})/5</p>
                  </div>

                  {/* Animal Type */}
                  <div className="text-center">
                    <p className="text-xs md:text-sm text-gray-500 font-semibold mb-3 font-devanagari">{t('healthCheck.animal')}</p>
                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-100 flex items-center justify-center">
                      <span className="text-4xl md:text-5xl">
                        {animalTypes.find(a => a.id === selectedAnimal)?.emoji || '🐾'}
                      </span>
                    </div>
                    <p className="mt-3 font-bold text-gray-800 font-devanagari">{result.animalType || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8"></div>

            {/* SECTION 2: GROWTH & READINESS */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 font-devanagari">{t('healthCheck.sectionGrowth')}</h2>
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
                      <h3 className="font-bold text-gray-800 font-devanagari">{t('healthCheck.estimatedAge')}</h3>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 mb-4 text-center">
                      <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-devanagari">
                        {result.estimatedAge.years || '0'} {t('healthCheck.years')} {result.estimatedAge.months || '0'} {t('healthCheck.months')}
                      </p>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{result.estimatedAge.ageDescription}</p>

                    {result.estimatedAge.ageIndicators?.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 font-devanagari">{t('healthCheck.ageIndicators')}:</p>
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
                      <h3 className="font-bold text-gray-800 font-devanagari">{t('healthCheck.breedingReadiness')}</h3>
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
                      <span className="text-sm text-gray-500 font-devanagari">{t('healthCheck.optimalMatingAge')}</span>
                      <span className="font-semibold text-gray-800 font-devanagari">{result.breedingReadiness.optimalMatingAge}</span>
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
                    <h3 className="font-bold text-gray-800 font-devanagari">{t('healthCheck.pregnancyInfo')}</h3>
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
                        <span className="text-sm text-gray-500 font-devanagari">{t('healthCheck.gestationPeriod')}</span>
                        <span className="font-semibold text-gray-800 font-devanagari">{result.pregnancyInfo.gestationPeriod}</span>
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
           </div>

           {/* Section Divider */}
           <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8"></div>

           {/* SECTION 3: OBSERVATIONS */}
           <div className="space-y-4">
             <div className="flex items-center space-x-2">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-50 flex items-center justify-center">
                 <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                 </svg>
               </div>
               <h2 className="text-xl font-bold text-gray-800 font-devanagari">{t('healthCheck.sectionObservations')}</h2>
             </div>

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
                      <h3 className="font-bold text-gray-800 font-devanagari">{t('healthCheck.visibleSigns')}</h3>
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
                      <h3 className="font-bold text-gray-800 font-devanagari">{t('healthCheck.healthyIndicators')}</h3>
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
           </div>

           {/* Section Divider */}
           <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8"></div>

           {/* SECTION 4: RISKS & ALERTS */}
           {result.potentialIssues?.length > 0 && (
             <div className="space-y-4">
               <div className="flex items-center space-x-2">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
                   <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                   </svg>
                 </div>
                 <h2 className="text-xl font-bold text-gray-800 font-devanagari">{t('healthCheck.sectionRisks')}</h2>
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
                    <h3 className="font-bold text-gray-800 font-devanagari">{t('healthCheck.potentialIssues')}</h3>
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
             </div>
           )}

           {/* Section Divider */}
           <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8"></div>

           {/* SECTION 5: GUIDANCE & RECOMMENDATIONS */}
           <div className="space-y-4">
             <div className="flex items-center space-x-2">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                 <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                 </svg>
               </div>
               <h2 className="text-xl font-bold text-gray-800 font-devanagari">{t('healthCheck.sectionGuidance')}</h2>
             </div>

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
                      <h3 className="font-bold text-gray-800 font-devanagari">{t('healthCheck.recommendations')}</h3>
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
                      <h3 className="font-bold text-gray-800 font-devanagari">{t('healthCheck.dietarySuggestions')}</h3>
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
          </div>

          {/* When to See Vet - Critical Alert */}
            {result.whenToSeeVet && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                {/* Pulsing Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 flex items-start">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mr-4 flex-shrink-0 animate-pulse">
                    <span className="text-2xl">🏥</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-red-800 text-lg font-devanagari">{t('healthCheck.whenToSeeVet')}</h4>
                      <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-xs font-bold">
                        {t('healthCheck.critical')}
                      </span>
                    </div>
                    <p className="text-red-700 leading-relaxed font-devanagari">{result.whenToSeeVet}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            {result.disclaimer && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-sm text-amber-800 leading-relaxed flex items-start justify-center font-devanagari">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{result.disclaimer}</span>
                </p>
              </div>
            )}

            {/* Try Again Button - Prominent CTA */}
            <div className="text-center pt-8">
              <button
                onClick={resetForm}
                className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-[#15BB73] to-[#0D9B5C] text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-green-300/50 hover:-translate-y-1 transition-all duration-300 shadow-xl font-devanagari"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('healthCheck.tryAgain')}
              </button>
              
              {/* Mobile Sticky Button Spacer */}
              <div className="h-20 md:hidden"></div>
            </div>
            
            {/* Mobile Sticky Try Again Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 md:hidden z-40">
              <button
                onClick={resetForm}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-[#15BB73] to-[#0D9B5C] text-white rounded-2xl font-bold text-base hover:shadow-xl transition-all duration-300 shadow-lg font-devanagari"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('healthCheck.tryAgain')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-[#15BB73] border-t-transparent rounded-full animate-spin"></div>
            {/* AI Badge in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[#15BB73] font-bold text-lg">AI</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3 font-devanagari">{t('healthCheck.analyzing')}</h3>
          <p className="text-gray-500 font-devanagari">{t('healthCheck.analyzingMessage')}</p>
          
          {/* Progress dots */}
          <div className="flex space-x-2 mt-6">
            <div className="w-3 h-3 bg-[#15BB73] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-[#15BB73] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-[#15BB73] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIHealthCheck;
