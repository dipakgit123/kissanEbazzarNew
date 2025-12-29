import React from 'react';

const FormCheckbox = ({
  id,
  name,
  label,
  checked,
  onChange
}) => {
  return (
    <div className="form-group">
      <div className="checkbox-group">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={onChange}
        />
        <label htmlFor={id}>{label}</label>
      </div>
    </div>
  );
};

export default FormCheckbox;
