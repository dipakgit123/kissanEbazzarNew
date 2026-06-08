import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;
const MAX_AI_HEALTH_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;
const TARGET_AI_HEALTH_UPLOAD_BYTES = 800 * 1024;
const MAX_AI_HEALTH_IMAGE_DIMENSION = 1600;

const loadImageElement = (file) => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    resolve(image);
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('Could not read image'));
  };

  image.src = objectUrl;
});

const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) {
      resolve(blob);
    } else {
      reject(new Error('Could not process image'));
    }
  }, type, quality);
});

const optimizeImageForUpload = async (file) => {
  const image = await loadImageElement(file);
  const maxDimension = Math.max(image.width, image.height);
  const scale = maxDimension > MAX_AI_HEALTH_IMAGE_DIMENSION
    ? MAX_AI_HEALTH_IMAGE_DIMENSION / maxDimension
    : 1;

  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('Could not process image');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, targetWidth, targetHeight);
  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const shouldCompress =
    file.size > TARGET_AI_HEALTH_UPLOAD_BYTES ||
    scale < 1 ||
    !['image/jpeg', 'image/webp'].includes(file.type);

  if (!shouldCompress) {
    return file;
  }

  const qualities = [0.82, 0.72, 0.62, 0.52, 0.42];
  let optimizedBlob = null;

  for (const quality of qualities) {
    const candidateBlob = await canvasToBlob(canvas, 'image/jpeg', quality);
    optimizedBlob = candidateBlob;

    if (candidateBlob.size <= TARGET_AI_HEALTH_UPLOAD_BYTES) {
      break;
    }
  }

  if (!optimizedBlob) {
    throw new Error('Could not process image');
  }

  const nextFileName = file.name.replace(/\.[^.]+$/, '') || 'animal-health-image';

  return new File([optimizedBlob], `${nextFileName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now()
  });
};

const SectionCard = ({ title, icon, children, className = '' }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </section>
);

const SummaryItem = ({ label, value, subvalue, icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex items-center gap-2">
      {icon}
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
    </div>
    <p className="mt-3 text-xl font-semibold text-slate-900">{value}</p>
    {subvalue ? <p className="mt-1 text-xs text-slate-500">{subvalue}</p> : null}
  </div>
);

const BulletList = ({ items }) => (
  <ul className="space-y-2">
    {items.map((item, index) => (
      <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const iconClassName = 'h-4 w-4 text-slate-600';

const Icons = {
  report: (
    <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7.5 3.75h6.75L19.5 9v9.75A1.5 1.5 0 0118 20.25H7.5A1.5 1.5 0 016 18.75v-13.5A1.5 1.5 0 017.5 3.75Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.25 3.75v5.25h5.25M9 13.5h6M9 17.25h4.5M9 9.75h1.5" />
    </svg>
  ),
  score: (
    <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2Zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2Z" />
    </svg>
  ),
  animal: (
    <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.5 12c0 5.25-3.75 8.25-7.5 8.25S4.5 17.25 4.5 12 8.25 3.75 12 3.75 19.5 6.75 19.5 12Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 10.5h.008v.008H9.75V10.5Zm4.5 0h.008v.008h-.008V10.5Zm-5.25 3c1.5 1.125 4.5 1.125 6 0" />
    </svg>
  ),
  alert: (
    <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3.75m0 3.75h.008v.008H12V16.5Zm-1.66-12.56L1.82 18a1.75 1.75 0 001.5 2.625h17.36A1.75 1.75 0 0022.18 18L13.66 3.94a1.9 1.9 0 00-3.32 0Z" />
    </svg>
  ),
  question: (
    <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.879 9.75A3 3 0 1114.25 12.4c-.6.42-1.25.95-1.25 1.85m0 3h.008v.008H13V17.25ZM21 12a9 9 0 11-18 0 9 9 0 0118 0Z" />
    </svg>
  ),
  growth: (
    <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.5 19.5h15m-12-3.75 3.75-3.75 2.25 2.25 4.5-6" />
    </svg>
  )
};

const AIHealthCheck = () => {
  const { t, i18n } = useTranslation();

  const animalTypes = useMemo(() => ([
    { id: 'cow', name: t('animalTypes.cow') },
    { id: 'buffalo', name: t('animalTypes.buffalo') },
    { id: 'horse', name: t('animalTypes.horse') },
    { id: 'goat', name: t('animalTypes.goat') },
    { id: 'sheep', name: t('animalTypes.sheep') },
    { id: 'dog', name: t('animalTypes.dog') },
    { id: 'cat', name: t('animalTypes.cat') },
    { id: 'other', name: t('animalTypes.other') }
  ]), [t]);

  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [preparingImage, setPreparingImage] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const fileInputRef = useRef(null);

  const selectedAnimalMeta = animalTypes.find((animal) => animal.id === selectedAnimal);
  const primaryRecommendation = result?.recommendations?.[0];
  const questionResponseMessage = useMemo(() => {
    if (!result?.questionErrorCode) {
      return result?.questionError || t('healthCheck.errorPromptFailed');
    }

    if (result.questionErrorCode === 'AI_RATE_LIMITED') {
      return t('healthCheck.errorPromptRateLimited');
    }

    if (result.questionErrorCode === 'AI_TEMPORARILY_BUSY') {
      return t('healthCheck.errorPromptConnectionFailed');
    }

    return result.questionError || t('healthCheck.errorPromptFailed');
  }, [result?.questionError, result?.questionErrorCode, t]);

  const setImageForAnalysis = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('healthCheck.errorImageFile'));
      return;
    }

    if (file.size > MAX_AI_HEALTH_IMAGE_SIZE_BYTES) {
      setError(t('healthCheck.errorFileSize'));
      return;
    }

    setPreparingImage(true);
    setError(null);

    try {
      const optimizedFile = await optimizeImageForUpload(file);
      setSelectedFile(optimizedFile);
      setPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return URL.createObjectURL(optimizedFile);
      });
    } catch {
      setError(t('healthCheck.errorImageProcessing'));
    } finally {
      setPreparingImage(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    await setImageForAnalysis(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    await setImageForAnalysis(file);
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return null;
    });
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
      formData.append('customQuestion', customPrompt);
      formData.append('languageHint', i18n.language);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/health-check/upload-and-analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { success: false, message: await response.text() };

      if (data.success) {
        setResult(data.data);
      } else {
        const isNginx413 = !contentType.includes('application/json') &&
          response.status === 413 &&
          typeof data.message === 'string' &&
          data.message.includes('413 Request Entity Too Large');

        setError(
          isNginx413
            ? t('healthCheck.errorRequestTooLarge')
            : (data.message || t('healthCheck.errorAnalysisFailed'))
        );
      }
    } catch {
      setError(t('healthCheck.errorConnectionFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedAnimal(null);
    setSelectedFile(null);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return null;
    });
    setSymptoms('');
    setAge('');
    setAdditionalInfo('');
    setResult(null);
    setError(null);
    setCustomPrompt('');
  };

  const getBodyConditionText = (score) => {
    const numericScore = Number(score);
    if (numericScore <= 2) return t('healthCheck.underweight');
    if (numericScore >= 4) return t('healthCheck.overweight');
    return t('healthCheck.normal');
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {!result ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="mb-6 flex items-center justify-center">
              <div className="flex items-center space-x-3">
                {[1, 2, 3].map((step) => (
                  <React.Fragment key={step}>
                    <div className="flex items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        step === 1 ? 'bg-slate-900 text-white' :
                        step === 2 ? 'bg-slate-200 text-slate-600' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {step}
                      </div>
                      <span className={`ml-2 hidden text-xs font-semibold sm:inline ${
                        step === 1 ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {step === 1 && t('healthCheck.step1')}
                        {step === 2 && t('healthCheck.step2')}
                        {step === 3 && t('healthCheck.step3')}
                      </span>
                    </div>
                    {step < 3 && <div className="h-px w-8 bg-slate-200" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-3 flex items-center text-sm font-bold text-slate-800">
                <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">1</span>
                {t('healthCheck.step1')}
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {animalTypes.map((animal) => (
                  <button
                    key={animal.id}
                    onClick={() => setSelectedAnimal(animal.id)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      selectedAnimal === animal.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {animal.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 border-t border-slate-200 pt-6">
              <label className="mb-3 flex items-center text-sm font-bold text-slate-800">
                <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">2</span>
                {t('healthCheck.step2')}
              </label>

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-slate-500"
                >
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m4 16 4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{t('healthCheck.clickOrDrag')}</p>
                  <p className="mt-1 text-xs text-slate-500">{t('healthCheck.fileFormats')}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{t('healthCheck.autoOptimizeHint')}</p>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img src={previewUrl} alt="Preview" className="max-h-48 rounded-2xl border border-slate-200 object-cover shadow-sm" />
                  <button
                    onClick={removeImage}
                    className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>

            <div className="mb-6 border-t border-slate-200 pt-6">
              <label className="mb-3 flex items-center text-sm font-bold text-slate-800">
                <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">3</span>
                {t('healthCheck.additionalInfo')}
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder={t('healthCheck.agePlaceholder')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:bg-white"
                />
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={t('healthCheck.symptomsPlaceholder')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:bg-white"
                />
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder={t('healthCheck.additionalInfoPlaceholder')}
                  rows={2}
                  className="resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:bg-white sm:col-span-2"
                />
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <label className="block text-sm font-bold text-slate-800">
                        {t('healthCheck.askQuestionLabel')}
                      </label>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {t('healthCheck.askQuestionInlineHint')}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                      AI
                    </span>
                  </div>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={t('healthCheck.askQuestionPlaceholder')}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 flex items-start rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3.75m0 3.75h.008v.008H12V16.5ZM21 12a9 9 0 11-18 0 9 9 0 0118 0Z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {preparingImage && (
              <div className="mb-6 flex items-start rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <svg className="mr-2 mt-0.5 h-5 w-5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{t('healthCheck.optimizingImage')}</span>
              </div>
            )}

            <button
              onClick={analyzeHealth}
              disabled={!selectedAnimal || !selectedFile || loading || preparingImage}
              className={`flex w-full items-center justify-center rounded-xl px-4 py-4 text-sm font-semibold transition ${
                !selectedAnimal || !selectedFile || loading || preparingImage
                  ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {loading || preparingImage ? (
                <span className="flex items-center">
                  <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {preparingImage ? t('healthCheck.optimizingImage') : t('healthCheck.analyzing')}
                </span>
              ) : (
                t('healthCheck.startHealthCheck')
              )}
            </button>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs leading-6 text-slate-600">{t('healthCheck.disclaimer')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <SectionCard title={t('healthCheck.results')} icon={Icons.report}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-semibold text-slate-900 font-devanagari">
                    {result.overallHealth || t('healthCheck.sectionOverview')}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 font-devanagari">
                    {primaryRecommendation || result.whenToSeeVet || t('healthCheck.disclaimer')}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      {result.urgencyLevel || t('healthCheck.normal')}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      {result.animalType || selectedAnimalMeta?.name || t('healthCheck.animal')}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      {t('healthCheck.bodyCondition')}: {result.bodyConditionScore || '3'}/5
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                  <SummaryItem
                    label={t('healthCheck.healthScore')}
                    value={result.healthScore || '?'}
                    icon={Icons.score}
                  />
                  <SummaryItem
                    label={t('healthCheck.bodyCondition')}
                    value={getBodyConditionText(result.bodyConditionScore)}
                    subvalue={`${result.bodyConditionScore || '3'} (${t('healthCheck.average')})/5`}
                    icon={Icons.report}
                  />
                  <SummaryItem
                    label={t('healthCheck.animal')}
                    value={result.animalType || selectedAnimalMeta?.name || '-'}
                    icon={Icons.animal}
                  />
                </div>
              </div>
            </SectionCard>

            {(result.questionAnswer || result.questionError) && (
              <SectionCard title={t('healthCheck.askQuestionResponseTitle')} icon={Icons.question}>
                <div className="grid gap-4 lg:grid-cols-[0.95fr,1.35fr]">
                  {result.questionAsked && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {t('healthCheck.askQuestionAskedLabel')}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-700 font-devanagari">{result.questionAsked}</p>
                    </div>
                  )}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="whitespace-pre-line text-sm leading-7 text-slate-700 font-devanagari">
                        {result.questionAnswer || questionResponseMessage}
                      </p>
                    </div>
                  </div>
                </SectionCard>
            )}

            <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-5">
                {(result.visibleSigns?.length > 0 || result.healthyIndicators?.length > 0) && (
                  <SectionCard title={t('healthCheck.sectionObservations')} icon={Icons.report}>
                    <div className="grid gap-4 md:grid-cols-2">
                      {result.visibleSigns?.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900 font-devanagari">{t('healthCheck.visibleSigns')}</p>
                          <div className="mt-3">
                            <BulletList items={result.visibleSigns} />
                          </div>
                        </div>
                      )}
                      {result.healthyIndicators?.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900 font-devanagari">{t('healthCheck.healthyIndicators')}</p>
                          <div className="mt-3">
                            <BulletList items={result.healthyIndicators} />
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                )}

                {result.potentialIssues?.length > 0 && (
                  <SectionCard title={t('healthCheck.potentialIssues')} icon={Icons.alert}>
                    <div className="space-y-3">
                      {result.potentialIssues.map((issue, index) => (
                        <div key={`${issue.condition}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-slate-900">{issue.condition}</p>
                            {issue.likelihood ? (
                              <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {issue.likelihood}
                              </span>
                            ) : null}
                          </div>
                          {issue.description ? (
                            <p className="mt-2 text-sm leading-6 text-slate-600">{issue.description}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {(result.recommendations?.length > 0 || result.dietarySuggestions?.length > 0) && (
                  <SectionCard title={t('healthCheck.sectionGuidance')} icon={Icons.score}>
                    <div className="grid gap-4 md:grid-cols-2">
                      {result.recommendations?.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900 font-devanagari">{t('healthCheck.recommendations')}</p>
                          <div className="mt-3">
                            <BulletList items={result.recommendations} />
                          </div>
                        </div>
                      )}
                      {result.dietarySuggestions?.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900 font-devanagari">{t('healthCheck.dietarySuggestions')}</p>
                          <div className="mt-3">
                            <BulletList items={result.dietarySuggestions} />
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                )}
              </div>

              <div className="space-y-5">
                {(result.estimatedAge || result.breedingReadiness || result.pregnancyInfo) && (
                  <SectionCard title={t('healthCheck.sectionGrowth')} icon={Icons.growth}>
                    <div className="space-y-4">
                      {result.estimatedAge && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900 font-devanagari">{t('healthCheck.estimatedAge')}</p>
                          <p className="mt-3 text-lg font-semibold text-slate-900 font-devanagari">
                            {result.estimatedAge.years || '0'} {t('healthCheck.years')} {result.estimatedAge.months || '0'} {t('healthCheck.months')}
                          </p>
                          {result.estimatedAge.ageDescription ? (
                            <p className="mt-2 text-sm leading-6 text-slate-600">{result.estimatedAge.ageDescription}</p>
                          ) : null}
                          {result.estimatedAge.ageIndicators?.length > 0 && (
                            <div className="mt-3">
                              <BulletList items={result.estimatedAge.ageIndicators} />
                            </div>
                          )}
                        </div>
                      )}

                      {result.breedingReadiness && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900 font-devanagari">{t('healthCheck.breedingReadiness')}</p>
                          <p className="mt-3 text-sm font-semibold text-slate-900">{result.breedingReadiness.matingReadinessStatus}</p>
                          {result.breedingReadiness.daysUntilMatingReady ? (
                            <p className="mt-1 text-sm text-slate-600">{result.breedingReadiness.daysUntilMatingReady}</p>
                          ) : null}
                          {result.breedingReadiness.optimalMatingAge ? (
                            <p className="mt-3 text-sm text-slate-600">
                              <span className="font-medium text-slate-800 font-devanagari">{t('healthCheck.optimalMatingAge')}:</span> {result.breedingReadiness.optimalMatingAge}
                            </p>
                          ) : null}
                          {result.breedingReadiness.matingAdvice ? (
                            <p className="mt-2 text-sm leading-6 text-slate-600">{result.breedingReadiness.matingAdvice}</p>
                          ) : null}
                        </div>
                      )}

                      {result.pregnancyInfo && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900 font-devanagari">{t('healthCheck.pregnancyInfo')}</p>
                          <p className="mt-3 text-sm font-semibold text-slate-900">{result.pregnancyInfo.pregnancyReadinessStatus}</p>
                          {result.pregnancyInfo.daysUntilPregnancyReady ? (
                            <p className="mt-1 text-sm text-slate-600">{result.pregnancyInfo.daysUntilPregnancyReady}</p>
                          ) : null}
                          {result.pregnancyInfo.gestationPeriod ? (
                            <p className="mt-3 text-sm text-slate-600">
                              <span className="font-medium text-slate-800 font-devanagari">{t('healthCheck.gestationPeriod')}:</span> {result.pregnancyInfo.gestationPeriod}
                            </p>
                          ) : null}
                          {result.pregnancyInfo.pregnancyAdvice ? (
                            <p className="mt-2 text-sm leading-6 text-slate-600">{result.pregnancyInfo.pregnancyAdvice}</p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </SectionCard>
                )}

                {result.whenToSeeVet && (
                  <SectionCard title={t('healthCheck.whenToSeeVet')} icon={Icons.alert}>
                    <p className="text-sm leading-7 text-slate-700 font-devanagari">{result.whenToSeeVet}</p>
                  </SectionCard>
                )}

                {result.disclaimer && (
                  <SectionCard title={t('healthCheck.disclaimer')} icon={Icons.report}>
                    <p className="text-sm leading-6 text-slate-600 font-devanagari">{result.disclaimer}</p>
                  </SectionCard>
                )}
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={resetForm}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('healthCheck.tryAgain')}
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
          <div className="relative mb-8">
            <div className="h-24 w-24 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 h-24 w-24 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-slate-700">AI</span>
            </div>
          </div>
          <h3 className="mb-3 text-2xl font-bold text-slate-800">{t('healthCheck.analyzing')}</h3>
          <p className="text-slate-500">{t('healthCheck.analyzingMessage')}</p>
          <div className="mt-6 flex space-x-2">
            <div className="h-3 w-3 animate-bounce rounded-full bg-slate-700" style={{ animationDelay: '0ms' }}></div>
            <div className="h-3 w-3 animate-bounce rounded-full bg-slate-700" style={{ animationDelay: '150ms' }}></div>
            <div className="h-3 w-3 animate-bounce rounded-full bg-slate-700" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIHealthCheck;
