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
import buffaloLogo from '../assets/images/buffelo_logo.png';
import catLogo from '../assets/images/cat_logo.png';
import cowLogo from '../assets/images/cow_logo.png';
import dogLogo from '../assets/images/Dog_logo.png';
import goatLogo from '../assets/images/goat_logo.png';
import horseLogo from '../assets/images/horse_logo.png';
import otherAnimalLogo from '../assets/images/other_animal.png';

const AnimalListingPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('animal');

  const cowImg = cowLogo;
  const buffaloImg = buffaloLogo;
  const goatImg = goatLogo;
  const horseImg = horseLogo;
  const dogImg = dogLogo;
  const catImg = catLogo;

  const tabs = [
    {
      id: 'animal',
      label: t('animalTypes.cow'),
      image: cowImg,
      icon: '🐄',
      color: 'from-amber-500 to-amber-600',
      accent: 'text-amber-700',
      borderColor: 'border-amber-300',
      iconBg: 'bg-amber-100',
      panelBg: 'from-amber-50 via-orange-50 to-white',
      chipClass: 'bg-amber-100 text-amber-700',
      category: 'Dairy',
      summary: 'Best for high-visibility milk and breeding listings.',
    },
    {
      id: 'buffalo',
      label: t('animalTypes.buffalo'),
      image: buffaloImg,
      icon: '🐃',
      color: 'from-slate-600 to-slate-700',
      accent: 'text-slate-700',
      borderColor: 'border-slate-300',
      iconBg: 'bg-slate-100',
      panelBg: 'from-slate-50 via-gray-50 to-white',
      chipClass: 'bg-slate-100 text-slate-700',
      category: 'Livestock',
      summary: 'Built for premium dairy, breeding, and working stock.',
    },
    {
      id: 'goat',
      label: t('animalTypes.goat'),
      image: goatImg,
      icon: '🐐',
      color: 'from-emerald-500 to-emerald-600',
      accent: 'text-emerald-700',
      borderColor: 'border-emerald-300',
      iconBg: 'bg-emerald-100',
      panelBg: 'from-emerald-50 via-green-50 to-white',
      chipClass: 'bg-emerald-100 text-emerald-700',
      category: 'Fast-moving',
      summary: 'Ideal for compact, high-demand market listings.',
    },
    {
      id: 'horse',
      label: t('animalTypes.horse'),
      image: horseImg,
      icon: '🐎',
      color: 'from-violet-500 to-violet-600',
      accent: 'text-violet-700',
      borderColor: 'border-violet-300',
      iconBg: 'bg-violet-100',
      panelBg: 'from-violet-50 via-purple-50 to-white',
      chipClass: 'bg-violet-100 text-violet-700',
      category: 'Premium',
      summary: 'Designed for performance, riding, and breeding animals.',
    },
    {
      id: 'dog',
      label: t('animalTypes.dog'),
      image: dogImg,
      icon: '🐕',
      color: 'from-orange-500 to-orange-600',
      accent: 'text-orange-700',
      borderColor: 'border-orange-300',
      iconBg: 'bg-orange-100',
      panelBg: 'from-orange-50 via-amber-50 to-white',
      chipClass: 'bg-orange-100 text-orange-700',
      category: 'Companion',
      summary: 'Structured for pet, guard, and breeding sale details.',
    },
    {
      id: 'cat',
      label: t('animalTypes.cat'),
      image: catImg,
      icon: '🐈',
      color: 'from-rose-500 to-pink-600',
      accent: 'text-rose-700',
      borderColor: 'border-rose-300',
      iconBg: 'bg-rose-100',
      panelBg: 'from-rose-50 via-pink-50 to-white',
      chipClass: 'bg-rose-100 text-rose-700',
      category: 'Companion',
      summary: 'Clean profile setup for pet and breed-focused listings.',
    },
    {
      id: 'other',
      label: t('animalTypes.other') || 'Other',
      image: otherAnimalLogo,
      icon: '🐾',
      color: 'from-blue-500 to-blue-600',
      accent: 'text-blue-700',
      borderColor: 'border-blue-300',
      iconBg: 'bg-blue-100',
      panelBg: 'from-blue-50 via-sky-50 to-white',
      chipClass: 'bg-blue-100 text-blue-700',
      category: 'Custom',
      summary: 'Use this when your animal does not fit the core groups.',
    },
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

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  const renderAnimalCard = (tab, compact = false) => {
    const isActive = activeTab === tab.id;

    return (
      <button
        key={tab.id}
        type="button"
        aria-pressed={isActive}
        onClick={() => setActiveTab(tab.id)}
        className={`group relative flex flex-col items-center text-center transition-all duration-300 ${
          compact
            ? `w-[96px] sm:w-[108px] md:w-[124px] flex-shrink-0 ${
                isActive
                  ? 'text-[#15BB73]'
                  : 'text-slate-700 hover:-translate-y-0.5'
              }`
            : `${
                isActive
                  ? 'w-[104px] text-[#15BB73]'
                  : 'w-[104px] text-slate-700 hover:-translate-y-0.5'
              }`
        }`}
      >
        <div className={`relative ${compact ? 'space-y-2' : 'space-y-2.5'}`}>
          <div
            className={`relative flex items-center justify-center rounded-full border bg-gradient-to-br ${tab.panelBg} ${
              compact ? 'h-[90px] w-[90px] sm:h-[102px] sm:w-[102px] md:h-[114px] md:w-[114px]' : 'h-[94px] w-[94px]'
            } ${
              isActive
                ? 'border-[#15BB73] shadow-[0_16px_30px_-18px_rgba(21,187,115,0.7)] ring-4 ring-emerald-100'
                : `${tab.borderColor} shadow-sm group-hover:shadow-[0_14px_28px_-20px_rgba(15,23,42,0.28)]`
            } transition-all duration-300`}
          >
            {isActive && (
              <span className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#15BB73] text-white shadow-md sm:right-1.5 sm:top-1.5">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}

            <div
              className={`flex items-center justify-center overflow-hidden rounded-full ${
                compact ? 'h-[76px] w-[76px] sm:h-[86px] sm:w-[86px] md:h-[96px] md:w-[96px]' : 'h-[78px] w-[78px]'
              } ${isActive ? 'bg-white/85 shadow-md shadow-white/70' : tab.iconBg} transition-transform duration-300 ${
                compact ? '' : 'group-hover:scale-105'
              }`}
            >
              {tab.image ? (
                <div
                  className={`overflow-hidden rounded-full bg-white ${
                    compact ? 'h-[64px] w-[64px] sm:h-[72px] sm:w-[72px] md:h-[82px] md:w-[82px]' : 'h-[62px] w-[62px]'
                  }`}
                >
                  <img
                    src={tab.image}
                    alt={tab.label}
                    className="h-full w-full scale-[1.08] object-cover object-center"
                  />
                </div>
              ) : (
                <span className={compact ? 'text-[3rem]' : 'text-[2.6rem]'}>{tab.icon}</span>
              )}
            </div>
          </div>

          <h3 className={`font-semibold tracking-tight text-slate-900 ${compact ? 'text-sm' : 'text-sm'}`}>
            {tab.label}
          </h3>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {t('listing.selectAnimalType') || 'Select Animal Type'}
            </h2>
            <p className="text-sm text-gray-600">
              {t('listing.selectAnimalTypeDescription') || 'Choose the type of animal you want to list for sale.'}
            </p>
          </div>

          <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex flex-nowrap items-start gap-1 min-w-max md:w-fit md:mx-auto">
              {tabs.map((tab) => renderAnimalCard(tab, true))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className={`px-6 py-4 border-b border-gray-200 bg-gradient-to-r ${activeTabData?.color}`}>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                {activeTabData?.image ? (
                  <div className="h-11 w-11 overflow-hidden rounded-full bg-white">
                    <img
                      src={activeTabData.image}
                      alt={activeTabData.label}
                      className="h-full w-full scale-[1.08] object-cover object-center"
                    />
                  </div>
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

          <div className="p-6">
            {renderForm()}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnimalListingPage;

