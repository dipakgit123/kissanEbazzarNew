import React, { useState } from 'react';
import './AnimalListingPage.css';
import AnimalListingForm from './AnimalListingForm';
import BuffaloListingForm from './BuffaloListingForm';
import CatListingForm from './CatListingForm';
import DogListingForm from './DogListingForm';
import GoatListingForm from './GoatListingForm';
import HorseListingForm from './HorseListingForm';
import cowClipart from '../assets/cliparts/cow_cliparts.jpg';
import buffaloClipart from '../assets/cliparts/buffello_clipart.jpg';
import catClipart from '../assets/cliparts/cat_clipart.png';
import dogClipart from '../assets/cliparts/Dog_clipart.jpg';
import goatClipart from '../assets/cliparts/goat_clipart.jpg';
import horseClipart from '../assets/cliparts/horse_clipart.jpg';

const AnimalListingPage = () => {
  const [activeTab, setActiveTab] = useState('animal');

  const tabs = [
    { id: 'animal', label: 'Cow', icon: cowClipart },
    { id: 'buffalo', label: 'Buffalo', icon: buffaloClipart },
    { id: 'cat', label: 'Cat', icon: catClipart },
    { id: 'dog', label: 'Dog', icon: dogClipart },
    { id: 'goat', label: 'Goat', icon: goatClipart },
    { id: 'horse', label: 'Horse', icon: horseClipart }
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
      default:
        return <AnimalListingForm />;
    }
  };

  return (
    <div className="animal-listing-page">
      <div className="tabs-container">
        <div className="tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="tab-icon">
                <span className="tab-icon-inner">
                  <img src={tab.icon} alt={tab.label} className="tab-icon-img" />
                </span>
              </span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-container">
        {renderForm()}
      </div>
    </div>
  );
};

export default AnimalListingPage;
