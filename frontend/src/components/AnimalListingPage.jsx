import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AnimalListingPage.css';
import AnimalListingForm from './AnimalListingForm';
import BuffaloListingForm from './BuffaloListingForm';
import CatListingForm from './CatListingForm';
import DogListingForm from './DogListingForm';
import GoatListingForm from './GoatListingForm';
import HorseListingForm from './HorseListingForm';
import OtherAnimalListingForm from './OtherAnimalListingForm';

const AnimalListingPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('animal');

  // Import animal images
  const cowImg = '/src/assets/images/cow1.png';
  const buffaloImg = '/src/assets/images/buffelo1.png';
  const goatImg = '/src/assets/images/goat1.png';
  const horseImg = '/src/assets/images/horse1.png';
  const dogImg = '/src/assets/images/Dog1.png';
  const catImg = '/src/assets/images/cat1.png';

  const tabs = [
    { 
      id: 'animal', 
      label: t('animalTypes.cow'), 
      image: cowImg,
      icon: '🐄',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-500',
      iconBg: 'bg-amber-100'
    },
    { 
      id: 'buffalo', 
      label: t('animalTypes.buffalo'), 
      image: buffaloImg,
      icon: '🐃',
      color: 'from-gray-600 to-gray-700',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-500',
      iconBg: 'bg-gray-100'
    },
    { 
      id: 'goat', 
      label: t('animalTypes.goat'), 
      image: goatImg,
      icon: '🐐',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-500',
      iconBg: 'bg-green-100'
    },
    { 
      id: 'horse', 
      label: t('animalTypes.horse'), 
      image: horseImg,
      icon: '🐴',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-500',
      iconBg: 'bg-purple-100'
    },
    { 
      id: 'dog', 
      label: t('animalTypes.dog'), 
      image: dogImg,
      icon: '🐕',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-500',
      iconBg: 'bg-orange-100'
    },
    { 
      id: 'cat', 
      label: t('animalTypes.cat'), 
      image: catImg,
      icon: '🐱',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      borderColor: 'border-pink-500',
      iconBg: 'bg-pink-100'
    },
    { 
      id: 'other', 
      label: t('animalTypes.other') || 'Other', 
      image: null,
      icon: '🐾',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-500',
      iconBg: 'bg-blue-100'
    }
  ];

  const renderForm = () => {
    switch (activeTab) {
      case 'animal':
        return <AnimalListingForm />;
      case 'buffalo':
        return <BuffaloListingForm />;
      case 'cat':
        return <CatListingForm />;
      case 'dog':
        return <DogListingForm />;
      case 'goat':
        return <GoatListingForm />;
      case 'horse':
        return <HorseListingForm />;
      case 'other':
        return <OtherAnimalListingForm />;
      default:
        return <AnimalListingForm />;
    }
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {t('listing.createListing') || 'Create Animal Listing'}
            </h1>
            <p className="text-green-100 text-sm md:text-base max-w-2xl mx-auto">
              {t('listing.subtitle') || 'List your animal for sale and reach thousands of potential buyers'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Instructions Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                {t('listing.instructions.title') || 'Quick Tips'}
              </h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• {t('listing.instructions.tip1') || 'Select the animal type below to get started'}</li>
                <li>• {t('listing.instructions.tip2') || 'Fill in all required details accurately'}</li>
                <li>• {t('listing.instructions.tip3') || 'Upload clear photos for better visibility'}</li>
                <li>• {t('listing.instructions.tip4') || 'Set a competitive price to attract buyers'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Animal Type Selector */}
        <div className="mb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {t('listing.selectAnimalType') || 'Select Animal Type'}
            </h2>
            <p className="text-sm text-gray-600">
              Choose the type of animal you want to list for sale
            </p>
          </div>
          
          {/* Desktop Grid View - Enhanced with Images */}
          <div className="hidden md:grid grid-cols-7 gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative group overflow-hidden rounded-2xl border-3 transition-all duration-300 transform hover:-translate-y-2 ${
                  activeTab === tab.id
                    ? `${tab.borderColor} shadow-2xl scale-105`
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-xl bg-white'
                }`}
                style={{
                  boxShadow: activeTab === tab.id ? `0 12px 35px -10px ${tab.color.includes('amber') ? '#f59e0b' : tab.color.includes('gray') ? '#6b7280' : tab.color.includes('green') ? '#10b981' : tab.color.includes('purple') ? '#8b5cf6' : tab.color.includes('orange') ? '#f97316' : tab.color.includes('pink') ? '#ec4899' : '#3b82f6'}50` : 'none'
                }}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tab.color} ${activeTab === tab.id ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative p-5">
                  <div className="flex flex-col items-center gap-3">
                    {/* Image Container with circular background */}
                    <div className={`relative w-20 h-20 ${activeTab === tab.id ? '' : 'group-hover:scale-110'} transition-transform duration-300`}>
                      {/* Glow effect */}
                      <div className={`absolute inset-0 rounded-full blur-2xl ${activeTab === tab.id ? 'bg-white/40' : 'bg-transparent'} transition-all duration-300`} />
                      
                      {/* Circular background */}
                      <div className={`relative w-full h-full rounded-full ${activeTab === tab.id ? 'bg-white/20' : tab.iconBg} flex items-center justify-center transition-all duration-300 ${activeTab === tab.id ? 'animate-pulse' : ''}`}>
                        {tab.image ? (
                          <img 
                            src={tab.image} 
                            alt={tab.label}
                            className="w-16 h-16 object-contain"
                          />
                        ) : (
                          <span className="text-5xl">{tab.icon}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Label */}
                    <span className={`text-sm font-bold text-center transition-colors duration-300 ${
                      activeTab === tab.id ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'
                    }`}>
                      {tab.label}
                    </span>
                  </div>
                </div>

                {/* Active indicator checkmark */}
                {activeTab === tab.id && (
                  <div className="absolute -top-2 -right-2 z-20">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-100 animate-bounce">
                      <svg className={`w-5 h-5 ${tab.textColor}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Hover glow effect */}
                <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                  activeTab === tab.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                }`} style={{
                  background: `linear-gradient(135deg, ${tab.color.includes('amber') ? '#fef3c7' : tab.color.includes('gray') ? '#f3f4f6' : tab.color.includes('green') ? '#d1fae5' : tab.color.includes('purple') ? '#ede9fe' : tab.color.includes('orange') ? '#fed7aa' : tab.color.includes('pink') ? '#fce7f3' : '#dbeafe'} 0%, transparent 100%)`
                }} />
              </button>
            ))}
          </div>

          {/* Mobile Horizontal Scroll - Enhanced with Images */}
          <div className="md:hidden overflow-x-auto pb-3 -mx-4 px-4">
            <div className="flex gap-4 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-shrink-0 w-28 overflow-hidden rounded-2xl border-3 transition-all duration-300 ${
                    activeTab === tab.id
                      ? `${tab.borderColor} shadow-xl`
                      : 'border-gray-200 bg-white'
                  }`}
                  style={{
                    boxShadow: activeTab === tab.id ? `0 8px 25px -8px ${tab.color.includes('amber') ? '#f59e0b' : tab.color.includes('gray') ? '#6b7280' : tab.color.includes('green') ? '#10b981' : tab.color.includes('purple') ? '#8b5cf6' : tab.color.includes('orange') ? '#f97316' : tab.color.includes('pink') ? '#ec4899' : '#3b82f6'}50` : 'none'
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${tab.color} ${activeTab === tab.id ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`} />
                  
                  <div className="relative p-4">
                    <div className="flex flex-col items-center gap-2">
                      {/* Image container */}
                      <div className={`w-16 h-16 rounded-full ${activeTab === tab.id ? 'bg-white/20' : tab.iconBg} flex items-center justify-center ${activeTab === tab.id ? 'scale-110' : ''} transition-all duration-300`}>
                        {tab.image ? (
                          <img 
                            src={tab.image} 
                            alt={tab.label}
                            className="w-12 h-12 object-contain"
                          />
                        ) : (
                          <span className="text-3xl">{tab.icon}</span>
                        )}
                      </div>
                      <span className={`text-xs font-bold text-center ${
                        activeTab === tab.id ? 'text-white' : 'text-gray-700'
                      }`}>
                        {tab.label}
                      </span>
                    </div>
                  </div>

                  {activeTab === tab.id && (
                    <div className="absolute -top-1 -right-1 z-20">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
                        <svg className={`w-4 h-4 ${tab.textColor}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Form Header */}
          <div className={`px-6 py-4 border-b border-gray-200 bg-gradient-to-r ${activeTabData?.color}`}>
            <div className="flex items-center gap-3">
              {/* Animal image in header */}
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                {activeTabData?.image ? (
                  <img 
                    src={activeTabData.image} 
                    alt={activeTabData.label}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <span className="text-3xl">{activeTabData?.icon}</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {activeTabData?.label} {t('listing.details') || 'Details'}
                </h3>
                <p className="text-sm text-white/90">
                  {t('listing.formSubtitle') || 'Fill in the information below to create your listing'}
                </p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6">
            {renderForm()}
          </div>
        </div>

        {/* Footer Tips */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Quality Photos</h4>
                <p className="text-xs text-gray-600">Upload clear, well-lit photos from multiple angles</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Accurate Details</h4>
                <p className="text-xs text-gray-600">Provide precise information about age, weight, and health</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Fair Pricing</h4>
                <p className="text-xs text-gray-600">Set competitive prices based on market rates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimalListingPage;
