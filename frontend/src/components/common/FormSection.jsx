import React from 'react';

const FormSection = ({ number, title, description, children }) => {
  // Translated legacy headings include their old position; the badge owns numbering.
  const heading = number ? title.replace(/^\s*\d+[.)]\s*/, '') : title;
  return (
    <section className="simple-form-section">
      <div className="simple-section-head">
        {number && <span className="simple-step-badge">{number}</span>}
        <div>
          <h3>{heading}</h3>
          {description && <p>{description}</p>}
        </div>
      </div>
      <div className="simple-section-body">
        {children}
      </div>
    </section>
  );
};

export default FormSection;
