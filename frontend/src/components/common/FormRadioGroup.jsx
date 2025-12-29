import React from 'react';

const FormRadioGroup = ({
  label,
  marathiLabel,
  name,
  options,
  selectedValue,
  onChange
}) => {
  return (
    <div className="form-group">
      <label>
        {label}
        {marathiLabel && <span className="marathi">{marathiLabel}</span>}
      </label>
      <div className="radio-group">
        {options.map((option) => (
          <div key={option.value} className="radio-option">
            <input
              type="radio"
              id={option.id}
              name={name}
              checked={selectedValue === option.value}
              onChange={() => onChange(option.value)}
            />
            <label htmlFor={option.id}>{option.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormRadioGroup;
