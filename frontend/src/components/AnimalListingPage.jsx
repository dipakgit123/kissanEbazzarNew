import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

  const tabs = [
    { 
      id: 'animal', 
      label: t('animalTypes.cow'), 
      emoji: '🐄',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-500'
    },
    { 
      id: 'buffalo', 
      label: t('animalTypes.buffalo'), 
      emoji: '🐃',
      color: 'from-gray-600 to-gray-700',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-500'
    },
    { 
      id: 'goat', 
      label: t('animalTypes.goat'), 
      emoji: '🐐',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-500'
    },
    { 
      id: 'horse', 
      label: t('animalTypes.horse'), 
      emoji: '🐴',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-500'
    },
    { 
      id: 'dog', 
      label: t('animalTypes.dog'), 
      emoji: '🐕',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-500'
    },
    { 
      id: 'cat', 
      label: t('animalTypes.cat'), 
      emoji: '🐱',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      borderColor: 'border-pink-500'
    },
    { 
      id: 'other', 
      label: t('animalTypes.other') || 'Other', 
      emoji: '🐾',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-500'
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
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {t('listing.selectAnimalType') || 'Select Animal Type'}
          </h2>
          
          {/* Desktop Grid View */}
          <div className="hidden md:grid grid-cols-7 gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 group ${
                  activeTab === tab.id
                    ? `${tab.bgColor} ${tab.borderColor} shadow-md`
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`text-4xl transform transition-transform duration-200 ${
                    activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'
                  }`}>
                    {tab.emoji}
                  </div>
                  <span className={`text-xs font-semibold text-center ${
                    activeTab === tab.id ? tab.textColor : 'text-gray-700'
                  }`}>
                    {tab.label}
                  </span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute -top-1 -right-1">
                    <div className={`w-6 h-6 bg-gradient-to-r ${tab.color} rounded-full flex items-center justify-center shadow-md`}>
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Mobile Horizontal Scroll */}
          <div className="md:hidden overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max px-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-shrink-0 w-24 p-3 rounded-xl border-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? `${tab.bgColor} ${tab.borderColor} shadow-md`
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`text-3xl ${activeTab === tab.id ? 'scale-110' : ''}`}>
                      {tab.emoji}
                    </div>
                    <span className={`text-xs font-semibold text-center ${
                      activeTab === tab.id ? tab.textColor : 'text-gray-700'
                    }`}>
                      {tab.label}
                    </span>
                  </div>
                  {activeTab === tab.id && (
                    <div className="absolute -top-1 -right-1">
                      <div className={`w-5 h-5 bg-gradient-to-r ${tab.color} rounded-full flex items-center justify-center shadow-md`}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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
              <div className="text-3xl">{activeTabData?.emoji}</div>
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
