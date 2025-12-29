import React from 'react';

const FormFileInput = ({
  id,
  name,
  label,
  accept,
  onChange,
  fileName,
  required = false
}) => {
  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>
      <div className="file-input-wrapper">
        <input
          type="file"
          id={id}
          name={name}
          accept={accept}
          onChange={onChange}
          required={required}
        />
        <label htmlFor={id} className="file-input-label">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {fileName || `Choose ${label}`}
        </label>
      </div>
    </div>
  );
};

export default FormFileInput;
