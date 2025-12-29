import React from 'react';

const InfoBanner = ({ message, marathiMessage }) => {
  return (
    <div className="info-banner">
      <p>
        ℹ️ <strong>Location Information:</strong> {message || 'Your listing location will be automatically set based on your profile location. Make sure your profile has the correct location details.'}
      </p>
      <p>
        {marathiMessage || 'स्थान माहिती आपल्या प्रोफाईल स्थानावर आधारित स्वयंचलितपणे सेट केली जाईल.'}
      </p>
    </div>
  );
};

export default InfoBanner;
