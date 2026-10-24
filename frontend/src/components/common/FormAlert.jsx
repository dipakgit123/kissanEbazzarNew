import React from 'react';

const FormAlert = ({ type, message }) => {
  if (!message) return null;

  return (
    <div role={type === 'success' ? 'status' : 'alert'} aria-atomic="true" className={`alert alert-${type}`}>
      {type === 'success' ? '✅' : '❌'} {message}
    </div>
  );
};

export default FormAlert;
