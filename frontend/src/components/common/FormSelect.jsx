import React from 'react';

const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false
}) => {
  return (
    <div className="form-group mb-6">
      <label className="form-label block mb-2 font-semibold text-gray-700">
        {label} {required && <span className="required text-red-500">*</span>}
      </label>
      <select
        className="form-select w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 outline-none bg-white"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormSelect;
