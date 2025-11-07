import React, { useState } from 'react';
import './AnimalListingPage.css';
import AnimalListingForm from './AnimalListingForm';
import BuffaloListingForm from './BuffaloListingForm';
import CatListingForm from './CatListingForm';
import DogListingForm from './DogListingForm';
import GoatListingForm from './GoatListingForm';
import HorseListingForm from './HorseListingForm';

const AnimalListingPage = () => {
  const [activeTab, setActiveTab] = useState('animal');

  const tabs = [
    { id: 'animal', label: 'Animal', icon: '🐄' },
    { id: 'buffalo', label: 'Buffalo', icon: '🐃' },
    { id: 'cat', label: 'Cat', icon: '🐱' },
    { id: 'dog', label: 'Dog', icon: '🐕' },
    { id: 'goat', label: 'Goat', icon: '🐐' },
    { id: 'horse', label: 'Horse', icon: '🐴' }
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
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
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
