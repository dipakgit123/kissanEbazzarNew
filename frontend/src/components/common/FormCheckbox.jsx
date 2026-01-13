import React from 'react';

const FormCheckbox = ({
  name,
  label,
  checked,
  onChange
}) => {
  return (
    <div className="form-group mb-4">
      <div className="checkbox-group flex items-center">
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={checked}
          onChange={onChange}
          className="w-5 h-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <label htmlFor={name} className="ml-3 text-gray-700 font-medium cursor-pointer">
          {label}
        </label>
      </div>
    </div>
  );
};

export default FormCheckbox;
