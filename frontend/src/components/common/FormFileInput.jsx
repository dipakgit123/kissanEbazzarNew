import React from 'react';

const FormFileInput = ({
  id,
  name,
  label,
  accept,
  onChange,
  file,
  fileName,
  required = false
}) => {
  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Call onChange with the file directly (as expected by parent components)
      onChange(selectedFile);
    }
  };

  // Get display name from file object or fileName prop
  const displayName = file?.name || fileName || `Choose ${label}`;

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
          onChange={handleChange}
          required={required && !file}
        />
        <label htmlFor={id} className="file-input-label">
          {file ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#22c55e' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
          <span style={{
            color: file ? '#22c55e' : 'inherit',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '200px',
            display: 'inline-block'
          }}>
            {displayName}
          </span>
        </label>
      </div>
    </div>
  );
};

export default FormFileInput;
