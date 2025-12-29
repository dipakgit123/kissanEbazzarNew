import React from 'react';

const FormSection = ({ number, title, children }) => {
  return (
    <div className="form-section">
      <h3 className="section-title">
        <span className="section-number">{number}</span>
        {title}
      </h3>
      {children}
    </div>
  );
};

export default FormSection;
