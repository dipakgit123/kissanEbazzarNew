import React from 'react';

const FormRadioGroup = ({
  label,
  name,
  value,
  onChange,
  options
}) => {
  return (
    <div className="form-group mb-6">
      <label className="form-label block mb-3 font-semibold text-gray-700">
        {label}
      </label>
      <div className="radio-group flex flex-wrap gap-4">
        {options.map((option) => (
          <div key={option.value} className="radio-option flex items-center">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
            />
            <label htmlFor={`${name}-${option.value}`} className="ml-2 text-gray-700 cursor-pointer">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormRadioGroup;
