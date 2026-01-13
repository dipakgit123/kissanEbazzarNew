import React from 'react';

const FormSection = ({ title, description, children }) => {
  return (
    <div className="form-section mb-8 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
      <div className="mb-6">
        <h3 className="section-title text-xl font-bold text-gray-800 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default FormSection;
