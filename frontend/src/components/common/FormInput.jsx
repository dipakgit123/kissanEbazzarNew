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
    <div className="form-group mb-6">
      <label className="form-label block mb-2 font-semibold text-gray-700">
        {label} {required && <span className="required text-red-500">*</span>}
      </label>
      <InputComponent
        className={`${type === 'textarea' ? 'form-textarea' : 'form-input'} w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 outline-none`}
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
        rows={rows || 4}
      />
      {infoText && <p className="info-text text-sm text-gray-500 mt-2">{infoText}</p>}
    </div>
  );
};

export default FormInput;
