import React from 'react';

const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  min,
  max,
  step,
  pattern,
  rows,
  infoText
}) => {
  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>
      <InputComponent
        className={type === 'textarea' ? 'form-textarea' : 'form-input'}
        type={type === 'textarea' ? undefined : type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        pattern={pattern}
        rows={rows}
      />
      {infoText && <p className="info-text">{infoText}</p>}
    </div>
  );
};

export default FormInput;
